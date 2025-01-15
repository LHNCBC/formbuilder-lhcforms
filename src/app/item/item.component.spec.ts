import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemComponent } from './item.component';
import {CommonTestingModule} from '../testing/common-testing.module';
import {runOnPushChangeDetection} from '../testing/common-testing.module';


describe('ItemComponent', () => {
  let component: ItemComponent;
  let fixture: ComponentFixture<ItemComponent>;
  CommonTestingModule.setUpTestBed(ItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile ui item editor', () => {
    expect(component).toBeTruthy();
    expect(component.uiItemEditor).toBeDefined();
  });
});
