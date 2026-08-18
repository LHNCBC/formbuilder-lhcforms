import {hasUsageContextLocalReference} from './usage-context-reference.util';

describe('hasUsageContextLocalReference', () => {
  it('should find a contained resource referenced by Usage Context', () => {
    expect(hasUsageContextLocalReference([{
      code: {code: 'workflow'},
      valueReference: {reference: ' #vs1 '}
    }], 'vs1')).toBeTrue();
  });

  it('should ignore other reference forms and ids', () => {
    expect(hasUsageContextLocalReference([{
      code: {code: 'workflow'},
      valueReference: {reference: 'ValueSet/vs1'}
    }], 'vs1')).toBeFalse();
    expect(hasUsageContextLocalReference([{
      code: {code: 'workflow'},
      valueReference: {reference: '#vs2'}
    }], 'vs1')).toBeFalse();
  });
});
