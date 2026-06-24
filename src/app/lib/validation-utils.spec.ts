import {
  DEFAULT_WIDGET_MODIFIED_MESSAGES,
  getModifiedErrorForPatternMismatch,
  hasInvalidParentTd,
  mapWidgetErrors,
  suppressInvalidInputValue
} from './validation-utils';

describe('validation-utils', () => {
  describe('getModifiedErrorForPatternMismatch', () => {
    it('returns mapped message for known pattern', () => {
      const message = getModifiedErrorForPatternMismatch('^\\S*$', DEFAULT_WIDGET_MODIFIED_MESSAGES);
      expect(message).toContain('Spaces and other whitespace characters are not allowed');
    });

    it('returns null for unknown pattern', () => {
      const message = getModifiedErrorForPatternMismatch('unknown-pattern', DEFAULT_WIDGET_MODIFIED_MESSAGES);
      expect(message).toBeNull();
    });
  });

  describe('mapWidgetErrors', () => {
    it('deduplicates by code and maps empty error', () => {
      const errors = [
        { code: 'REQUIRED', message: 'required 1', params: [null, ''] },
        { code: 'REQUIRED', message: 'required 2', params: [null, ''] }
      ];

      const mapped = mapWidgetErrors(errors as any[], DEFAULT_WIDGET_MODIFIED_MESSAGES, {
        showEmptyError: true
      });

      expect(mapped?.length).toBe(1);
      expect(mapped?.[0].code).toBe('EMPTY_ERROR');
      expect(mapped?.[0].modifiedMessage).toBe('This field is required.');
    });

    it('applies filter callback', () => {
      const errors = [
        { code: 'ENABLEWHEN_PATTERN', message: 'enableWhen', params: ['^\\S*$', 'x'] },
        { code: 'PATTERN', message: 'general', params: ['^\\S*$', 'x'] }
      ];

      const mapped = mapWidgetErrors(errors as any[], DEFAULT_WIDGET_MODIFIED_MESSAGES, {
        showEmptyError: false,
        errorFilter: (error: any) => error.code.startsWith('ENABLEWHEN_')
      });

      expect(mapped?.length).toBe(1);
      expect(mapped?.[0].code).toBe('ENABLEWHEN_PATTERN');
    });
  });

  describe('hasInvalidParentTd', () => {
    it('returns true when nearest td has invalid class', () => {
      const td = document.createElement('td');
      td.classList.add('invalid');
      const wrapper = document.createElement('div');
      const input = document.createElement('input');
      wrapper.appendChild(input);
      td.appendChild(wrapper);

      expect(hasInvalidParentTd(input)).toBeTrue();
    });
  });

  describe('suppressInvalidInputValue', () => {
    it('sets null when input is ng-invalid', () => {
      const input = document.createElement('input');
      input.classList.add('ng-invalid');
      let captured: any = 'unchanged';

      suppressInvalidInputValue(
        { target: input } as any,
        (value) => captured = value,
        ''
      );

      expect(captured).toBeNull();
    });

    it('clears input and sets parentTdInvalidValue when parent td is invalid', () => {
      const td = document.createElement('td');
      td.classList.add('invalid');
      const input = document.createElement('input');
      input.value = 'abc';
      td.appendChild(input);

      let captured: any = null;
      suppressInvalidInputValue(
        { target: input } as any,
        (value) => captured = value,
        'replacement'
      );

      expect(input.value).toBe('');
      expect(captured).toBe('replacement');
    });
  });
});
