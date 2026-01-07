import {ChangeDetectorRef, Component, Input, NgModule} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TreeModule} from '@bugsplat/angular-tree-component';
import {
  ActionRegistry, BindingRegistry,
  DefaultLogService,
  ExpressionCompilerFactory, FormProperty, FormPropertyFactory,
  ISchema, JEXLExpressionCompilerFactory, LogService, PropertyBindingRegistry,
  SchemaFormModule, SchemaValidatorFactory, TerminatorService, ValidatorRegistry, WidgetFactory,
  WidgetRegistry, ZSchemaValidatorFactory, FormComponent
} from '@lhncbc/ngx-schema-form';
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {LayoutModule} from '@angular/cdk/layout';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AppModule} from '../app.module';
import {LformsWidgetRegistry} from '../lib/lforms-widget-registry';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormService} from '../services/form.service';
import {FhirService} from '../services/fhir.service';

declare var LForms: any;

export function useFormPropertyFactory(schemaValidatorFactory: SchemaValidatorFactory,
                           validatorRegistry: ValidatorRegistry,
                           propertyBindingRegistry: PropertyBindingRegistry,
                           expressionCompilerFactory: ExpressionCompilerFactory,
                           logService: LogService) {
  return new FormPropertyFactory(schemaValidatorFactory, validatorRegistry, propertyBindingRegistry, expressionCompilerFactory, logService);
}



@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sf-test',
  imports: [SchemaFormModule],
  template: `
    <sf-form [schema]="schema" [(model)]="model"></sf-form>
  `,
  providers: [FormComponent]
})
export class TestComponent {

  @Input()
  schema: ISchema = {type: 'object', properties: {}};
  @Input()
  model: any;

}

@NgModule({
  imports: [
    SchemaFormModule,
    TestComponent
  ],
})
export class CommonTestingModule {

  static commonTestingImports: any[] = [
    AppModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    NoopAnimationsModule,
    LayoutModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    NgbModule
  ];

  static commonTestingDeclarations: any [] = [];

  static formPropertyFactory: FormPropertyFactory;

  static commonTestProviders: any [] = [
    provideHttpClient(),
    WidgetFactory,
    {provide: WidgetRegistry, useClass: LformsWidgetRegistry},
    NgbActiveModal,
    FormService,
    FhirService,
    ActionRegistry,
    BindingRegistry,
    TerminatorService,
    {provide: SchemaValidatorFactory, useClass: ZSchemaValidatorFactory},
    ValidatorRegistry,
    PropertyBindingRegistry,
    {provide: ExpressionCompilerFactory, useClass: JEXLExpressionCompilerFactory},
    {provide: LogService, useClass: DefaultLogService},
  ];

  static setUpTestBedConfig = (moduleConfig: any) => {
    beforeEach(async () => {
      let declarations = CommonTestingModule.commonTestingDeclarations;
      let imports = CommonTestingModule.commonTestingImports;
      let providers = CommonTestingModule.commonTestProviders;
      declarations = moduleConfig.declarations ? [...declarations, ...moduleConfig.declarations] : declarations;
      imports = moduleConfig.imports ? [...imports, ...moduleConfig.imports] : imports;
      providers = moduleConfig.providers ? [...providers, ...moduleConfig.providers] : providers;
      const spy = spyOn(FormService.prototype, 'loadLFormsLib');
      spy.and.callFake(() => {return Promise.resolve(LForms.lformsVersion)});

      await TestBed.configureTestingModule({
        declarations,
        imports,
        providers
      }).compileComponents();
    });

    beforeEach(() => {
      CommonTestingModule.formPropertyFactory = useFormPropertyFactory(
        TestBed.inject(SchemaValidatorFactory),
        TestBed.inject(ValidatorRegistry),
        TestBed.inject(PropertyBindingRegistry),
        TestBed.inject(ExpressionCompilerFactory),
        TestBed.inject(LogService)
      );
    });

    beforeEach(async () => {
      const formService = TestBed.inject(FormService);
      await formService.initialize();
    });
  };

  static setUpTestBed = (TestingComponent: any, standalone = false) => {
    const config: {imports?: [any], declarations?: [any]} = {};
    if (standalone) {
      config.imports = [TestingComponent];
    }
    else {
      config.declarations = [TestingComponent];
    }
    CommonTestingModule.setUpTestBedConfig(config);
  };

  static setupTestBedWithTestForm = () => {
    CommonTestingModule.setUpTestBedConfig({imports: [TestComponent]});
  }

  static createProperty(schema: ISchema, model: any): FormProperty {
    const formProperty = this.formPropertyFactory.createProperty(schema, null, null);
    formProperty.setValue(model, false);
    formProperty.updateValueAndValidity();
    return formProperty;
  }

}

/**
 * Changes in components using OnPush strategy are only applied once when calling .detectChanges(),
 * This function solves this issue.
 */
export async function runOnPushChangeDetection(fixture: ComponentFixture<any>): Promise<void> {
  const changeDetectorRef = fixture.debugElement.injector.get<ChangeDetectorRef>(ChangeDetectorRef);
  changeDetectorRef.detectChanges();
  return fixture.whenStable();
}
