import {ComponentFixture, TestBed} from '@angular/core/testing';

import { BasePageComponent } from './base-page.component';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('BasePageComponent', () => {
  let component: BasePageComponent;
  let fixture: ComponentFixture<BasePageComponent>;

  CommonTestingModule.setUpTestBed(BasePageComponent);
  beforeEach(() => {
    fixture = TestBed.createComponent(BasePageComponent);
    component = fixture.componentInstance;
    component.acceptedTermsOfUse = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    // @ts-ignore
    expect(component).toBeTruthy();
  });

  it('should render title', (done) => {
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      const titleEl = compiled.querySelector('#resizableMiddle .container.card .card-body p');
      expect(titleEl.textContent)
        .toContain('How do you want to create your form?');
      done();
    });
  });
});
