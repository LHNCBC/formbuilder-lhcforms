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
    expect(firstFixture.nativeElement.querySelector(`[id="${firstTitleId}"]`)).not.toBeNull();
    expect(firstFixture.nativeElement.querySelector(`[id="${firstDescriptionId}"]`)).not.toBeNull();
    expect(secondFixture.nativeElement.querySelector(`[id="${secondTitleId}"]`)).not.toBeNull();
    expect(secondFixture.nativeElement.querySelector(`[id="${secondDescriptionId}"]`)).not.toBeNull();
  });
});
