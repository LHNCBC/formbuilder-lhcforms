// Type definitions for FHIR Release 3.0
// Project: http://hl7.org/fhir/index.html
// Definitions by: Artifact Health <https://github.com/meirgottlieb>
//                 Jan Huenges <https://github.com/jhuenges>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyType

export declare module fhirPrimitives {
  /**
   * Any combination of letters, numerals, "-" and ".", with a length limit of 64 characters.  (This might be an integer, an unprefixed OID, UUID or any other identifier pattern that meets these constraints.)  Ids are case-insensitive.
   */
  type id = string;
  /**
   * String of characters used to identify a name or a resource
   */
  type uri = string;
  /**
   * Resource locator with protocols.
   */
  type url = string;
  /**
   * A stream of bytes
   */
  type base64Binary = string;
  // eslint-disable-next-line max-len
  /**
   * A string which has at least one character and no leading or trailing whitespace and where there is no whitespace other than single spaces in the contents
   */
  type code = string;
  /**
   * A date or partial date (e.g. just year or year + month). There is no time zone. The format is a union of the schema types gYear, gYearMonth and date.  Dates SHALL be valid dates.
   */
  type date = string;
  /**
   * A date, date-time or partial date (e.g. just year or year + month).  If hours and minutes are specified, a time zone SHALL be populated. The format is a union of the schema types gYear, gYearMonth, date and dateTime. Seconds must be provided due to schema type constraints but may be zero-filled and may be ignored.                 Dates SHALL be valid dates.
   */
  type dateTime = string;
  /**
   * A rational number with implicit precision
   */
  type decimal = number;
  /**
   * An instant in time - known at least to the second
   */
  type instant = string;
  /**
   * A whole number
   */
  type integer = number;
  /**
   * A string that may contain markdown syntax for optional processing by a mark down presentation engine
   */
  type markdown = string;
  /**
   * An OID represented as a URI
   */
  type oid = string;
  /**
   * An integer with a value that is positive (e.g. >0)
   */
  type positiveInt = number;
  /**
   * A time during the day, with no date specified
   */
  type time = string;
  /**
   * An integer with a value that is not negative (e.g. >= 0)
   */
  type unsignedInt = number;

}
