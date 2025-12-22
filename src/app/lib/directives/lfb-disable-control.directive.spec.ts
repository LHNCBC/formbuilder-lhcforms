import { LfbDisableControlDirective } from './lfb-disable-control.directive';
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {Component, DebugElement} from "@angular/core";
import {By} from "@angular/platform-browser";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  template: `<input [lfbDisableControl]="isDisabled" [formControl]="control" />`,
  imports: [LfbDisableControlDirective, ReactiveFormsModule]
})
class TestHostComponent {
  isDisabled = true;
  control = new FormControl();
}

describe('LfbDisableControlDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FormsModule, ReactiveFormsModule],
      // providers: [NgControl]
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    debugElement = fixture.debugElement.query(By.directive(LfbDisableControlDirective));
    component = fixture.componentInstance;
  });

  it('should create an instance', () => {
    fixture.detectChanges();
    expect(debugElement.nativeElement.disabled).toBe(true);
    fixture.componentInstance.isDisabled = false;
    fixture.detectChanges();
    expect(debugElement.nativeElement.disabled).toBe(false);
    fixture.componentInstance.isDisabled = true;
    fixture.detectChanges();
    expect(debugElement.nativeElement.disabled).toBe(true);
  });
});
