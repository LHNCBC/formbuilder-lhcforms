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
  standalone: false,
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  /**
   * Filter transformation.
   *
   * @param value - JSON object
   */
  transform(value: any): string {
    return JSON.stringify(Util.convertToQuestionnaireJSON(value), null, 2);
  }
}
