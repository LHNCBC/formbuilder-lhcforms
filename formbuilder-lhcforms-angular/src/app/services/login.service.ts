import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';

/**
 * Define user profile
 */
export interface UserProfile {
  displayName?: string;
  email?: string;
}

/**
 * Define login event
 */
export interface LoginEvent {
  userProfile: UserProfile;
  event: 'signedIn' | 'signedOut';
}

/**
 *
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  service$ = new Subject<LoginEvent>();
  constructor() { }


  /**
   * Generate logout event.
   * @param userProfile
   */
  logOut(userProfile: UserProfile) {
    return this.service$.next(null);
  }

  /**
   * Let the listeners subscribe to the service.
   */
  service(): Observable<LoginEvent> {
    return this.service$.asObservable();
  }


  /**
   * Generate login event, after authentication.
   * TODO - authentication is not defined yet.
   */
  login() {
    return this.service$.next({event: 'signedIn', userProfile: {displayName: 'Test User', email: 'testUser@example.com'}});
  }
}
