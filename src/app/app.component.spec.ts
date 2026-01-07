import {TestBed, ComponentFixture} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {CommonTestingModule} from './testing/common-testing.module';

describe('AppComponent', () => {

  CommonTestingModule.setUpTestBed(AppComponent);
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance;
  });

  describe('karma-lforms-loader probe', () => {
    it('loader file should be evaluated', () => {
      // proves the module tag ran at all
      // @ts-ignore
      expect(window.__karma__?.lformsLoaderProbe).toBe('evaluated');
    });

    it('loader should attempt to load LForms', () => {
      // @ts-ignore
      expect(window.__karma__?.lformsLoaderReady).toBeTrue();
    });
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it(`should have as title 'formbuilder-lhcforms'`, () => {
    expect(app.title).toEqual('formbuilder-lhcforms');
  });
});
