/**
 * Controller for form builder page.
 */
angular.module('formBuilder')
  .controller('FormBuilderCtrl', [
    '$scope',
    '$q',
    '$http',
    '$routeParams',
    'toJsonFilter',
    'FileUploader',
    'formBuilderService',
    'fhirService',
    '$mdDialog',
    '$mdSidenav',
    '$log',
    'usSpinnerService',
    '$rootScope',
    'dataConstants',
    'firebaseService',
    function($scope,
             $q,
             $http,
             $routeParams,
             toJsonFilter,
             FileUploader,
             formBuilderService,
             fhirService,
             $mdDialog,
             $mdSidenav,
             $log,
             usSpinnerService,
             $rootScope,
             dataConstants,
             firebaseService) {


      /*************************************************/


      $scope.toggleSidenav = function (menuId) {
        $mdSidenav(menuId).toggle();
      };
      /*************************************************/

      // Place holder to call URL.revokeObjectURL() to release the resources.
      // See https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#Notes
      var objectUrl = null;

      $scope.setInitialLoad = function () {
        $scope.initialLoad = true;
      };

      $scope.resetInitialLoad = function () {
        $scope.initialLoad = false;
      };

      $scope.getInitialLoad = function () {
        return $scope.initialLoad;
      };

      /**
       * Place holder for tree data
       * @type {Array}
       */
      $scope.formBuilderData = {
        headers: formBuilderService.getHeaders(),
        treeData: []
      };

      $scope.selectedNode = null;

      $scope.sourceJson = null;
      
      $scope.termsOfUseAccepted = 'unknown';

      $scope.isUserSignedIn = !firebaseService.isEnabled(); // If disabled, no control on fhir server access.

      // See https://github.com/nervgh/angular-file-upload/wiki/Introduction on
      // usage of angular-file-upload.
      $scope.uploader = new FileUploader({removeAfterUpload: true});

      /**
       * Callback after the item is selected in the file dialog.
       *
       * @param {Object} item - Refer to angular-file-upload for object definition.
       *   Apart from others, it has selected file reference.
       */
      $scope.uploader.onAfterAddingFile = function(item) {
        var reader = new FileReader(); // Read from local file system.
        reader.onload = function(event) {
          gtag('event', 'file-import', {
            event_category: 'engagement',
            event_label: 'local-file'
          });
          var importedData = null;
          try {
            importedData = JSON.parse(event.target.result);
          }
          catch(err) {
            err.message += ': Content is not in json format. Aborted file loading.';
            showFhirResponse(event, {fhirError: err});
            return;
          }
          switch($scope.detectDataFormat(importedData)) {
            case 'STU3':
              try {
                importedData = LForms.Util.convertFHIRQuestionnaireToLForms(importedData, 'STU3');
              }
              catch (err) {
                err.message += ': Failed to convert the selected FHIR Questionnaire. File loading is aborted.';
                showFhirResponse(event, {fhirError: err});
                break;
              }
              // Fall through
            case 'lforms':
              $scope.$broadcast('REPLACE_FORM', importedData);
              break;
            default:
              showFhirResponse(event, {fhirError: {message: 'Unsupported data format. File loading is aborted.'}});
              break;
          }
        };
        reader.readAsText(item._file);
      };


      /**
       * Detect format of the json object, used when loading data from a file to see which format it belongs to.
       * @param dataObj - Lforms or Questionnaire
       * @returns {*} - Return 'lforms' or 'STU3'
       */
      $scope.detectDataFormat = function(dataObj) {
        var ret = null;
        if(dataObj) {
          if(dataObj.resourceType === "Questionnaire") {
            ret = 'STU3';
          }
          else if(dataObj.items) {
            ret = 'lforms';
          }
        }
        return ret;
      };


      /**
       * Return the included template name in 'ng-include'
       * @returns {string}
       */
      $scope.getTemplateUrl = function() {

        return $scope.selectedTemplate;

      };


      /**
       * Close terms of use dialog
       * 
       * @param answer - Response from user action
       */
      $scope.touAnswer = function (answer) {
        gtag('event', 'accept-terms-of-use', {
          event_category: 'engagement',
          event_label: answer
        });
        $scope.termsOfUseAccepted = answer;
        $mdDialog.hide(answer);
      };


      /**
       * Display terms of use dialog 
       * 
       */
      $scope.showTermsOfUse = function() {
        var dlgOpts = {
          templateUrl: 'app/form-builder/touDialog.html',
          escapeToClose: false
        };
        
        $mdDialog.show(dlgOpts).then(function(answer) {
          $scope.termsOfUseAccepted = answer ? 'yes' : 'no';
        }, function() {
          $scope.termsOfUseAccepted = 'no';
        });
      };
      /**
       * Setter - Safe way to assign from child scopes.
       *
       * @param node
       */
      $scope.setSelectedNode = function(node) {
        if($scope.selectedNode !== node && node) {
          Def.Autocompleter.screenReaderLog('A new item '+
            $scope.getItem(node.lfData, 'question').value +
            ' is loaded into item builder panel');
        }
        $scope.selectedNode = node;
      };


      /**
       * Initialize form builder setup.
       */
      $scope.setFormBuilderData = function() {
        formBuilderService.cacheLFData();
      };


      /**
       * Initialize lform data for widget preview.
       * @param jsonInput
       */
      function setPreviewData(jsonInput) {
        $scope.previewSrc = toJsonFilter(jsonInput, ['_', '$']);
        if(jsonInput.items.length > 0) {
          var previewSrcObj = JSON.parse($scope.previewSrc);
          $scope.previewLfData = new LFormsData(previewSrcObj);
          if(previewSrcObj.id) {
            $scope.previewLfData.id = previewSrcObj.id;
          }
          var fhirData = LForms.Util.convertLFormsToFHIRData('Questionnaire', 'STU3', $scope.previewLfData);
          $scope.previewFhirSrc = toJsonFilter(fhirData, ['_', '$']);
        }
        else {
          $scope.previewLfData = null;
          $scope.previewFhirSrc = null;
        }
      }


      /**
       * Handle preview widget button
       */
      $scope.previewWidget = function() {
        var transformedObj = formBuilderService.transformFormBuilderToFormDef($scope.formBuilderData);

        if (transformedObj) {
          formBuilderService.removeInvalidAnswers(transformedObj);
          transformedObj.templateOptions = transformedObj.templateOptions || {};
          transformedObj.templateOptions.showFormHeader = false;
          transformedObj.templateOptions.hideFormControls = true;
          transformedObj.templateOptions.viewMode = 'md';
          setPreviewData(transformedObj);
        }
      };

      /**
       * Handle file export button
       *
       */
      $scope.export = function(ev) {

        if(!$scope.previewSrc) {
          showFhirResponse(ev, {dialogTitle: 'Alert', message: 'The form content is empty. Nothing to export.'});
          return;
        }
        $scope.showFileExportDialog(ev).then(function (answer) {
          if(answer) {
            gtag('event', 'file-export', {
              event_category: 'engagement',
              event_label: 'local-file'
            });
            $scope.previewWidget();
            var content = answer.format === 'STU3' ? $scope.previewFhirSrc : $scope.previewSrc;
            var blob = new Blob([content], {type: 'application/json;charset=utf-8'});
            var exportFileName = $scope.formBuilderData.headers[2].value ? $scope.formBuilderData.headers[2].value :
              'NewLForm';

            // Use hidden anchor to do file download.
            var downloadLink = angular.element(document.getElementById('exportAnchor'));
            var urlFactory = (window.URL || window.webkitURL);
            if(objectUrl != null) {
              // First release any resources on existing object url
              urlFactory.revokeObjectURL(objectUrl);
            }
            objectUrl = urlFactory.createObjectURL(blob);
            downloadLink.attr('href', objectUrl);
            downloadLink.attr('download', exportFileName + '.' + answer.format + '.json');
            downloadLink[0].click();
          }
        });

      };


      /**
       * Handle file import button
       */
      $scope.import = function() {
        document.querySelector('#fileInput').click();
      };

      $scope.searchFhir = function(ev, searchStr) {
        gtag('event', 'fhir-search', {
          event_category: 'engagement',
          event_label: $rootScope.fhirHeaders[dataConstants.TARGET_FHIR_HEADER],
          value: searchStr
        });
        fhirService.search(searchStr, true)
          .then(function(response) {
            $scope.showFhirResults(ev, {fhirResults: response.data});
          }, function (err) {
            showFhirResponse(ev, {fhirError: err});
          });
      };


      /**
       * Handle import from FHIR server, a FHIR read operation
       *
       * @param ev - event object
       * @param resourceId - id of the FHIR resource to import
       */
      $scope.importFromFhir = function(ev, resourceId) {
        gtag('event', 'fhir-read', {
          event_category: 'engagement',
          event_label: $rootScope.fhirHeaders[dataConstants.TARGET_FHIR_HEADER],
          value: resourceId
        });
        fhirService.read(resourceId).then(function (response) {
          try {
            $scope.$broadcast('REPLACE_FORM', LForms.Util.convertFHIRQuestionnaireToLForms(response.data, 'STU3'));
          }
          catch(err) {
            err.message += ': Failed to convert selected questionnaire';
            showFhirResponse(ev, {fhirError: err});
          }
        }, function (err) {
          showFhirResponse(ev, {fhirError: err});
        });
      };


      /**
       * Handle export to FHIR server, a FHIR create operation
       *
       * @param ev - event object
       */
      $scope.exportToFhir = function(ev) {
        $scope.showFhirServerDialog(ev).then(function (answer) {
          if(answer) {
            $scope.previewWidget();
            gtag('event', 'fhir-create', {
              event_category: 'engagement',
              event_label: $rootScope.fhirHeaders[dataConstants.TARGET_FHIR_HEADER]
            });
            fhirService.create($scope.previewFhirSrc, $scope.userProfile)
              .then(function (response) {
                $scope.formBuilderData.id = response.data.id;
                showFhirResponse(ev, {fhirResponse: response.data});
              }, function (err) {
                showFhirResponse(ev, {fhirError: err});
              });
          }
        });
      };


      /**
       * Handle an update on a FHIR server, a FHIR update operation
       * @param ev - event object
       */
      $scope.updateOnFhir = function(ev) {
        $scope.previewWidget();
        gtag('event', 'fhir-update', {
          event_category: 'engagement',
          event_label: $rootScope.fhirHeaders[dataConstants.TARGET_FHIR_HEADER]
        });
        fhirService.update($scope.previewFhirSrc, $scope.userProfile)
          .then(function (response) {
            showFhirResponse(ev, {fhirResponse: 'Successfully updated the resource.'});
          }, function (err) {
            err.message = 'Failed to update the resource.';
            showFhirResponse(ev, {fhirError: err});
          });
      };


      /**
       * Display FHIR resources in a dialog.
       *
       * @param ev - Event object
       * @param localScope - Optional custom scope object to pass to angular dialog
       * @returns {promise}
       */
      $scope.showFhirResults = function(ev, localScope) {
        if(!localScope) {
          localScope = {};
        }

        // Pass some needed args to controller.
        localScope.formBuilderData = $scope.formBuilderData;
        localScope.getFhirServer = $scope.getFhirServer;
        localScope.importFromFhir = $scope.importFromFhir;
        localScope.userProfile = $scope.userProfile;
        localScope.showFhirResponse = showFhirResponse;

        return $mdDialog.show({
          controller: 'fhirDlgController',
          templateUrl: 'app/form-builder/fhir-results-dialog.html',
          targetEvent: ev,
          clickOutsideToClose: false,
          locals: localScope,
          bindToController: true,
          controllerAs: 'fhirCtrl'
        });
      };


      /**
       * Display list of FHIR servers for selection.
       *
       * @param ev - Event object
       * @param localScope - Optional custom scope object to pass to angular dialog
       * @returns {promise}
       */
      $scope.showFhirServerDialog = function(ev, localScope) {
        if(!localScope) {
          localScope = {};
        }

        // Pass some needed args to controller.
        localScope.getFhirServer = $scope.getFhirServer;
        localScope.userProfile = $scope.userProfile;

        return $mdDialog.show({
          controller: 'fhirDlgController',
          templateUrl: 'app/form-builder/fhir-server-dialog.html',
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: localScope,
          bindToController: true,
          controllerAs: 'fhirCtrl'
        });
      };


      /**
       * Display list of exported file formats.
       *
       * @param ev - Event object
       * @param localScope - Optional custom scope object to pass to angular dialog
       * @returns {promise}
       */
      $scope.showFileExportDialog = function(ev, localScope) {
        if(!localScope) {
          localScope = {};
        }

        var controller = function () {
          var self = this;
          self.closeDlg = function(answer) {
            $mdDialog.hide(answer);
          };
          self.formatList = [
            {displayName: 'FHIR Questionnaire (STU3)', format: 'STU3'},
            {displayName: 'LHC Forms', format: 'lforms'}
          ];
          self.format = self.formatList[0];
        };

        return $mdDialog.show({
          controller: controller,
          templateUrl: 'app/form-builder/file-export-dialog.html',
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: localScope,
          bindToController: true,
          controllerAs: 'ctrl'
        });
      };


      /**
       * Get selected fhir server.
       *
       * @returns {object} - FHIR server object.
       */
      $scope.getFhirServer = function() {
        var ret = null;
        var fhirEndpoint = $rootScope.fhirHeaders[dataConstants.TARGET_FHIR_HEADER] || dataConstants.fhirServerList[0].endpoint;
        dataConstants.fhirServerList.some(function (server, index) {
          var match = server.endpoint === fhirEndpoint;
          ret = match ? server : null;
          return match;
        });

        return ret;
      };


      /**
       * Display FHIR server responses in a dialog
       *
       * @param ev - event object
       * @param localScope - scope object for the dialog
       * @param dialogOptions
       */
      function showFhirResponse(ev, localScope, dialogOptions) {
        if(!localScope) {
          localScope = {};
        }

        if(!localScope.dialogTitle) {
          localScope.dialogTitle = 'Response from FHIR Server';
        }
        var dlgOpts = {
          controller: function() {
            this.closeDlg = function(answer){
              $mdDialog.hide(answer);
            };
          },
          parent: angular.element(document.body),
          templateUrl: 'app/form-builder/fhir-dialog.html',
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: localScope,
          bindToController: true,
          controllerAs: 'fhirCtrl'
        };

        angular.extend(dlgOpts, dialogOptions);
        $mdDialog.show(dlgOpts);
      }


      /**
       * Safe way to assign from child scopes.
       * @param lfFormData
       */
      $scope.updateLFData = function (lfFormData) {
        $scope.formBuilderData = lfFormData;
      };


      /**
       * Get an lfItem using a field name
       * @param lfData - LForms data object
       * @param fieldName - Field name
       * @returns {*}
       */
      $scope.getItem = function (lfData, fieldName) {
        var ret = null;
        var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];

        if(indexInfo) {
          ret = lfData[indexInfo.category].items[indexInfo.index];
        }
        return ret;
      };


      /**
       * Sign in dialog handler
       *
       * @param event
       */
      $scope.showSignInDialog = function (event) {
        $mdDialog.show({
          scope: $scope,
          preserveScope: true,
          templateUrl: 'app/firebase/oauth-signin-dialog.html',
          parent: angular.element(document.body),
          targetEvent: event,
          controller: function ($scope, $mdDialog, firebaseService) {
            $scope.closeDialog = function () {
              $mdDialog.hide();
            };
            $scope.signInWithGoogle = function() {
              firebaseService.signInWithGoogle();
            };
            $scope.signInWithFacebook = function() {
              firebaseService.signInWithFacebook();
            };
            $scope.signInWithTwitter = function() {
              firebaseService.signInWithTwitter();
            };
            $scope.signInAnonymously = function() {
              firebaseService.signInAnonymously();
            };
            $scope.$on('LF_FIREBASE_AUTH_SIGNEDIN', function(event, currentUser) {
              console.log("signin event received");
              $scope.closeDialog();
            });
          }
        });
      };


      /**
       *  Sign out handler
       */
      $scope.signOut = function () {
        gtag('event', 'logout', {event_category: 'engagement'});
        firebaseService.signOut();
      };


      /**
       *  Find out the firebase service
       */
      $scope.isFirebaseEnabled = function () {
        return firebaseService.isEnabled();
      };

      /************** angular-spinner ****************
       * Spinner handling for loading of panels and forms etc.
       *
       * See https://github.com/urish/angular-spinner for details.
       *
       **********************************************/

      $scope.spinneractive = false;


      /**
       * Start spinner
       */
      $scope.startSpin = function() {
        $scope.loading = true;
        if (!$scope.spinneractive) {
          usSpinnerService.spin('spinner-1');
        }
      };


      /**
       * Stop spinner
       */
      $scope.stopSpin = function() {
        $scope.loading = false;
        if ($scope.spinneractive) {
          usSpinnerService.stop('spinner-1');
        }
      };


      /**
       * Spin event listener
       */
      $rootScope.$on('us-spinner:spin', function(event, key) {
        $scope.spinneractive = true;
      });


      /**
       * Stop event listener
       */
      $rootScope.$on('us-spinner:stop', function(event, key) {
        $scope.spinneractive = false;
      });

      $rootScope.$on('LF_FIREBASE_AUTH_SIGNEDIN', function (ev, user) {
        $scope.userProfile = user.toJSON();
        if(user.isAnonymous) {
          $scope.userProfile.displayName = '[Anonymous]';
        }
        $scope.isUserSignedIn = true;
        $scope.$apply();
      });

      $rootScope.$on('LF_FIREBASE_AUTH_SIGNEDOUT', function (ev, user) {
        $scope.userProfile = null;
        $scope.isUserSignedIn = false;
        $scope.$apply();
      });


      $rootScope.$on('LF_FIREBASE_AUTH_RESOURCE_CREATED', function (ev, resource) {
        $scope.$apply();
      });
    }]);
