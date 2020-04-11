import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ArrayWidget, FormProperty} from 'ngx-schema-form';
import {Form} from '@angular/forms';

@Component({
  selector: 'app-array-grid',
  templateUrl: './array-grid.component.html',
  styleUrls: ['./array-grid.component.css']
})
export class ArrayGridComponent extends ArrayWidget implements AfterViewInit {

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }
}

