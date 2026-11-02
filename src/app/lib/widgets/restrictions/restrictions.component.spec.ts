import { ComponentFixture, TestBed } from '@angular/core/testing';

import fhir from 'fhir/r4';

import { RestrictionsComponent } from './restrictions.component';

xdescribe('RestrictionsComponent', () => {
  let component: RestrictionsComponent;
  let fixture: ComponentFixture<RestrictionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ RestrictionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestrictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('RestrictionsComponent.updateOptionExtensions', () => {
  const metadata = {id: 'note'};

  /**
   * Create a component for the item data type, without the Angular dependencies.
   *
   * @param dataType - Item data type.
   * @returns The component.
   */
  function createComponent(dataType: string): RestrictionsComponent {
    const component = Object.create(RestrictionsComponent.prototype) as RestrictionsComponent;
    (component as any).dataType = dataType;
    return component;
  }

  it('should drop the element field of the previous value type', () => {
    const extUrl = RestrictionsComponent.optionsDef.minValue.extUrl;
    const extensions = [{url: extUrl, valueInteger: 1, _valueInteger: metadata} as fhir.Extension];

    const changed = createComponent('decimal').updateOptionExtensions(extensions, 'minValue', [{value: '1.5'}]);

    expect(changed).toBeTrue();
    expect(extensions).toEqual([{url: extUrl, valueDecimal: 1.5} as fhir.Extension]);
  });

  it('should drop a stale element field of another value type', () => {
    const extUrl = RestrictionsComponent.optionsDef.minValue.extUrl;
    const extensions = [{url: extUrl, valueDecimal: 1.5, _valueInteger: metadata} as fhir.Extension];

    const changed = createComponent('decimal').updateOptionExtensions(extensions, 'minValue', [{value: '1.5'}]);

    expect(changed).toBeTrue();
    expect(extensions).toEqual([{url: extUrl, valueDecimal: 1.5} as fhir.Extension]);
  });

  it('should keep the element field of an unchanged value type', () => {
    const extUrl = RestrictionsComponent.optionsDef.minValue.extUrl;
    const extensions = [{url: extUrl, valueDecimal: 1.5, _valueDecimal: metadata} as fhir.Extension];

    const changed = createComponent('decimal').updateOptionExtensions(extensions, 'minValue', [{value: '2'}]);

    expect(changed).toBeTrue();
    expect(extensions).toEqual([{url: extUrl, valueDecimal: 2, _valueDecimal: metadata} as fhir.Extension]);
  });
});
