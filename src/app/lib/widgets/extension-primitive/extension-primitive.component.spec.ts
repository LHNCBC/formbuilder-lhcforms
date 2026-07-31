import {ComponentFixture, TestBed} from '@angular/core/testing';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {FormControl} from '@angular/forms';
import {Subject} from 'rxjs';

import {ExtensionPrimitiveComponent} from './extension-primitive.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';

describe('ExtensionPrimitiveComponent', () => {
  const extensionUrl = 'http://example.org/extension';
  const legacyExtensionUrl = 'http://example.org/legacy-extension';

  let fixture: ComponentFixture<ExtensionPrimitiveComponent>;
  let component: ExtensionPrimitiveComponent;
  let extensionsService: jasmine.SpyObj<ExtensionsService>;
  let formService: {loading: boolean};
  let errorsChanges: Subject<any[]>;
  let formProperty: any;

  beforeEach(async () => {
    extensionsService = jasmine.createSpyObj('ExtensionsService', [
      'removeExtensionsByUrl',
      'resetExtension'
    ]);
    formService = {loading: false};

    await TestBed.configureTestingModule({
      imports: [ExtensionPrimitiveComponent],
      providers: [
        {provide: ExtensionsService, useValue: extensionsService},
        {provide: FormService, useValue: formService},
        {provide: LiveAnnouncer, useValue: jasmine.createSpyObj('LiveAnnouncer', ['announce'])}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExtensionPrimitiveComponent);
    component = fixture.componentInstance;
  });

  function initialize(value: any, valueX = 'valuePositiveInt', legacyExtensionUrls = [legacyExtensionUrl]): void {
    errorsChanges = new Subject<any[]>();
    const valueChanges = new Subject<any>();
    const schema: any = {
      widget: {
        extensionUrl,
        valueX,
        legacyExtensionUrls
      }
    };
    formProperty = {
      value,
      path: 'testField',
      schema,
      valueChanges,
      errorsChanges,
      setValue: jasmine.createSpy('setValue')
    };
    component.schema = schema;
    component.formProperty = formProperty;
    component.control = new FormControl();
    component.ngAfterViewInit();
  }

  it('should convert and reset a numeric primitive extension', () => {
    initialize('3');

    errorsChanges.next([]);

    expect(extensionsService.removeExtensionsByUrl).toHaveBeenCalledWith(legacyExtensionUrl);
    expect(extensionsService.resetExtension).toHaveBeenCalledWith(
      extensionUrl,
      {url: extensionUrl, valuePositiveInt: 3},
      'valuePositiveInt',
      false
    );
  });

  it('should preserve a non-numeric primitive value', () => {
    initialize('horizontal', 'valueCode', []);

    errorsChanges.next([]);

    expect(extensionsService.resetExtension).toHaveBeenCalledWith(
      extensionUrl,
      {url: extensionUrl, valueCode: 'horizontal'},
      'valueCode',
      false
    );
  });

  it('should remove canonical and legacy extensions for an empty value', () => {
    initialize('');

    errorsChanges.next([]);

    expect(extensionsService.removeExtensionsByUrl.calls.allArgs()).toEqual([
      [legacyExtensionUrl],
      [extensionUrl]
    ]);
    expect(extensionsService.resetExtension).not.toHaveBeenCalled();
  });

  it('should remove canonical and legacy extensions when validation fails', () => {
    initialize('3');

    errorsChanges.next([{path: '/testField', message: 'Invalid value'}]);

    expect(extensionsService.removeExtensionsByUrl.calls.allArgs()).toEqual([
      [legacyExtensionUrl],
      [extensionUrl]
    ]);
    expect(extensionsService.resetExtension).not.toHaveBeenCalled();
  });

  it('should remove canonical and legacy extensions when numeric conversion fails', () => {
    initialize('not-a-number');

    errorsChanges.next([]);

    expect(extensionsService.removeExtensionsByUrl.calls.allArgs()).toEqual([
      [legacyExtensionUrl],
      [extensionUrl]
    ]);
    expect(extensionsService.resetExtension).not.toHaveBeenCalled();
  });

  it('should not synchronize extensions while the form is loading', () => {
    initialize('3');
    formService.loading = true;

    errorsChanges.next([]);

    expect(extensionsService.removeExtensionsByUrl).not.toHaveBeenCalled();
    expect(extensionsService.resetExtension).not.toHaveBeenCalled();
  });

  it('should not synchronize extensions without complete widget configuration', () => {
    initialize('3');
    component.schema.widget.extensionUrl = undefined;

    errorsChanges.next([]);

    expect(extensionsService.removeExtensionsByUrl).not.toHaveBeenCalled();
    expect(extensionsService.resetExtension).not.toHaveBeenCalled();
  });
});
