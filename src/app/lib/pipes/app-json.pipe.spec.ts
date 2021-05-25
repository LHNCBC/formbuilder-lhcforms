import { AppJsonPipe } from './app-json.pipe';

fdescribe('AppJsonPipe', () => {
  // The pipe ignores __$* keys.
  const obj = {
    test: () => {console.log('hi')},
    __$a: {
      __$b: '_b',
      c: 'c'
    },
    A: {
      b: 'b',
      __$b: '_b'
    },
    // question is referring to ITreeNode.
    // {question: [ITreeNode]} should be translated to {question: [linkId]}.
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
