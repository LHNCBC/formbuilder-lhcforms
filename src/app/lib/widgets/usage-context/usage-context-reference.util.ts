import type {UsageContextEditModel} from './usage-context.types';

/**
 * Check whether a contained resource id is the target of a Usage Context reference.
 *
 * @param usageContexts - Questionnaire Usage Context values.
 * @param resourceId - Contained resource id without the fragment prefix.
 * @returns True when a valueReference points to the contained resource.
 */
export function hasUsageContextLocalReference(
  usageContexts: UsageContextEditModel[] | null | undefined,
  resourceId: string | null | undefined
): boolean {
  const normalizedId = resourceId?.trim();
  if(!normalizedId) {
    return false;
  }

  return !!usageContexts?.some((usageContext) =>
    usageContext?.valueReference?.reference?.trim() === `#${normalizedId}`
  );
}
