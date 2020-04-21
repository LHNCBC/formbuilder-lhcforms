import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementChooserComponent } from './element-chooser.component';

describe('ElementChooserComponent', () => {
  let component: ElementChooserComponent;
  let fixture: ComponentFixture<ElementChooserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElementChooserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ElementChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
