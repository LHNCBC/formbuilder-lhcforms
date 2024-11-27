import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewDlgComponent } from './preview-dlg.component';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('PreviewDlgComponent', () => {
  let component: PreviewDlgComponent;
  let fixture: ComponentFixture<PreviewDlgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewDlgComponent ],
      imports: [MatDialogModule, MatTabsModule, MatIconModule, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: {}}]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    // @ts-ignore
    expect(component).toBeTruthy();
  });
});
