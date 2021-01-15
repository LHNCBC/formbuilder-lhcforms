import { Pipe, PipeTransform } from '@angular/core';

/**
 * Special case pipe to convert questionnaire object to json string.
 * Ignore functions and _* keys. In a special case, handles enableWhen.question
 */
@Pipe({
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  transform(value: any): string {
    const replacer = (k, v) => {

      return (
        k.startsWith('_') ||
        typeof v === 'function'
      ) ? undefined : (k === 'question' && v && v.data && typeof v.data === 'object' ? v.data.linkId : v); // Special case: enableWhen.question is a TreeNode.
                                                              // It should include linkId.
    };
    return JSON.stringify(value, replacer, 2);
  }

}
