import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { FormService } from '../../../services/form.service';
import {NgbCollapseModule, NgbModal, NgbModalOptions, NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {TableComponent} from '../table/table.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import {ISchema} from "@lhncbc/ngx-schema-form";
import { EXTENSION_URL_VARIABLE, EXTENSION_URL_CUSTOM_VARIABLE_TYPE } from '../../constants/constants';
import {CommonModule, NgClass} from "@angular/common";
import {BooleanControlledComponent} from "../boolean-controlled/boolean-controlled.component";
import {LabelComponent} from "../label/label.component";
import {TitleComponent} from "../title/title.component";
import {FaIconComponent, FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatTooltipModule} from "@angular/material/tooltip";
import {Util} from "../../util";

@Component({
  selector: 'lfb-variable',
  imports: [FormsModule, ReactiveFormsModule, MatTooltipModule, NgbCollapseModule, NgbPopoverModule, CommonModule, BooleanControlledComponent, LabelComponent, TitleComponent, FontAwesomeModule],
  templateUrl: './variable.component.html',
  styleUrl: './variable.component.css'
})
export class VariableComponent extends TableComponent implements OnInit {
  private formService = inject(FormService);
  private modalService = inject(NgbModal);
  cdr = inject(ChangeDetectorRef);
  private modelService = inject(SharedObjectService);
  private extensionsService = inject(ExtensionsService);

  questionnaire = null;
  faAdd = faPlusCircle;
  private variableTypeMapping = {
    "expression": "FHIRPath Expression",
    "query": "FHIR Query",
    "queryObservation": "FHIR Query (Observation)",
    "question": "Question",
    "simple" : "Easy Path Expression"
  };

  extensionSchema: ISchema;

  ngOnInit(): void {
    this.extensionSchema = this.formService.getExtensionSchema();
    super.ngOnInit();
    const sub = this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });
    this.subscriptions.push(sub);
  }

  /**
   * Locate the custom extension 'variable type' and return the mapping variable type.
   * @param extensions - Item's extension.
   */
  getVariableType(extensions: any): string {
    const match = extensions.find((ext) => ext.url === EXTENSION_URL_CUSTOM_VARIABLE_TYPE);
    return this.variableTypeMapping[match?.valueString] ?? "";
  }

  /**
   * Get extension
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractVariableExtensions(items, linkId): fhir.Extension []|null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        const variableExtensions = item.extension.filter(ext => ext.url === EXTENSION_URL_VARIABLE);
        if (variableExtensions.length > 0) {
          return variableExtensions;
        }
      } else if (item.item) {
        const extension = this.extractVariableExtensions(item.item, linkId);
        if (extension !== null) {
          return extension;
        }
      }
    }

    return null;
  }

  /**
   * Retrieves variable header description or data.
   * @param parentProperty - header schema or data object.
   * @param propertyId - field to display.
   * @param isHeader - indicates whether to return header description or data.
   */
  getVariableProperty(parentProperty: any, propertyId: string, isHeader: boolean): string {
    const path = propertyId.split('.');
    let p = parentProperty;
    for (const id of path) {
      p = (!isHeader && id === 'extension') ? this.getVariableType(p[id]) : p[id];
    }

    return (isHeader) ? p.description : p;
  }

  /**
   * Retrieves a list of variable fields structure.
   * @param isHeader - indicates whether to return header fields or data fields.
   * @returns - A list of header or data fields structure.
   */
  getVariableFieldsStructure(isHeader: boolean): any [] {
    let ret: any [] = [];
    if (this.formProperty.schema.widget) {
      if (isHeader) {
        return this.formProperty.schema.widget.showHeaderFields;
      } else {
        return this.formProperty.schema.widget.showDataFields;
      }
    }
    return ret;
  }

  /**
   * Filter out empty variables.
   * @returns - Array of non-empty variables or an empty array.
   */
  get nonEmptyVariables(): fhir.Extension [] {
    return (this.formProperty.value ?? []).filter(v => v && (
      (Array.isArray(v.extension) && v.extension.length > 0) ||
      (v.valueExpression &&
        'name' in v.valueExpression &&
        'language' in v.valueExpression &&
        'expression' in v.valueExpression)
    ));
  }

  /**
   * Open the Expression Editor as a modal to create or edit variables.
   */
  editVariables(): void {
    const modalConfig: NgbModalOptions = {
      size: 'lg',
      fullscreen: 'lg'
    };

    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);
    const linkId = this.formProperty.findRoot().getProperty('linkId')?.value ?? '';
    modalRef.componentInstance.linkId = linkId;
    modalRef.componentInstance.expressionUri = this.schema.widget.expressionUri;
    modalRef.componentInstance.questionnaire = this.questionnaire;
    modalRef.componentInstance.display = this.schema.widget.displayExpressionEditorSections;
    modalRef.componentInstance.expressionLabel = this.schema.widget.expressionLabel;
    modalRef.result.then((result) => {
      // Result returning from the Rule Editor is the whole questionnaire.
      // Rule Editor returns false in the case changes were cancelled.
      if (result) {
        let resultExtensions;
        if (linkId) {
          resultExtensions = Util.getExtensionsByLinkId(result.item, linkId);
        } else {
          resultExtensions = result.extension;
        }
        let variableExts = resultExtensions.filter((ext) => {
          if(!ext || !ext.valueExpression?.expression) {
            return false;
          }

          const ret = ext.url === EXTENSION_URL_VARIABLE;
          if(ret) {
            this.extensionsService.updateExtension(ext);
          }
          return ret;
        });

        // Result coming back from the Expression Editor may also contain launchContext.  We do want
        // to save those extensions, but want to filter out from the variables.
        this.extensionsService.replaceExtensions(EXTENSION_URL_VARIABLE, variableExts);

        this.formProperty.setValue(variableExts, false);
        this.cdr.detectChanges();
      }
    }).catch((error) => {
      console.log(`variable.component.ts: editVariables() modalRef.result.then().catch() ${error.message}`);
    });
  }

  /**
   * Delete a variable from the array via index.
   * @param index - Index of the variable to be removed from the array.
   */
  deleteVariable(index: number) {
    this.extensionsService.removeExtensionByUrlAtIndex(EXTENSION_URL_VARIABLE, index);
    const variablesExtension = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE) ?? [];
    this.formProperty.setValue(variablesExtension, false);
    this.cdr.markForCheck();
  }


  /**
   * Generate track for @for loop.
   * @param variableExt -
   * @param index
   */
  getVariableTrackParam(variableExt: fhir.Extension, index: number ) {
    let ret: string;

    if(variableExt) {
      if(variableExt.valueExpression) {
        ret = variableExt.url+variableExt.valueExpression?.name+variableExt.valueExpression?.expression;
      }
      else if(variableExt.extension) {
        ret = variableExt.url + this.getVariableTrackParam(variableExt.extension[0], 0);
      }
    }
    else {
      ret = index.toString();
    }
    return ret;
  }
}
