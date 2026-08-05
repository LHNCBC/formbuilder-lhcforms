import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  ExtensionCardinalitySelectionDlgComponent
} from './extension-cardinality-selection-dlg.component';

describe('ExtensionCardinalitySelectionDlgComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionCardinalitySelectionDlgComponent],
      providers: [{
        provide: NgbActiveModal,
        useValue: jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss'])
      }]
    }).compileComponents();
  });

  it('should use unique accessible-name IDs for simultaneous dialogs', () => {
    const firstFixture: ComponentFixture<ExtensionCardinalitySelectionDlgComponent> =
      TestBed.createComponent(ExtensionCardinalitySelectionDlgComponent);
    const secondFixture: ComponentFixture<ExtensionCardinalitySelectionDlgComponent> =
      TestBed.createComponent(ExtensionCardinalitySelectionDlgComponent);
    firstFixture.detectChanges();
    secondFixture.detectChanges();

    const firstDialog: HTMLElement = firstFixture.nativeElement.querySelector('[role="dialog"]');
    const secondDialog: HTMLElement = secondFixture.nativeElement.querySelector('[role="dialog"]');
    const firstTitleId = firstDialog.getAttribute('aria-labelledby');
    const secondTitleId = secondDialog.getAttribute('aria-labelledby');
    const firstDescriptionId = firstDialog.getAttribute('aria-describedby');
    const secondDescriptionId = secondDialog.getAttribute('aria-describedby');

    expect(firstTitleId).not.toBe(secondTitleId);
    expect(firstDescriptionId).not.toBe(secondDescriptionId);
    expect(firstFixture.nativeElement.querySelector('input[type="radio"]').getAttribute('name'))
      .not.toBe(secondFixture.nativeElement.querySelector('input[type="radio"]').getAttribute('name'));
    expect(firstFixture.nativeElement.querySelector(`[id="${firstTitleId}"]`)).not.toBeNull();
    expect(firstFixture.nativeElement.querySelector(`[id="${firstDescriptionId}"]`)).not.toBeNull();
    expect(secondFixture.nativeElement.querySelector(`[id="${secondTitleId}"]`)).not.toBeNull();
    expect(secondFixture.nativeElement.querySelector(`[id="${secondDescriptionId}"]`)).not.toBeNull();
  });

  it('should distinguish versioned definitions in radio accessible names', () => {
    const fixture: ComponentFixture<ExtensionCardinalitySelectionDlgComponent> =
      TestBed.createComponent(ExtensionCardinalitySelectionDlgComponent);
    fixture.componentInstance.candidates = [{
      title: 'Shared extension',
      version: '1.0.0',
      fhirVersion: '4.0.1',
      maxCardinality: '1'
    }, {
      title: 'Shared extension',
      version: '2.0.0',
      fhirVersion: '5.0.0',
      maxCardinality: '*'
    }];
    fixture.detectChanges();

    const radios: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]')
    );
    const firstLabel = radios[0].getAttribute('aria-label');
    const secondLabel = radios[1].getAttribute('aria-label');

    expect(firstLabel).toContain('Shared extension');
    expect(firstLabel).toContain('version 1.0.0');
    expect(firstLabel).toContain('FHIR version 4.0.1');
    expect(firstLabel).toContain('maximum 1');
    expect(secondLabel).toContain('version 2.0.0');
    expect(secondLabel).toContain('FHIR version 5.0.0');
    expect(secondLabel).toContain('maximum *');
    expect(firstLabel).not.toBe(secondLabel);
  });
});
