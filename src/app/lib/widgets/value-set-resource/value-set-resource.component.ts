import {
  inject,
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import {
  FormProperty,
  ISchema,
  PropertyGroup,
  SchemaFormModule
} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';

import { FormService } from '../../../services/form.service';
import {ExtensionsService} from "../../../services/extensions.service";
import {SharedObjectService} from "../../../services/shared-object.service";
import {TableService} from "../../../services/table.service";

@Component({
  selector: 'lfb-value-set-resource',
  imports: [SchemaFormModule],
  templateUrl: './value-set-resource.component.html',
  styleUrl: './value-set-resource.component.css',
  providers: [ExtensionsService, TableService]
})
export class ValueSetResourceComponent implements OnInit {

  notification = '';
  @Input()
  model: fhir.ValueSet;
  @Input()
  schema: ISchema;
  @Input()
  indexInContained?: number;
  @Output()
  valueSetChanged = new EventEmitter<fhir.ValueSet>();
  errors: any[] = [];
  _emptyId = true;

  /**
   * Validators for the ValueSet resource.
   */
  vsValidators = {
    /**
     * Validate the id of the ValueSet resource.
     *   The schema's pattern validations are handled in the id's StringComponent.
     *   Here validate against duplicate ids used in other
     *   resources.
     * @param value - The value of the id field.
     * @param formProperty - The FormProperty object for the id field.
     */
    '/id': (value: string, formProperty: FormProperty) => {
      let ret: any = null;
      const id = value?.trim();
      const q = this.sharedService.questionnaire;
      const index = q.contained?.findIndex((contained, index) => {
        return contained.id === id && index !== this.indexInContained;
      });
      if (index !== undefined && index >= 0) {
        ret = [{
          code: 'DUPLICATE_ID',
          message: 'Id must be unique.',
          path: `#${formProperty.path}`,
          params: [index, value]
        }];
      }
      return ret;
    }
  };

  formService: FormService = inject(FormService);
  sharedService: SharedObjectService = inject(SharedObjectService);

  /**
   * OnInit lifecycle hook.
   */
  ngOnInit(): void {
    this.model = this.model || {resourceType: 'ValueSet'} as fhir.ValueSet;
    this.model.status = this.model.status || 'draft';
  }

  /**
   * Handle the value set change event.
   * @param event
   */
  onValueSetChanged(event) {
    this._emptyId = !event.value?.id?.trim().length;
    if(event.value.expansion) {
      event.value.expansion.timestamp = new Date().toISOString();
    }
    this.valueSetChanged.emit(event.value);
  }

  /**
   * Handle the errors changed event.
   * @param event
   */
  onErrorsChanged(event: { value: any[] }) {
    if(event.value && event.value.length) {
      this.errors = event.value;
    }
    else {
      this.errors = [];
    }
  }

  /**
   *
   */
  get emptyId(): boolean {
    return this._emptyId;
  }

  /**
   * Check for errors
   * @return {boolean} - Returns true if there are errors, false otherwise.
   */
  hasErrors(): boolean {
    return !!this.errors?.length;
  }
}
