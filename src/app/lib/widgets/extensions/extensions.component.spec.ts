import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionsComponent } from './extensions.component';

describe('ExtensionsComponent', () => {
  let component: ExtensionsComponent;
  let fixture: ComponentFixture<ExtensionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtensionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
