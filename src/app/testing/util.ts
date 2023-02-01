import {ENTER} from '@angular/cdk/keycodes';
import fhir from 'fhir/r4';
import {DebugElement} from '@angular/core';
import {fhirPrimitives} from '../fhir';

/**
 * Define bundle options
 */
export interface BundleOptions {
  total: number;
  offset?: number;
  pageSize?: number;
  baseUrl?: fhirPrimitives.url;
  linkRelationUrl?: fhirPrimitives.url; // If present, implies create bundle based on the link url, such as next or prev relation.
}

/**
 * Holds utility methods. Avoid non-static methods.
 */
export class TestUtil {
  static setValue(inputEl: HTMLInputElement, value: string): void {
    inputEl.value = value;
    inputEl.dispatchEvent(new Event('input'));
    inputEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
  }

  static checkRadio(radioEl: HTMLInputElement): void {
    radioEl.dispatchEvent(new Event('change'));
  }

  static click(el: HTMLElement): void {
    el.dispatchEvent(new Event('click'));
  }

  static select(selectEl: HTMLSelectElement, optionIndex: number): void {
    selectEl.value = selectEl.options[optionIndex].value;
    selectEl.dispatchEvent(new Event('change'));
  }

  static withButtonText(contextEl: DebugElement, text: string): DebugElement {
    return contextEl.query((de) => {
      return (de.name === 'button') && (de.nativeElement.textContent === text);
    });
  }
  /**
   * Create dummy search results bundle to mock FHIR search responses.
   *
   * @param options - Bundle options
   *   If bundle option includes link relation url, this method reads offset, pageSize and base url from it.
   *   Since total is not part of link, caller still needs to specify total.
   *
   *   If link relation url is not included, caller needs to specify offset, pageSize and base url along with total to
   *   create appropriate results bundle.
   */
  static createDummySearchBundle(
    // {total: number, offset: number = 0, pageSize: number = 20, baseUrl: fhirPrimitives.url = 'https://lforms-fhir.nlm.nih.gov/baseR4'}
    options: BundleOptions
    ): fhir.Bundle {
    const ret: fhir.Bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: options.total,
      entry: [],
      link: []
    };

    let total: number;
    let pageSize: number;
    let offset: number;
    let baseUrl: fhirPrimitives.url;

    const urlObj = options.linkRelationUrl ? new URL(options.linkRelationUrl) : null;
    if(urlObj) {
      const relationParams = urlObj.searchParams;
      offset = parseInt(relationParams.get('_getpagesoffset'), 10);
      pageSize = parseInt(relationParams.get('_count'), 10);
      baseUrl = urlObj.origin + urlObj.pathname.replace(/\/Questionnaire$/, '');
    }else {
      offset = options.offset >= 0 ? options.offset : 0;
      pageSize = options.pageSize >= 0 ? options.pageSize : 20;
      baseUrl = options.baseUrl ? options.baseUrl : 'https://lforms-fhir.nlm.nih.gov/baseR4';
    }
    // Sanitize inputs
    total = options.total >= 0 ? options.total : 0;

    offset = offset > total ? total : offset;
    const entriesCount = total - offset > pageSize ? pageSize : total - offset;

    /**
     * Create bundle link based on the relation
     * @param relation - Should be 'self' | 'next' | 'prev' | 'previous'.
     *
     */
    const createLink = (relation) => {
      let pagesoffset: number;
      if(relation === 'next') {
        pagesoffset = entriesCount < pageSize ? -1 : offset + pageSize;
      }
      else if (relation === 'self') {
        pagesoffset = offset;
      }
      else if (relation === 'prev' || relation === 'previous') { // prev and previous
        pagesoffset = offset === 0 ? -1 : offset - pageSize;
      }
      else {
        return null;
      }

      if(pagesoffset < 0) {
        return null;
      }

      const url = new URL(baseUrl+'/Questionnaire');
      url.searchParams.set('_getpages', 'dummy');
      url.searchParams.set('_getpagesoffset', pagesoffset.toString());
      url.searchParams.set('_count', pageSize.toString());
      url.searchParams.set('bundletype', 'searchset');
      return {relation, url: url.toString()};
    };

    ret.link.push(createLink('self'));
    const next = createLink('next');
    if(next !== null) {
      ret.link.push(next);
    }
    const prev = createLink('prev');
    if(prev !== null) {
      ret.link.push(prev);
    }

    for(let i = 0; i < entriesCount; i++) {
      const id = (offset+i+1).toString(10);
      ret.entry.push({
        resource: {
          resourceType: 'Questionnaire',
          id,
          status: 'draft',
          title: 'Form '+id,
          date: new Date().toUTCString(),
          publisher: 'dummy publisher'
        }
      });
    }
    return ret;
  }

}
