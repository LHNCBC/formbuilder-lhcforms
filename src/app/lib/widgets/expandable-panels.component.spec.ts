import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandablePanelsComponent } from './expandable-panels.component';

describe('ExpandablePanelsComponent', () => {
  let component: ExpandablePanelsComponent;
  let fixture: ComponentFixture<ExpandablePanelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpandablePanelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandablePanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
