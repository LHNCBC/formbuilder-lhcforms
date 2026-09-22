import fhir from 'fhir/r5';

export interface ParsedBase64 {
  data: string;
  contentType?: string;
  size: string;
}

export interface LanguageOption {
  code: string;
  display: string;
}

/** Utilities shared by Attachment authoring widgets. */
export class AttachmentUtil {
  /** Common BCP-47 language tags offered as suggestions for the R5 All Languages binding. */
  static readonly COMMON_LANGUAGES: readonly LanguageOption[] = [
    {code: 'en-US', display: 'English (United States)'},
    {code: 'ar', display: 'Arabic'},
    {code: 'bn', display: 'Bengali'},
    {code: 'zh', display: 'Chinese'},
    {code: 'zh-CN', display: 'Chinese (China)'},
    {code: 'zh-HK', display: 'Chinese (Hong Kong)'},
    {code: 'zh-SG', display: 'Chinese (Singapore)'},
    {code: 'zh-TW', display: 'Chinese (Taiwan)'},
    {code: 'hr', display: 'Croatian'},
    {code: 'cs', display: 'Czech'},
    {code: 'da', display: 'Danish'},
    {code: 'nl', display: 'Dutch'},
    {code: 'nl-BE', display: 'Dutch (Belgium)'},
    {code: 'nl-NL', display: 'Dutch (Netherlands)'},
    {code: 'en', display: 'English'},
    {code: 'en-AU', display: 'English (Australia)'},
    {code: 'en-CA', display: 'English (Canada)'},
    {code: 'en-GB', display: 'English (Great Britain)'},
    {code: 'en-IN', display: 'English (India)'},
    {code: 'en-NZ', display: 'English (New Zealand)'},
    {code: 'en-SG', display: 'English (Singapore)'},
    {code: 'fi', display: 'Finnish'},
    {code: 'fr', display: 'French'},
    {code: 'fr-BE', display: 'French (Belgium)'},
    {code: 'fr-FR', display: 'French (France)'},
    {code: 'fr-CH', display: 'French (Switzerland)'},
    {code: 'fy', display: 'Frisian'},
    {code: 'fy-NL', display: 'Frisian (Netherlands)'},
    {code: 'de', display: 'German'},
    {code: 'de-AT', display: 'German (Austria)'},
    {code: 'de-DE', display: 'German (Germany)'},
    {code: 'de-CH', display: 'German (Switzerland)'},
    {code: 'el', display: 'Greek'},
    {code: 'hi', display: 'Hindi'},
    {code: 'it', display: 'Italian'},
    {code: 'it-IT', display: 'Italian (Italy)'},
    {code: 'it-CH', display: 'Italian (Switzerland)'},
    {code: 'ja', display: 'Japanese'},
    {code: 'ko', display: 'Korean'},
    {code: 'no', display: 'Norwegian'},
    {code: 'no-NO', display: 'Norwegian (Norway)'},
    {code: 'pl', display: 'Polish'},
    {code: 'pt', display: 'Portuguese'},
    {code: 'pt-BR', display: 'Portuguese (Brazil)'},
    {code: 'pa', display: 'Punjabi'},
    {code: 'ru', display: 'Russian'},
    {code: 'ru-RU', display: 'Russian (Russia)'},
    {code: 'sr', display: 'Serbian'},
    {code: 'sr-RS', display: 'Serbian (Serbia)'},
    {code: 'es', display: 'Spanish'},
    {code: 'es-AR', display: 'Spanish (Argentina)'},
    {code: 'es-ES', display: 'Spanish (Spain)'},
    {code: 'es-UY', display: 'Spanish (Uruguay)'},
    {code: 'sv', display: 'Swedish'},
    {code: 'sv-SE', display: 'Swedish (Sweden)'},
    {code: 'te', display: 'Telugu'}
  ];

  static readonly COMMON_LANGUAGE_CODES = AttachmentUtil.COMMON_LANGUAGES.map(({code}) => code);

  private static readonly GRANDFATHERED_LANGUAGE_TAGS = new Set([
    'art-lojban', 'cel-gaulish', 'en-gb-oed', 'i-ami', 'i-bnn', 'i-default',
    'i-enochian', 'i-hak', 'i-klingon', 'i-lux', 'i-mingo', 'i-navajo',
    'i-pwn', 'i-tao', 'i-tay', 'i-tsu', 'no-bok', 'no-nyn', 'sgn-be-fr',
    'sgn-be-nl', 'sgn-ch-de', 'zh-guoyu', 'zh-hakka', 'zh-min', 'zh-min-nan',
    'zh-xiang'
  ]);

  /** RFC 5646 langtag grammar, capturing variants and extensions for duplicate checks. */
  private static readonly LANGUAGE_TAG_PATTERN = new RegExp(
    '^(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4,8})' +
    '(?:-[a-z]{4})?' +
    '(?:-(?:[a-z]{2}|[0-9]{3}))?' +
    '((?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*)' +
    '((?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*)' +
    '(?:-x(?:-[a-z0-9]{1,8})+)?$'
  );

  /**
   * Parse plain base64 or a base64 data URI into the representation required by
   * FHIR Attachment.data. Whitespace is ignored and data URI metadata is removed.
   * @param value - The plain base64 value or base64 data URI to parse.
   * @returns The normalized base64 data and metadata, or null when invalid or empty.
   */
  static parseBase64(value: string): ParsedBase64 | null {
    if(typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if(!trimmed) {
      return null;
    }

    // RFC 2397 defines the media type as the type/subtype followed by any
    // parameters. Capture everything before the terminal `;base64` marker so
    // parameters such as `charset` remain part of Attachment.contentType.
    const dataUriMatch = trimmed.match(/^data:([^,]*);base64,([\s\S]*)$/i);
    const dataUriMediaType = dataUriMatch?.[1]?.trim();
    let contentType: string | undefined;
    if(dataUriMatch) {
      // RFC 2397 defaults an omitted media type to text/plain;charset=US-ASCII.
      // It also permits the text/plain portion to be omitted when parameters
      // such as charset are supplied as a shorthand.
      contentType = !dataUriMediaType
        ? 'text/plain;charset=US-ASCII'
        : dataUriMediaType.startsWith(';')
          ? `text/plain${dataUriMediaType}`
          : dataUriMediaType;
    }
    const data = (dataUriMatch ? dataUriMatch[2] : trimmed).replace(/\s/g, '');

    if(!AttachmentUtil.isValidBase64(data)) {
      return null;
    }

    return {
      data,
      contentType,
      size: AttachmentUtil.base64ByteLength(data).toString()
    };
  }

  /**
   * Return whether a string is canonical, correctly padded base64 data.
   * @param value - The base64 data to validate.
   * @returns True when the value is canonical base64 data.
   */
  static isValidBase64(value: string): boolean {
    if(!value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
      return false;
    }

    const firstPadding = value.indexOf('=');
    if(firstPadding >= 0 && firstPadding < value.length - 2) {
      return false;
    }

    try {
      return btoa(atob(value)) === value;
    }
    catch {
      return false;
    }
  }

  /**
   * Calculate the decoded byte length of canonical base64 data.
   * @param value - The base64 data whose decoded length is required.
   * @returns The number of decoded bytes.
   */
  static base64ByteLength(value: string): number {
    const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
    return (value.length * 3 / 4) - padding;
  }

  /**
   * Check BCP-47 syntax, including extlangs, grandfathered tags, and private use.
   * Subtag registration and extension-specific semantics are not validated.
   * @param value - The language tag to validate, ignoring surrounding whitespace and case.
   * @returns True for a well-formed tag without repeated variants or extension singletons.
   */
  static isValidLanguageTag(value: string): boolean {
    const tag = value?.trim();
    if(!tag || !/^[A-Za-z0-9-]+$/.test(tag)) {
      return false;
    }

    const normalizedTag = tag.toLowerCase();
    if(AttachmentUtil.GRANDFATHERED_LANGUAGE_TAGS.has(normalizedTag) ||
      /^x(?:-[a-z0-9]{1,8})+$/.test(normalizedTag)) {
      return true;
    }

    const match = AttachmentUtil.LANGUAGE_TAG_PATTERN.exec(normalizedTag);
    if(!match) {
      return false;
    }

    const variants = match[1].split('-').filter(Boolean);
    const singletons = match[2].split('-').filter((subtag) => subtag.length === 1);
    return new Set(variants).size === variants.length && new Set(singletons).size === singletons.length;
  }

  /**
   * Calculate the FHIR Attachment.hash value (SHA-1, encoded as base64).
   * @param data - Plain base64 data or a base64 data URI to hash.
   * @returns The base64-encoded SHA-1 digest.
   */
  static async sha1Base64(data: string): Promise<string> {
    const parsed = AttachmentUtil.parseBase64(data);
    if(!parsed) {
      throw new Error('Invalid base64Binary data.');
    }
    return AttachmentUtil.sha1Base64Bytes(AttachmentUtil.base64ToBytes(parsed.data));
  }

  /**
   * Read a browser file into a FHIR Attachment with data, size, and hash metadata.
   * @param file - The file to convert.
   * @returns The populated Attachment.
   */
  static async fileToAttachment(file: File): Promise<fhir.Attachment> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for(let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }

    const attachment: fhir.Attachment = {
      data: btoa(binary),
      title: file.name,
      size: file.size.toString(),
      hash: await AttachmentUtil.sha1Base64Bytes(bytes)
    };
    if(file.type) {
      attachment.contentType = file.type;
    }
    return attachment;
  }

  /**
   * Serialize an Attachment after removing fields that have no meaningful value.
   * @param attachment - The Attachment to serialize.
   * @returns Compact JSON for the cleaned Attachment.
   */
  static compactJson(attachment: fhir.Attachment): string {
    return JSON.stringify(AttachmentUtil.withoutEmptyFields(attachment || {}));
  }

  /**
   * Return a shallow copy of an Attachment without empty fields or empty nested values.
   * @param attachment - The Attachment to clean.
   * @returns The cleaned Attachment copy.
   */
  static withoutEmptyFields(attachment: fhir.Attachment): fhir.Attachment {
    return Object.entries(attachment || {}).reduce((result, [key, value]) => {
      let cleanedValue = value;
      if(Array.isArray(value)) {
        cleanedValue = value.filter((entry) => entry !== null && entry !== undefined);
      }
      else if(value && typeof value === 'object') {
        cleanedValue = Object.entries(value).reduce((objectResult, [objectKey, objectValue]) => {
          if(objectValue !== null && objectValue !== undefined && objectValue !== '' &&
            (!Array.isArray(objectValue) || objectValue.length > 0)) {
            objectResult[objectKey] = objectValue;
          }
          return objectResult;
        }, {});
      }
      if(cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '' &&
        (!Array.isArray(cleanedValue) || cleanedValue.length > 0) &&
        (typeof cleanedValue !== 'object' || Array.isArray(cleanedValue) || Object.keys(cleanedValue).length > 0)) {
        result[key] = cleanedValue;
      }
      return result;
    }, {} as fhir.Attachment);
  }

  /**
   * Normalize every Attachment value in a Questionnaire for the requested FHIR release.
   * R5 integer64 values are JSON strings; earlier releases use a JSON number and do not
   * contain the media-specific fields introduced in R5.
   * @param questionnaire - The Questionnaire-like object to normalize in place.
   * @param version - The target FHIR release, such as STU3, R4, or R5.
   * @returns The same Questionnaire-like object after normalization.
   */
  static normalizeQuestionnaireAttachments<T>(questionnaire: T, version: string): T {
    AttachmentUtil.visitAttachmentValues(questionnaire, (attachment) => {
      if(version === 'R5') {
        AttachmentUtil.normalizeR5Size(attachment);
      }
      else {
        AttachmentUtil.normalizeLegacyAttachment(attachment);
      }
    });
    return questionnaire;
  }

  /**
   * Decode canonical base64 data into bytes.
   * @param value - The base64 data to decode.
   * @returns The decoded byte array.
   */
  private static base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  /**
   * Calculate a base64-encoded SHA-1 digest for a byte array.
   * @param bytes - The bytes to hash.
   * @returns The base64-encoded SHA-1 digest.
   */
  private static async sha1Base64Bytes(bytes: Uint8Array): Promise<string> {
    const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', source));
    let binary = '';
    digest.forEach((byte) => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  /**
   * Visit valueAttachment, answerAttachment, and STU3 initialAttachment properties
   * at any Questionnaire nesting level.
   * @param value - The value whose nested Attachment properties are traversed.
   * @param visitor - The callback invoked for every Attachment object.
   */
  private static visitAttachmentValues(value: unknown, visitor: (attachment: Record<string, any>) => void): void {
    if(!value || typeof value !== 'object') {
      return;
    }
    if(Array.isArray(value)) {
      value.forEach((entry) => AttachmentUtil.visitAttachmentValues(entry, visitor));
      return;
    }

    Object.entries(value).forEach(([key, child]) => {
      if((key === 'valueAttachment' || key === 'answerAttachment' || key === 'initialAttachment') &&
        child && typeof child === 'object') {
        visitor(child as Record<string, any>);
      }
      AttachmentUtil.visitAttachmentValues(child, visitor);
    });
  }

  /**
   * Convert Attachment.size to the R5 integer64 JSON representation.
   * Preserve primitive metadata when the scalar value is absent.
   * @param attachment - The Attachment object to normalize in place.
   */
  private static normalizeR5Size(attachment: Record<string, any>): void {
    const size = attachment.size;
    if(typeof size === 'number' && Number.isSafeInteger(size) && size >= 0) {
      attachment.size = size.toString();
    }
    else if(typeof size === 'string') {
      attachment.size = size.trim();
    }

    if(attachment.size !== undefined &&
      !AttachmentUtil.isUnsignedIntegerInRange(attachment.size, '9223372036854775807')) {
      delete attachment.size;
      delete attachment._size;
    }
  }

  /**
   * Convert an R5 Attachment to the fields and primitive representation supported before R5.
   * Preserve primitive size metadata when the scalar value is absent.
   * @param attachment - The Attachment object to normalize in place.
   */
  private static normalizeLegacyAttachment(attachment: Record<string, any>): void {
    const size = typeof attachment.size === 'number'
      ? attachment.size.toString()
      : typeof attachment.size === 'string' ? attachment.size.trim() : undefined;
    if(AttachmentUtil.isUnsignedIntegerInRange(size, '2147483647')) {
      attachment.size = Number(size);
    }
    else if(attachment.size !== undefined) {
      delete attachment.size;
      delete attachment._size;
    }

    ['height', 'width', 'frames', 'duration', 'pages'].forEach((field) => {
      delete attachment[field];
      delete attachment[`_${field}`];
    });
  }

  /**
   * Check a canonical unsigned integer string against an inclusive decimal upper bound.
   * @param value - The candidate unsigned integer string.
   * @param maximum - The inclusive decimal upper bound.
   * @returns True when the value is canonical and within the bound.
   */
  private static isUnsignedIntegerInRange(value: unknown, maximum: string): value is string {
    if(typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
      return false;
    }
    return value.length < maximum.length || (value.length === maximum.length && value <= maximum);
  }
}
