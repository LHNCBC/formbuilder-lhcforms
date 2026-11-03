import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationExtractComponent } from './observation-extract.component';

describe('ObservationExtractComponent', () => {
  let component: ObservationExtractComponent;
  let fixture: ComponentFixture<ObservationExtractComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ObservationExtractComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationExtractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('ObservationExtractComponent extraction rules', () => {
  const url = ObservationExtractComponent.extUrl;

  it('reads only a boolean value of the first observationExtract extension', () => {
    expect(ObservationExtractComponent.getExtractBoolean(undefined)).toBeUndefined();
    expect(ObservationExtractComponent.getExtractBoolean([{url, valueBoolean: false}])).toBeFalse();
    expect(ObservationExtractComponent.getExtractBoolean([{url, valueCode: 'member'}])).toBeUndefined();
    expect(ObservationExtractComponent.getExtractBoolean([
      {url: 'http://example.org/other', valueBoolean: false}, {url, valueBoolean: true}
    ])).toBeTrue();
  });

  it('inherits the boolean of the nearest ancestor that has one', () => {
    const inherited = (ancestors) => ObservationExtractComponent.getInheritedExtractBoolean(ancestors);
    expect(inherited([])).toBeUndefined();
    expect(inherited([[], [{url, valueCode: 'member'}]])).toBeUndefined();
    // A nearer false overrides a more distant true, and the reverse.
    expect(inherited([[{url, valueCode: 'member'}], [{url, valueBoolean: false}], [{url, valueBoolean: true}]]))
      .toBeFalse();
    expect(inherited([[{url, valueBoolean: true}], [{url, valueBoolean: false}]])).toBeTrue();
  });

  it('extracts a relationship item only under the nearest true ancestor or with an extracted code', () => {
    const extracted = (ancestors, codes?) => ObservationExtractComponent.isRelationshipItemExtracted(ancestors, codes);
    expect(extracted([])).toBeFalse();
    expect(extracted([[{url, valueBoolean: true}]])).toBeTrue();
    // The nearest boolean wins; relationship-only ancestors are skipped.
    expect(extracted([[{url, valueCode: 'member'}], [{url, valueBoolean: true}]])).toBeTrue();
    expect(extracted([[{url, valueBoolean: false}], [{url, valueBoolean: true}]])).toBeFalse();
    expect(extracted([], [{code: 'C1', extension: [{url, valueBoolean: true}]}])).toBeTrue();
  });
});
