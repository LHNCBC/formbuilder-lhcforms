import {
  AfterViewChecked,
  Component,
  DoCheck,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Util} from '../../util';
import {FormProperty, ObjectProperty, PropertyGroup} from '@lhncbc/ngx-schema-form';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import { FormService } from 'src/app/services/form.service';
import { debounceTime, map } from 'rxjs/operators';

type ErrorItem = {
  code: string;
  originalMessage: string;
  modifiedMessage: string;
};

type EwErrors = {
  [key: string]: ErrorItem[];
};

@Component({
  standalone: false,
  selector: 'lfb-enable-when',
  templateUrl: './enable-when.component.html',
  styleUrls: ['../table/table.component.css', './enable-when.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EnableWhenComponent extends TableComponent implements OnInit, DoCheck, AfterViewChecked, OnDestroy {

  showFieldNames: string[] = ['question', 'operator', 'answerString'];
  showHeaderFields: any[];
  warningIcon = faExclamationTriangle;

  private viewChecked$ = new Subject<void>();
  awaitingValidation: boolean;
  enableWhenErrors: EwErrors [] = [];
  public Object = Object;

  modifiedMessages = {
    PATTERN: [
      {
        pattern: "^[A-Za-z0-9\\-\\.]{1,64}$",
        message: 'Only alphanumeric, hyphen and period characters are allowed in this field. Make sure any white space characters are not used.'
      }, // id
      {
        pattern: '^\\S*$',
        message: 'Spaces and other whitespace characters are not allowed in this field.'
      }, // uri
      {
        pattern: '^[^\\s]+(\\s[^\\s]+)*$',
        message: 'Spaces are not allowed at the beginning or end.'
      },       // code
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$',
        message: 'Valid format is yyyy-MM-dd.'
      }, // Date
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$',
        message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
      } // Datetime
    ],
    MIN_LENGTH: null,
    MAX_LENGTH: null
  }

  private enableWhenReeval$ = new BehaviorSubject<void>(undefined);

  constructor(private formService: FormService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();

    this.awaitingValidation = true;

    const definedShowFields = this.formProperty.schema.widget.showFields;
    this.showHeaderFields = this.showFieldNames.map((fName) => {

      const schemaDef = definedShowFields.find((f) => {
        return f.field === fName;
      })
      if(schemaDef) {
        schemaDef.description = this.formProperty.schema.items.properties[fName].description;
      }
      return schemaDef;
    });

    // 'viewChecked$' is a Subject that emits events after the 'ngAfterViewChecked' lifecycle
    // hook is called. This Subject incorporates a 'debounceTime' which delays the emission of
    // the last update event. This is meant to minimizing rapid updates and to wait until the
    // last validation is completed before the screen reader cna read the message.
    this.viewChecked$
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.awaitingValidation = false;
        this.cdr.detectChanges();
      });
  }

  ngDoCheck() {
    if(this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }

  /**
   * Call after the view and its child views has been checked
   * by the change detection mechanism. The lifecycle hook is
   * triggered whenever Angular completes a change detection
   * cycle involving a view.
   *
   * The 'viewChecked$' Subject emits each time this function
   * is called.
   */
  ngAfterViewChecked() {
    this.viewChecked$.next();
  }

  get rowProperties(): ObjectProperty [] {
    return this.formProperty.properties as ObjectProperty[];
  }


  /**
   * Whether to display the field in the cell
   * @param singleEnableWhenProperty - FormProperty representing an enableWhen condition.
   * @param fieldName - One of the field name from enableWhen object.
   *
   * @return boolean
   */
  isShow(singleEnableWhenProperty: PropertyGroup, fieldName: string): boolean {
    let show = false;
    if(fieldName === 'question') {
      show = true;
    }
    else if(fieldName === 'operator') {
      const q = singleEnableWhenProperty.getProperty('question').value;
      show = !!q;
    }
    else if(Util.isAnswerField(fieldName)) {
      const op = singleEnableWhenProperty.getProperty('operator').value;
      show = !!op && op !== 'exists';
    }
    return show;
  }


  /**
   * Check validity of enableWhen fields. question, operator and answer[x] are mandatory.
   * Question implies presence of enableWhen. Highlight other missing fields.
   * @param rowProperty - FormProperty representing a single condition (row).
   * @param field - Property id of the field.
   * @returns - True if there are no errors, otherwise false.
   */
  isValid(rowProperty: ObjectProperty, field: string): boolean {
    const prop = rowProperty.getProperty(field);
    const enableWhenErrorPrefix = "ENABLEWHEN";
    const ret = prop._errors?.some((err) => {
      return err.code?.startsWith(enableWhenErrorPrefix) || err.code?.startsWith("PATTERN");
    });
    return !ret;
  }

  /**
   * Loop through each of the 'EnableWhen' fields and return any errors.
   * @param rowProperty - Object property representing an enableWhen condition.
   * @returns - observable that emits a string created by joining the 'errorMessage' array.
   */
  getEnableWhenFieldErrors(rowIndex: number, rowProperty: ObjectProperty, fieldProperty: any []): Observable<string> {
    this.enableWhenErrors[rowIndex] = {};
    let errorMessages: string[] = [];
    const fields = fieldProperty.map(f => f.field);

    for (const field of fields) {

      const fieldProperty = rowProperty.getProperty(field);
      const fieldValue = fieldProperty?.value;
      const errors = this.getFieldErrors(fieldProperty);

      if (errors) {
        errorMessages.push(...errors);
        break;
      }
    }
    return of(errorMessages.length ? errorMessages.join() : null);
  }

  createErrorObject(errors: any): {code: string, originalMessage: string, modifiedMessage: string} [] | null {
    let errorObjects;
    if (errors?.length) {
      errorObjects = Object.values(errors)
        .filter(e => e['path'].startsWith('#/enableWhen') || e['path'].startsWith('#enableWhen') )
        .map((e: any) => {
          const modMessage = this.modifiedMessages[e.code]
                                 .filter(m => m.pattern === e.params[0])
                                 .map(m => m.message);
          let ret = {code: e.code, originalMessage: e.message, modifiedMessage: modMessage[0]};
          return ret;
        });
    }
    return errorObjects;
  }


  /**
   * Collect enablewhen related errors from the field.
   * @param fieldProperty - FormProperty representing the field.
   */
  getFieldErrors(fieldProperty: FormProperty): string[] {
    const messages = fieldProperty?._errors?.reduce((acc, error) => {
      if (error.path.startsWith('#/enableWhen') || error.path.startsWith('#enableWhen')) {
        const modMessage = this.modifiedMessages[error.code]?.filter(m => m.pattern === error.params[0])
          .map(m => m.message) ?? [];
        const message = (modMessage.length > 0) ? modMessage[0] : error.message;
        if (!acc.includes(message)) {
          acc.push(message);
        }
      }
      return acc;
    }, []);
    return messages?.length ? messages : null;
  }

  /**
   * Get fields to show.
   */
  getFields(rowFormProperty: ObjectProperty): any[] {
    let ret: any[] = [];
    const answerType = rowFormProperty.getProperty('__$answerType').value;
    ret = this.formProperty.schema.widget.showFields.filter((f) => {
      return this.includeField(answerType, f.field);
    });
    return ret;
  }


  /**
   * Match data type of the source to answer[x] field.
   *
   * @param answerType - Type of the source item.
   * @param answerField - One of the answer[x].
   */
  includeField(answerType: string, answerField: string): boolean {
    // Assume answerType empty for answerString field.
    const ret: boolean = !answerType && answerField === 'answerString';
    return ret || !Util.isAnswerField(answerField) || Util.getAnswerFieldName(answerType) === answerField;
  }

  /**
   * Handle error identified by the table cell co-ordinates.
   * @param rowIndex - tr index of the table
   * @param colIndex - td index of tr
   * @param fieldProperty - Form property of the identified field.
   */
  onError(rowIndex: number, colIndex: number, fieldProperty: FormProperty) {
    const errorMessages = this.getFieldErrors(fieldProperty);
    // Set dom attributes after the UI is updated.
    setTimeout(() => {
      this.setErrorState(!!errorMessages, rowIndex, colIndex);
    });
  }


  /**
   * Set or remove error related attributes of the field control.
   * @param isError - Indicates wether to add or remove the attributes.
   * @param rowIndex - Identify the row
   * @param colIndex - Identify the cell.
   */
  setErrorState(isError: boolean, rowIndex: number, colIndex: number) {
    const cell = this.elementRef.nativeElement.querySelector(`tbody tr:nth-child(${rowIndex+1}) td:nth-child(${colIndex+1})`);
    const el = cell.querySelector('input,textarea,select');
    if(el) {
      const errEl = cell.nextElementSibling.querySelector('button.answerXErrors');
      if(isError) {
        this.renderer.setAttribute(el,'aria-invalid','true');
        this.renderer.setAttribute(el,'aria-errormessage', errEl ? errEl.getAttribute('id') : null);
      }
      else {
        this.renderer.removeAttribute(el,'aria-invalid');
        this.renderer.removeAttribute(el,'aria-errormessage');
      }
    }
  }

  /**
   * Overriding parent method.
   *
   * Call the parent class method to delete the enableWhen condition. This method overrides
   * the inherited parent method, originally derived from the 'sf-form' library.
   *
   * Once the enableWhen condition is deleted, remove its associated error (if present)
   * from the TreeNodeStatusMap, and adjust the indexes of other enableWhen errors as needed.
   *
   * @param index - The row represented by its form property.
   */
  removeProperty(index: number) {
    super.removeProperty(index);
    const treeNodeId = this.formProperty.searchProperty(FormService.TREE_NODE_ID).value;
    this.formService.deleteErrorAndAdjustEnableWhenIndexes(treeNodeId, index);
  }

  /**
   * Generates an accessible error message for screen reader users, providing additional
   * information about the row index where the error occurs.
   * @param errorMessage - error message string for the enableWhen condition.
   * @param rowIndex - a number indicating the specific row of the enableWhen condition
   *                   where the error occurs.
   */
  composeAccessibleErrorMessage(errorMessage: string, rowIndex: number): string {
    return `${errorMessage.slice(0, -1)} for enableWhen condition ${rowIndex + 1}.`;
  }

  /**
   * Implement OnDestroy
   */
  ngOnDestroy() {
    this.viewChecked$.complete();
  }
}
