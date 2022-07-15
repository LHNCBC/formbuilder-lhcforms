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
      ret = showFields.filter((field) => {
        // Only one of the answer[x] is shown.
        const isAnswer = this._isAnswerField(field.field);
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
        else {
          // FormProperty visibility (Util.isVisible()) is also based on operator value.
          // For enableWhen table, disregard the operator value to show the empty columns. Note that the
          // display of fields in the column itself will be based on the operator value.
          // The visibility is still significant in the form property to include/exclude in the json output.
          const answerType = this.formProperty.properties[i].getProperty('__$answerType').value;
          ret = this.isAnswerTypeMatch(answerType, propertyId);
        }
      }
    }
    return ret;
  }

  get rowProperties(): PropertyGroup [] {
    return this.formProperty.properties as PropertyGroup [];
  }


  /**
   * Whether to display the field in the cell
   * @param singleEnableWhenProperty - FormProperty representing an enableWhen condition.
   * @param fieldName - One of the field name from enableWhen object.
   *
   * @return boolean
   */
  isShow(singleEnableWhenProperty: PropertyGroup, fieldName: string): boolean {
    let show = true;
    if(fieldName === 'operator') {
      const q = singleEnableWhenProperty.getProperty('question').value;
      show = !!q;
    }
    else if(this._isAnswerField(fieldName)) {
      const op = singleEnableWhenProperty.getProperty('operator').value;
      show = !!op && op !== 'exists';
    }
    return show;
  }


  /**
   * Utility to identify answer[x] field.
   * @param f - Field name
   */
  _isAnswerField(f): boolean {
    return f && f.startsWith('answer');
  }


  /**
   * Match data type of the source to answer[x] field.
   *
   * @param answerType - Type of the source item.
   * @param answerField - One of the answer[x].
   */
  isAnswerTypeMatch(answerType: string, answerField: string): boolean {
    const answerTypeMap = {
      boolean: 'answerBoolean',
      integer: 'answerInteger',
      decimal: 'answerInteger',
      date: 'answerDate',
      dateTime: 'answerDateTime',
      time: 'answerTime',
      string: 'answerString',
      text: 'answerString',
      choice: 'answerCoding',
      'open-choice': 'answerCoding',
      quantity: 'answerQuantity',
      reference: 'answerReference'
    };

    return answerTypeMap[answerType] === answerField;
  }
}
