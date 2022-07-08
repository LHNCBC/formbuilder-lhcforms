import { Component, OnInit } from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Util} from '../../util';
import {PropertyGroup} from 'ngx-schema-form/lib/model';

@Component({
  selector: 'lfb-enable-when',
  templateUrl: './enable-when.component.html',
  styleUrls: ['./enable-when.component.css']
})
export class EnableWhenComponent extends TableComponent {

  /**
   * Get fields to show.
   */
  getShowFields(): any [] {
    let ret: any [] = [];

    if (this.formProperty.schema.widget && this.formProperty.schema.widget.showFields) {
      const showFields = this.formProperty.schema.widget.showFields;
      let answerIncluded = false;
      const isAnswerField = (f) => {
        return f && f.startsWith('answer');
      };
      ret = showFields.filter((field) => {
        // Only one of the answer[x] is shown.
        const isAnswer = isAnswerField(field.field);
        if(isAnswer && answerIncluded) {
          return false;
        }
        const isVisible = this.isVisible(field.field);

        if(isAnswer && isVisible) {
          answerIncluded = true;
        }
        return isVisible;
      });
    }
    return ret;
  }

  /**
   * Check visibility i.e. based on visibleIf of ngx-schema-form
   * @param propertyId - property id
   */
  isVisible(propertyId) {
    let ret = false;
    if (this.formProperty.properties.length > 0) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; !ret && i < this.formProperty.properties.length; i++) {
        const visible = Util.isVisible(this.formProperty.properties[i], propertyId);
        if(visible) {
          if(propertyId === 'answerBoolean') {
            const answerType = this.formProperty.properties[i].getProperty('__$answerType').value;
            ret = !(answerType === 'choice' || answerType === 'open-choice');
          }
          else {
            ret = true;
          }
        }
      }
    }
    return ret;
  }

  get rowProperties(): PropertyGroup [] {
    return this.formProperty.properties as PropertyGroup [];
  }
}
