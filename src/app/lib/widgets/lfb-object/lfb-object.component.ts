import {Component, OnInit} from '@angular/core';
import {FormProperty, ObjectLayoutWidget, PropertyGroup} from "@lhncbc/ngx-schema-form";
import {AppFormElementComponent} from "../form-element/form-element.component";
import {LabelComponent} from "../label/label.component";
import {NgClass, NgIf} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {Util} from "../../util";

@Component({
  selector: 'lfb-object',
  imports: [
    AppFormElementComponent,
    LabelComponent,
    NgIf,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './lfb-object.component.html'
})
export class LfbObjectComponent extends ObjectLayoutWidget implements OnInit {

  widgetInfo: any = {};
  showFields: {field: string, col: number}[] = [];
  formProperties: {[key: string]: FormProperty};
  isRequired = false;
  ngOnInit() {
    this.isRequired = Util.getIsRequired(this.formProperty);
    const schema = this.formProperty.schema;
    this.widgetInfo = schema.widget;
    const propertyIds = Object.keys(schema.properties).filter((id) => {
      return schema.properties.hasOwnProperty(id);
    });
    // If no showFields are defined, show all properties
    if (!this.widgetInfo.showFields) {
      this.showFields = propertyIds.map((id) => ({field: id, col: 12}));
    }
    else {
      // Otherwise, filter properties based on showFields
      this.widgetInfo.showFields.forEach((field) => {
        let exp = field.field;
        let flags = '';
        if(!field.regex) {
          exp = '^' + exp + '$'; // Ensure exact match if not a regex
        }
        else {
          flags = field.flags || '';
        }
        const regEx = new RegExp(exp, flags); // Case insensitive if regex is true
        // If the field is a regular expression, test it against the propertyIds
        propertyIds.forEach((id) => {
          if (regEx.test(id)) {
            this.showFields.push({field: id, col: field.col || 12});
          }
        });
      });
    }
    // Convert properties to a map for easier access
    this.formProperties = this.formProperty.properties as {[key: string]: FormProperty};
  }

  protected readonly Object = Object;
}
