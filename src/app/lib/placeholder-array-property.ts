import {
  ArrayProperty,
  AtomicProperty,
  FormProperty,
  PROPERTY_TYPE_MAPPING
} from '@lhncbc/ngx-schema-form';

/**
 * Schema keyword of an array that holds the id and/or extension elements of a repeating
 * primitive element, e.g. _given of given. See ElementArrayProperty.
 */
export const ELEMENT_ARRAY_KEYWORD = 'x-elementArray';

/** Item types of the arrays whose loaded empty entries are kept as null. */
const PRIMITIVE_ITEM_TYPES = ['string', 'number', 'integer', 'boolean'];

/**
 * Check whether a schema is an array of primitive values.
 *
 * @param schema - Schema to check.
 * @returns True if the item schema has one of PRIMITIVE_ITEM_TYPES, possibly nullable, or
 *   references a FHIR primitive type definition, whose name starts with a lowercase letter,
 *   e.g. #/definitions/canonical.
 */
export function isPrimitiveArraySchema(schema: any): boolean {
  const items = schema?.items;
  if(schema?.type !== 'array' || !items || typeof items !== 'object' || Array.isArray(items)) {
    return false;
  }
  if(typeof items.$ref === 'string') {
    return /^#\/definitions\/[a-z]/.test(items.$ref);
  }
  const types: unknown[] = Array.isArray(items.type) ? items.type : [items.type];
  return types.some((type) => PRIMITIVE_ITEM_TYPES.includes(type as string));
}

/**
 * Array property that keeps null placeholders of repeating primitive elements.
 *
 * In FHIR JSON, a repeating primitive element, e.g. derivedFrom, may have null entries that
 * align its values with the id and/or extension entries of its element array, e.g. _derivedFrom.
 * The ArrayProperty of ngx-schema-form drops the empty children when it reduces its value,
 * which shifts the values against their element array. This class outputs null for the
 * children that were loaded as null or '' and are still empty, so the positions are kept.
 *
 * Util.cleanPrimitiveArrayPairs() later removes the nulls that do not align with an element,
 * so the output of arrays without an element array is not changed. Children added by the
 * user and arrays of objects behave as in ArrayProperty.
 *
 * When the user removes, clears, or reorders the entries, the sibling element array, e.g.
 * _derivedFrom in the same object, is rebuilt so that each element stays with its value.
 * See alignElements() and setValue().
 */
export class PlaceholderArrayProperty extends ArrayProperty {
  /** Whether a value is being loaded by setValue() or reset(). */
  private loading = false;

  /** Value being loaded by setValue() or reset(), while its children are created. */
  private loadingValue: unknown[] | null = null;

  /** Children that were loaded as null placeholders. */
  private placeholders = new WeakSet<FormProperty>();

  /**
   * Output children, in the order of the entries of the sibling element array as of the last
   * load or alignment.
   */
  private alignedChildren: FormProperty[] = [];

  /**
   * Element array entries of the children, recorded when the children are realigned. A child
   * that is cleared and entered again gets its entry back.
   */
  private childElements = new WeakMap<FormProperty, unknown>();

  /**
   * Set the value, recording which children are loaded as placeholders.
   *
   * A call from the parent (onlySelf is true) loads the value as is; the parent sets the
   * element array, if any. Any other call, e.g. from a widget, replaces the entries: the new
   * entries are matched to the current ones by value, in order, and the sibling element array
   * is rebuilt with the elements of the matched entries.
   *
   * @param value - New array value.
   * @param onlySelf - Whether to skip updating the ancestors.
   */
  override setValue(value: any, onlySelf: boolean): void {
    const elementArray = !onlySelf && this.hasPrimitiveItems() ? this.getElementArrayProperty() : null;
    if(!Array.isArray(elementArray?.value)) {
      this.load(value, () => super.setValue(value, onlySelf));
      return;
    }

    this.recordChildElements(elementArray.value, this.alignedChildren);
    const previous = this.alignedChildren.map((child) => ({
      value: this.outputValue(child),
      element: this.childElements.get(child) ?? null
    }));
    // Update the ancestors only after the element array is rebuilt.
    this.load(value, () => super.setValue(value, true));

    const matched = new Set<number>();
    this.alignedChildren.forEach((child) => {
      const childValue = this.outputValue(child);
      const index = previous.findIndex((entry, i) => !matched.has(i) && entry.value === childValue);
      if(index >= 0) {
        matched.add(index);
        this.childElements.set(child, previous[index].element);
      }
    });
    this.writeElements(elementArray);
    this.parent?.updateValueAndValidity(false, true);
  }

  /**
   * Reset the value, recording which children are loaded as placeholders.
   *
   * @param value - New array value.
   * @param onlySelf - Whether to skip updating the ancestors.
   */
  override reset(value: any, onlySelf = true): void {
    this.load(value, () => super.reset(value, onlySelf));
  }

  /**
   * Update the value from the children. A visible child without a value is output as
   * null if it was loaded as a placeholder, and is dropped otherwise. Outside of a load,
   * the sibling element array is realigned with the output children.
   */
  override _updateValue(): void {
    if(!this.hasPrimitiveItems()) {
      super._updateValue();
      return;
    }

    const value = [];
    const outputChildren: FormProperty[] = [];
    this.forEachChild((property, index) => {
      // While loading, the children are created one by one and update this value each time.
      if(this.loadingValue && PlaceholderArrayProperty.isPlaceholder(this.loadingValue[Number(index)])) {
        this.placeholders.add(property);
      }
      if(property.visible) {
        if(property._hasValue()) {
          value.push(property.value);
          outputChildren.push(property);
        }
        else if(this.placeholders.has(property)) {
          value.push(null);
          outputChildren.push(property);
        }
      }
    });
    this._value = value;

    if(this.loading) {
      // The loaded entries are aligned with the element array that the parent loads.
      this.alignedChildren = outputChildren;
    }
    else {
      this.alignElements(outputChildren);
    }
  }

  /**
   * Rebuild the sibling element array if the output children were removed, added, or
   * reordered since the last alignment. Each child keeps its element; a new child gets null.
   *
   * @param outputChildren - Children in the order of the current output.
   */
  private alignElements(outputChildren: FormProperty[]): void {
    const previous = this.alignedChildren;
    this.alignedChildren = outputChildren;
    const moved = outputChildren.length !== previous.length ||
      outputChildren.some((child, i) => child !== previous[i]);
    if(!moved) {
      return;
    }

    const elementArray = this.getElementArrayProperty();
    if(Array.isArray(elementArray?.value)) {
      this.recordChildElements(elementArray.value, previous);
      this.writeElements(elementArray);
    }
  }

  /**
   * Record the element of each child from an element array aligned with the children.
   *
   * @param elements - Element array, e.g. the value of _derivedFrom.
   * @param children - Children aligned with the element array.
   */
  private recordChildElements(elements: unknown[], children: FormProperty[]): void {
    children.forEach((child, i) => {
      this.childElements.set(child, elements[i] ?? null);
    });
  }

  /**
   * Set the element array to the recorded elements of the aligned children. The ancestors
   * are updated by the caller.
   *
   * @param elementArray - Form property of the sibling element array.
   */
  private writeElements(elementArray: FormProperty): void {
    const elements = this.alignedChildren.map((child) => this.childElements.get(child) ?? null);
    elementArray.setValue(elements, true);
  }

  /**
   * Get the sibling element array of this array, e.g. _derivedFrom of derivedFrom.
   *
   * @returns Form property of the element array, or null if the parent has none.
   */
  private getElementArrayProperty(): FormProperty | null {
    const properties = this.parent?.properties;
    if(!properties || Array.isArray(properties)) {
      return null;
    }
    const field = Object.keys(properties).find((key) => properties[key] === this);
    return field && !field.startsWith('_') ? properties['_' + field] ?? null : null;
  }

  /**
   * Get the output value of an output child.
   *
   * @param child - Child of this array.
   * @returns The value of the child, or null for an empty placeholder.
   */
  private outputValue(child: FormProperty): unknown {
    return child._hasValue() ? child.value : null;
  }

  /**
   * Check whether the items of this array are primitive values.
   *
   * @returns True if the schema of this array is accepted by isPrimitiveArraySchema().
   */
  private hasPrimitiveItems(): boolean {
    return isPrimitiveArraySchema(this.schema);
  }

  /**
   * Run a load of a new value, recording the value while the children are created. The
   * elements recorded for the previous children are forgotten.
   *
   * @param value - Value being loaded.
   * @param loadFn - Function that loads the value.
   */
  private load(value: unknown, loadFn: () => void): void {
    this.placeholders = new WeakSet<FormProperty>();
    this.childElements = new WeakMap<FormProperty, unknown>();
    this.loadingValue = Array.isArray(value) ? value : null;
    this.loading = true;
    try {
      loadFn();
    }
    finally {
      this.loading = false;
      this.loadingValue = null;
    }
  }

  /**
   * Check whether a loaded entry is a placeholder.
   *
   * @param entry - Entry of a loaded value.
   * @returns True for null, undefined, and ''.
   */
  private static isPlaceholder(entry: unknown): boolean {
    return entry === null || entry === undefined || entry === '';
  }
}

/**
 * Property of an array that holds the id and/or extension elements of a repeating primitive
 * element, e.g. _given of given. The array is kept as loaded, including its null entries,
 * which align the elements with the values. It is not split into child properties, because
 * ArrayProperty would drop the null entries, and the editor schema of the elements may not
 * cover every extension, e.g. nested extensions.
 */
export class ElementArrayProperty extends AtomicProperty {
  /**
   * Value of the property when the array is missing.
   *
   * @returns null.
   */
  fallbackValue(): null {
    return null;
  }

  /**
   * Set the value to reset to. A missing value is stored as null.
   *
   * @param value - Array value, or null or undefined if missing.
   */
  override resetValue(value: any): void {
    super.resetValue(value ?? null);
  }

  /**
   * Check whether the array is present.
   *
   * @returns True if the value is neither null nor undefined.
   */
  override _hasValue(): boolean {
    return this.value !== null && this.value !== undefined;
  }

  /**
   * Validate the value against the schema. A missing array is not an error, because the
   * schema only accepts arrays.
   */
  override _runValidation(): void {
    if(this._hasValue()) {
      super._runValidation();
    }
    else {
      // Same as the private FormProperty.setErrors(null).
      this._errors = null;
      this.errorsChanges.next(null);
    }
  }
}

/**
 * Make ngx-schema-form create an ElementArrayProperty for each array marked with
 * ELEMENT_ARRAY_KEYWORD, and a PlaceholderArrayProperty for any other array in the schema.
 * Call it before any form is created.
 */
export function registerPlaceholderArrayProperty(): void {
  PROPERTY_TYPE_MAPPING.array = (schemaValidatorFactory, validatorRegistry, expressionCompilerFactory,
                                 schema, parent, path, formPropertyFactory, logger) => {
    if(schema?.[ELEMENT_ARRAY_KEYWORD]) {
      return new ElementArrayProperty(schemaValidatorFactory, validatorRegistry, expressionCompilerFactory,
        schema, parent, path, logger);
    }
    return new PlaceholderArrayProperty(formPropertyFactory, schemaValidatorFactory, validatorRegistry,
      expressionCompilerFactory, schema, parent, path, logger);
  };
}



