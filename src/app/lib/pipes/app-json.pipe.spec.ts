import { AppJsonPipe } from './app-json.pipe';
import {Util} from '../util';

describe('AppJsonPipe', () => {
  // The pipe ignores __$* keys.
  const obj = {
    linkId: 'l1',
    __$helpText: {
      text: 'Help text!',
      type: 'display',
      linkId: 'll1',
      extension: [Util.HELP_BUTTON_EXTENSION]
    },
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
    const helpTextItem = JSON.parse(JSON.stringify(Util.helpItemTemplate));
    helpTextItem.text = 'Help text!';
    helpTextItem.linkId = 'll1';
    helpTextItem.type = 'display';
    const expected = JSON.parse(pipe.transform(obj));
    expect(expected).toEqual({
      linkId: 'l1',
      item: [helpTextItem],
      A: {b: 'b'},
      question: 2,
      enableWhen: {question: 1}
    });
  });
});
