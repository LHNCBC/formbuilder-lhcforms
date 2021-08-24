/**
 * Special case pipe to convert questionnaire object to json string.
 * Ignore functions and __$* keys. __$* are local fields, which should be ignored
 * when translating to form definitions.
 * In a special case, handles enableWhen.question, which may refer to
 * ITreeNode. ITreeNode should translate to its linkId.
 */
import { Pipe, PipeTransform } from '@angular/core';
import {Util} from '../util';

@Pipe({
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  transform(value: any): string {
    const replacer = (k, v) => {

      return (
        k.startsWith('__$') ||
        typeof v === 'function' ||
        Util.isEmpty(v)
      ) ? undefined :
        // Special case: enableWhen.question is a TreeNode. It should include linkId.
        (k === 'question' && v && v.data && typeof v.data === 'object' ? v.data.linkId : v);
    };
    return JSON.stringify(value, replacer, 2);
  }

}
