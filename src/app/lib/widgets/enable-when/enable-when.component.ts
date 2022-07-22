import {Component, DoCheck, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Util} from '../../util';
import {ObjectProperty, PropertyGroup} from 'ngx-schema-form/lib/model';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'lfb-enable-when',
  templateUrl: './enable-when.component.html',
  styleUrls: ['./enable-when.component.css']
})
export class EnableWhenComponent extends TableComponent implements OnInit, DoCheck {

  showFieldNames: string[] = ['question', 'operator', 'answerString'];
  showHeaderFields: any[];

  ngOnInit() {
    super.ngOnInit();
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

  }

  ngDoCheck() {
    if(this.formProperty.properties.length === 0) {
      this.addItem();
    }
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
   * @param rowProperty
   * @param field
   */
  isValid(rowProperty: ObjectProperty, field: string): boolean {
    const prop = rowProperty.getProperty(field);
    const ret = prop._errors?.some((err) => {
      return err.code?.startsWith('ENABLEWHEN');
    });
    return !ret;
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
}
