import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShareObjectService {
  objSource: BehaviorSubject<any> = new BehaviorSubject<any>({});
  object = this.objSource.asObservable();
  objectStr = this.object.pipe(map((item) => JSON.stringify(item, null, 2)));
  constructor() {}

  setObject(obj: any) {
    let valid = true;
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        valid = false;
      }
    }
    if (valid) {
      this.objSource.next(obj);
    }
  }
}
