import { AppJsonPipe } from './app-json.pipe';

describe('AppJsonPipe', () => {
  const obj = {
    test: () => {console.log('hi')},
    _a: {
      _b: '_b',
      c: 'c'
    },
    A: {
      b: 'b',
      _b: '_b'
    },
    // Should be transformed to {question: 2}
    question: {
      // data => questionnaire.item
      data: {
        linkId: 2, // The field that matters, all other are ignored.
        x: 3,
        y: 4
      },
      d: 0 // Should be ignored
    },
    enableWhen: {question: 1}
  };

  it('should create an instance', () => {
    const pipe = new AppJsonPipe();
    expect(pipe).toBeTruthy();
  });

  it('should transform ignoring functions', () => {
    const pipe = new AppJsonPipe();
    expect(JSON.parse(pipe.transform(obj))).toEqual({
      A: {b: 'b'},
      question: 2,
      enableWhen: {question: 1}
    });
  });
});
