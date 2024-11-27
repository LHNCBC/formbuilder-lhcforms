import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatToolbarModule} from '@angular/material/toolbar';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ HeaderComponent ],
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatIconTestingModule,
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
