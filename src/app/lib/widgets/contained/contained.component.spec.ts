import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainedComponent } from './contained.component';

describe('ContainedComponent', () => {
  let component: ContainedComponent;
  let fixture: ComponentFixture<ContainedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContainedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
