/**
 * Derive a short display string from common fields without assuming a resource-specific schema.
 *
 * @param resource - FHIR resource or search-result summary.
 * @returns Human-readable display text.
 */
export function getContainedResourceDisplay(resource: any): string {
  if(typeof resource?.title === 'string' && resource.title.trim()) {
    return resource.title;
  }
  if(typeof resource?.name === 'string' && resource.name.trim()) {
    return resource.name;
  }
  const name = Array.isArray(resource?.name) ? resource.name[0] : null;
  if(name) {
    const humanName = name.text || [...(name.given || []), name.family].filter(Boolean).join(' ');
    if(humanName) {
      return humanName;
    }
  }
  for(const value of [resource?.description, resource?.url, resource?.status]) {
    if(typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  if(resource?.code?.text) {
    return resource.code.text;
  }
  const codingDisplay = resource?.code?.coding?.find((coding) => coding.display)?.display;
  return codingDisplay || '';
}
