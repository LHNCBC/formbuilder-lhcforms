import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionContainerComponent } from './extension-container.component';

describe('ExtensionContainerComponent', () => {
  let component: ExtensionContainerComponent;
  let fixture: ComponentFixture<ExtensionContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtensionContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
