import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryFormatComponent } from './entry-format.component';

describe('EntryFormatComponent', () => {
  let component: EntryFormatComponent;
  let fixture: ComponentFixture<EntryFormatComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [EntryFormatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntryFormatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
