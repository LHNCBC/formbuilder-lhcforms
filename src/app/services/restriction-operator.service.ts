import {EventEmitter, Injectable} from '@angular/core';
import {AcceptChange} from '../lib/widgets/restrictions-operator/restrictions-operator.component';

@Injectable()
export class RestrictionOperatorService {

  constructor() { }

  rejectChange = new EventEmitter<AcceptChange>();
  next(reject: AcceptChange) {
    this.rejectChange.next(reject);
  }

  subscribe(cb: (reject: AcceptChange) => void) {
    this.rejectChange.subscribe(cb);
  }
}
