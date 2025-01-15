import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationLinkPeriodComponent } from './observation-link-period.component';
import {ExtensionsService} from '../../../services/extensions.service';

xdescribe('ObservationLinkPeriodComponent', () => {
  let component: ObservationLinkPeriodComponent;
  let fixture: ComponentFixture<ObservationLinkPeriodComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExtensionsService],
      declarations: [ ObservationLinkPeriodComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservationLinkPeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
