import {Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, merge, Observable, of, Subject} from 'rxjs';
import {FormService} from '../../services/form.service';
import {debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {ControlWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-choice',
  template: `
    <ng-template #rt let-r="result" let-t="term">
      <ngb-highlight [result]="r.name" [term]="t"></ngb-highlight>
    </ng-template>

      <app-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"></app-label>
      <input *ngIf="schema.type!='array'"
             [formControl]="control"
             [attr.name]="name"
             [attr.id]="id"
             [disabled]="schema.readOnly"
             [disableControl]="schema.readOnly"
             type="text"
             [(ngModel)]="model"
             [ngbTypeahead]="search"
             [editable]="false"
             [inputFormatter]="inputFormatter"
             [resultFormatter]="resultListItemFormatter"
             class="form-control"
             (focus)="focus$.next($any($event).target.value)"
             (click)="click$.next($any($event).target.value)"
             (selectItem)="onSelect($event)"
             #instance="ngbTypeahead"
      >

      <input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
  `,
  styles: [
  ]
})
export class ChoiceComponent extends ControlWidget implements OnInit {
  faInfo = faInfoCircle;
  nolabel = false;
  model: ITreeNode;

  sources: ITreeNode [];

  @ViewChild('instance') instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  search = (input$: Observable<string>): Observable<ITreeNode []> => {
    const debouncedText$ = input$.pipe(debounceTime(100), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => (term === '' ? this.sources
        : this.sources.filter(el => el.data.text.toLowerCase().indexOf(term.toLowerCase()) > -1)))
    );
  }


  constructor(private formService: FormService) {
    super();
  }

  ngOnInit(): void {
    this.sources = this.formService.getSourcesExcludingFocussedTree();
    const value = this.formProperty.value;
    if (this.sources && this.sources.length > 0 && value) {
      const source = this.sources.find((el) => el.data.linkId === value);
      if (source) {
        this.model = source;
        this.formProperty.setValue(source.data.linkId, true);
        this.formProperty.searchProperty('_answerType').setValue(source.data.type, true);
      }
    }
  }

  onSelect($event): void {
    this.formProperty.setValue($event.item.data.linkId, true);
    this.formProperty.searchProperty('_answerType').setValue($event.item.data.type, true);
  }

  inputFormatter(item: ITreeNode): string {
    let ret: string;
    if (item && item.data) {
      ret = item.data.text;
    }
    return ret;
  }

  resultListItemFormatter(item: ITreeNode): string {
    let indent = '';
    let ret: string;
    if (item && item.data) {
      for (let i = 1; i < item.level; i++) {
        indent = indent + '  ';
      }
      ret = indent + item.data.text;
    }
    return ret;
  }

}
