import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface TableStatus {
  type: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private tableStatusChanged: BehaviorSubject<TableStatus> = new BehaviorSubject<TableStatus>(null);

  tableStatusChanged$ = this.tableStatusChanged.asObservable();

  setTableStatusChanged(status: TableStatus) {
    this.tableStatusChanged.next(status);
  }
}
