import { Component, OnInit, Input } from '@angular/core';
import { LoginService, UserProfile } from '../services/login.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import appVersion from '../../assets/version.json';


@Component({
  standalone: false,
  selector: 'lfb-header',
  template: `
    <nav id="header" class="ps-0 pe-0 d-flex">
      <mat-icon id="logo" svgIcon="home" aria-label="Home"></mat-icon>
      <div id="siteNameBox" class="d-flex flex-column align-self-baseline ps-2">
        <div class="fs-4"><a class="btn btn-link p-0" id="siteName" href="/">NLM Form Builder</a></div>
        <div class="fs-6">A tool for building HL7<sup>®</sup> FHIR<sup>®</sup> Questionnaires</div>

      </div>
      <div *ngIf="appVersion" class="float-lg-right version-info align-self-end fw-bold pb-1"
        >Version: <a target="_blank" rel="noopener noreferrer"
                     href="https://github.com/lhncbc/formbuilder-lhcforms/blob/master/CHANGELOG.md">{{appVersion}}</a></div>
      <div class="float-lg-right" *ngIf="isFirebaseEnabled">
        <div *ngIf="!isUserSignedIn">
          <button class="btn btn-sm btn-primary" (click)="showSignInDialog()">
            <button class="btn border-0 m-0 p-0" matTooltip="Login with OAuth authenticators">Sign in</button>
          </button>
        </div>
        <div *ngIf="isUserSignedIn">
          <span>{{userProfile.displayName}}</span>
          <button class="btn btn-sm btn-primary" (click)="signOut()">
            <button class="btn border-0 m-0 p-0"
                  [ngbTooltip]="userProfile.displayName + userProfile.email ? (' : ' + userProfile.email) : ''">Sign out</button>
          </button>
        </div>
        <div *ngIf="loginError">{{loginError.message}}</div>
      </div>
</nav>
  `,
  styles: [`
    #header {
      /* margin-bottom: 20px; */
      position: relative;
      /* font-size: 12px;*/
      font-family: 'Droid Sans', Arial, Helvetica, sans-serif;
      color: #202020;
      border-top: 2px solid #0BACB6;
      border-bottom: 7px solid #17b4e3;
      /*line-height: normal;*/
      height: 84px;
      background: transparent;
      align-items: center;
    }

    #header a {
      color: #1E4193;
      text-decoration: none;
    }

    #logo {
      float: left;
      width: 72px;
      height: 72px;
    }

    #logo {
      display: block;
    }

    #logo .site-name-slogan {
      font-size: 14px;
      position: relative;
      top: 10px;
      left: -2px;
    }

    #logo .site-name-slogan span {
      display: block;
      font-size: 24px;
      position: relative;
      left: -2px;
    }

    #logo .site-name-slogan .slogan {
      color: #202020;
      font-size: 12px;
      position: relative;
      left: 1px;
    }

    #siteNameBox {
      flex: 1 1 auto;
    }

    #siteName {
      font-size: 125%;
    }

    .version-info {
    }

    .version-info a:hover {
      text-decoration: underline !important;
    }
  `]
})
export class HeaderComponent implements OnInit {

  userProfile: UserProfile = {};
  isUserSignedIn = false;
  @Input()
  isFirebaseEnabled = false;
  loginError: any = null;
  appVersion: string;
  constructor(private loginService: LoginService,
              private iconRegistry: MatIconRegistry,
              private sanitizer: DomSanitizer) {
    // Register our icon(s)
    this.iconRegistry.addSvgIcon('home',
      this.sanitizer.bypassSecurityTrustResourceUrl('../../assets/images/projectLogo.svg'));
  }


  /**
   * Initialize login service
   */
  ngOnInit(): void {
    if(appVersion?.version) {
      this.appVersion = appVersion.version;
    }
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


  /**
   * Logout
   */
  signOut() {
    this.loginService.logOut(this.userProfile);
  }

  showSignInDialog() {

  }

}
