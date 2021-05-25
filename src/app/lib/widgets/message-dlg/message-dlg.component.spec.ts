import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageDlgComponent } from './message-dlg.component';

describe('MessageDlgComponent', () => {
  let component: MessageDlgComponent;
  let fixture: ComponentFixture<MessageDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
