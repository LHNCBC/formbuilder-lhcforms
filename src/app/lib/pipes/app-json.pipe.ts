/**
 * Special case pipe to convert questionnaire object to json string.
 * Ignore functions and __$* keys. __$* are local fields, which should be ignored
 * when translating to form definitions.
 * In a special case, handles enableWhen.question, which may refer to
 * ITreeNode. ITeeNode should translate to its linkId.
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  transform(value: any): string {
    const replacer = (k, v) => {

      return (
        k.startsWith('__$') ||
        typeof v === 'function'
      ) ? undefined : (k === 'question' && v && v.data && typeof v.data === 'object' ? v.data.linkId : v); // Special case: enableWhen.question is a TreeNode.
                                                              // It should include linkId.
    };
    return JSON.stringify(value, replacer, 2);
  }

}
