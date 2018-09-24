
"use strict";

describe('formbuilder.service ', function () {

  var fbService;
  module.sharedInjector();

  beforeAll(module('formBuilder'));

  beforeAll(inject(function ($injector) {
    fbService = $injector.get('formBuilderService');
    fbService.cacheLFData();
  }));

  var importedLFormsData;
  beforeEach(function () {
    importedLFormsData = {
      items: [{
        question: 'q',
        questionCode: '1-1',
        questionCodeSystem: 'LOINC'
      }]
    };
  });

  it('imports questionCardinality field', function () {
    var cardinality = {min: "1", max: "*"};
    importedLFormsData.questionCardinality = cardinality;

    expect(fbService.createFormBuilderQuestion(importedLFormsData).basic.itemHash['/questionCardinality/1'].value.code).toBeTruthy();
    cardinality.max = "1";
    expect(fbService.createFormBuilderQuestion(importedLFormsData).basic.itemHash['/questionCardinality/1'].value.code).toBeFalsy();
  });

  it('imports answerCardinality field', function () {
    var cardinality = {min: '0', max: '*'};
    importedLFormsData.answerCardinality = cardinality;

    var fbQ = fbService.createFormBuilderQuestion(importedLFormsData);
    expect(fbQ.basic.itemHash['/answerRequired/1'].value.code).toBeFalsy();
    expect(fbQ.basic.itemHash['/multipleAnswers/1'].value.code).toBeTruthy();
  });
});

