import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleComponent } from './title.component';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';

describe('TitleComponent', () => {
  let component: TitleComponent;
  let fixture: ComponentFixture<TitleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleComponent ],
      imports: [
        MatIconModule,
        MatIconTestingModule,
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
