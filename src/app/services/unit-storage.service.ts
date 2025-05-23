import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UnitStorageService {
  private unitStorage: any[] = [];

  /**
   * Checks if a unit string contains both space and at least one of the specified delimiters.
   *
   * This is useful for detecting ambiguous or complex unit expressions that mix spaces
   * (which are not allowed in UCUM unit codes) with other delimiters such as '/', '.', or '*'.
   *
   * @param unitStr - The unit string to check.
   * @param unitTokenizeStr - A string containing delimiter characters to test for (e.g., "/.*").
   * @returns True if the unit string contains both a space and at least one delimiter; otherwise, false.
   */
  hasSpaceAndDelimiter(unitStr: string, unitTokenizeStr: string): boolean {
    const regex = new RegExp(`[${unitTokenizeStr}]`);
    const hasDelimiter = regex.test(unitStr);
    return (unitStr.indexOf(' ') > -1 && hasDelimiter);
  }

  /**
   * Translates a unit display string into its corresponding UCUM code string.
   *
   * This function tokenizes the input unit string using the provided delimiters,
   * then attempts to match each token against the stored units and any additional
   * units provided in `currentUnitList`. If a match is found (either by code or display),
   * the token in the string is replaced with the corresponding code. Any matched unit
   * not already in storage is added to the storage. The function returns the transformed
   * string with display names replaced by their UCUM codes.
   *
   * @param unitStr - The unit string to translate (may contain display names or codes).
   * @param currentUnitList - An optional array of additional units to match against.
   * @param unitTokenizeStr - A string of delimiter characters for tokenizing the unit string (e.g., "/.*").
   * @returns The unit string with display names replaced by their corresponding UCUM codes.
   */
  translateUnitDisplayToCode(unitStr: string, currentUnitList: string[], unitTokenizeStr: string): string {
    let newUnitStr = '';

    const regex = new RegExp(`[${unitTokenizeStr}]`); 
    const tokens = unitStr.split(regex);

    const compareUnitStorage = currentUnitList ?
      [...this.getUnits(), ...currentUnitList] :
      [...this.getUnits()];

    newUnitStr = unitStr;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].replace(/[\[\]\(\)]/g, '');
      for (let j = 0; j < compareUnitStorage.length; j++) {
        if (token === compareUnitStorage[j][0] || token === compareUnitStorage[j][1]) {
          const exists = this.getUnits().some(item => item[0] === compareUnitStorage[j][0]);

          if (!exists) {
            this.unitStorage.push(compareUnitStorage[j]);
          }
          newUnitStr = newUnitStr.replace(token, compareUnitStorage[j][0]);
          break;
        }
      }
    }

    return newUnitStr;
  }

  // Add a unit to the storage
  addUnit(unit: any): void {
    const exists = this.unitStorage.some(item => item[0] === unit[0]);
    if (!exists) {
      this.unitStorage.push(unit);
    }
  }

  // Get all stored units
  getUnits(): any[] {
    return this.unitStorage;
  }

  // Clear all stored units
  clearUnits(): void {
    this.unitStorage = [];
  }

  /**
   * Extracts the unit index from an ID string.
   *
   * This function searches for a numeric index surrounded by dots in the given element ID,
   * such as "__$units.0.valueCoding.display", and returns it as a number.
   * If no index is found, it returns -1.
   *
   * @param elementId - The element ID string to parse.
   * @returns The extracted index as a number, or -1 if not found.
   */
  getUnitIndexFromId(elementId: string): number {
    let index = -1;
    const match = elementId.match(/\.(\d+)\./);

    if (match) {
      index = Number(match[1]);
    }
    return index;
  }
}