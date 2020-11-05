import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appJson'
})
export class AppJsonPipe implements PipeTransform {

  transform(value: any): string {
    const replacer = (k, v) => {

      return (
        k.startsWith('_') ||
        typeof v === 'function'
      ) ? undefined : (k === 'question' ? v.data.linkId : v);
    };
    return JSON.stringify(value, replacer, 2);
  }

}
