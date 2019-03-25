angular.module('formBuilder')
.controller('fhirDlgController', ['$mdDialog', 'fhirService', 'dataConstants',
function ($mdDialog, fhirService, dataConstants) {
  var self = this;
  self.fhirResultsCount = 0;
  self.onlyUserResources = true;

  self.fhirServerList = dataConstants.fhirServerList;
  self.savedFhirServer = self.getFhirServer();
  self.fhirServer = self.savedFhirServer;


  /**
   * Set fhir server headers
   *
   * @param fhirServer - fhirServer object. See dataConstants.fhirServerList for its definition.
   */
  self.setFhirServer = function(fhirServer) {
    fhirService.setFhirServer(fhirServer);
  };


  /**
   * Restore saved fhir server
   */
  self.restoreFhirServer = function() {
    fhirService.setFhirServer(self.savedFhirServer);
  };


  /**
   * Close dialog
   *
   * @param answer - Flag to indicate continue/cancellation
   */
  self.closeDlg = function(answer) {
    if(answer === false) {
      self.restoreFhirServer();
    }
    $mdDialog.hide(answer);
  };


  /**
   * Search FHIR server
   * @param ev - event object
   */
  self.search = function(ev) {
    fhirService.setFhirServer(self.fhirServer);
    fhirService.search(self.searchStr, self.onlyUserResources)
      .then(self.handleFhirResults, function(err) {
        self.handleError(ev, err);
      });
  };

  /**
   * Load a fhir resource from server
   * @param ev - event object
   * @param resId - fhir resource id
   */
  self.loadResource = function(ev, resId) {
    $mdDialog.hide();
    self.importFromFhir(ev, resId);
  };


  /**
   * Delete a fhir resource
   *
   * @param ev event object
   * @param resId - fhir resource id
   */
  self.deleteResource = function(ev, resId) {
    // Deleting id disables update button. If the loaded form is deleted from
    // the server, disable updates.
    if(resId === self.formBuilderData.id) {
      delete self.formBuilderData.id;
    }
    fhirService.delete(resId)
      .then(function (response) {
        self.showFhirResponse(ev, {fhirResponse: response.data}, {multiple: true});
        self.search();
      }, function(err) {
        self.handleError(ev, err);
        self.search();
      });
  };


  /**
   * Get requested page
   *
   * @param ev - event object
   * @param relation - String specifying requested relation (next/prev/self)
   */
  self.getPage = function(ev, relation) {
    fhirService.getPage(self.fhirResults, relation)
      .then(self.handleFhirResults, function(err) {
        self.handleError(ev, err);
      });
  };


  /**
   * Read the page offset from the resultset
   * @returns {number}
   */
  self.currentOffset = function () {
    var offset = 0;
    var selfUrl = self.getLink('self');
    if(selfUrl) {
      var m = new RegExp('[?&]_getpagesoffset=([^&#]+)').exec(selfUrl);
      offset = m ? parseInt(m[1]) : 0;
    }

    return offset;
  };


  /**
   * Get next/prev/link link from resultset/bundle
   *
   * @param relation - String specifying requested relation (next/prev/self)
   * @returns {*}
   */
  self.getLink = function (relation) {
    var ret = null;
    for (var i = 0; !ret && self.fhirResults && i < self.fhirResults.link.length; i++) {
      if(self.fhirResults.link[i] && self.fhirResults.link[i].relation === relation) {
        ret = self.fhirResults.link[i].url;
        break;
      }
    }

    return ret;
  };


  /**
   * Check if you have a next/prev page links.
   *
   * @param relation - String specifying requested relation (next/prev/self)
   * @returns {boolean}
   */
  self.hasLink = function (relation) {
    return !!self.getLink(relation);
  };


  /**
   * Display results from fhir server.
   *
   * @param serverResponse - Server response object
   */
  self.handleFhirResults = function (serverResponse) {
    self.fhirResults = serverResponse.data;
    self.fhirResultsCount = self.currentOffset();
  };


  /**
   *  Display error messages from the server.
   *
   * @param ev - event object
   * @param err - error object
   */
  self.handleError = function(ev, err) {
    if(!err.message) {
      if(err.data && err.data.message) {
        err.message = err.data.message;
      }
      else if (err.statusText) {
        err.message = err.statusText;
      }
      else {
        err.message = 'An error in communication with the server.';
      }
    }

    self.showFhirResponse(ev, {fhirError: err}, {multiple: true});
  };
}]);
