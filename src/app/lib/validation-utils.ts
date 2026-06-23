export type WidgetValidationError = {
  code: string;
  originalMessage: string;
  modifiedMessage: string | null;
};

export type PatternMessage = {
  pattern: string;
  message: string;
};

export type ModifiedMessages = {
  PATTERN: PatternMessage[];
  [key: string]: string | null | PatternMessage[];
};

export const DEFAULT_WIDGET_MODIFIED_MESSAGES: ModifiedMessages = {
  PATTERN: [
    {
      pattern: '^[A-Za-z0-9\\-\\.]{1,64}$',
      message: 'Only alphanumeric, hyphen and period characters are allowed in this field. Make sure any white space characters are not used.'
    },
    {
      pattern: '^\\S*$',
      message: 'Spaces and other whitespace characters are not allowed in this field.'
    },
    {
      pattern: '^[^\\s]+(\\s[^\\s]+)*$',
      message: 'Spaces are not allowed at the beginning or end.'
    },
    {
      pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$',
      message: 'Valid format is yyyy-MM-dd.'
    },
    {
      pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$',
      message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
    },
    {
      pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$',
      message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
    },
    {
      pattern: '^[1-9][0-9]*$',
      message: 'Enter an integer greater than 0.'
    },
    {
      pattern: '^[0]|([1-9][0-9]*)$',
      message: 'Enter an integer greater than or equal to 0.'
    }
  ],
  MIN_LENGTH: null,
  MAX_LENGTH: null
};

type ErrorMappingOptions = {
  showEmptyError: boolean;
  errorFilter?: (error: any) => boolean;
};

export function getModifiedErrorForPatternMismatch(pattern: string, modifiedMessages: ModifiedMessages): string | null {
  const messageObj = modifiedMessages.PATTERN.find((el) => el.pattern === pattern);
  return messageObj ? messageObj.message : null;
}

export function mapWidgetErrors(
  errors: any[] | null | undefined,
  modifiedMessages: ModifiedMessages,
  options: ErrorMappingOptions
): WidgetValidationError[] | null {
  if (!errors?.length) {
    return null;
  }

  const errorsObj: Record<string, any> = {};
  errors.reduce((acc, error) => {
    if ((!options.errorFilter || options.errorFilter(error)) && !acc[error.code]) {
      acc[error.code] = error;
    }
    return acc;
  }, errorsObj);

  const filteredErrors = Object.values(errorsObj);
  if (!filteredErrors.length) {
    return null;
  }

  return filteredErrors.map((e: any) => {
    const ret: WidgetValidationError = { code: e.code, originalMessage: e.message, modifiedMessage: null };
    const errorValue = e.params?.[1];
    if (typeof errorValue === 'string' && !errorValue.trim() && options.showEmptyError) {
      ret.code = 'EMPTY_ERROR';
      ret.modifiedMessage = 'This field is required.';
    } else {
      const modifiedMessage = e.code === 'PATTERN'
        ? getModifiedErrorForPatternMismatch(e.params?.[0], modifiedMessages)
        : (modifiedMessages[e.code] as string | null);
      ret.modifiedMessage = modifiedMessage;
    }
    return ret;
  });
}

export function hasInvalidParentTd(inputEl: HTMLElement): boolean {
  let el: HTMLElement | null = inputEl;
  while (el && el.tagName !== 'TD') {
    el = el.parentElement;
  }
  return !!el && el.classList.contains('invalid');
}

export function suppressInvalidInputValue(
  event: Event,
  setValue: (value: any) => void,
  parentTdInvalidValue: any
): void {
  const inputEl = event.target as HTMLInputElement;
  if (inputEl.classList.contains('ng-invalid')) {
    setValue(null);
  } else if (hasInvalidParentTd(inputEl)) {
    inputEl.value = '';
    setValue(parentTdInvalidValue);
  }
}