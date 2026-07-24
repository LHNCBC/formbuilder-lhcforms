import {Injectable} from '@angular/core';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';

/**
 * Preserve complete Identifier values that cannot be represented reliably by
 * the schema-form property tree used by nested table dialogs.
 */
@Injectable({providedIn: 'root'})
export class RawValueStoreService {
  private readonly identifiers = new WeakMap<FormProperty, fhir.Identifier>();

  /**
   * Store a detached copy of an Identifier for a form-property row.
   *
   * @param property - Identifier row property.
   * @param value - Complete Identifier value returned by its dialog.
   */
  setIdentifier(property: FormProperty, value: fhir.Identifier): void {
    if(property) {
      this.identifiers.set(property, JSON.parse(JSON.stringify(value ?? null)));
    }
  }

  /**
   * Read the complete Identifier associated with a form-property row.
   *
   * @param property - Identifier row property.
   * @returns Stored Identifier, or undefined when the row has not been seeded.
   */
  getIdentifier(property: FormProperty): fhir.Identifier | undefined {
    return property ? this.identifiers.get(property) : undefined;
  }
}
