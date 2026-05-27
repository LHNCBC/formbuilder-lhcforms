import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LfbArrayComponent } from './lfb-array.component';
import {TableService} from "../../../services/table.service";
import {ArrayProperty, PropertyGroup, SchemaFormModule} from "@lhncbc/ngx-schema-form";
import {FormService} from "../../../services/form.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import sampleQ from "../../../../../cypress/fixtures/sample.R4.json";
import {HttpClientTestingModule, provideHttpClientTesting} from "@angular/common/http/testing";

xdescribe('LfbArrayComponent', () => {
  let component: LfbArrayComponent;
  let fixture: ComponentFixture<LfbArrayComponent>;
  let formService: FormService;

  CommonTestingModule.setUpTestBedConfig({
    imports: [LfbArrayComponent],
    providers: [TableService, FormService, provideHttpClientTesting()]
  });
  beforeEach(async () => {
    fixture = TestBed.createComponent(LfbArrayComponent);
    component = fixture.componentInstance;

    formService = fixture.debugElement.injector.get(FormService);
    const schema = formService.getFormLevelSchema();
    const rootProperty: PropertyGroup = CommonTestingModule.createProperty(schema, sampleQ) as PropertyGroup;
    const contactProp = rootProperty.getProperty('contact') as ArrayProperty;

    component.formProperty = contactProp;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
