import {ChangeDetectorRef, Component, Input, NgModule} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TreeModule} from '@bugsplat/angular-tree-component';
import {
  ISchema,
  SchemaFormModule, WidgetFactory,
  WidgetRegistry,
} from '@lhncbc/ngx-schema-form';
import {HttpClientTestingModule} from '@angular/common/http/testing';
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

@Component({
  standalone: false,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sf-test',
  template: `
    <sf-form [schema]="schema" [(model)]="model"></sf-form>
  `
})
export class TestComponent {

  @Input()
  schema: ISchema = {type: 'object', properties: {}};
  @Input()
  model: any;

}

@NgModule({
  imports: [
    SchemaFormModule
  ],
  declarations: [TestComponent]
})
export class CommonTestingModule {

  static commonTestingImports: any[] = [
    AppModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    HttpClientTestingModule,
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

  static commonTestProviders: any [] = [
    WidgetFactory,
    {provide: WidgetRegistry, useClass: LformsWidgetRegistry},
    NgbActiveModal,
    FormService,
    FhirService
  ];

  static setUpTestBedConfig = (moduleConfig: any) => {
    beforeEach(() => {
      let declarations = CommonTestingModule.commonTestingDeclarations;
      let imports = CommonTestingModule.commonTestingImports;
      let providers = CommonTestingModule.commonTestProviders;
      declarations = moduleConfig.declarations ? [...declarations, ...moduleConfig.declarations] : declarations;
      imports = moduleConfig.imports ? [...imports, ...moduleConfig.imports] : imports;
      providers = moduleConfig.providers ? [...providers, ...moduleConfig.providers] : providers;
      const spy = spyOn(FormService.prototype, 'loadLFormsLib');
      spy.and.callFake(() => {return Promise.resolve(LForms.lformsVersion)});

      TestBed.configureTestingModule({
        declarations,
        imports,
        providers
      }).compileComponents();
    });

    beforeEach(() => {
      TestBed.inject(FormService);
    });
  };

  static setUpTestBed = (TestingComponent: any) => {
    CommonTestingModule.setUpTestBedConfig({declarations: [TestingComponent]});
  };

  static setupTestBedWithTestForm = () => {
    CommonTestingModule.setUpTestBedConfig({declarations: [TestComponent]});
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
