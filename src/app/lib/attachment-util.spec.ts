import {AttachmentUtil} from './attachment-util';

describe('AttachmentUtil', () => {
  it('parses and normalizes plain base64', () => {
    expect(AttachmentUtil.parseBase64('SGVs\nbG8='))
      .toEqual({data: 'SGVsbG8=', contentType: undefined, size: '5'});
  });

  it('strips a data URI prefix and returns its complete MIME type', () => {
    expect(AttachmentUtil.parseBase64('data:text/plain;charset=utf-8;base64,SGVsbG8='))
      .toEqual({data: 'SGVsbG8=', contentType: 'text/plain;charset=utf-8', size: '5'});
    expect(AttachmentUtil.parseBase64(
      'data:application/example;version=1;charset=utf-8;base64,SGVsbG8='
    )).toEqual({
      data: 'SGVsbG8=',
      contentType: 'application/example;version=1;charset=utf-8',
      size: '5'
    });
  });

  it('applies the RFC 2397 default media type when a data URI omits it', () => {
    expect(AttachmentUtil.parseBase64('data:;base64,SGVsbG8='))
      .toEqual({
        data: 'SGVsbG8=',
        contentType: 'text/plain;charset=US-ASCII',
        size: '5'
      });
    expect(AttachmentUtil.parseBase64('data:;charset=utf-8;base64,SGVsbG8='))
      .toEqual({
        data: 'SGVsbG8=',
        contentType: 'text/plain;charset=utf-8',
        size: '5'
      });
  });

  it('rejects malformed base64', () => {
    expect(AttachmentUtil.parseBase64('not base64!')).toBeNull();
    expect(AttachmentUtil.parseBase64('')).toBeNull();
  });

  it('converts a File to FHIR Attachment data and metadata', async () => {
    const file = new File([new TextEncoder().encode('Hello')], 'hello.txt', {type: 'text/plain'});
    expect(await AttachmentUtil.fileToAttachment(file)).toEqual({
      data: 'SGVsbG8=',
      title: 'hello.txt',
      contentType: 'text/plain',
      size: '5',
      hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A='
    });
  });

  it('calculates a base64-encoded SHA-1 hash from attachment data', async () => {
    expect(await AttachmentUtil.sha1Base64('SGVsbG8='))
      .toBe('9/+ei3uy4Jtwk1pdeF4MxdnQq/A=');
  });

  it('validates BCP-47 language tags', () => {
    expect(AttachmentUtil.isValidLanguageTag('en-US')).toBeTrue();
    expect(AttachmentUtil.isValidLanguageTag('zh-Hant-TW')).toBeTrue();
    expect(AttachmentUtil.isValidLanguageTag('x-project')).toBeTrue();
    expect(AttachmentUtil.isValidLanguageTag('en_US')).toBeFalse();
    expect(AttachmentUtil.isValidLanguageTag('en--US')).toBeFalse();
  });

  it('accepts extended-language subtags and complete BCP-47 combinations', () => {
    [
      'zh-cmn-Hans', 'zh-yue-HK', 'ar-aao', 'sgn-ase-US', 'ZH-CMN-hANS-CN',
      'zh-cmn-Hans-CN-u-ca-chinese-x-record', '  zh-cmn-Hans  ',
      'en-Latn-US', 'es-419', 'de-CH-1901', 'sl-rozaj-biske-1994',
      'en-a-myext-b-another', 'en-0-abc', 'en-a-abcde-abcde',
      'qaa-Qaaa-QM-x-southern'
    ].forEach((tag) => {
      expect(AttachmentUtil.isValidLanguageTag(tag)).withContext(tag).toBeTrue();
    });
  });

  it('preserves grandfathered and private-use language tags', () => {
    [
      'i-klingon', 'I-DEFAULT', 'en-GB-oed', 'sgn-BE-FR', 'zh-min-nan',
      'x-project', 'X-a-1', 'en-x-private', 'en-x-a-a', 'en-x-abcde-abcde'
    ].forEach((tag) => {
      expect(AttachmentUtil.isValidLanguageTag(tag)).withContext(tag).toBeTrue();
    });
  });

  it('accepts reserved grammatical forms without requiring subtag registration', () => {
    ['abcd', 'abcde', 'abcdefgh', 'aaa-bbb-ccc-ddd'].forEach((tag) => {
      expect(AttachmentUtil.isValidLanguageTag(tag)).withContext(tag).toBeTrue();
    });
  });

  it('rejects malformed BCP-47 subtag sequences and non-ASCII characters', () => {
    [
      '', ' ', 'en_US', 'en--US', 'en US', 'en-\u00e9', '\u212aen',
      'en-', '-en', 'e', 'abcdefghi', 'abcd-abc', 'en-abc-def-ghi-jkl',
      'en-US-Latn', 'en-12', 'en-a', 'en-a-b', 'en-a-123456789',
      'en-x', 'x', 'i-unknown', 'en-x-123456789'
    ].forEach((tag) => {
      expect(AttachmentUtil.isValidLanguageTag(tag)).withContext(tag).toBeFalse();
    });
  });

  it('rejects repeated variants and extension singletons regardless of case', () => {
    ['en-abcde-abcde', 'sl-rozaj-ROZAJ', 'en-a-foo-A-bar', 'en-0-foo-0-bar'].forEach((tag) => {
      expect(AttachmentUtil.isValidLanguageTag(tag)).withContext(tag).toBeFalse();
    });
  });

  it('provides the FHIR R4 Common Languages as preferred suggestions', () => {
    expect(AttachmentUtil.COMMON_LANGUAGES.find(({code}) => code === 'en-US'))
      .toEqual({code: 'en-US', display: 'English (United States)'});
    expect(AttachmentUtil.COMMON_LANGUAGE_CODES).toContain('zh-TW');
    expect(AttachmentUtil.COMMON_LANGUAGE_CODES).not.toContain('zh-Hant-TW');
    expect(AttachmentUtil.COMMON_LANGUAGES[0].code).toBe('en-US');
    const remainingDisplays = AttachmentUtil.COMMON_LANGUAGES.slice(1).map(({display}) => display);
    expect(remainingDisplays)
      .toEqual([...remainingDisplays].sort((first, second) => first.localeCompare(second, 'en')));
  });

  it('creates compact Attachment JSON without empty fields', () => {
    expect(AttachmentUtil.compactJson({title: 'Report', contentType: '', size: '0'}))
      .toBe('{"title":"Report","size":"0"}');
  });

  it('omits empty size metadata from compact JSON without discarding a primitive id', () => {
    const attachment = {url: 'https://example.org/report.pdf', _size: {extension: []}};
    expect(AttachmentUtil.compactJson(attachment)).toBe('{"url":"https://example.org/report.pdf"}');
    expect(attachment._size).toEqual({extension: []});

    const attachmentWithId = {...attachment, _size: {id: 'size-note', extension: []}};
    expect(AttachmentUtil.compactJson(attachmentWithId))
      .toBe('{"url":"https://example.org/report.pdf","_size":{"id":"size-note"}}');
  });

  it('normalizes Attachment fields for R5 and earlier releases', () => {
    const questionnaire: any = {
      item: [{initial: [{valueAttachment: {
        size: 5,
        height: 480,
        width: 640,
        frames: 2,
        duration: 1.5,
        pages: 3
      }}]}]
    };

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'R5');
    expect(questionnaire.item[0].initial[0].valueAttachment.size).toBe('5');

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'R4');
    expect(questionnaire.item[0].initial[0].valueAttachment).toEqual({size: 5});
  });

  it('normalizes STU3 initialAttachment values at root and nested item levels', () => {
    const sizeMetadata = {id: 'size-note'};
    const mediaMetadata = {id: 'media-note'};
    const url = 'https://example.org/image.png';
    const attachments: Record<string, unknown>[] = ['0', '5', '2147483647', '2147483648']
      .map((size) => ({
        url,
        size,
        _size: sizeMetadata,
        height: 480,
        _height: mediaMetadata,
        width: 640,
        _width: mediaMetadata,
        frames: 2,
        _frames: mediaMetadata,
        duration: 1.5,
        _duration: mediaMetadata,
        pages: 3,
        _pages: mediaMetadata
      }));
    const questionnaire = {
      item: [{
        initialAttachment: attachments[0],
        item: attachments.slice(1).map((initialAttachment) => ({initialAttachment}))
      }]
    };

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'STU3');

    expect(attachments).toEqual([
      {url, size: 0, _size: sizeMetadata},
      {url, size: 5, _size: sizeMetadata},
      {url, size: 2147483647, _size: sizeMetadata},
      {url}
    ]);
  });

  ['R5', 'R4', 'STU3'].forEach((version) => {
    it(`preserves Attachment.size metadata without a scalar value for ${version}`, () => {
      const extension = [{
        url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
        valueCode: 'unknown'
      }];

      [{id: 'size-note'}, {extension}, {id: 'size-note', extension}].forEach((metadata) => {
        const attachment = {url: 'https://example.org/report.pdf', _size: metadata};
        const questionnaire = {
          item: [version === 'STU3'
            ? {initialAttachment: attachment}
            : {initial: [{valueAttachment: attachment}]}]
        };

        AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, version);

        expect(attachment).toEqual({url: 'https://example.org/report.pdf', _size: metadata});
      });
    });

    it(`still removes malformed Attachment.size values and their metadata for ${version}`, () => {
      [null, '', 'invalid', '-1', '1.5', '9223372036854775808', -1, 1.5, NaN, Infinity]
        .forEach((size) => {
          const attachment = {size, _size: {id: 'invalid-size'}};
          const questionnaire = {
            item: [version === 'STU3'
              ? {initialAttachment: attachment}
              : {initial: [{valueAttachment: attachment}]}]
          };

          AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, version);

          expect(attachment.size).withContext(`size: ${String(size)}`).toBeUndefined();
          expect(attachment._size).withContext(`size: ${String(size)}`).toBeUndefined();
        });
    });
  });

  it('preserves the full R5 integer64 range without JavaScript number coercion', () => {
    const questionnaire: any = {
      item: [{initial: [{valueAttachment: {size: '9223372036854775807'}}]}]
    };

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'R5');
    expect(questionnaire.item[0].initial[0].valueAttachment.size).toBe('9223372036854775807');

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'R4');
    expect(questionnaire.item[0].initial[0].valueAttachment.size).toBeUndefined();
  });

  it('enforces the FHIR R4 unsignedInt upper bound for Attachment.size', () => {
    const questionnaire: any = {
      item: [{initial: [
        {valueAttachment: {size: '2147483647'}},
        {valueAttachment: {size: '2147483648'}},
        {valueAttachment: {size: '4294967295'}}
      ]}]
    };

    AttachmentUtil.normalizeQuestionnaireAttachments(questionnaire, 'R4');

    expect(questionnaire.item[0].initial[0].valueAttachment.size).toBe(2147483647);
    expect(questionnaire.item[0].initial[1].valueAttachment.size).toBeUndefined();
    expect(questionnaire.item[0].initial[2].valueAttachment.size).toBeUndefined();
  });
});
