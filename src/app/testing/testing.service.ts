import {Component, Injectable, Input, NgModule, OnInit} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {FormService} from '../services/form.service';
import {
  DefaultWidgetRegistry,
  FormProperty,
  FormPropertyFactory} from 'ngx-schema-form';
import {CommonTestingModule} from './common-testing.module';
import {SchemaPreprocessor} from 'ngx-schema-form';

@Injectable({
  providedIn: 'root'
})
export class TestingService {
  rootProperty: FormProperty;

  constructor(
    private formService: FormService,
    private formPropertyFactory: FormPropertyFactory
  ) {
    let schema = formService.itemSchema;
    schema = SchemaPreprocessor.preprocess(schema);
    this.rootProperty = this.formPropertyFactory.createProperty(schema);
  }

  beforeEachSetup(componentClass: any) {
    CommonTestingModule.setUpTestBed(componentClass);
  }

  createComponent(componentClass: any) {
    const fixture = TestBed.createComponent(componentClass);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  getProperty(propertyId: string) {
    return this.rootProperty.searchProperty(propertyId);
  }

}

