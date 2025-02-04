/**
 * An input box for enableWhen's source to search eligible source items listed in the tree.
 */
import {Component, OnInit, ViewChild} from '@angular/core';
import {merge, Observable, Subject} from 'rxjs';
import {FormService} from '../../../services/form.service';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {Util} from '../../util';
@Component({
  standalone: false,
  selector: 'lfb-choice',
  template: `
    <ng-template #rt let-r="result" let-t="term">
      <ngb-highlight [result]="r.name" [term]="t"></ngb-highlight>
    </ng-template>
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">

      <lfb-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"></lfb-label>
      <input *ngIf="schema.type !== 'array'"
             name="{{name}}"
             [attr.id]="id"
             [attr.disabled]="schema.readOnly ? '' : null"
             type="text"
             [(ngModel)]="model"
             [ngbTypeahead]="search"
             [editable]="false"
             [inputFormatter]="inputFormatter"
             [resultFormatter]="resultListItemFormatter"
             class="form-control"
             (focus)="focus$.next($any($event).target.value)"
             (click)="click$.next($any($event).target.value)"
             (change)="validateQuestion()"
             (selectItem)="onSelect($event)"
             #instance="ngbTypeahead"
             popupClass="add-scrolling"
      >

      <input *ngIf="schema.readOnly" name="{{name}}" type="hidden" [formControl]="control">
    </div>
  `,
  styles: [
  ]
})
export class EnableWhenSourceComponent extends LfbControlWidgetComponent implements OnInit {
  // Info icon.
  faInfo = faInfoCircle;
  nolabel = false;
  model: ITreeNode;

  sources: ITreeNode [];

  @ViewChild('instance') instance: NgbTypeahead;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  /**
   * Search through text of the source items, with input string. For empty term, show  all items.
   *
   * @param input$ - Observation for input string.
   */
  search = (input$: Observable<string>): Observable<ITreeNode []> => {
    const debouncedText$ = input$.pipe(debounceTime(100), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => (term === '' ? this.sources
        : this.sources.filter(el => el.data.text.toLowerCase().indexOf(term.toLowerCase()) > -1)))
    );
  };


  /**
   * Invoke super class constructor.
   *
   * @param formService - Service to help with collection of sources
   */
  constructor(private formService: FormService) {
    super();
  }


  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.sources = this.formService.getSourcesExcludingFocusedTree();
    const value = this.formProperty.value; // Source is already assigned for this item.
    if (this.sources && this.sources.length > 0 && value) {
      const source = this.sources.find((el) => el.data.linkId === value);
      if (source) {
        this.model = source;
        this.formProperty.setValue(source.data.linkId, true);
        // Set answer type input
        this.formProperty.searchProperty('__$answerType').setValue(source.data.type, true);
      }
    } else if (value === "" && '__$answerType' in this.formProperty.parent.value) {
      this.validateQuestion();
    }
  }

  /**
   * Handle user selection event
   * @param $event - Source tree node object
   */
  onSelect($event): void {
    this.formProperty.setValue($event.item.data.linkId, true);
    this.formProperty.searchProperty('__$answerType').setValue($event.item.data.type, false);
  }


  /**
   * Format the input after selection
   * @param item - TreeNode object of the item.
   */
  inputFormatter(item: ITreeNode): string {
    let ret: string;
    if (item && item.data) {
      ret = Util.getIndexPath(item).join('.') + ' - ' + item.data.text;
    }
    return ret;
  }


  /**
   * Format item in the results popup.
   * @param item - TreeNode object of the item.
   */
  resultListItemFormatter(item: ITreeNode): string {
    let indent = '';
    let ret: string;
    if (item && item.data) {
      for (let i = 1; i < item.level; i++) {
        indent = indent + '  ';
      }
      ret = indent + Util.getIndexPath(item).join('.') + ' - ' + item.data.text;
    }
    return ret;
  }

  /**
   * Validates the state of a form property associated with a question model.
   * If 'this.model' is falsy, it sets 'this.model' to null. It clears the
   * current value of the form property by setting it to an empty string.
   * Finally, it triggers re-validation of the form property.
   */
  validateQuestion(): void {
    if (!this.model) {
      this.model = null;
      this.formProperty.setValue("", false);
      this.formProperty.updateValueAndValidity();

      // Aside from clearing the question, also clear the 'operator' and the answer.
      this.formProperty.parent.getProperty('operator').setValue('', false);

      const answerType = this.formProperty.parent.getProperty('__$answerType').value;

      if (answerType !== "choice" && answerType !== "open-choice") {
        const answerKeyName = Util.getAnswerFieldName(answerType);
        this.formProperty.parent.getProperty(answerKeyName).setValue('', false);
      }
    }
  }
}
