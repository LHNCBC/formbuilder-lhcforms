import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoincNoticeComponent } from './loinc-notice.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('LoincNoticeComponent', () => {
  let component: LoincNoticeComponent;
  let fixture: ComponentFixture<LoincNoticeComponent>;

  CommonTestingModule.setUpTestBedConfig({
    declarations: [LoincNoticeComponent],
    providers: [NgbActiveModal],
    imports: [FormsModule]
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(LoincNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear SNOMED acceptance when SNOMED support is disabled', () => {
    component.onUseSnomedChange(true);
    component.acceptedTerms.acceptedSnomed = true;

    component.onUseSnomedChange(false);

    expect(component.useSnomed).toBeFalse();
    expect(component.acceptedTerms.acceptedSnomed).toBeFalse();
  });

  it('should not return SNOMED acceptance when SNOMED support is disabled', () => {
    const activeModal = TestBed.inject(NgbActiveModal);
    const closeSpy = spyOn(activeModal, 'close');
    component.acceptedTerms.acceptedLoinc = true;
    component.acceptedTerms.acceptedSnomed = true;
    component.useSnomed = false;

    component.close(true);

    expect(closeSpy).toHaveBeenCalledWith({acceptedLoinc: true, acceptedSnomed: false});
  });
});
