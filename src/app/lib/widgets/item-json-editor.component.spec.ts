import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemJsonEditorComponent } from './item-json-editor.component';

describe('ItemJsonEditorComponent', () => {
  let component: ItemJsonEditorComponent;
  let fixture: ComponentFixture<ItemJsonEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemJsonEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemJsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
