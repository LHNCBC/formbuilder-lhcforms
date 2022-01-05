import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemJsonEditorComponent } from './item-json-editor.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('ItemJsonEditorComponent', () => {
  let component: ItemJsonEditorComponent;
  let fixture: ComponentFixture<ItemJsonEditorComponent>;

  CommonTestingModule.setUpTestBed(ItemJsonEditorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemJsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
