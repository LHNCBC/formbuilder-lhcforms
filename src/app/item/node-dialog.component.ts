import {ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, tap} from 'rxjs/operators';
import {NgbActiveModal, NgbTypeahead} from '@ng-bootstrap/ng-bootstrap';
import {ItemComponent} from './item.component';
import {Util} from '../lib/util';
import { ValidationService } from '../services/validation.service';

export type DialogMode = 'Move' | 'Insert' | 'Copy';

@Component({
  standalone: false,
  selector: 'lfb-node-dialog',
  template: `
    <div class="modal-header bg-primary">
      <h4 class="modal-title text-white" id="modal-move-title">{{title}}</h4>
      <button type="button" class="btn-close btn-close-white" aria-label="Close"
              (click)="activeModal.dismiss(false)"
              (keydown.enter)="activeModal.dismiss(false)"
      ></button>
    </div>
    <div class="modal-body">
      <form>
        <div class="form-group">
          <label for="moveTarget1" class="">Pick a target item to {{mode.toLocaleLowerCase()}} to:</label>
          <input
                 name="name"
                 id="moveTarget1"
                 type="text"
                 [(ngModel)]="targetNode"
                 [ngbTypeahead]="search"
                 [editable]="false"
                 [inputFormatter]="formatter"
                 [resultFormatter]="resultFormatter"
                 class="form-control"
                 (focus)="focus$.next($any($event).target.value)"
                 (click)="click$.next($any($event).target.value)"
                 #searchBox="ngbTypeahead"
                 popupClass="add-scrolling"
          >

          <p class="mt-4" id="dropLocationRadioGroupLabel">Specify drop location:</p>
          <ul class="list-unstyled ms-5" aria-labelledby="dropLocationRadioGroupLabel" role="radiogroup">
            <li>
              <label class="btn">
                <input value="AFTER" type="radio" [(ngModel)]="targetLocation" name="targetLocation" [ngModelOptions]="{standalone: true}">
                After the target item.
              </label>
            </li>
            <li>
              <label class="btn">
                <input value="BEFORE" type="radio" [(ngModel)]="targetLocation" name="targetLocation" [ngModelOptions]="{standalone: true}">
                Before the target item.
              </label>
            </li>
            <li>
              <label class="btn">
                <input value="CHILD" type="radio" [(ngModel)]="targetLocation" name="targetLocation" [ngModelOptions]="{standalone: true}">
                As a child of target item.
              </label>
            </li>
          </ul>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary"
              (keydown.enter)="activeModal.dismiss(false)"
              (click)="activeModal.dismiss(false)"
      >Cancel</button>
      <button type="button" class="btn btn-primary" [disabled]="!targetNode ? 'disabled' : null"
              (click)="activeModal.close({target: targetNode, location: targetLocation})"
              (keydown.enter)="activeModal.close({target: targetNode, location: targetLocation})"
      >{{mode}}
      </button>
    </div>
  `,
  styleUrls: ['./item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeDialogComponent implements OnInit {
  @ViewChild('searchBox') searchBox: NgbTypeahead;
  @Input()
  node: ITreeNode;
  @Input()
  item: ItemComponent;
  @Input()
  mode: DialogMode;

  targetNode: ITreeNode;
  targetLocation = 'AFTER';
  self: NodeDialogComponent;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  sources: ITreeNode[] = [];
  title: string;

  constructor(public activeModal: NgbActiveModal, private validationService: ValidationService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.self = this;
    this.item.treeComponent.treeModel.doForAll((node) => {
      if (this.node.id !== node.id || this.mode === 'Copy') {
        this.sources.push(node);
      }
    });
    this.title = `${this.mode} - ${this.resultFormatter(this.node)}`;
  }

  /**
   * Search through text of the source items, with input string. For empty term, show  all items.
   *
   * @param input$ - Observation for input string.
   */

  search = (input$: Observable<string>): Observable<ITreeNode []> => {
    const debouncedText$ = input$.pipe(debounceTime(100), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.searchBox.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => {
        return this.sources.filter(source =>
          (term === '' || source.data.text.toLowerCase().includes(term.toLowerCase())) &&
          (this.targetLocation !== 'CHILD' || source.data.type !== 'display')
        );
      })
    );
  };


  /**
   * Format item in the results popup.
   * @param item - TreeNode object of the item.
   */
  formatter(item: ITreeNode): string {
    return Util.formatNodeForDisplay(item);
  }

  resultFormatter(item: ITreeNode): string {
    return Util.truncateString(Util.formatNodeForDisplay(item), 50);
  }

  /**
   * Determines whether the "As a child of target item" option should be shown in the dialog.
   * The option is hidden if the target node is of type 'display' or if there are validation errors
   * that prevent child insertion (e.g., invalid enableWhen conditions).
   * If the option is not allowed and currently selected, it resets the selection to 'AFTER'.
   *
   * @returns {boolean} True if the child option can be shown; otherwise, false.
   */
  canDisplayChildOption(): boolean {

    if (this.targetNode?.data?.type === 'display') {
      // Reset it back to 'AFTER'
      if (this.targetLocation === 'CHILD') {
        setTimeout(() => {
            this.targetLocation = 'AFTER';
          this.cdr.markForCheck();
        });
      }
      return false;
    }

    const errors = this.validationService.validateEnableWhenAll({
      'value': this.targetNode?.data?.enableWhen,
      'id': this.targetNode?.data?.__$treeNodeId,
      'linkId': this.targetNode?.data?.linkId
    }, false, false);

    if (errors === null || (Array.isArray(errors) && errors.length === 0)) {
      return true;
    } else {
      // Reset it back to 'AFTER'
      if (this.targetLocation === 'CHILD') {
        setTimeout(() => {
            this.targetLocation = 'AFTER';
          this.cdr.markForCheck();
        });
      }
      return false;
    }
  }

}
