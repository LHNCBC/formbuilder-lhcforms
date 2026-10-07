import {
  getAllowedSystemLookups,
  LOINC_SYSTEM_URL,
  SNOMED_SYSTEM_URL
} from './coding-system-lookup';

describe('getAllowedSystemLookups', () => {
  const lookups = [
    {systemUrl: SNOMED_SYSTEM_URL, lookupUrl: 'snomed-lookup'},
    {systemUrl: LOINC_SYSTEM_URL, lookupUrl: 'loinc-lookup'},
    {systemUrl: 'http://unitsofmeasure.org', lookupUrl: 'ucum-lookup'}
  ];

  it('offers only UCUM when SNOMED terms have not been accepted', () => {
    expect(getAllowedSystemLookups(lookups, false)).toEqual([
      {systemUrl: 'http://unitsofmeasure.org', lookupUrl: 'ucum-lookup'}
    ]);
  });

  it('offers SNOMED and UCUM when SNOMED terms have been accepted', () => {
    expect(getAllowedSystemLookups(lookups, true)).toEqual([
      {systemUrl: SNOMED_SYSTEM_URL, lookupUrl: 'snomed-lookup'},
      {systemUrl: 'http://unitsofmeasure.org', lookupUrl: 'ucum-lookup'}
    ]);
  });
});
