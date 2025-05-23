import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitsDisplayComponent } from './units-display.component';
import { TableService } from 'src/app/services/table.service';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { UnitStorageService } from 'src/app/services/unit-storage.service';
import { of } from 'rxjs';

xdescribe('UnitsDisplayComponent', () => {
  let component: UnitsDisplayComponent;
  let fixture: ComponentFixture<UnitsDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ExtensionsService, useValue: jasmine.createSpyObj('ExtensionsService', ['resetExtension', 'addExtension', 'replaceExtensions', 'getExtensionsByUrl', 'getFirstExtensionByUrl', 'removeExtension']) },
        { provide: UnitStorageService, useValue: jasmine.createSpyObj('UnitStorageService', ['addUnit', 'getUnits', 'clearUnits', 'translateUnitDisplayToCode']) }
      ],
      declarations: [UnitsDisplayComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitsDisplayComponent);
    component = fixture.componentInstance;

    // Set schema FIRST
    component.schema = { placeholder: '', widget: {"id": "units-display"} } as any;

    // Then mock formProperty
    component.formProperty = {
      parent: {
        getProperty: () => ({ setValue: () => {} }),
        valueChanges: { subscribe: () => ({}) },
        __canonicalPathNotation: 'mockPath'
      },
      searchProperty: () => ({ valueChanges: { subscribe: () => ({}) } }),
      findRoot: () => ({
        getProperty: () => ({
          properties: [],
          value: [],
          setValue: () => {},
          addItem: () => {}
        })
      }),
      schema: {
        widget: {
          "id": "units-display"
        }
      },
      valueChanges: of({}),
      root: null,
      path: '',
      findProperty: () => null,
    } as any;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});