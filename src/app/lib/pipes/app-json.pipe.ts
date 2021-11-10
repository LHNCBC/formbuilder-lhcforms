/**
 * Special case pipe to convert questionnaire object to json string.
 * Ignore functions and __$* keys. __$* are local fields, which should be ignored
 * when translating to form definitions.
 * In a special case, handles enableWhen.question, which may refer to
 * ITreeNode. ITreeNode should translate to its linkId.
 */
import { Pipe, PipeTransform } from '@angular/core';
import {Util} from '../util';
import traverse from 'traverse';

@Pipe({
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  /**
   * Filter transformation.
   *
   * @param value - JSON object
   */
  transform(value: any): string {
    const transformed = traverse(value).map(function(x) {
      // __$helpText is a simple string input control. It should translate to .item[x] with display type and
      // display control extension.

      if(x?.__$helpText?.trim().length > 0) {
        const index = Util.findItemIndexWithHelpText(x.item);
        let helpTextItem;
        if(index < 0) {
          helpTextItem = Util.createHelpTextItem(x, x.__$helpText.trim());
          if(!x.item) {
            x.item = [];
          }
          x.item.push(helpTextItem);
        }
        else {
          helpTextItem = x.item[index];
          helpTextItem.text = x.__$helpText;
        }
        // Replace helpText with sub item
        delete x.__$helpText;
        this.update(x);
      }
      // Internally the question is target TreeNode. Change that to node's linkId.
      else if(this.key === 'question' && typeof x?.data === 'object') {
        this.update(x.data.linkId);
      }
      // Remove all custom fields starting with __$ and empty fields.
      else if(this.key?.startsWith('__$') || typeof x === 'function' || Util.isEmpty(x)) {
        if(this.notRoot) {
          this.delete();
        }
      }
    });

    return JSON.stringify(transformed, null, 2);
  }

}
