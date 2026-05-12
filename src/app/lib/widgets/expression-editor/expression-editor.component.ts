import {
  Directive,
  Input,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from 'src/app/services/extensions.service';
import {
  EXTENSION_URL_VARIABLE,
} from '../../constants/constants';
import {Util} from "../../util";
import {FormService} from "../../../services/form.service";

@Directive()
export abstract class ExpressionEditorComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  formService = inject(FormService);
  modalService = inject(NgbModal);
  cdr = inject(ChangeDetectorRef);
  modelService = inject(SharedObjectService);
  extensionsService = inject(ExtensionsService);

  @Input() model: any;
  @Input() exp: string;
  @Output() questionnaireChange = new EventEmitter<fhir4.Questionnaire>();

  elementId: string;
  // control is already declared in the base class.
  // control = new FormControl();
  questionnaire = null;
  private LANGUAGE_FHIRPATH = 'text/fhirpath';
  linkId: string;
  expression: string;
  expressionUri: string;
  itemId: number;
  faAdd = faPlusCircle;
  noTableLabel = false;
  extension: fhir.Extension;

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    let sub: Subscription;
    this.expressionUri = this.formProperty.schema.widget.expressionUri;
    this.init();
    sub = this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('id').valueChanges.subscribe((value) => {
      this.itemId = value;
    });
    this.subscriptions.push(sub);
    sub = this.formProperty.searchProperty('linkId').valueChanges.subscribe((value) => {
      this.linkId = value;
    });
    this.subscriptions.push(sub);
  };

  /**
   * Initialize
   */
  init() {
    this.noTableLabel = !!this.formProperty.schema.widget.noTableLabel;
    this.extension = this.formProperty.value?.valueExpression?.expression ? this.formProperty.value
      : {
        url: this.expressionUri,
        valueExpression: {
          expression: '',
          language: this.LANGUAGE_FHIRPATH
        }
      };
    this.extensionsService.updateExtension(this.extension);
    this.expression = this.extension.valueExpression?.expression || '';
  }

  /**
   * Open the Expression Editor widget to create/update variables and expression.
   */
  editExpression(): void {
    const modalConfig: NgbModalOptions = {
      size: 'lg',
      fullscreen: 'lg'
    };
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);
    modalRef.componentInstance.linkId = this.formProperty.searchProperty('/linkId').value;
    modalRef.componentInstance.expressionUri = this.extension.url;
    modalRef.componentInstance.questionnaire = this.questionnaire;
    modalRef.componentInstance.display = this.schema.widget.displayExpressionEditorSections;
    modalRef.componentInstance.expressionLabel = this.schema.widget.expressionLabel;
    modalRef.result.then((result) => {
      // Result returning from the Expression Editor is the whole questionnaire.
      // Expression Editor returns false in the case changes were cancelled.
      if (result) {
        let resultExtensions = Util.getExtensionsByLinkId(result.item, this.linkId);
        resultExtensions = (resultExtensions || []).filter((ext) => {
          if(!ext || !ext.valueExpression?.expression) {
            return false;
          }

          this.extensionsService.updateExtension(ext);
          if(ext.url === this.extension.url) {
            this.extension = ext;
            this.expression = ext.valueExpression?.expression || '';
          }
          return true;
        });
        this.extensionsService.extensionsProp.reset(resultExtensions, false);
        this.formProperty.setValue(this.extension, true);
        const variables = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE);

        this.cdr.detectChanges();

        this.formProperty.findRoot().getProperty('__$variable').setValue(variables, false);
      }
    }).catch((error) => {
      console.log(error.message);
    });
  }
}

