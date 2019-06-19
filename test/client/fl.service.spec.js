
"use strict";

fdescribe('fl.service', function () {

  var flService, fbService, lodash, dataConstants;
  module.sharedInjector();

  beforeAll(module('formBuilder'));

  beforeAll(inject(function ($injector) {
    flService = $injector.get('flService');
    lodash = $injector.get('lodash');
    dataConstants = $injector.get('dataConstants');
    fbService = $injector.get('formBuilderService');
    fbService.cacheLFData();
  }));

  var fbData;
  beforeEach(function () {
    fbData = fbService.createFormBuilder();
  });

  it('convertFormLevelDataToLForms() - empty conversion', function () {
    expect(flService.exportFormLevelDataToLForms(fbData.treeData[0].lfData)).toEqual({status: 'draft'}); // default
  });

  it('FHIR string types', function () {
    assertImportExport('title', 'test title', 'basic');
    assertImportExport('name', 'test name', 'basic');
  });

  it('FHIR code types', function () {
    assertImportExport('status', 'retired', 'basic');
  });

  it('FHIR date & time types', function () {
    assertImportExport('date', '11/27/2019', 'basic');
  });

  fit('import/export formbuilder-headers.lforms.json', function () {
    var sample = fbService.createFormBuilder(lformsFormBuilderHeaders);
    expect(flService.exportFormLevelDataToLForms(sample.treeData[0].lfData)).toEqual(lformsFormBuilderHeaders); // default
  });


  function assertImportExport(fieldName, fieldValue, basicOrAdv) {
    var fbItem = fbService.getFormBuilderField(fbData.treeData[0].lfData[basicOrAdv].items, fieldName);
    flService._updateFBItem(fbItem, fieldValue);
    var lfItem = flService._convertFBItem(fbItem);
    expect(lfItem).toEqual(fieldValue);
  }


});