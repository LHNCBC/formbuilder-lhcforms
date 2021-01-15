import {Component, Input, NgModule, OnInit} from '@angular/core';
import {async, TestBed} from '@angular/core/testing';
import {TreeModule} from '@circlon/angular-tree-component';
import {
  DefaultWidgetRegistry, ISchema, SchemaFormModule, SchemaValidatorFactory, WidgetRegistry, ZSchemaValidatorFactory
} from 'ngx-schema-form';
import {HttpClientModule} from '@angular/common/http';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {LayoutModule} from '@angular/cdk/layout';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AppModule} from '../app.module';

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
  };

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
  };

  static setUpTestBed = (TestingComponent: any) => {
    CommonTestingModule.setUpTestBedConfig({declarations: [TestingComponent]});
  };

  static setupTestBedOne = () => {
    CommonTestingModule.setUpTestBedConfig1({declarations: [TestComponent]});
  }
}
