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
  private readonly deletedIdentifiers = new WeakSet<FormProperty>();
  private readonly identifierTables = new WeakMap<object, Map<string, fhir.Identifier[]>>();

  /**
   * Store a detached copy of an Identifier for a form-property row.
   *
   * @param property - Identifier row property.
   * @param value - Complete Identifier value returned by its dialog.
   */
  setIdentifier(property: FormProperty, value: fhir.Identifier): void {
    if(property) {
      this.deletedIdentifiers.delete(property);
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

  /**
   * Stop preserving an Identifier row that is being explicitly removed.
   *
   * @param property - Identifier row property being deleted.
   */
  clearIdentifier(property: FormProperty): void {
    if(property) {
      this.identifiers.delete(property);
    }
  }

  /**
   * Record that a row was explicitly deleted so schema-unknown descendants
   * retained by schema-form cannot resurrect it during model reconstruction.
   *
   * @param property - Identifier row property being deleted.
   */
  markIdentifierDeleted(property: FormProperty): void {
    if(property) {
      this.clearIdentifier(property);
      this.deletedIdentifiers.add(property);
    }
  }

  /**
   * Check whether an Identifier row was explicitly deleted.
   *
   * @param property - Identifier row property.
   * @returns True when the row must be excluded from reconstructed values.
   */
  isIdentifierDeleted(property: FormProperty): boolean {
    return !!property && this.deletedIdentifiers.has(property);
  }

  /**
   * Store the authoritative rows after a structural Identifier table change.
   *
   * @param property - Identifier array property.
   * @param values - Complete remaining Identifier rows.
   */
  setIdentifierTable(property: FormProperty, values: fhir.Identifier[]): void {
    if(property) {
      const owner = property.root || property;
      let tables = this.identifierTables.get(owner);
      if(!tables) {
        tables = new Map<string, fhir.Identifier[]>();
        this.identifierTables.set(owner, tables);
      }
      tables.set(property.path, JSON.parse(JSON.stringify(values ?? [])));
    }
  }

  /**
   * Read rows recorded after an Identifier table add, edit, or delete.
   *
   * @param property - Identifier array property.
   * @returns Complete rows, including an empty array after deleting the final row.
   */
  getIdentifierTable(property: FormProperty): fhir.Identifier[] | undefined {
    if(!property) {
      return undefined;
    }
    return this.identifierTables.get(property.root || property)?.get(property.path);
  }
}
