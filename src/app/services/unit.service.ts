import {Injectable} from '@angular/core';

declare var LForms: any;

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private unitStorage: any[] = [];
  private unitTokenizeStr: string;

  /**
   * Sets the string of delimiter characters used for tokenizing unit strings.
   *
   * This function joins the provided array of delimiter characters into a single string,
   * separated by backslashes, and stores it for use in unit string tokenization.
   *
   * @param unitTokenizers - An array of delimiter characters (e.g., ['/', '.']).
   */
  setUnitStringTokenizer(unitTokenizers: string[]): void {
    this.unitTokenizeStr = unitTokenizers.join('\\');
  }

  /**
   * Splits a unit string into tokens using the configured delimiter characters.
   *
   * This function creates a regular expression from the stored delimiter string
   * and splits the provided unit string into an array of tokens based on those delimiters.
   *
   * @param unitStr - The unit string to tokenize.
   * @returns An array of tokens obtained by splitting the unit string.
   */
  tokenizeUnitStr(unitStr: string): string[] {
    if (typeof unitStr !== 'string') {
      return unitStr;
    }
    const regex = new RegExp(`[${this.unitTokenizeStr}]`);
    return unitStr.split(regex);
  }

  /**
   * Checks if a unit string contains at least one of the specified delimiters.
   *
   * @param unitStr - The unit string to check.
   * @returns True if the unit string contains at least one delimiter; otherwise, false.
   */
  hasDelimiter(unitStr: string): boolean {
    const regex = new RegExp(`[${this.unitTokenizeStr}]`);
    return regex.test(unitStr);
  }

  /**
   * Checks if a unit string contains both space and at least one of the specified delimiters.
   *
   * This is useful for detecting ambiguous or complex unit expressions that mix spaces
   * (which are not allowed in UCUM unit codes) with other delimiters such as '/', '.', or '*'.
   *
   * @param unitStr - The unit string to check.
   * @returns True if the unit string contains both a space and at least one delimiter; otherwise, false.
   */
  hasSpaceAndDelimiter(unitStr: string): boolean {
    const regex = new RegExp(`[${this.unitTokenizeStr}]`);
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
   * @returns The unit string with display names replaced by their corresponding UCUM codes.
   */
  translateUnitDisplayToCode(unitStr: string, currentUnitList: string[]): string {
    let newUnitStr = '';

    const tokens = this.tokenizeUnitStr(unitStr);

    const compareUnitStorage = currentUnitList ?
      [...this.getUnits(), ...currentUnitList] :
      [...this.getUnits()];

    newUnitStr = unitStr;
    for (let i = 0; i < tokens.length; i++) {
      // Remove all occurrences of the '[' and ']'
      let token = tokens[i];
      let matched = false;
      for (let j = 0; j < compareUnitStorage.length; j++) {
        if (token !== compareUnitStorage[j][0] && token !== compareUnitStorage[j][1]) {
          token = token.replace(/[\[\]\(\)]/g, '');
          if (token !== compareUnitStorage[j][0] && token !== compareUnitStorage[j][1]) {
            continue;
          }
        }

        if (token) {
          const exists = this.getUnits().some(item => item[0] === compareUnitStorage[j][0]);

          if (!exists) {
            this.unitStorage.push(compareUnitStorage[j]);
          }
          const bracketWrappedToken = `[${token}]`;
          if (newUnitStr.indexOf(bracketWrappedToken) > -1) {
            token = bracketWrappedToken;
          }

          newUnitStr = newUnitStr.replace(token, compareUnitStorage[j][0]);

          break;
        }
      }
    }

    return newUnitStr;
  }

  /**
   * Validates a unit string using the UCUM package and updates internal unit storage.
   *
   * This function uses the UCUM package to validate the provided unit string. If the unit is valid
   * (or invalid but has a UCUM code), it cleans the unit name, adds the unit to internal storage,
   * and, if the unit name contains multiple tokens, recursively validates each token.
   *
   * @param unitStr - The unit string to validate.
   * @returns The parse result object from the UCUM package.
   */
  validateWithUcumUnit(unitStr: string): any {
    const parseResp = LForms.ucumPkg.UcumLhcUtils.getInstance().validateUnitString(unitStr);
    if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
      if (parseResp?.unit?.name) {
        parseResp.unit.name = this.getCleanName(parseResp.unit.name);
        this.addUnitFromUcumResponse(parseResp);

        // If parseResp.unit.name contains a tokenizer, it means it consists
        // of multiple names or codes. In that case, you need to perform a lookup
        // for each individual name or code.
        const tokens = this.tokenizeUnitStr(parseResp.unit.code);
        if (tokens.length > 1) {
          tokens.forEach(token => {
            this.validateWithUcumUnit(token);
          });
        }
      }
    }
    return parseResp;
  }

  /**
   * Adds a unit to the internal unit storage if it does not already exist.
   *
   * This function checks if a unit (represented as an array, where the first element is the code)
   * is already present in the unit storage. If not, it adds the unit to the storage.
   *
   * @param unit - The unit to add, typically an array of 3 items: 'display', 'code', and 'system' respectively.
   */
  addUnit(unit: any): void {
    const exists = this.unitStorage.some(item => item[0] === unit[0]);
    if (!exists) {
      this.unitStorage.push(unit);
    }
  }

  /**
   * Adds a unit to the internal unit storage from a UCUM package parse result if it does not already exist.
   *
   * This function constructs a unit array from the UCUM package parse result (typically using the display and code fields),
   * checks if a unit with the same display already exists in the storage, and adds it if not present.
   *
   * @param parseResp - The parse result object from the UCUM package, expected to have a `unit` property with `display` and `code` fields.
   */
  addUnitFromUcumResponse(parseResp: any): void {
    if (parseResp?.unit?.name) {
      const code = parseResp.unit.code;
      const name = parseResp.unit.name;
      const unit = [code, name, ""];
      this.addUnit(unit);
    }
  }

  /**
   * Returns the current array of units stored internally.
   *
   * @returns An array containing all units currently in the unit storage.
   */
  getUnits(): any[] {
    return this.unitStorage;
  }

  /**
   * Returns the unit from unitStorage whose display (item[1]) matches the given displayStr.
   * @param displayStr - The display string to match.
   * @returns The unit array if found, otherwise undefined.
   */

  getUnitByDisplayString(displayStr: string): any {
    return this.unitStorage.find(item => item[1] === displayStr);
  }

  /**
   * Clears all units from the internal unit storage.
   *
   * This function resets the unit storage array, removing all units that have been added.
   * After calling this method, the storage will be empty.
   */
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

  /**
   * Removes all <sup>...</sup> HTML tags from a string, retaining their content.
   *
   * @param str - The input string possibly containing <sup>...</sup> HTML tags.
   * @returns The string with all <sup>...</sup> tags removed, but their content retained.
   *
   * Example:
   *   getCleanName("[meter<sup>3</sup]*[meter<sup>4</sup>]") // returns "[meter3]*[meter4]"
   */
  getCleanName(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }
    return str.replace(/<sup>(.*?)<\/sup>/gi, '$1');
  }

  /**
   * Builds a mapping from the completion options table: key = 2nd <td>, value = 1st <td>.
   *
   * @param completionOptions - The DOM element containing the completion options table (with <tr> rows and <td> columns).
   * @returns A map where the key is the 2nd <td> value and the value is the 1st <td> value for each row.
   */
  private buildCompletionOptionsMap(completionOptions: HTMLElement): Record<string, string> {
    const map: Record<string, string> = {};
    const rows = completionOptions.querySelectorAll('tr');
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length >= 2) {
        const key = tds[1].textContent?.trim();
        const value = tds[0].textContent?.trim();
        if (key && value) {
          map[key] = value;
        }
      }
    });
    return map;
  }

  /**
   * Tokenizes a string by the given word boundary characters.
   *
   * @param value - The input string to tokenize.
   * @param wordBoundaryChars - Array of word boundary characters to use for splitting.
   * @returns The array of tokens obtained by splitting the input string.
   */
  private tokenizeByWordBoundaries(value: string, wordBoundaryChars: string[]): string[] {
    const regex = new RegExp(`[${wordBoundaryChars.map(c => c.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('')}]`);
    return value.split(regex);
  }

  /**
   * Rebuilds a string from tokens, preserving original delimiters and wrapping as needed.
   *
   * @param tokens - The array of original tokens from the input string.
   * @param original - The original input string (used to extract delimiters).
   * @param wordBoundaryChars - Array of word boundary characters for wrapping logic.
   * @param newTokens - The array of tokens after mapping/replacement.
   * @returns The rebuilt string with delimiters and wrapping applied.
   */
  private rebuildStringWithDelimiters(tokens: string[], original: string, wordBoundaryChars: string[], newTokens: string[]): string {
    let rebuilt = '';
    let lastIndex = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (i > 0) {
        const prevToken = tokens[i - 1];
        const currToken = tokens[i];
        const idx = original.indexOf(currToken, lastIndex);
        const delim = original.substring(lastIndex + prevToken.length, idx);
        rebuilt += delim;
        lastIndex = idx;
      }
      let tokenToAdd = newTokens[i];
      if (
        typeof tokenToAdd === 'string' &&
        !tokenToAdd.startsWith('/') &&
        Array.isArray(wordBoundaryChars) &&
        wordBoundaryChars.some(char => tokenToAdd.includes(char))
      ) {
        tokenToAdd = '(' + tokenToAdd + ')';
      }
      rebuilt += tokenToAdd;
    }
    return rebuilt;
  }

  /**
   * Replaces tokens in a unit string (data.final_val) with mapped values from a completion options table.
   * Used for advanced mapping of user input to display values.
   *
   * @param data - The LForms autocompleter data object (must have final_val).
   * @param completionOptions - The DOM element containing the completion options table (with <tr> rows and <td> columns).
   * @param wordBoundaryChars - Array of word boundary characters (e.g., ['/', '.']) for tokenization and wrapping logic.
   */
  replaceTokensWithCompletionOptions(data: any, completionOptions: HTMLElement, wordBoundaryChars: string[]): void {
    if (!completionOptions || !data || typeof data.final_val !== 'string') return;
    const map = this.buildCompletionOptionsMap(completionOptions);
    const tokens = this.tokenizeByWordBoundaries(data.final_val, wordBoundaryChars);
    let replaced = false;
    const newTokens = tokens.map(token => {
      if (map[token]) {
        replaced = true;
        return map[token];
      }
      return token;
    });
    if (replaced) {
      data.final_val = this.rebuildStringWithDelimiters(tokens, data.final_val, wordBoundaryChars, newTokens);
      data.on_list = false;
      data.used_list = false;
    }
  }

  /**
   * Transforms input value for unit entry: converts '[' to '(', ']' to ')', and '*' to '.'.
   * Returns the transformed string.
   *
   * @param value - The input string to transform.
   * @returns The transformed string.
   */
  transformUnitInput(value: string): string {
    if (typeof value !== 'string') return value;
    return value.replace(/\[/g, '(')
                .replace(/\]/g, ')')
                .replace(/\*/g, '.');
  }
}
