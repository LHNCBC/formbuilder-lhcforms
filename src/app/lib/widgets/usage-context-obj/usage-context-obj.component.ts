import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FormComponent, PropertyGroup, SchemaFormModule, TemplateSchemaModule} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';
import {TableService} from '../../../services/table.service';

/**
 * A component to edit a FHIR UsageContext object.
 */
@Component({
  standalone: true,
  selector: 'lfb-usage-context-obj',
  imports: [
    TemplateSchemaModule,
    FormsModule,
    SchemaFormModule
  ],
  templateUrl: './usage-context-obj.component.html',
  providers: [TableService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsageContextObjComponent implements AfterViewInit {
  formService = inject(FormService);

  @ViewChild('sfForm', {read: FormComponent}) sfForm: FormComponent;
  @Output() changed = new EventEmitter<any>();
  @Output() validityChanged = new EventEmitter<boolean>();
  @Input() model!: any;

  usageContextSchema = this.formService.cloneUsageContextSchema();
  sfFormRootProperty: PropertyGroup;

  /**
   * Capture the schema-form root property after the form is initialized.
   */
  ngAfterViewInit() {
    this.sfFormRootProperty = this.sfForm.rootProperty as PropertyGroup;
  }

  /**
   * Handle changes to the <sf-form>.
   *
   * @param value - Updated UsageContext model emitted by the schema form.
   */
  handleChange(value: any) {
    this.changed.emit(value);
  }

  /**
   * Forward schema-form validity changes to the dialog.
   *
   * @param valid - True when the complete UsageContext schema form is valid.
   */
  handleValidityChange(valid: boolean) {
    this.validityChanged.emit(valid);
  }
}
