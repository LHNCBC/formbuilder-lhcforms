import {Injectable} from '@angular/core';
import {FormService} from './form.service';

export type SubjectTypeFHIRVersion = 'R3' | 'R4' | 'R5' | 'R6';
export type SubjectTypeCompatibilityChoice = 'cancel' | 'keep' | 'export' | 'drop';

export interface SubjectTypeOption {
  enum?: string[];
  description?: string;
  versions?: string[];
}

export const SUBJECT_TYPE_COMPATIBILITY_DIALOG = {
  title: 'Subject type compatibility',
  importMessage: (version: string, list: string): string =>
    `Some imported subject types are not valid in FHIR ${version}: ${list}`
    + '<p>They can be preserved for review, or removed from this imported form. What would you like to do?</p>',
  exportMessage: (version: string, list: string): string =>
    `Some subject types are not valid in FHIR ${version}: ${list}`
    + '<p>Removing them only affects this export and will not change the current form. What would you like to do?</p>'
};

export const SUBJECT_TYPE_COMPATIBILITY_WARNING = {
  importMessage: (version: string, list: string): string =>
    `Some imported subject types are not valid in FHIR ${version}: ${list}`
    + '<p>They were preserved for review, but may not validate or export cleanly in the current R5 form.</p>',
  outputMessage: (version: string, list: string): string =>
    `This Questionnaire has subject types that are not valid in FHIR ${version}: ${list}`
    + `<p>They are preserved in the form, but the ${version} output may fail validation.</p>`
};

/**
 * Service for subjectType compatibility checks based on the form-level schema.
 */
@Injectable({
  providedIn: 'root'
})
export class SubjectTypeService {
  private readonly activeSubjectTypeVersionOrder: SubjectTypeFHIRVersion[] = ['R3', 'R4', 'R5'];
  private readonly versionDisplayNames: {[version in SubjectTypeFHIRVersion]: string} = {
    R3: 'STU3',
    R4: 'R4',
    R5: 'R5',
    R6: 'R6'
  };

  constructor(private formService: FormService) {}

  /**
   * Normalize external FHIR version labels to schema compatibility versions.
   * STU3 maps to R3 compatibility checks.
   */
  private normalizeCompatibilityVersion(version: string): SubjectTypeFHIRVersion | null {
    if(version === 'STU3') {
      return 'R3';
    }
    return this.isSubjectTypeFHIRVersion(version) ? version : null;
  }

  private isSupportedByCompatibilityVersion(
    subjectType: string,
    compatibilityVersion: SubjectTypeFHIRVersion,
    subjectTypeOptions: SubjectTypeOption[]
  ): boolean {
    const versions = this.getSubjectTypeVersionsFromOptions(subjectType, subjectTypeOptions);
    return versions.includes(compatibilityVersion);
  }

  /**
   * Get the FHIR versions that include the given resource type as a valid subjectType.
   * @param resourceType - FHIR resource type to check.
   * @return FHIR versions that support the resource type.
   */
  getSubjectTypeVersions(resourceType: string): SubjectTypeFHIRVersion[] {
    return this.getSubjectTypeVersionsFromOptions(resourceType, this.getSubjectTypeOptions());
  }

  /**
   * Check whether a versioned subjectType option should be shown in the current UI.
   * R6 metadata is retained in the schema, but R6-only values are hidden until R6 is supported.
   * @param option - subjectType schema option.
   * @return True when the option has no version metadata, or at least one active version.
   */
  isSubjectTypeOptionDisplayable(option: SubjectTypeOption): boolean {
    return !option.versions || this.getActiveSubjectTypeOptionVersions(option).length > 0;
  }

  /**
   * Build a display label for a subjectType option from its version metadata.
   * @param option - subjectType schema option.
   * @return Resource label with active version suffix when the option is version-limited.
   */
  getSubjectTypeOptionLabel(option: SubjectTypeOption): string {
    const label = this.getBaseSubjectTypeOptionLabel(option);
    const versions = this.getActiveSubjectTypeOptionVersions(option);
    if(!option.versions || versions.length === this.activeSubjectTypeVersionOrder.length) {
      return label;
    }
    const versionLabel = versions.map((version) => this.versionDisplayNames[version]).join(', ');
    return versions.length ? `${label} (${versionLabel})` : label;
  }

  /**
   * Get subjectType values that are not valid for the target FHIR version.
   * @param questionnaire - Questionnaire-like object containing subjectType values.
   * @param version - Target FHIR version.
   * @return subjectType values that are not supported by the target version.
   */
  getInvalidSubjectTypesForVersion(questionnaire: {subjectType?: string[]}, version: string): string[] {
    const compatibilityVersion = this.normalizeCompatibilityVersion(version);
    if(!compatibilityVersion || !Array.isArray(questionnaire?.subjectType)) {
      return [];
    }
    const subjectTypeOptions = this.getSubjectTypeOptions();
    if(!subjectTypeOptions.length) {
      return [];
    }
    return questionnaire.subjectType
      .filter((subjectType) => !this.isSupportedByCompatibilityVersion(subjectType, compatibilityVersion, subjectTypeOptions));
  }

  /**
   * Return a copy of the questionnaire with subjectType values removed if they are invalid for the target FHIR version.
   * @param questionnaire - Questionnaire-like object containing subjectType values.
   * @param version - Target FHIR version.
   * @return Questionnaire copy with invalid subjectType values removed.
   */
  removeInvalidSubjectTypesForVersion<T extends {subjectType?: string[]}>(questionnaire: T, version: string): T {
    const compatibilityVersion = this.normalizeCompatibilityVersion(version);
    if(!compatibilityVersion || !Array.isArray(questionnaire?.subjectType)) {
      return questionnaire;
    }
    const subjectTypeOptions = this.getSubjectTypeOptions();
    if(!subjectTypeOptions.length) {
      return questionnaire;
    }
    const allowedSubjectTypes = questionnaire.subjectType
      .filter((subjectType) => this.isSupportedByCompatibilityVersion(subjectType, compatibilityVersion, subjectTypeOptions));
    return {
      ...questionnaire,
      subjectType: allowedSubjectTypes.length ? allowedSubjectTypes : undefined
    };
  }

  /**
   * Resolve subjectType values that are incompatible with the target FHIR version.
   * @param questionnaire - Questionnaire-like object being imported or exported.
   * @param version - Target FHIR version to validate subjectType values against.
   * @param confirmCompatibility - Function that asks the user how to handle invalid subjectType values.
   * @returns Questionnaire to use, or null when the user cancels.
   */
  async resolveSubjectTypeQuestionnaire<T extends {subjectType?: string[]}>(
    questionnaire: T,
    version: string,
    confirmCompatibility: (invalidTypes: string[]) => Promise<SubjectTypeCompatibilityChoice>
  ): Promise<T | null> {
    const invalidTypes = this.getInvalidSubjectTypesForVersion(questionnaire, version);
    if(!invalidTypes.length) {
      return questionnaire;
    }

    const choice = await confirmCompatibility(invalidTypes);
    if(choice === 'cancel') {
      return null;
    }
    if(choice === 'drop') {
      return this.removeInvalidSubjectTypesForVersion(questionnaire, version);
    }
    return questionnaire;
  }

  /**
   * Build a warning message for subjectType values that are incompatible with a target FHIR version.
   * @param questionnaire - Questionnaire-like object containing subjectType values.
   * @param version - Target FHIR version.
   * @param context - Workflow context where the warning will be displayed.
   * @return Warning message with invalid subjectType values, or null when all values are valid.
   */
  getSubjectTypeCompatibilityWarning(
    questionnaire: {subjectType?: string[]},
    version: string,
    context: 'import' | 'export' | 'preview'
  ): string | null {
    const invalidTypes = this.getInvalidSubjectTypesForVersion(questionnaire, version);
    if(!invalidTypes.length) {
      return null;
    }
    const formattedTypes = this.formatSubjectTypeList(invalidTypes);
    if(context === 'import') {
      return SUBJECT_TYPE_COMPATIBILITY_WARNING.importMessage(version, formattedTypes);
    }
    return SUBJECT_TYPE_COMPATIBILITY_WARNING.outputMessage(version, formattedTypes);
  }

  /**
   * Format subjectType values as an HTML unordered list for compatibility dialogs and alerts.
   * @param subjectTypes - subjectType values to display.
   * @return HTML unordered list with escaped subjectType values.
   */
  formatSubjectTypeList(subjectTypes: string[]): string {
    const items = subjectTypes
      .map((subjectType) => `<li>${this.escapeHtml(subjectType)}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }

  /**
   * Get the subjectType options from the loaded form-level schema.
   * @return subjectType schema options.
   */
  private getSubjectTypeOptions(): SubjectTypeOption[] {
    return this.formService.flSchema?.properties?.subjectType?.items?.oneOf || [];
  }

  /**
   * Get the FHIR versions that include the resource type from a provided list of schema options.
   * @param resourceType - FHIR resource type to check.
   * @param subjectTypeOptions - subjectType schema options.
   * @return FHIR versions that support the resource type.
   */
  private getSubjectTypeVersionsFromOptions(
    resourceType: string,
    subjectTypeOptions: SubjectTypeOption[]
  ): SubjectTypeFHIRVersion[] {
    const option = subjectTypeOptions.find((subjectTypeOption) => subjectTypeOption.enum?.[0] === resourceType);
    return (option?.versions || []).filter((version): version is SubjectTypeFHIRVersion =>
      this.isSubjectTypeFHIRVersion(version)
    );
  }

  /**
   * Return a subjectType option label without a hard-coded version suffix.
   * @param option - subjectType schema option.
   * @return Base option label.
   */
  private getBaseSubjectTypeOptionLabel(option: SubjectTypeOption): string {
    const label = option.description || option.enum?.[0] || '';
    return label.replace(/\s+\((?:STU3|R[3-6])(?:,\s*(?:STU3|R[3-6]))*\)$/, '');
  }

  /**
   * Get versions for an option that are currently active in Form Builder.
   * @param option - subjectType schema option.
   * @return Active FHIR release identifiers in display order.
   */
  private getActiveSubjectTypeOptionVersions(option: SubjectTypeOption): SubjectTypeFHIRVersion[] {
    return this.activeSubjectTypeVersionOrder.filter((version) => option.versions?.includes(version));
  }

  /**
   * Check whether a version has subjectType compatibility metadata in the schema.
   * @param version - FHIR version to check.
   * @return True when the version is supported for subjectType compatibility checks.
   */
  private isSubjectTypeFHIRVersion(version: string): version is SubjectTypeFHIRVersion {
    return ['R3', 'R4', 'R5', 'R6'].includes(version);
  }

  /**
   * Escape a string before inserting it into HTML content.
   * @param value - String to escape.
   * @return HTML-escaped string.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
