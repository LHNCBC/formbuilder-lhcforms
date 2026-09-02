import copy from 'fast-copy';
import fhir from 'fhir/r4';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';

export const TEMPLATE_EXTRACT_CHILD_URLS = [
  'template',
  'fullUrl',
  'resourceId',
  'ifNoneMatch',
  'ifModifiedSince',
  'ifMatch',
  'ifNoneExist'
] as const;

export type TemplateExtractChildUrl = typeof TEMPLATE_EXTRACT_CHILD_URLS[number];
export type TemplateExtractExpressionUrl = Exclude<TemplateExtractChildUrl, 'template'>;

export interface TemplateExtractEditModel {
  templateReference: string;
  fullUrl: string;
  resourceId: string;
  ifNoneMatch: string;
  ifModifiedSince: string;
  ifMatch: string;
  ifNoneExist: string;
  sourceExtension?: fhir.Extension;
}

export interface ContainedResourceOption {
  reference: string;
  label: string;
}

const KNOWN_CHILD_URLS = new Set<string>(TEMPLATE_EXTRACT_CHILD_URLS);

/**
 * Convert a templateExtract extension into the widget's edit model.
 */
export function parseTemplateExtractExtension(extension: fhir.Extension): TemplateExtractEditModel {
  const children = extension?.extension || [];
  const getString = (url: TemplateExtractExpressionUrl): string =>
    children.find(child => child.url === url)?.valueString || '';

  return {
    templateReference: children.find(child => child.url === 'template')?.valueReference?.reference || '',
    fullUrl: getString('fullUrl'),
    resourceId: getString('resourceId'),
    ifNoneMatch: getString('ifNoneMatch'),
    ifModifiedSince: getString('ifModifiedSince'),
    ifMatch: getString('ifMatch'),
    ifNoneExist: getString('ifNoneExist'),
    sourceExtension: copy(extension)
  };
}

/**
 * Convert the widget's edit model to a valid complex templateExtract extension.
 * Unknown child slices and metadata on known slices are retained when an imported
 * extension is edited.
 */
export function buildTemplateExtractExtension(model: TemplateExtractEditModel): fhir.Extension {
  const result: fhir.Extension = copy(model.sourceExtension || {url: EXTENSION_URL_TEMPLATE_EXTRACT});
  const originalChildren = result.extension || [];
  const childByUrl = new Map<string, fhir.Extension>();
  originalChildren.forEach(child => {
    if(KNOWN_CHILD_URLS.has(child.url) && !childByUrl.has(child.url)) {
      childByUrl.set(child.url, child);
    }
  });

  Object.keys(result).forEach(key => {
    if(key.startsWith('value')) {
      delete result[key];
    }
  });
  result.url = EXTENSION_URL_TEMPLATE_EXTRACT;

  const templateChild = copy(childByUrl.get('template') || {url: 'template'});
  Object.keys(templateChild).forEach(key => {
    if(key.startsWith('value') && key !== 'valueReference') {
      delete templateChild[key];
    }
  });
  templateChild.url = 'template';
  delete templateChild.extension;
  templateChild.valueReference = {
    ...(templateChild.valueReference || {}),
    reference: model.templateReference
  };

  const knownChildren: fhir.Extension[] = [templateChild];
  TEMPLATE_EXTRACT_CHILD_URLS.slice(1).forEach((url: TemplateExtractExpressionUrl) => {
    const value = model[url];
    if(value?.trim()) {
      const child = copy(childByUrl.get(url) || {url});
      Object.keys(child).forEach(key => {
        if(key.startsWith('value') && key !== 'valueString') {
          delete child[key];
        }
      });
      child.url = url;
      delete child.extension;
      child.valueString = value;
      knownChildren.push(child);
    }
  });

  result.extension = [
    ...knownChildren,
    ...originalChildren.filter(child => !KNOWN_CHILD_URLS.has(child.url))
  ];
  return result;
}

/**
 * Return selectable local references for the resources already contained by a Questionnaire.
 */
export function getContainedResourceOptions(questionnaire: fhir.Questionnaire): ContainedResourceOption[] {
  return (questionnaire?.contained || [])
    .filter(resource => !!resource?.id && !!resource?.resourceType)
    .map(resource => ({
      reference: `#${resource.id}`,
      label: `${resource.resourceType} #${resource.id}`
    }));
}

/**
 * Check whether a contained resource is targeted by a templateExtract extension
 * at the Questionnaire root or on any Questionnaire item.
 */
export function hasTemplateExtractReference(questionnaire: fhir.Questionnaire, resourceId?: string): boolean {
  if(!questionnaire || !resourceId) {
    return false;
  }
  const reference = `#${resourceId}`;
  const referencesResource = (extensions: fhir.Extension[] = []): boolean =>
    extensions.some(extension =>
      extension.url === EXTENSION_URL_TEMPLATE_EXTRACT &&
      extension.extension?.some(child =>
        child.url === 'template' && child.valueReference?.reference === reference
      )
    );
  const searchItems = (items: fhir.QuestionnaireItem[] = []): boolean =>
    items.some(item => referencesResource(item.extension) || searchItems(item.item));

  return referencesResource(questionnaire.extension) || searchItems(questionnaire.item);
}
