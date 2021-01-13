import { LayoutModule } from '@angular/cdk/layout';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ItemComponent } from './item.component';
import {SchemaFormModule, SchemaValidatorFactory, WidgetRegistry, ZSchemaValidatorFactory} from 'ngx-schema-form';
import {LformsWidgetRegistry} from '../lib/lforms-widget-registry';
import {FetchService} from '../fetch.service';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {TreeComponent, TreeModule} from '@circlon/angular-tree-component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor.component';
import {JsonEditorComponent} from '../json-editor/json-editor.component';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('ItemComponent', () => {
  let component: ItemComponent;
  let fixture: ComponentFixture<ItemComponent>;
/*
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ItemComponent, NgxSchemaFormComponent, JsonEditorComponent, ItemJsonEditorComponent, TreeComponent],
      imports: [
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
      ]
    }).compileComponents();
  }));
*/
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

  it('should compile json item editor', () => {
    component.toggleEditType({});
    fixture.detectChanges();
    expect(component.jsonItemEditor).toBeDefined();
  });
});
