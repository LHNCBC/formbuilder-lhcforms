import { TestBed, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {CommonTestingModule} from './testing/common-testing.module';

describe('AppComponent', () => {

  CommonTestingModule.setUpTestBed(AppComponent);

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'formbuilder-lhcforms'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('formbuilder-lhcforms');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    const titleEl = compiled.querySelector('#resizableMiddle .container.card-body p');
    expect(titleEl.textContent)
      .toContain('How do you want to create your form?');
  });
});
