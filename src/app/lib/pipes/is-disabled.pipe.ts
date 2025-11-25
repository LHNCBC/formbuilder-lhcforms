import { Pipe, PipeTransform } from '@angular/core';
import {ArrayProperty} from "@lhncbc/ngx-schema-form";
import {Observable} from "rxjs";

@Pipe({name: 'isDisabledPipe', standalone: true})
export class IsDisabledPipe implements PipeTransform {
  /**
   * Transform the indexed FormProperty to a boolean value indicating if the row is disabled.
   * @param arrayProperty - Model of the table.
   * @param index - Index of the arrayProperty.
   * @param isDisabledCallback - Callback function to indicate if the row should be disabled.
   */
  transform(arrayProperty: ArrayProperty,
            index: number,
            isDisabledCallback: (a: ArrayProperty, i: number) => boolean): Observable<boolean> {
    return new Observable(subscriber => {
      const timeId = setTimeout(() => {
        const isDisabled = isDisabledCallback(arrayProperty, index);
        subscriber.next(isDisabled);
        subscriber.complete();
        clearTimeout(timeId);
      })
    });
  }
}
