import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ValidatorRegistry
} from '@lhncbc/ngx-schema-form/lib/';

import {
  ZSchemaValidatorFactory
} from '@lhncbc/ngx-schema-form/lib/schemavalidatorfactory';
import { JEXLExpressionCompilerFactory } from '@lhncbc/ngx-schema-form/lib/expression-compiler-factory';
import {ISchema} from '@lhncbc/ngx-schema-form';
import { DefaultLogService } from '@lhncbc/ngx-schema-form';

import { HelpTextComponent } from './help-text.component';

xdescribe('HelpTextComponent', () => {
  let component: HelpTextComponent;
  let fixture: ComponentFixture<HelpTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
