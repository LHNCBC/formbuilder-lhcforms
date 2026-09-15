import {EXTENSION_URL_MIN_OCCURS} from '../../constants/constants';
import {mergeIntegerExtension} from './min-max-occurs.utils';

describe('mergeIntegerExtension', () => {
  it('should preserve extension and primitive metadata', () => {
    const currentExtension = {
      id: 'min-occurs-extension',
      url: EXTENSION_URL_MIN_OCCURS,
      valueInteger: 2,
      _valueInteger: {id: 'min-occurs-value'}
    };

    expect(mergeIntegerExtension(currentExtension, EXTENSION_URL_MIN_OCCURS, 3)).toEqual({
      id: 'min-occurs-extension',
      url: EXTENSION_URL_MIN_OCCURS,
      valueInteger: 3,
      _valueInteger: {id: 'min-occurs-value'}
    } as any);
  });
});
