import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {Subscription} from 'rxjs';
import {ArrayProperty} from '@lhncbc/ngx-schema-form';
import {Util} from '../../util';

@Component({
  selector: 'lfb-help-text',
  templateUrl: '../string/string.component.html',
  styleUrls: ['./help-text.component.css']
})
export class HelpTextComponent extends StringComponent implements AfterViewInit, OnDestroy {


  subscriptions: Subscription [] = [];

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    /*
    let itemArray;
    const itemProp = this.formProperty.searchProperty('/item') as ArrayProperty;
    let subscription = itemProp.valueChanges.subscribe((items) => {
      itemArray = items;
      const itemIndex = Util.findItemIndexWithHelpText(items);
      // const helpTextItem = this.findItemWithHelpText(items);
      if(itemIndex >= 0) {
        this.formProperty.setValue(items[itemIndex].text, false);
      }
    });
    this.subscriptions.push(subscription);

    subscription = this.formProperty.valueChanges.subscribe((val) => {
      const itemIndex = Util.findItemIndexWithHelpText(itemArray);
      // let helpTextItem = this.findItemWithHelpText(itemArray);
      if(itemIndex < 0 && val) {
        // helpTextItem = this.createHelpTextItem(val);
        itemProp.addItem(this.createHelpTextItem(val));
      }
      else if(val && val.trim().length > 0) {
        itemArray[itemIndex].text = val.trim();
      }
      else if (itemIndex >= 0) { // delete for empty val
        itemArray.splice(itemIndex, 1);
      }
    });

    this.subscriptions.push(subscription);
    */
  }


  ngOnDestroy() {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
