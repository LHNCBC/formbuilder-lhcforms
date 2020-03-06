
"use strict";

describe('formbuilder.service ', function () {

  var fbService, $httpBackend, dataConstants;
  module.sharedInjector();

  beforeAll(module('formBuilder'));

  beforeAll(inject(function ($injector) {
    fbService = $injector.get('formBuilderService');
    $httpBackend = $injector.get('$httpBackend');
    dataConstants = $injector.get('dataConstants');
    fbService.cacheLFData();
  }));

  var importedLFormsData;
  beforeEach(function () {
    importedLFormsData = {
      items: [{
        question: 'q',
        questionCode: '12345-6',
        questionCodeSystem: 'LOINC'
      }]
    };
  });

  describe('translate skip logic', function () {
    let previewJson;

    function _changeTriggerAndLoad(trigger) {
      let formWithSKL = readJSON('test/client/fixtures/skip-logic-trigger-cne.lforms.json');
      formWithSKL.items[1].skipLogic.conditions[0].trigger = trigger;
      let form = fbService.createFormBuilder(formWithSKL);
      previewJson = fbService.transformFormBuilderToFormDef(form);
    }

    it('CNE/CWE type using code/system/text', function() {
      const triggers = [{
        value: {code: 'LA11849-9'}
      }, {
        value: {code: 'LA11850-7', system: 'http://loinc.org'}
      }, {
        value: {text: '2 liters/min'}
      }];

      triggers.forEach((trigger) => {
        _changeTriggerAndLoad(trigger);
        expect(previewJson.items[1].skipLogic.conditions[0].trigger).toEqual(trigger);
      });
    });
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

  it('should test _pruneObject()', function () {
    expect(fbService._pruneObject({})).toEqual({});
    expect(fbService._pruneObject({a: null})).toEqual({});

    var obj1 = {a: 1, b: null, c: undefined, d: "", e: " ", f: {g: false, h: 0, i: 1, j: ' xxx ', k: ' yy zz   ', m: {}}};
    var pruned = {a: 1, f: {g: false, h: 0, i: 1, j: 'xxx', k: 'yy zz'}};
    expect(fbService._pruneObject(obj1)).toEqual(pruned);
  });

  it('should test _isEquivalent()', function () {
    var obj1 = {a: 1, b: null, c: undefined, d: "", e: " ", f: {g: false, h: 0, i: 1, j: ' xxx ', k: ' yy zz   '}};
    var equivalent1 = {a: 1, f: {g: false, h: 0, i: 1, j: 'xxx', k: 'yy zz', l: null, m: {}}};
    expect(fbService._isEquivalent(obj1, equivalent1)).toEqual(true);
  });

  describe('_updateUnitsURL()', function () {
    var loincPropertyResp, lfData, codeItem, datatypeItem, unitsItem;

    beforeEach(function () {
      lfData = angular.copy(formBuilderDef); // Work with original form builder definition.
      // Setup needed fields
      codeItem = fbService.getFormBuilderField(lfData.items, 'questionCode');
      codeItem.value = '12345-6';
      datatypeItem = fbService.getFormBuilderField(lfData.items, 'dataType');
      datatypeItem.value = {code: 'REAL'};
      unitsItem = fbService.getFormBuilderField(lfData.items, 'units');

      // Setup mock response. It could be modified in the test suit
      loincPropertyResp = [1, [codeItem.value],null,[[]]];
      $httpBackend.when('GET', /^https:.+$/).respond(function () { return [200, loincPropertyResp];});
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });


    it('with no loinc property', function (done) {
      var expectedUrl = unitsItem.externallyDefined;
      assertUpdateUnitsURL(expectedUrl, done);
    });

    it('with loinc property', function (done) {
      loincPropertyResp[3][0].push('aaa bbb');
      loincPropertyResp[3][0].push('xxx yyy'); // Should ignore the second one.
      var expectedUrl = unitsItem.externallyDefined+'&bq=loinc_property:(%22aaa%20bbb%22)^20';
      assertUpdateUnitsURL(expectedUrl, done);
    });

    it('loinc property with special characters', function (done) {
      loincPropertyResp[3][0].push('aaa;"&<>\'bbb');
      var expectedUrl = unitsItem.externallyDefined+'&bq=loinc_property:(%22aaa%3B%22%26%3C%3E\'bbb%22)^20';
      assertUpdateUnitsURL(expectedUrl, done);
    });


    /**
     * Mock http calls and assert units search url
     *
     * @param exptectedUrl - The exptected url after updateUnitsURL is called.
     * @param done - Done method from jasmine framework to wait on asynchronous call.
     */
    function assertUpdateUnitsURL(exptectedUrl, done) {
      $httpBackend.expectGET(/^https:.+$/);
      fbService._updateUnitsURL(lfData).then(function(resp){
        expect(unitsItem.externallyDefined).toEqual(exptectedUrl);
        done();
      }, function (err) {
        done(err);
      });
      $httpBackend.flush();
    }
  });

});

