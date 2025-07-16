import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDlgComponent } from './resource-dlg.component';

xdescribe('ResourceDlgComponent', () => {
  let component: ResourceDlgComponent;
  let fixture: ComponentFixture<ResourceDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDlgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
