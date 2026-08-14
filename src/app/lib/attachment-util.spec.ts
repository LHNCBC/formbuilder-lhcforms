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
