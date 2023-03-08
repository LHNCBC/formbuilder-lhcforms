import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ExtensionsService} from '../../../services/extensions.service';

import { TerminologyServerComponent } from './terminology-server.component';

xdescribe('TerminologyServerComponent', () => {
  let component: TerminologyServerComponent;
  let fixture: ComponentFixture<TerminologyServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ExtensionsService],
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
