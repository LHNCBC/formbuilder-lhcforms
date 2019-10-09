'use strict';

const fb = require('./formbuilder.po').formbuilder;

const util = require('./test-util');



fdescribe('FHIR server interactions - ', function () {
  beforeAll(function () {
    util.loadHomePage();
  });


  describe('FHIR resource operations on the server', function () {
    // Note - The tests in this block are in an order. Any changes to
    // a test suite could impact the following assertions.

    const newTitle = 'Newly created form';
    const updatedTitle = 'Updated form';
    const uhnServerName = 'http://hapi.fhir.org/baseR4';

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
    });

    it('should create', function () {
      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeFalsy();
      fb.dismissMenu();
      util.assertCreateFhirResource(newTitle, uhnServerName);
      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeTruthy();
      fb.dismissMenu();
    });

    it('should read', function () {
      util.assertImportFromFhir(newTitle);
    });

    // Assume there is a loaded panel
    it('should update', function () {
      fb.formNode.click();
      fb.formTitle.clear();
      fb.formTitle.sendKeys(updatedTitle);
      fb.exportMenu.click();
      fb.updateFhir.click();
      expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
      fb.fhirResponse.getText().then(function(text){
        expect(text).toBe('\"Successfully updated the resource.\"');
      });

      fb.closeDialog();

      util.assertImportFromFhir(updatedTitle);
    });

    // Assume there is a resource on the server
    xit('should delete', function () {

      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeTruthy();
      fb.dismissMenu();

      util.getFhirResourceDeleteElement(updatedTitle, uhnServerName).click();

      expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
      fb.fhirResponse.getText().then(function(text){
        var resp = JSON.parse(text);
        expect(resp.issue[0].diagnostics).toContain('Successfully deleted 1 resource(s) in');
      });
      fb.closeDialog(); // fhir response
      fb.closeDialog(); // fhir results

      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeFalsy();
      fb.dismissMenu();
    });

    xit('should do next/previous page', function () {

      fb.importMenu.click();
      fb.showFhirResources.click();
      expect(fb.dialog.isDisplayed()).toBeTruthy();
      fb.fhirServerPulldownSelect(uhnServerName).click();

      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeFalsy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();

      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();

      fb.fhirServerPulldownSelect('http://hapi.fhir.org/baseDstu3').click();

      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeFalsy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();

      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();


      fb.closeDialog(); // fhir results
    });
  });

  xdescribe('Add user specified FHIR server', function () {


  });
});

