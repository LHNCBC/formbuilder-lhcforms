import {ComponentFixture, TestBed} from '@angular/core/testing';

import { BasePageComponent } from './base-page.component';
import {CommonTestingModule} from '../testing/common-testing.module';
import {FormService} from '../services/form.service';
import {ExtensionCardinalityService} from '../services/extension-cardinality.service';

describe('BasePageComponent', () => {
  let component: BasePageComponent;
  let fixture: ComponentFixture<BasePageComponent>;

  CommonTestingModule.setUpTestBed(BasePageComponent);
  beforeEach(() => {
    fixture = TestBed.createComponent(BasePageComponent);
    component = fixture.componentInstance;
    component.acceptedTermsOfUse = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    // @ts-ignore
    expect(component).toBeTruthy();
  });

  it('should render title', (done) => {
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      const titleEl = compiled.querySelector('#resizableMiddle .container.card .card-body p');
      expect(titleEl.textContent)
        .toContain('How do you want to create your form?');
      done();
    });
  });

  it('should clear extension cardinality selections when loading a Questionnaire', async () => {
    const cardinalityService = TestBed.inject(ExtensionCardinalityService);
    const clearSelectionsSpy = spyOn(cardinalityService, 'clearSelections');

    await component.setQuestionnaire({resourceType: 'Questionnaire', status: 'draft'});

    expect(clearSelectionsSpy).toHaveBeenCalledOnceWith();
  });

  describe('parseOpenerUrl()', () => {
    let formService: FormService;

    // Invoke the private parseOpenerUrl() with a partial window.location mock.
    const parseOpenerUrl = (pathname: string, search = ''): string =>
      component['parseOpenerUrl']({pathname, search} as Location);

    beforeEach(() => {
      // Same singleton the component resolves through inject(FormService).
      formService = TestBed.inject(FormService);
    });

    afterEach(() => {
      // parseOpenerUrl() stores opener state on the shared FormService singleton.
      // The component's constructor keeps a (never-unsubscribed) FormService.lformsLoaded$
      // subscription, so clear the url to stop a later emission from calling
      // window.opener.postMessage() (window.opener is null under Karma).
      formService.windowOpenerUrl = null;
    });

    it('should read referrer and fhirVersion from the root "window-open" path', () => {
      const ret = parseOpenerUrl('/window-open', '?fhirVersion=R4&referrer=https://parent.example.com/fhir');
      expect(formService.windowOpenerUrl).toBe('https://parent.example.com/fhir');
      expect(formService['_windowOpenerFhirVersion']).toBe('R4');
      // parseOpenerUrl() communicates through FormService and returns nothing.
      expect(ret).toBeNull();
    });

    it('should read the params when the app is served from a sub-path', () => {
      // MR !169: strip everything up to the last slash so the "window-open" route is
      // recognized even when the app is hosted under a base href.
      parseOpenerUrl('/lhc-forms-builder/window-open', '?fhirVersion=STU3&referrer=https://parent.example.com/fhir');
      expect(formService.windowOpenerUrl).toBe('https://parent.example.com/fhir');
      expect(formService['_windowOpenerFhirVersion']).toBe('STU3');
    });

    it('should match the "window-open" path case-insensitively', () => {
      parseOpenerUrl('/WINDOW-OPEN', '?fhirVersion=R4&referrer=https://parent.example.com');
      expect(formService.windowOpenerUrl).toBe('https://parent.example.com');
    });

    it('should leave opener details untouched for a non "window-open" path', () => {
      formService.windowOpenerUrl = 'https://unchanged.example.com';
      parseOpenerUrl('/home', '?fhirVersion=STU3&referrer=https://parent.example.com');
      expect(formService.windowOpenerUrl).toBe('https://unchanged.example.com');
      expect(formService['_windowOpenerFhirVersion']).toBe('R4'); // default retained
    });

    it('should ignore an invalid fhirVersion and keep the default', () => {
      parseOpenerUrl('/window-open', '?fhirVersion=NOT_A_VERSION&referrer=https://parent.example.com');
      expect(formService['_windowOpenerFhirVersion']).toBe('R4');
      expect(formService.windowOpenerUrl).toBe('https://parent.example.com');
    });

    it('should set a null opener url when the referrer param is missing', () => {
      parseOpenerUrl('/window-open', '?fhirVersion=R4');
      expect(formService.windowOpenerUrl).toBeNull();
    });
  });
});
