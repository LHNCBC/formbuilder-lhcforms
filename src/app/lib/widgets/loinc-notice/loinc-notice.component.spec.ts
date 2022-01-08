import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoincNoticeComponent } from './loinc-notice.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

describe('LoincNoticeComponent', () => {
  let component: LoincNoticeComponent;
  let fixture: ComponentFixture<LoincNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoincNoticeComponent ],
      providers: [NgbActiveModal]
    })
    .compileComponents();
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
