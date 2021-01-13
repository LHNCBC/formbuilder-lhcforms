import {Component, EventEmitter, Input, NgModule, OnChanges, SimpleChanges, Output, OnInit} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ItemComponent} from '../item/item.component';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {JsonEditorComponent} from '../json-editor/json-editor.component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor.component';
import {TreeComponent, TreeModule} from '@circlon/angular-tree-component';
import {
  ActionRegistry, BindingRegistry, DefaultWidgetRegistry, ExpressionCompilerFactory,
  FormComponent, FormElementComponent, FormProperty, FormPropertyFactory,
  ISchema, LogService,
  SchemaFormModule, SchemaPreprocessor, SchemaValidatorFactory, TerminatorService,
  ValidatorRegistry, Widget, WidgetFactory, WidgetRegistry, ZSchemaValidatorFactory
} from 'ngx-schema-form';
import {HttpClientModule} from '@angular/common/http';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {LayoutModule} from '@angular/cdk/layout';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AppComponent} from '../app.component';
import {AppModule} from '../app.module';
import {By} from '@angular/platform-browser';
import {FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {PropertyBindingRegistry} from 'ngx-schema-form/lib/property-binding-registry';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sf-test',
  template: `
    <sf-form [schema]="schema" [(model)]="model"></sf-form>
  `
})
export class TestComponent implements OnInit {

  @Input()
  schema: ISchema = {type: 'object', properties: {}};
  @Input()
  model: any;

  ngOnInit() {
  }
}

@NgModule({
  imports: [
    SchemaFormModule
  ],
  declarations: [TestComponent]
})
export class CommonTestingModule {

  static moduleImports: any[] = [
    AppModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    HttpClientModule,
    NoopAnimationsModule,
    LayoutModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
  ];

  static moduleDeclarations: any [] = [];

  static moduleProviders: any [] = [];

  static setUpTestBedConfig = (moduleConfig: any) => {
    beforeEach(() => {
      let declarations = CommonTestingModule.moduleDeclarations;
      let imports = CommonTestingModule.moduleImports;
      let providers = CommonTestingModule.moduleProviders;
      declarations = moduleConfig.declarations ? [...declarations, ...moduleConfig.declarations] : declarations;
      imports = moduleConfig.imports ? [...imports, ...moduleConfig.imports] : imports;
      providers = moduleConfig.providers ? [...providers, ...moduleConfig.providers] : providers;

      TestBed.configureTestingModule({
        declarations,
        imports,
        providers
      });
    });
  }

  static setUpTestBedConfig1 = (moduleConfig: any) => {
    beforeEach(async(() => {
      let declarations = CommonTestingModule.moduleDeclarations;
      let imports = CommonTestingModule.moduleImports;
      let providers = CommonTestingModule.moduleProviders;
      declarations = moduleConfig.declarations ? [...declarations, ...moduleConfig.declarations] : declarations;
      imports = moduleConfig.imports ? [...imports, ...moduleConfig.imports] : imports;
      providers = moduleConfig.providers ? [...providers, ...moduleConfig.providers] : providers;

      TestBed.configureTestingModule({
        imports: [
          SchemaFormModule.forRoot(),
          HttpClientModule
        ],
        declarations,
        providers: [
          {provide: WidgetRegistry, useClass: DefaultWidgetRegistry},
          {
            provide: SchemaValidatorFactory,
            useClass: ZSchemaValidatorFactory
          }
        ]
      }).compileComponents();
    }));
  }

  static setUpTestBed = (TestingComponent: any) => {
    CommonTestingModule.setUpTestBedConfig({declarations: [TestingComponent]});
  }

  static setupTestBedOne = () => {
    CommonTestingModule.setUpTestBedConfig1({declarations: [TestComponent]});
  }
}

/*
const schemaA: ISchema = {
  type: 'object',
  properties: {
    fieldB: {
      type: 'string',
      title: 'A title',
      description: 'A description'
    },
    fieldA: {
      type: 'string',
      title: 'B title',
      description: 'B description'
    }
  }
};
describe('TestHost', () => {

  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, SchemaFormModule.forRoot()],
      declarations: [TestComponent],
      providers: []
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    const predicate = By.directive(FormComponent);
    const form = fixture.debugElement.query(predicate).componentInstance;
    expect(form).toBeTruthy();
  });

  it('should generate form with input', () => {
    const forms = fixture.debugElement.queryAll(By.css('form'));
    expect(forms.length).toBe(1);

    const inputs = forms[0].queryAll(By.css('input'));
    expect(inputs.length).toBe(1);
  });

  it('should generate new form on schema changes', () => {
    component.schema = schemaA;
    fixture.detectChanges();

    const forms = fixture.debugElement.queryAll(By.css('form'));
    expect(forms.length).toBe(1);

    const inputs = forms[0].queryAll(By.css('input'));
    expect(inputs.length).toBe(2);
  });

  it('should populate respective input on changes to model', () => {
    component.schema = schemaA;
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('input');

    inputs.forEach(input => {
      expect(input.value).toBeFalsy();
    });

    component.model = {
      fieldA: 'A',
      fieldB: 'B'
    };
    fixture.detectChanges();

    expect(inputs[0].value).toEqual('B');
    expect(inputs[1].value).toEqual('A');
  });

  it('should support 2 way data binding', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement;

    expect(input.value).toBeFalsy();

    component.model = {
      fieldA: 'A'
    };

    fixture.detectChanges();

    fixture.whenStable().then(() => {
      expect(input.value).toEqual('A');

      const value = 'CHANGED';
      input.value = value;
      input.dispatchEvent(new Event('input'));

      expect(component.model.fieldA).toEqual(value);
    });
  });

  it('should emit onChange events on field value change', () => {
    const predicate = By.directive(FormComponent);
    const form = fixture.debugElement.query(predicate).componentInstance;
    spyOn(form.onChange, 'emit');

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      input.value = 'CHANGED';
      input.dispatchEvent(new Event('input'));

      const value = {fieldA: 'CHANGED'};
      expect(form.onChange.emit).toHaveBeenCalledWith({value});
    });
  });
});
*/
