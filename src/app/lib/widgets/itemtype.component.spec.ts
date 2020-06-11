import {Component, ViewChild} from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemtypeComponent } from './itemtype.component';

fdescribe('ItemtypeComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;
  let comp: ItemtypeComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemtypeComponent, ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();
    comp = testHostComponent.itemtypeComponent;
  });

  it('should create', () => {
    expect(testHostComponent).toBeTruthy();
  });

  it('should update itemType with data type input', () => {
    comp.dataType = 'display';
    testHostFixture.detectChanges();
    expect(comp.itemType).toEqual('display');
    comp.dataType = 'group';
    testHostFixture.detectChanges();
    expect(comp.itemType).toEqual('group');
    comp.dataType = 'string';
    testHostFixture.detectChanges();
    expect(comp.itemType).toEqual('question');
  });

  it('should emit dataType with item type input', () => {
    let dataType: string;
    comp.dataTypeChanged.subscribe((type) => {
      dataType = type;
    });

    comp.itemType = 'display';
    testHostFixture.detectChanges();
    expect(dataType).toEqual('display');
    comp.itemType = 'group';
    testHostFixture.detectChanges();
    expect(dataType).toEqual('group');
    comp.itemType = 'question';
    testHostFixture.detectChanges();
    expect(dataType).toEqual(comp.dataType);
  });

  @Component({
    selector: `app-host-component`,
    template: `<app-itemtype></app-itemtype>`
  })
  class TestHostComponent {
    @ViewChild(ItemtypeComponent)
    public itemtypeComponent: ItemtypeComponent;
  }
});
