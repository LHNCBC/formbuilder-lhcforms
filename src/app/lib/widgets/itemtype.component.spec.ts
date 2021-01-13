import {Component, ViewChild} from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemtypeComponent } from './itemtype.component';
import {FormsModule} from '@angular/forms';
import {DefaultWidgetRegistry, SchemaFormModule, SchemaValidatorFactory, WidgetRegistry, ZSchemaValidatorFactory} from 'ngx-schema-form';
import {LformsWidgetRegistry} from '../lforms-widget-registry';
import {LabelComponent} from './label.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

xdescribe('ItemtypeComponent', () => {
//  let testHostComponent: TestHostComponent;
//  let testHostFixture: ComponentFixture<TestHostComponent>;
  let comp: ItemtypeComponent;
  let fixture: ComponentFixture<ItemtypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SchemaFormModule.forRoot(), FormsModule, FontAwesomeModule, MatTooltipModule],
      declarations: [ ItemtypeComponent, LabelComponent],
      providers: [
        {provide: WidgetRegistry, useClass: LformsWidgetRegistry},
        {provide: SchemaValidatorFactory, useClass: ZSchemaValidatorFactory}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemtypeComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should update itemType with data type input', () => {
    comp.itemType = 'display';
    fixture.detectChanges();
    expect(comp.itemType).toEqual('display');
    comp.itemType = 'group';
    fixture.detectChanges();
    expect(comp.itemType).toEqual('group');
    comp.itemType = 'string';
    fixture.detectChanges();
    expect(comp.itemType).toEqual('question');
  });

  it('should emit dataType with item type input', () => {
    let dataType: string;
    comp.formProperty.valueChanges.subscribe((type) => {
      dataType = type;
    });

    comp.itemType = 'display';
    fixture.detectChanges();
    expect(dataType).toEqual('display');
    comp.itemType = 'group';
    fixture.detectChanges();
    expect(dataType).toEqual('group');
    comp.itemType = 'question';
    fixture.detectChanges();
    expect(dataType).toEqual(comp.formProperty.value);
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
