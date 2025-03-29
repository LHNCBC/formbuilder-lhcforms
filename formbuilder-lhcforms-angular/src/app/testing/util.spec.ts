import {TestUtil, BundleOptions} from './util';
import fhir from 'fhir/r4';

describe('Test util', () => {
  let dummyBundle: fhir.Bundle;
  beforeEach(() => {
    dummyBundle = null;
  });

  it('Should create first page dummy bundle', () => {
    dummyBundle = TestUtil.createDummySearchBundle({total: 71});
    expect(dummyBundle.total).toEqual(71);
    expect(dummyBundle.entry.length).toEqual(20);
    expect(dummyBundle.link.length).toEqual(2);
    expect(dummyBundle.link[0].relation).toBe('self');
    const selfUrl = new URL(dummyBundle.link[0].url);
    expect(selfUrl.origin).toEqual('https://lforms-fhir.nlm.nih.gov');
    expect(selfUrl.pathname).toEqual('/baseR4/Questionnaire');
    const selfSearchParams = selfUrl.searchParams;
    expect(selfSearchParams.get('_count')).toBe('20');
    expect(selfSearchParams.get('_getpagesoffset')).toBe('0');
  });

  it('Should create second page dummy bundle', () => {
    const firstPageBundle = TestUtil.createDummySearchBundle({total: 71});
    expect(firstPageBundle.link[1]).toBeDefined();
    dummyBundle =
      TestUtil.createDummySearchBundle({total: 71, linkRelationUrl: firstPageBundle.link[1].url});
    expect(dummyBundle.total).toEqual(71);
    expect(dummyBundle.entry.length).toEqual(20);
    expect(dummyBundle.link.length).toEqual(3);
    expect(dummyBundle.link[0].relation).toBe('self');
    expect(dummyBundle.link[1].relation).toBe('next');
    expect(dummyBundle.link[2].relation).toBe('prev');

    const selfUrl = new URL(dummyBundle.link[0].url);
    expect(selfUrl.origin).toEqual('https://lforms-fhir.nlm.nih.gov');
    expect(selfUrl.pathname).toEqual('/baseR4/Questionnaire');
    const selfSearchParams = selfUrl.searchParams;
    expect(selfSearchParams.get('_count')).toBe('20');
    expect(selfSearchParams.get('_getpagesoffset')).toBe('20');

    const nextUrl = new URL(dummyBundle.link[1].url);
    expect(nextUrl.origin).toEqual('https://lforms-fhir.nlm.nih.gov');
    expect(nextUrl.pathname).toEqual('/baseR4/Questionnaire');
    const nextSearchParams = nextUrl.searchParams;
    expect(nextSearchParams.get('_count')).toBe('20');
    expect(nextSearchParams.get('_getpagesoffset')).toBe('40');

    const prevUrl = new URL(dummyBundle.link[2].url);
    expect(prevUrl.origin).toEqual('https://lforms-fhir.nlm.nih.gov');
    expect(prevUrl.pathname).toEqual('/baseR4/Questionnaire');
    const prevSearchParams = prevUrl.searchParams;
    expect(prevSearchParams.get('_count')).toBe('20');
    expect(prevSearchParams.get('_getpagesoffset')).toBe('0');

  });
});
