import { Directive, HostListener, ElementRef, forwardRef, Input, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { FormProperty } from '@lhncbc/ngx-schema-form';

@Directive({
  selector: '[lfbInitialNumber]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InitialNumberDirective),
      multi: true
    }
  ]
})

export class InitialNumberDirective implements ControlValueAccessor {
  private el = inject(ElementRef);

  @Input() propType: string = '';
  @Input() formProperty: FormProperty;
  private allowedDecimalKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-', '+', 'e', 'E', 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
  private allowedIntegerKeys = this.allowedDecimalKeys.filter(key => !['.', 'e', 'E'].includes(key));
  static readonly INITIAL_INTEGER = /^-?([0]|([1-9][0-9]*))$/;
  static readonly INITIAL_DECIMAL = /^[-]?(0|[1-9][0-9]*|[0-9]*\.[0-9]+)([eE][-+]?[0-9]+)?$/;

  @HostListener('input', ['$event.target.value'])
  onInputChange(value: string | null) {
    let validationResult = null;
    let numberValue;
    let errorMessage;
    if (this.propType === 'valueDecimal') {
      validationResult = InitialNumberDirective.INITIAL_DECIMAL.test(value);
      numberValue = Number(value);
      errorMessage = `Invalid decimal value.`;
    } else {
      validationResult = InitialNumberDirective.INITIAL_INTEGER.test(value);
      numberValue = Number(value);
      errorMessage = `Invalid integer value.`;
    }

    if (!validationResult) {
      this.formProperty.setValue(null, false);

      const errors: any[] = [];
      const errorCode = 'PATTERN';
      const err: any = {};
      err.code = errorCode;
      err.path = `#${this.formProperty._canonicalPath}`;
      err.message =  errorMessage;
      errors.push(err);
      this.formProperty.extendErrors(errors);
    } else {
      this.formProperty.setValue(numberValue, false);
      this.formProperty.extendErrors(null);
    }

    this.onTouched();
  }

  onChange: any = () => {};
  onTouched: any = () => {};


  /**
   * Restrict key inputs for 'integer' or 'decimal' data types.
   * @param event - Keyboard event object.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    let allowedKeys;
    const currentValue = (event.target as HTMLInputElement).value;

    if (this.propType === 'valueDecimal') {
      if (event.key === '.' && currentValue.includes('.')) {
        event.preventDefault();
      }

      if (event.key.toLowerCase() === 'e' && currentValue.toLowerCase().includes('e')) {
        event.preventDefault();
      }
      if (event.key === '-' && (currentValue.includes('-') || (currentValue.includes('-') && (currentValue[currentValue.length - 1] !== 'e' && currentValue[currentValue.length - 1] !== 'E')))) {
        event.preventDefault();
      }

      allowedKeys = this.allowedDecimalKeys;
    } else if (this.propType === 'valueInteger') {
      if (event.key === '-' && currentValue.includes('-')) {
        event.preventDefault();
      }

      allowedKeys = this.allowedIntegerKeys;
    }
    if (allowedKeys && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Writes a new value to the input element. For this particular implementation, we want to
   * preserve the user's input value and not overwrite it with the value from the form property.
   * The update of the input element will be done via set value method.
   * @param value - value to be assigned to the input element.
   */
  writeValue(value: any): void { }

  /**
   * Registers a callback function that should be called when the control's value changes in the UI.
   * @param fn - callback function to be registered.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback function that should be called when the input is touched.
   * @param fn - callback function to be registered.
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Retrieves the current value of the input element.
   * @returns (string | null) - current value of the input element or null if the element does not have a value.
   */
  get value(): string | null {
    return this.el.nativeElement.value;
  }

  /**
   * Sets the value of the input element.
   * @param value - string value to set or null.
   */
  set value(value: string | null) {
    this.el.nativeElement.value = value;
  }
}
