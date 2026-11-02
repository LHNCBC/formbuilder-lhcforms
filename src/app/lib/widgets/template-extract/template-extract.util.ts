import copy from 'fast-copy';
import fhir from 'fhir/r4';
import {EXTENSION_URL_TEMPLATE_EXTRACT, EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE} from '../../constants/constants';
import {Util} from '../../util';

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
const EXPRESSION_URLS = TEMPLATE_EXTRACT_CHILD_URLS.slice(1) as TemplateExtractExpressionUrl[];
const DUPLICATE_CONSEQUENCE =
  'Each occurrence is extracted separately, which may create duplicate or conflicting Bundle entries.';

/**
 * Convert a templateExtract extension into the widget's edit model.
 *
 * @param extension - A templateExtract extension, possibly with unknown child slices.
 * @returns Edit model with empty strings for absent children and a copy of the source extension.
 */
export function parseTemplateExtractExtension(extension: fhir.Extension): TemplateExtractEditModel {
  const children = extension?.extension || [];

  /**
   * Read the valueString of the first child extension with the given url.
   *
   * @param url - Child extension url.
   * @returns The child's valueString, or an empty string if absent.
   */
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
 * extension is edited, except the value[x] fields of other value types and their element
 * fields, e.g. a _valueCode on an expression child. The template valueReference is retained only when its reference
 * is unchanged.
 *
 * @param model - Edit model. An empty expression field is omitted from the result, unless
 *   the source extension has a child for it without expression text, e.g. a child with only
 *   _valueString metadata such as a data-absent-reason extension. Such a child is kept
 *   unchanged, because the field was not edited.
 * @returns A templateExtract extension with the template child first, followed by the
 *   expression children and then any unknown children.
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

  Util.removeValueChoices(result);
  result.url = EXTENSION_URL_TEMPLATE_EXTRACT;

  const templateChild = copy(childByUrl.get('template') || {url: 'template'});
  Util.removeValueChoices(templateChild, 'valueReference');
  templateChild.url = 'template';
  delete templateChild.extension;
  // Details such as display, type or identifier describe the original template; drop them
  // when another template is chosen.
  templateChild.valueReference = templateChild.valueReference?.reference === model.templateReference
    ? templateChild.valueReference
    : {reference: model.templateReference};

  const knownChildren: fhir.Extension[] = [templateChild];
  TEMPLATE_EXTRACT_CHILD_URLS.slice(1).forEach((url: TemplateExtractExpressionUrl) => {
    const value = model[url];
    const sourceChild = childByUrl.get(url);
    if(!value?.trim()) {
      // A source child without expression text is valid FHIR when it has metadata, e.g.
      // only _valueString. The edit model shows it as empty, so it was not changed.
      if(sourceChild && !sourceChild.valueString?.trim()) {
        knownChildren.push(copy(sourceChild));
      }
    }
    else {
      const child = copy(sourceChild || {url});
      Util.removeValueChoices(child, 'valueString');
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
 *
 * @param questionnaire - Questionnaire whose contained resources are listed.
 * @returns Options for contained resources that have both an id and a resourceType.
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
 * Check whether a contained resource is a template of template-based extraction at the
 * Questionnaire root or on any Questionnaire item: the template child of a templateExtract
 * extension, or the valueReference of a templateExtractBundle extension.
 *
 * @param questionnaire - Questionnaire to search.
 * @param resourceId - Contained resource id, without the leading '#'.
 * @returns True when a templateExtract or templateExtractBundle extension references '#resourceId'.
 */
export function hasTemplateExtractReference(questionnaire: fhir.Questionnaire, resourceId?: string): boolean {
  if(!questionnaire || !resourceId) {
    return false;
  }
  const reference = `#${resourceId}`;

  /**
   * Check whether any extension in a list is a template extraction targeting the resource.
   *
   * @param extensions - Extensions of the Questionnaire or of an item.
   * @returns True when a templateExtract or templateExtractBundle extension references the resource.
   */
  const referencesResource = (extensions: fhir.Extension[] = []): boolean =>
    extensions.some(extension =>
      (extension.url === EXTENSION_URL_TEMPLATE_EXTRACT &&
        extension.extension?.some(child =>
          child.url === 'template' && child.valueReference?.reference === reference
        )) ||
      (extension.url === EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE && extension.valueReference?.reference === reference)
    );

  /**
   * Recursively check items and their descendants for a templateExtract reference.
   *
   * @param items - Questionnaire items to search.
   * @returns True when any item in the subtree references the resource.
   */
  const searchItems = (items: fhir.QuestionnaireItem[] = []): boolean =>
    items.some(item => referencesResource(item.extension) || searchItems(item.item));

  return referencesResource(questionnaire.extension) || searchItems(questionnaire.item);
}

/**
 * Build a key that identifies the extraction instruction of a templateExtract occurrence.
 * Only the template reference and the trimmed expressions are compared; unknown child
 * extensions and metadata do not change what is extracted.
 *
 * @param model - Parsed templateExtract occurrence.
 * @returns Comparison key; equal keys denote duplicate extraction instructions.
 */
export function getTemplateExtractSignature(model: TemplateExtractEditModel): string {
  return JSON.stringify([
    model?.templateReference || '',
    ...EXPRESSION_URLS.map(url => model?.[url]?.trim() || '')
  ]);
}

/**
 * Group the templateExtract occurrences of one scope that use the same template and
 * identical expressions.
 *
 * @param extensions - templateExtract extensions at a single Questionnaire or item scope.
 * @returns Groups of zero-based indexes, in row order; only groups with two or more rows.
 */
export function findDuplicateTemplateExtractGroups(extensions: fhir.Extension[] = []): number[][] {
  const groups = new Map<string, number[]>();
  extensions.forEach((extension, index) => {
    const key = getTemplateExtractSignature(parseTemplateExtractExtension(extension));
    groups.set(key, [...(groups.get(key) || []), index]);
  });
  return Array.from(groups.values()).filter(group => group.length > 1);
}

/**
 * Format one-based row numbers as readable text, e.g. "Row 2" or "Rows 1, 2, and 4".
 *
 * @param rowNumbers - One-based row numbers; at least one is expected.
 * @returns Row label followed by the numbers.
 */
export function formatRowNumbers(rowNumbers: number[]): string {
  if(rowNumbers.length <= 1) {
    return `Row ${rowNumbers[0]}`;
  }
  if(rowNumbers.length === 2) {
    return `Rows ${rowNumbers[0]} and ${rowNumbers[1]}`;
  }
  return `Rows ${rowNumbers.slice(0, -1).join(', ')}, and ${rowNumbers[rowNumbers.length - 1]}`;
}

/**
 * Build the summary-table warning for duplicate templateExtract occurrences.
 *
 * @param groups - Duplicate groups returned by findDuplicateTemplateExtractGroups().
 * @returns Warning text, or an empty string when there are no duplicates.
 */
export function getDuplicateTemplateExtractTableWarning(groups: number[][]): string {
  if(!groups.length) {
    return '';
  }
  const duplicates = groups
    .map(group => `${formatRowNumbers(group.map(index => index + 1))} use the same template with identical expressions.`)
    .join(' ');
  return `${duplicates} ${DUPLICATE_CONSEQUENCE}`;
}

/**
 * Build the dialog warning shown when the occurrence being edited duplicates other rows.
 *
 * @param rowNumbers - One-based numbers of the other rows with the same extraction instruction.
 * @returns Warning text, or an empty string when there are no duplicates.
 */
export function getDuplicateTemplateExtractDialogWarning(rowNumbers: number[]): string {
  if(!rowNumbers.length) {
    return '';
  }
  const verb = rowNumbers.length === 1 ? 'uses' : 'use';
  return `${formatRowNumbers(rowNumbers)} at this level already ${verb} the same template with identical expressions. ` +
    DUPLICATE_CONSEQUENCE;
}

