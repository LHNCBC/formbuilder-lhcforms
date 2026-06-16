import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageDlgComponent, MessageType } from './message-dlg.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

describe('MessageDlgComponent', () => {
  let component: MessageDlgComponent;
  let fixture: ComponentFixture<MessageDlgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageDlgComponent ],
      providers: [NgbActiveModal]
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

  it('should use the message type from options', () => {
    component.options = {
      title: 'Compatibility warning',
      message: 'Some subject types are not valid.',
      type: MessageType.WARNING
    };

    component.ngOnInit();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.modal-header');
    expect(component.type).toBe(MessageType.WARNING);
    expect(header.classList).toContain('bg-warning');
    expect(header.classList).not.toContain('bg-primary');
  });
});
