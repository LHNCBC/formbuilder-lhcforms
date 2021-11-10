import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormProperty, ISchema} from '@lhncbc/ngx-schema-form';

import {RadioComponent} from './radio.component';
import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

const schema: ISchema = {
  type: 'object',
  properties: {
    fieldA: {
      enum: [
        'one',
        'two',
        'three',
        'four'
      ],
      type: 'string',
      title: 'Field A',
      widget: {
        id: 'radio',
        layout: 'row',
        labelPosition: 'left',
        labelWidthClass: 'col-sm-2',
        controlWidthClass: 'col-sm-6'
      }
    },
  }
};

// const model: any = {fieldA: 'one'};
const model: any = {
      text: 'Field A',
      linkId: 'l1',
      type: 'string',
      repeats: false
};


describe('formProperty: radio', () => {
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.schema = schema;
    fixture.componentInstance.model = model;
    fixture.detectChanges();
  });

  it('should initialize radio widget', () => {
    expect(fixture.componentInstance).toBeTruthy();
    // console.log(JSON.stringify(fixture.componentInstance.model, null, 2));
    const input = fixture.debugElement.query(By.css('form'));
    // recursiveWalk(input.children, (el) => { console.log(el.name); });
    // TODO - expect(input.nativeElement.value).toBe('one');
  });
});


/**
 * Walk through children of given set of nodes.
 *
 * @param debugElements - Set of nodes to walk down through their children.
 * @param callback - Callback function visiting each node. The function parameters are
 *   debugEl: DebugElement - Node visited.
 *   path: string[] - Array of names of ancestral nodes.
 * @param path? - Initial path - Typically not empty or undefined at the initial call.
 */
function recursiveWalk(debugElements: DebugElement [], callback, path?) {
  path = path || [];
  debugElements?.forEach((de) => {
    path.push(de.name);
    callback(de, path);
    recursiveWalk(de.children, callback, path);
    path.pop();
  });
}
