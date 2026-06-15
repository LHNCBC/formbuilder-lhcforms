import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {SchemaFormModule, TemplateSchemaModule} from "@lhncbc/ngx-schema-form";
import fhir from "fhir/r4";
import {FormsModule} from "@angular/forms";

import {FormService} from '../../../services/form.service';
import {TableService} from "../../../services/table.service";

/**
 * A component to edit a FHIR Identifier object.
 */
@Component({
  standalone: true,
  selector: 'lfb-identifier-obj',
  imports: [
    TemplateSchemaModule,
    FormsModule,
    SchemaFormModule
  ],
  templateUrl: './identifier-obj.component.html',
  providers: [TableService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentifierObjComponent {

  formService = inject(FormService);

  @Output() changed = new EventEmitter<fhir.Identifier>();
  @Input() model!: fhir.Identifier;

  identifierSchema = this.formService.cloneIdentifierSchema();

  /**
   * Handle changes to the <sf-form>.
   *
   * @param value - Updated identifier model emitted by the schema form.
   */
  handleChange(value: fhir.Identifier) {
    this.changed.emit(value);
  }
}
