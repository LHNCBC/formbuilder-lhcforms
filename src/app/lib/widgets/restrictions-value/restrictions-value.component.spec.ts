import {RestrictionsValueComponent} from './restrictions-value.component';

/**
 * Unit tests for the byte <-> unit conversion helpers used by the "Maximum size"
 * (maxSize) restriction editor for attachment items. These are pure static helpers,
 * so they can be tested without instantiating the Angular component.
 */
describe('RestrictionsValueComponent (size conversion)', () => {

  it('should return the correct byte multiplier for each unit', () => {
    expect(RestrictionsValueComponent.factorFor('B')).toBe(1);
    expect(RestrictionsValueComponent.factorFor('KB')).toBe(1024);
    expect(RestrictionsValueComponent.factorFor('MB')).toBe(1024 * 1024);
    expect(RestrictionsValueComponent.factorFor('GB')).toBe(1024 * 1024 * 1024);
    // Unknown unit falls back to bytes.
    expect(RestrictionsValueComponent.factorFor('TB')).toBe(1);
  });

  it('should pick the largest exact unit when converting bytes for display', () => {
    expect(RestrictionsValueComponent.bytesToBestUnit(1024)).toEqual({value: 1, unit: 'KB'});
    expect(RestrictionsValueComponent.bytesToBestUnit(5 * 1024 * 1024)).toEqual({value: 5, unit: 'MB'});
    expect(RestrictionsValueComponent.bytesToBestUnit(2 * 1024 * 1024 * 1024)).toEqual({value: 2, unit: 'GB'});
  });

  it('should fall back to bytes when no larger unit divides evenly', () => {
    expect(RestrictionsValueComponent.bytesToBestUnit(1)).toEqual({value: 1, unit: 'B'});
    expect(RestrictionsValueComponent.bytesToBestUnit(1536)).toEqual({value: 1536, unit: 'B'});
    expect(RestrictionsValueComponent.bytesToBestUnit(5000000)).toEqual({value: 5000000, unit: 'B'});
  });

  it('should round-trip a value entered in a friendly unit back to bytes', () => {
    // Simulate entering "5" with unit "MB" -> stored bytes -> converted back for display.
    const bytes = Math.round(5 * RestrictionsValueComponent.factorFor('MB'));
    expect(bytes).toBe(5242880);
    expect(RestrictionsValueComponent.bytesToBestUnit(bytes)).toEqual({value: 5, unit: 'MB'});
  });

  it('should enable an attachment restriction value only for a valid operator', () => {
    const component = Object.create(RestrictionsValueComponent.prototype) as RestrictionsValueComponent;
    component.schema = {readOnly: false};
    (component as any).dataType = 'attachment';

    (component as any).currentOperator = 'maxLength';
    component.isMaxSize = false;
    component.isMimeType = false;
    expect(component.isValueDisabled).toBeTrue();

    (component as any).currentOperator = 'maxSize';
    component.isMaxSize = true;
    expect(component.isValueDisabled).toBeFalse();

    (component as any).currentOperator = 'mimeType';
    component.isMaxSize = false;
    component.isMimeType = true;
    expect(component.isValueDisabled).toBeFalse();

    component.schema.readOnly = true;
    expect(component.isValueDisabled).toBeTrue();
  });
});
