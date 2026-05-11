import { Component, OnInit } from '@angular/core';
import {GridComponent} from '../grid.component/grid.component';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';

/**
 *
 */
@Component({
  standalone: false,
  selector: 'lfb-left-label-form-group',
  template: `
      @if (label) {
        @for (field of getShowFields(); track field) {
          <div class="form-group row">
            <div [ngClass]="labelWidthClass + ' ps-0 pe-1'">
              <lfb-label
                [for]="getShowFieldProperty(field).id"
                [title]="getSchema(field).title"
                [helpMessage]="getSchema(field).description"
              ></lfb-label>
            </div>
            <div [class]="controlWidthClass" >
              <lfb-form-element
                [nolabel]="true"
                [formProperty]="getShowFieldProperty(field)"
              ></lfb-form-element>
            </div>
          </div>
        }
      } @else {
        <div class="form-group row">
          <div [ngClass]="labelWidthClass + ' ps-0 pe-1'">
            <button href="#" type="button"
              [ngClass]="{'float-sm-end': true}"
              class="btn btn-sm m-0 btn-default collapse-button"
              (click)="isCollapsed = !isCollapsed"
              [attr.aria-expanded]="!isCollapsed"
              [attr.aria-controls]="groupId">
              <fa-icon [icon]="isCollapsed ? faRight : faDown" aria-hidden="true"></fa-icon>
            </button>
            <lfb-label
              [for]="formProperty?.canonicalPathNotation"
              [title]="formProperty.schema.title"
              [helpMessage]="formProperty.schema.description"
            ></lfb-label>
          </div>
          <div [class]="controlWidthClass + ' meta-group-content'" [attr.id]="groupId" [ngbCollapse]="isCollapsed">
            @for (field of getShowFields(); track field) {
              @if (isSelfLabeledField(field)) {
                <div class="form-group row mb-1">
                  <div class="col-sm-12 ps-0 pe-0">
                    <lfb-form-element
                      [nolabel]="false"
                      [formProperty]="getShowFieldProperty(field)"
                    ></lfb-form-element>
                  </div>
                </div>
              } @else {
                <div class="form-group mb-2">
                  <div class="ps-0 pe-0">
                    <lfb-label
                      [for]="getShowFieldProperty(field).id"
                      [title]="getSchema(field).title"
                      [helpMessage]="getSchema(field).description"
                    ></lfb-label>
                  </div>
                  <div class="ps-0 pe-0">
                    <lfb-form-element
                      [nolabel]="true"
                      [formProperty]="getShowFieldProperty(field)"
                    ></lfb-form-element>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
      `,
  styles: [`
    .form-group {
      margin: 0;
    }
    .row {
      margin: 0;
    }
    :host ::ng-deep .col,.col-1,.col-2,.col-3,.col-4,.col-5,.col-6,.col-7,.col-8,.col-9,.col-10,.col-11,.col-12,
    .col-sm,.col-sm-1,.col-sm-2,.col-sm-3,.col-sm-4,.col-sm-5,.col-sm-6,.col-sm-7,.col-sm-8,.col-sm-9,.col-sm-10,.col-sm-11,.col-sm-12
    {
      padding-right: 5px;
      padding-left: 5px;
    }

    /* In grouped mode, subfield labels are rendered by this component; hide widget-internal duplicates. */
    :host ::ng-deep .meta-group-content sf-array-widget > .widget.form-group > label.horizontal.control-label,
    :host ::ng-deep .meta-group-content sf-array-widget > .widget.form-group > span.formHelp {
      display: none !important;
    }

    /* Profile rows: keep remove action on same line as input. */
    :host ::ng-deep .meta-group-content sf-array-widget > .widget.form-group > div {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    :host ::ng-deep .meta-group-content sf-array-widget > .widget.form-group > div > sf-form-element {
      flex: 1 1 auto;
      min-width: 0;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-remove-button {
      line-height: 1;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--bs-link-color) !important;
      min-width: 16px;
      min-height: 16px;
      font-size: 0;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-remove-button .glyphicon {
      font-size: 14px;
      line-height: 1;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-remove-button .glyphicon-minus:before {
      content: "\\e020" !important;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-add-button {
      margin-top: 2px !important;
      padding: 0.25rem 0.5rem !important;
      border: 1px solid var(--bs-border-color) !important;
      border-radius: 0.2rem !important;
      background-color: var(--bs-light) !important;
      color: var(--bs-primary) !important;
      box-shadow: var(--bs-box-shadow-sm) !important;
      font-size: 0.875rem !important;
      font-weight: 400;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-add-button .glyphicon {
      font-size: 0.9rem;
      line-height: 1;
    }

    :host ::ng-deep .meta-group-content sf-array-widget .array-add-button .glyphicon-plus:before {
      content: "\\e081" !important;
    }
  `]
})
export class LeftLabelFormGroupComponent  extends GridComponent implements OnInit {

  static seqNum = 0;
  labelWidthClass = '';
  controlWidthClass = '';
  label = true;
  isCollapsed = false;
  groupId = 'leftLabelGroup' + LeftLabelFormGroupComponent.seqNum++;
  faRight = faAngleRight;
  faDown = faAngleDown;

  ngOnInit(): void {
    const w = this.formProperty.schema.widget;
    this.labelWidthClass = w && w.labelWidth ? 'col-sm-' + w.labelWidth : 'col-sm';
    this.controlWidthClass = w && w.controlWidth ? 'col-sm-' + w.controlWidth : 'col-sm';
    this.label = w && w.label !== undefined ? w.label : true;
  }

  getShowFields(): string[] {
    return super.getShowFields(this.formProperty.schema.widget);
  }

  getSchema(propId: string) {
    return this.getShowFieldProperty(propId).schema;
  }

  isSelfLabeledField(propId: string): boolean {
    const widgetId = this.getSchema(propId)?.widget?.id;
    return widgetId === 'table' || widgetId === 'meta-profile';
  }
}
