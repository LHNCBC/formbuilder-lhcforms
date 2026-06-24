import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { LfbObjectComponent } from './lfb-object.component';
describe('LfbObjectComponent', () => {
  let component: LfbObjectComponent;
  let fixture: ComponentFixture<LfbObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LfbObjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LfbObjectComponent);
    component = fixture.componentInstance;
    (component as any).control = {
      setErrors: () => {}
    };
    component.formProperty = {
      schema: {
        properties: {}
      },
      properties: {},
      valueChanges: new Subject(),
      errorsChanges: new Subject(),
      getProperty: () => null
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
