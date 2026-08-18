import { WidgetValidationError } from '../../validation-utils';
import { filterSpuriousTimePatternErrors } from './time-util';

describe('filterSpuriousTimePatternErrors', () => {
  const patternError: WidgetValidationError = {
    code: 'PATTERN',
    originalMessage: 'Invalid time format.',
    modifiedMessage: 'Valid format is HH:mm:ss.'
  };

  it('removes a stale pattern error when the current value is a valid FHIR time', () => {
    const otherError: WidgetValidationError = {
      code: 'OTHER',
      originalMessage: 'Other error.',
      modifiedMessage: null
    };

    expect(filterSpuriousTimePatternErrors(
      [patternError, otherError],
      '23:59:60.123'
    )).toEqual([otherError]);
  });

  it('preserves the pattern error when the current value is malformed', () => {
    expect(filterSpuriousTimePatternErrors([patternError], 'bad-time')).toEqual([patternError]);
    expect(filterSpuriousTimePatternErrors([patternError], '24:00:00')).toEqual([patternError]);
  });
});
