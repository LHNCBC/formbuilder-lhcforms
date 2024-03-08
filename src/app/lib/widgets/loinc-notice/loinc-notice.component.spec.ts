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
});
