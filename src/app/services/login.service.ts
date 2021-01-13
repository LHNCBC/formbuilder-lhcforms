import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';

export interface UserProfile {
  displayName?: string;
  email?: string;
}

export interface LoginEvent {
  userProfile: UserProfile;
  event: 'signedIn' | 'signedOut';
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  service$ = new Subject<LoginEvent>();
  constructor() { }

  logOut(userProfile: UserProfile) {
    return this.service$.next(null);
  }

  service(): Observable<LoginEvent> {
    return this.service$.asObservable();
  }

  login() {
    return this.service$.next({event: 'signedIn', userProfile: {displayName: 'Test User', email: 'testUser@example.com'}});
  }
}
