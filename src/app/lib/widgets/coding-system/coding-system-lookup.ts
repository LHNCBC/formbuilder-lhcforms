export const LOINC_SYSTEM_URL = 'http://loinc.org';
export const SNOMED_SYSTEM_URL = 'http://snomed.info/sct';

/**
 * Return the code-system lookups that may be offered in the answer choices UI.
 *
 * LOINC answers may still be entered or imported, but the general LOINC item
 * endpoint must not be used to look them up. SNOMED lookup is licensed and is
 * available only after the user accepts the SNOMED terms.
 *
 * @param systemLookups - Configured code-system lookup entries, each with a `systemUrl`.
 *   A null or undefined value is treated as an empty list.
 * @param isSnomedUser - True if the user has accepted the SNOMED CT license terms.
 * @returns A new array of the allowed lookup entries. The LOINC entry is always
 *   excluded, and the SNOMED entry is excluded unless `isSnomedUser` is true.
 */
export function getAllowedSystemLookups(systemLookups: any[], isSnomedUser: boolean): any[] {
  return (systemLookups || []).filter((lookup: any) =>
    lookup.systemUrl !== LOINC_SYSTEM_URL &&
    (lookup.systemUrl !== SNOMED_SYSTEM_URL || isSnomedUser)
  );
}
