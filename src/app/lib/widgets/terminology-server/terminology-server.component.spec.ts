import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminologyServerComponent } from './terminology-server.component';

describe('TerminologyServerComponent', () => {
  let component: TerminologyServerComponent;
  let fixture: ComponentFixture<TerminologyServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TerminologyServerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminologyServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
