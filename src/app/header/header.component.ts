import { Component, OnInit, Input } from '@angular/core';
import { LoginService, UserProfile } from '../services/login.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-header',
  template: `
    <mat-toolbar id="header">
      <mat-icon id="logo" svgIcon="home" aria-label="Home"></mat-icon>
      <div id="siteNameBox">
        <a mat-button id="siteName" href="/">Form Builder for FHIR Questionnaire</a>
      </div>
      <button mat-button color="primary" [matMenuTriggerFor]="menuExport">Export<mat-icon>arrow_drop_down</mat-icon></button>
      <mat-menu #menuExport="matMenu">
        <button mat-menu-item>Export to file...</button>
        <button mat-menu-item>Create a new FHIR resource on a server...</button>
        <button mat-menu-item>Update a FHIR resource on a server</button>
      </mat-menu>
      <button mat-button color="primary" [matMenuTriggerFor]="menuImport">Import<mat-icon>arrow_drop_down</mat-icon></button>
      <mat-menu #menuImport="matMenu">
        <button mat-menu-item>Import from file...</button>
        <button mat-menu-item>Load from FHIR server...</button>
      </mat-menu>
      <div class="float-lg-right" *ngIf="isFirebaseEnabled">
        <div *ngIf="!isUserSignedIn">
          <button mat-button color="primary" (click)="showSignInDialog()">
            Sign in
            <span matTooltipPosition="above" matTooltip="Login with OAuth authenticators"></span>
          </button>
        </div>
        <div *ngIf="isUserSignedIn">
          <span>{{userProfile.displayName}}</span>
          <button mat-button color="primary" (click)="signOut()">sign out
            <span matTooltipPosition="above"
                  [matTooltip]="userProfile.displayName + userProfile.email ? (' : ' + userProfile.email) : ''"></span>
          </button>
        </div>
        <div *ngIf="loginError">{{loginError.message}}</div>
      </div>
    </mat-toolbar>
  `,
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  userProfile: UserProfile = {};
  isUserSignedIn = false;
  @Input()
  isFirebaseEnabled = false;
  loginError: any = null;
  constructor(private loginService: LoginService,
              private iconRegistry: MatIconRegistry,
              private sanitizer: DomSanitizer) {
    this.iconRegistry.addSvgIcon('home',
      this.sanitizer.bypassSecurityTrustResourceUrl('../../assets/images/lhncbc.svg'));
  }

  ngOnInit(): void {
    this.loginService.service().subscribe((loginEvent) => {
      if (loginEvent.event === 'signedIn') {
        this.userProfile = loginEvent.userProfile;
        this.isUserSignedIn = true;
      } else if (loginEvent.event === 'signedOut') {
        this.userProfile = {};
        this.isUserSignedIn = false;
      }
    });
  }

  signOut() {
    this.loginService.logOut(this.userProfile);
  }

  showSignInDialog() {

  }

}
