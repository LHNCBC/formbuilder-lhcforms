import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpTextComponent } from './help-text.component';

xdescribe('HelpTextComponent', () => {
  let component: HelpTextComponent;
  let fixture: ComponentFixture<HelpTextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HelpTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
