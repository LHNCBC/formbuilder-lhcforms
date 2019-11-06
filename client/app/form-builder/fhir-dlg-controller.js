angular.module('formBuilder')
.controller('fhirDlgController', ['$mdDialog', 'fhirService', 'dataConstants', '$http', '$q',
function ($mdDialog, fhirService, dataConstants, $http, $q) {
  'use strict';

  var self = this;
  self.fhirResultsCount = 0;
  self.onlyUserResources = true;

  self.fhirServerList = dataConstants.fhirServerList;
  self.savedFhirServer = self.getFhirServer();
  self.fhirServer = self.savedFhirServer;
  self.errorMessage = null;
  self.urlinput = {endpoint: null};

  self.fhirVersions = {
    '4.0.0': 'R4',
    '3.5a.0': 'R4',
    '3.5.0': 'R4',
    '3.3.0': 'R4',
    '3.2.0': 'R4',
    '3.0.1': 'STU3',
    '1.8.0': 'STU3',
    '1.6.0': 'STU3',
    '1.4.0': 'STU3',
    '1.2.0': 'STU3',
    '1.1.0': 'STU3',
  };


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
    self.importFhirResource(ev, resId);
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


  /**
   * Handle button events for addition of fhir server
   *
   * @param event - Event object representing user action.
   */
  self.addFhirServer = function (event) {
    var dlgOpts = {
      controller: function () {
        var thisCtrl = this;
        thisCtrl.urlinput = {endpoint: null};
        thisCtrl.closeDlg = function(answer){
          $mdDialog.hide(answer);
        };


        /**
         * Handle verify url button to check the user input.
         */
        thisCtrl.validateFhirServer = function () {
          thisCtrl.message = null;
          thisCtrl.errorMessage = null;
          self.isValidFhirServer(thisCtrl.urlinput.endpoint)
            .then(function (newServerObj) {
              thisCtrl.urlinput = newServerObj;
              thisCtrl.message = newServerObj.endpoint+' is recognized FHIR server.';
            }, function (resp) {
              thisCtrl.errorMessage = resp instanceof Error ? resp.message : resp.data ? resp.data : 'Failed to recognize your FHIR server';
            });
        };


        /**
         * Add the new FHIR server to the list. The new server object if valid is stored in thisCtrl.urlinput
         */
        thisCtrl.addServer = function () {
          if(thisCtrl.urlinput.endpoint && thisCtrl.urlinput.version) {
            // Prepend the new item to the list to show up at the top.
            self.fhirServerList.unshift(thisCtrl.urlinput);
            self.fhirServer = thisCtrl.urlinput;
            thisCtrl.closeDlg(true);
          }
        };
      },


    templateUrl: 'app/form-builder/add-fhir-server.html',
      escapeToClose: true,
      bindToController: true,
      targetEvent: event,
      parent: document.body,
      controllerAs: 'addCtrl',
      multiple: true
    };

    $mdDialog.show(dlgOpts);
  };


  /**
   * Given a base url, see if it is a valid FHIR server.
   *
   * @param baseUrl - Base URL of the FHIR server.
   * @returns {*} - Http promise which resolves to server object having incremented id, and
   * recognized fhir version (R4|STU3).
   */
  self.isValidFhirServer = function (baseUrl) {
    return $q(function (resolve, reject) {
      if(baseUrl && baseUrl.match(/^https?:\/\/[^\/]/)) {
        var metaReq = {
          method: 'GET',
          url: baseUrl+'/metadata',
          params: {
            _elements: 'fhirVersion,implementation', // Gives a small response. Is this reliable?
            _format: 'json'
          }
        };

        self.startSpin();
        $http(metaReq).then(function (resp) {
          self.stopSpin();
          if(resp.status === 200) {
            var ver = self.fhirVersions[resp.data.fhirVersion];
            if(!ver && resp.data.fhirVersion.startsWith(('4.0.'))) {
              ver = 'R4'; // Cover future R4 versions, assuming they all start with 4.???
            }
            if(ver) {
              var newServerObj = {
                id: self.fhirServerList.length+1,
                endpoint: (resp.data.implementation && resp.data.implementation.url)? resp.data.implementation.url : baseUrl,
                desc: resp.data.implementation ? resp.data.implementation.description : '',
                version: ver
              };
              // Remove any trailing slashes.
              newServerObj.endpoint = newServerObj.endpoint.replace(/\/+$/, '');
              resolve(newServerObj);
            }
            else {
              reject(new Error(baseUrl + ' returned an unsupported FHIR version: ' + resp.data.fhirVersion));
            }
          }
          else {
            reject(new Error(baseUrl + ' returned an http status code ' + resp.status + '. It does not look like a FHIR server.'));
          }
        }, function (err) {
          self.stopSpin();
          reject(err);
        });
      }
      else {
        reject(new Error('Not a valid url: '+encodeURIComponent(baseUrl)));
      }
    });
  };

}]);
