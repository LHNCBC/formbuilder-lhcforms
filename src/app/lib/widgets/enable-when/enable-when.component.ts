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
import {Observable, of, Subject} from 'rxjs';
import { FormService } from 'src/app/services/form.service';
import { debounceTime } from 'rxjs/operators';

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
      return err.code?.startsWith(enableWhenErrorPrefix);
    });
    return !ret;
  }

  /**
   * Loop through each of the 'EnableWhen' fields and return any errors.
   * @param rowProperty - Object property representing an enableWhen condition.
   * @returns - observable that emits a string created by joining the 'errorMessage' array.
   */
  getEnableWhenFieldErrors(rowProperty: ObjectProperty): Observable<string> {
    let errorMessages: string [] = [];
    const fields = ["question", "operator", "__$answerType"];

    for (const field of fields) {
      const fieldValue = rowProperty.getProperty(field)?.value;
      if (fieldValue || (!fieldValue && field === "question")) {
        const fieldName = (field === '__$answerType') ? Util.getAnswerFieldName(fieldValue) : field;
        const errors = this.getFieldErrors(rowProperty.getProperty(fieldName));

        if (errors) {
          errorMessages.push(...errors);
          break;
        }
      }
    }

    return of(errorMessages.length ? errorMessages.join() : null);
  }

  /**
   * Collect enablewhen related errors from the field.
   * @param fieldProperty - FormProperty representing the field.
   */
  getFieldErrors(fieldProperty: FormProperty): string [] {
    const messages = fieldProperty?._errors?.reduce((acc, error) => {
      if(error.code?.startsWith('ENABLEWHEN')) {
        acc.push(error.message);
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
