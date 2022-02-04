import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSpecifiedServerDlgComponent } from './user-specified-server-dlg.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {FhirSearchDlgComponent} from '../fhir-search-dlg/fhir-search-dlg.component';

describe('UserSpecifiedServerDlgComponent', () => {
  let component: UserSpecifiedServerDlgComponent;
  let fixture: ComponentFixture<UserSpecifiedServerDlgComponent>;

  afterAll(() => {
    TestBed.resetTestingModule();
  });

  CommonTestingModule.setUpTestBed(FhirSearchDlgComponent);



  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserSpecifiedServerDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSpecifiedServerDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
