import {Injectable} from '@angular/core';
import fhir from 'fhir/r4';

export type ContainedResourceFHIRVersion = 'STU3' | 'R4' | 'R4B' | 'R5' | 'R6';
export type ContainedResourceVersionConfidence = 'authoritative' | 'inferred' | 'ambiguous' | 'unknown';

export interface ContainedResourceVersionInfo {
  version: ContainedResourceFHIRVersion | null;
  confidence: ContainedResourceVersionConfidence;
  source: 'content-type' | 'meta.profile' | 'questionnaire' | 'fhir-server' | 'editor' | 'unknown';
  details?: string;
}

export interface ContainedResourceVersionRecord {
  resourceType: string;
  id?: string;
  info: ContainedResourceVersionInfo;
}

export interface ContainedResourceCompatibilityIssue extends ContainedResourceVersionRecord {
  targetVersion: ContainedResourceFHIRVersion;
  kind: 'mismatch' | 'unknown';
}

export interface PreparedContainedResource {
  resource: fhir.Resource;
  versionInfo: ContainedResourceVersionInfo;
  removedMetadata: string[];
  generatedId: boolean;
}

type AnnotatedResource = fhir.Resource & {
  __$fhirVersionInfo?: ContainedResourceVersionInfo;
  [key: string]: any;
};

/**
 * Handles validation, FHIR-version provenance, and output compatibility checks for contained resources.
 */
@Injectable({providedIn: 'root'})
export class ContainedResourceService {
  static readonly VERSION_INFO_FIELD = '__$fhirVersionInfo';

  private readonly versionByToken: Record<string, ContainedResourceFHIRVersion> = {
    '3.0': 'STU3',
    '3.0.1': 'STU3',
    '3.0.2': 'STU3',
    '4.0': 'R4',
    '4.0.0': 'R4',
    '4.0.1': 'R4',
    '4.3': 'R4B',
    '4.3.0': 'R4B',
    '5.0': 'R5',
    '5.0.0': 'R5',
    '6.0': 'R6',
    '6.0.0': 'R6'
  };

  /**
   * Parse and prepare a single JSON FHIR resource for insertion into Questionnaire.contained.
   *
   * @param input - JSON file contents or a parsed FHIR resource.
   * @param existingResources - Resources already present in Questionnaire.contained.
   * @param contentType - Browser-provided file MIME type, when available.
   * @param serverVersion - Known version of the source FHIR server, when applicable.
   * @returns Prepared resource, version information, and normalization details.
   * @throws Error when the input is not a usable single FHIR resource.
   */
  prepareImportedResource(
    input: string | fhir.Resource,
    existingResources: fhir.Resource[] = [],
    contentType = '',
    serverVersion?: string
  ): PreparedContainedResource {
    let resource: AnnotatedResource;
    try {
      resource = typeof input === 'string'
        ? JSON.parse(input)
        : JSON.parse(JSON.stringify(input));
    }
    catch (_error) {
      throw new Error('The selected file is not valid JSON.');
    }

    if(!resource || Array.isArray(resource) || typeof resource !== 'object') {
      throw new Error('The selected file must contain one FHIR resource JSON object.');
    }
    if(typeof resource.resourceType !== 'string' || !/^[A-Z][A-Za-z0-9]{0,63}$/.test(resource.resourceType.trim())) {
      throw new Error('The selected JSON does not have a valid resourceType.');
    }
    (resource as any).resourceType = resource.resourceType.trim();
    if(Array.isArray(resource.contained) && resource.contained.length) {
      throw new Error('A contained resource cannot contain nested resources.');
    }

    const generatedId = !resource.id;
    if(generatedId) {
      resource.id = this.generateResourceId(resource.resourceType, existingResources);
    }
    if(!/^[A-Za-z0-9\-.]{1,64}$/.test(resource.id)) {
      throw new Error(`The resource id "${resource.id}" is not a valid FHIR id.`);
    }
    if(existingResources.some((existing) => existing?.id === resource.id)) {
      throw new Error(`A contained resource with id "${resource.id}" already exists.`);
    }

    const normalizedServerVersion = this.normalizeVersion(serverVersion);
    const versionInfo: ContainedResourceVersionInfo = normalizedServerVersion
      ? {
        version: normalizedServerVersion,
        confidence: 'authoritative',
        source: 'fhir-server'
      }
      : this.detectVersion(resource, contentType);
    const removedMetadata = this.removeProhibitedContainedMetadata(resource);
    this.setVersionInfo(resource, versionInfo);
    return {resource, versionInfo, removedMetadata, generatedId};
  }

  /**
   * Detect a resource's FHIR version from MIME metadata or a version-specific core profile.
   *
   * @param resource - FHIR resource to inspect.
   * @param contentType - Optional MIME content type associated with the resource.
   * @param fallbackVersion - Known version of the containing Questionnaire.
   * @returns Structured detection result; unknown when the evidence is insufficient or conflicting.
   */
  detectVersion(
    resource: fhir.Resource,
    contentType = '',
    fallbackVersion?: string
  ): ContainedResourceVersionInfo {
    const contentTypeVersion = this.detectVersionFromContentType(contentType);
    const profileVersions = this.detectVersionsFromProfiles((resource as fhir.DomainResource)?.meta?.profile || []);
    const evidence = new Set<ContainedResourceFHIRVersion>();
    if(contentTypeVersion) {
      evidence.add(contentTypeVersion);
    }
    profileVersions.forEach((version) => evidence.add(version));

    if(evidence.size > 1) {
      return {
        version: null,
        confidence: 'ambiguous',
        source: 'unknown',
        details: `Conflicting version evidence: ${Array.from(evidence).join(', ')}`
      };
    }
    if(contentTypeVersion) {
      return {version: contentTypeVersion, confidence: 'authoritative', source: 'content-type'};
    }
    if(profileVersions.length === 1) {
      return {version: profileVersions[0], confidence: 'inferred', source: 'meta.profile'};
    }

    const normalizedFallback = this.normalizeVersion(fallbackVersion);
    if(normalizedFallback) {
      return {version: normalizedFallback, confidence: 'inferred', source: 'questionnaire'};
    }
    return {version: null, confidence: 'unknown', source: 'unknown'};
  }

  /**
   * Annotate contained resources that do not already have provenance information.
   *
   * @param questionnaire - Questionnaire whose contained resources should be annotated.
   * @param questionnaireVersion - FHIR version detected before conversion to internal R5.
   */
  annotateContainedResources(questionnaire: fhir.Questionnaire, questionnaireVersion?: string): void {
    questionnaire?.contained?.forEach((resource) => {
      if(!this.getVersionInfo(resource)) {
        this.setVersionInfo(resource, this.detectVersion(resource, '', questionnaireVersion));
      }
    });
  }

  /**
   * Mark a resource created by Form Builder as an internal R5 resource.
   *
   * @param resource - Newly created resource.
   */
  annotateEditorResource(resource: fhir.Resource): void {
    this.setVersionInfo(resource, {version: 'R5', confidence: 'authoritative', source: 'editor'});
  }

  /**
   * Read internal version provenance from a resource.
   *
   * @param resource - Resource to inspect.
   * @returns Stored version information, if present.
   */
  getVersionInfo(resource: fhir.Resource): ContainedResourceVersionInfo | null {
    return (resource as AnnotatedResource)?.[ContainedResourceService.VERSION_INFO_FIELD] || null;
  }

  /**
   * Collect serializable version records in contained-array order.
   *
   * @param questionnaire - Questionnaire containing annotated resources.
   * @returns Version records for all contained resources.
   */
  getVersionRecords(questionnaire: fhir.Questionnaire): ContainedResourceVersionRecord[] {
    return (questionnaire?.contained || []).map((resource) => ({
      resourceType: resource.resourceType,
      id: resource.id,
      info: this.getVersionInfo(resource) || this.detectVersion(resource)
    }));
  }

  /**
   * Restore version records onto contained resources after loading clean autosave data.
   *
   * @param questionnaire - Questionnaire restored from autosave.
   * @param records - Previously stored records in contained-array order.
   */
  applyVersionRecords(questionnaire: fhir.Questionnaire, records: ContainedResourceVersionRecord[]): void {
    (questionnaire?.contained || []).forEach((resource, index) => {
      const record = records?.[index];
      if(record && record.resourceType === resource.resourceType && record.id === resource.id) {
        this.setVersionInfo(resource, record.info);
      }
    });
  }

  /**
   * Find contained-resource version issues for a target FHIR output version.
   *
   * @param records - Contained-resource version records.
   * @param targetVersion - Preview or export FHIR version.
   * @returns Mismatches and resources whose source version is unknown.
   */
  getCompatibilityIssues(
    records: ContainedResourceVersionRecord[],
    targetVersion: string
  ): ContainedResourceCompatibilityIssue[] {
    const normalizedTarget = this.normalizeVersion(targetVersion);
    if(!normalizedTarget) {
      return [];
    }
    return (records || []).reduce<ContainedResourceCompatibilityIssue[]>((issues, record) => {
      if(!record.info?.version) {
        issues.push({...record, targetVersion: normalizedTarget, kind: 'unknown'});
      }
      else if(record.info.version !== normalizedTarget) {
        issues.push({...record, targetVersion: normalizedTarget, kind: 'mismatch'});
      }
      return issues;
    }, []);
  }

  /**
   * Build an HTML warning suitable for the existing message and preview dialogs.
   *
   * @param records - Contained-resource version records.
   * @param targetVersion - Preview or export FHIR version.
   * @returns Warning HTML, or an empty string when all versions match.
   */
  getCompatibilityWarning(records: ContainedResourceVersionRecord[], targetVersion: string): string {
    const issues = this.getCompatibilityIssues(records, targetVersion);
    if(!issues.length) {
      return '';
    }
    const list = issues.map((issue) => {
      const identity = `${this.escapeHtml(issue.resourceType)}${issue.id ? ` #${this.escapeHtml(issue.id)}` : ''}`;
      const source = issue.info.version ? `FHIR ${issue.info.version}` : 'an unknown FHIR version';
      return `<li>${identity} was imported as ${source}.</li>`;
    }).join('');
    return `Some contained resources may not be compatible with the FHIR ${this.escapeHtml(targetVersion)} output:`
      + `<ul>${list}</ul><p>Contained resources are preserved without automatic version conversion.</p>`;
  }

  /**
   * Convert external version labels into the labels used by contained-resource checks.
   *
   * @param version - External version label or semantic version.
   * @returns Normalized version label, or null when unsupported.
   */
  normalizeVersion(version?: string): ContainedResourceFHIRVersion | null {
    if(!version) {
      return null;
    }
    const upper = version.toUpperCase();
    if(upper === 'R3' || upper === 'STU3') {
      return 'STU3';
    }
    if(upper === 'R4' || upper === 'R4B' || upper === 'R5' || upper === 'R6') {
      return upper as ContainedResourceFHIRVersion;
    }
    return this.versionByToken[version] || null;
  }

  /**
   * Set internal-only version provenance on a resource.
   *
   * @param resource - Resource to annotate.
   * @param info - Version information to store.
   */
  private setVersionInfo(resource: fhir.Resource, info: ContainedResourceVersionInfo): void {
    (resource as AnnotatedResource)[ContainedResourceService.VERSION_INFO_FIELD] = info;
  }

  /**
   * Detect a FHIR version parameter from a MIME content type.
   *
   * @param contentType - MIME content type to parse.
   * @returns Normalized FHIR version, or null when no supported parameter is present.
   */
  private detectVersionFromContentType(contentType: string): ContainedResourceFHIRVersion | null {
    const token = /(?:^|;)\s*fhirVersion\s*=\s*"?([^;"\s]+)/i.exec(contentType)?.[1];
    return this.normalizeVersion(token);
  }

  /**
   * Detect version-specific HL7 core profile URLs.
   *
   * @param profiles - Resource meta.profile canonical URLs.
   * @returns Unique FHIR versions identified by the profiles.
   */
  private detectVersionsFromProfiles(profiles: string[]): ContainedResourceFHIRVersion[] {
    return Array.from(new Set((profiles || []).flatMap((profile) => {
      const token = /^https?:\/\/(?:www\.)?hl7\.org\/fhir\/(3\.0(?:\.\d+)?|4\.0(?:\.\d+)?|4\.3(?:\.\d+)?|5\.0(?:\.\d+)?|6\.0(?:\.\d+)?)\/StructureDefinition\//i.exec(profile)?.[1];
      const version = this.normalizeVersion(token);
      return version ? [version] : [];
    })));
  }

  /**
   * Generate a unique, valid FHIR id for an imported resource.
   *
   * @param resourceType - Imported resource type used as the id stem.
   * @param existingResources - Existing contained resources whose ids must not collide.
   * @returns Generated FHIR id.
   */
  private generateResourceId(resourceType: string, existingResources: fhir.Resource[]): string {
    const stem = resourceType.replace(/[^A-Za-z0-9\-.]/g, '-').slice(0, 55) || 'resource';
    let suffix = 1;
    let candidate = `${stem}-${suffix}`;
    const ids = new Set(existingResources.map((resource) => resource?.id).filter(Boolean));
    while(ids.has(candidate)) {
      suffix++;
      candidate = `${stem}-${suffix}`;
    }
    return candidate;
  }

  /**
   * Remove metadata prohibited on a contained resource and report the affected paths.
   *
   * @param resource - Imported resource to normalize.
   * @returns Paths removed from the resource.
   */
  private removeProhibitedContainedMetadata(resource: AnnotatedResource): string[] {
    const removed: string[] = [];
    ['versionId', 'lastUpdated', 'security'].forEach((field) => {
      if(resource.meta?.[field] !== undefined) {
        delete resource.meta[field];
        removed.push(`meta.${field}`);
      }
    });
    if(resource.meta && !Object.keys(resource.meta).length) {
      delete resource.meta;
    }
    return removed;
  }

  /**
   * Escape imported strings before placing them in an existing innerHTML warning.
   *
   * @param value - Untrusted string to escape.
   * @returns HTML-safe string.
   */
  private escapeHtml(value: string): string {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }
}
