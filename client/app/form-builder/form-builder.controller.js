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


      $scope.formatList = [
        {displayName: 'FHIR Questionnaire (R4)', format: 'R4'},
        {displayName: 'FHIR Questionnaire (STU3)', format: 'STU3'},
        {displayName: 'LHC-Forms', format: 'lforms'}
      ];
      $scope.selectedFormat = $scope.formatList[0];

      $scope.previewSource = {};
      for(var i = 0; i < $scope.formatList.length; i++) {
        $scope.previewSource[$scope.formatList[i].format] = null;
      }
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
      $scope.formBuilderData = formBuilderService.createFormBuilder();

      $scope.selectedNode = $scope.formBuilderData.treeData[0];

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
          var importedData = null;
          try {
            importedData = JSON.parse(event.target.result);
          }
          catch(err) {
            err.message += ': Content is not in json format. Aborted file loading.';
            showFhirResponse(event, {fhirError: err});
            return;
          }

          var version = formBuilderService.detectVersion(importedData);
          switch(version) {
            case 'STU3':
            case 'R4':
              try {
                importedData = LForms.Util.convertFHIRQuestionnaireToLForms(importedData, version);
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
        if($scope.selectedNode !== node && node && node.lfData && node.lfData.basic.code === 'basicItemLevelFields') {
          Def.Autocompleter.screenReaderLog('A new item '+
            $scope.getItem(node.lfData, 'question').value +
            ' is loaded into item builder panel');
        }
        $scope.selectedNode = node;
      };


      /**
       * Initialize lform data for widget preview.
       * @param jsonInput
       */
      function setPreviewData(jsonInput) {
        $scope.previewSource['lforms'] = toJsonFilter(jsonInput, ['_', '$']);
        var previewSrcObj = JSON.parse($scope.previewSource['lforms']);
        $scope.formatList.slice(0, ($scope.formatList.length - 1)).forEach(function (ele) {
          var fhirData = LForms.FHIR[ele.format].SDC.convertLFormsToQuestionnaire(previewSrcObj);
          $scope.previewSource[ele.format] = toJsonFilter(fhirData, ['_', '$']);
        });
        if(previewSrcObj.items.length > 0) {
          $scope.previewLfData = new LForms.LFormsData(previewSrcObj);
          if(previewSrcObj.id) {
            $scope.previewLfData.id = previewSrcObj.id;
          }

          //Customize preview in formbuilder.
          $scope.previewLfData.templateOptions = $scope.previewLfData.templateOptions || {};
          $scope.previewLfData.templateOptions.showFormHeader = false;
          $scope.previewLfData.templateOptions.hideFormControls = true;
          $scope.previewLfData.templateOptions.viewMode = 'md';
        }
        else {
          $scope.previewLfData = null;
        }
      }


      /**
       * Handle preview widget button
       */
      $scope.previewWidget = function() {
        var transformedObj = formBuilderService.transformFormBuilderToFormDef($scope.formBuilderData);

        if (transformedObj) {
          formBuilderService.removeInvalidAnswers(transformedObj);
          setPreviewData(transformedObj);
        }
      };



      /**
       * Refresh button handler
       */
      $scope.refreshPreview = function() {
        if($scope.selectedNode) {
          if($scope.selectedNode.isDirty) {
            $scope.changeThisAndAncestralCustomCodes($scope.selectedNode);
            $scope.selectedNode.isDirty = false;
          }
          $scope.selectedNode.previewItemData = formBuilderService.convertLfData($scope.selectedNode.lfData);
        }
        $scope.previewWidget();
      };


      /**
       * Handle file export button
       *
       */
      $scope.export = function(ev) {

        $scope.showFileExportDialog(ev, {formatList: $scope.formatList, selectedFormat: $scope.selectedFormat}).then(function (answer) {
          if(answer) {
            $scope.previewWidget();
            var content = $scope.previewSource[answer.format];
            var blob = new Blob([content], {type: 'application/json;charset=utf-8'});
            var formName = $scope.formBuilderData.treeData[0].lfData.basic.itemHash['/name/1'].value;
            var formShortName = $scope.formBuilderData.treeData[0].lfData.basic.itemHash['/shortName/1'].value;
            var exportFileName = formShortName ?  formShortName.replace(/\s/g, '-') : (formName ? formName.replace(/\s/g, '-') : 'form');

            // Use hidden anchor to do file download.
            var downloadLink = document.getElementById('exportAnchor');
            var urlFactory = (window.URL || window.webkitURL);
            if(objectUrl != null) {
              // First release any resources on existing object url
              urlFactory.revokeObjectURL(objectUrl);
            }
            objectUrl = urlFactory.createObjectURL(blob);
            downloadLink.setAttribute('href', objectUrl);
            downloadLink.setAttribute('download', exportFileName + '.' + answer.format + '.json');
            downloadLink.click();
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
        fhirService.setFhirServer($scope.getFhirServer());
        $scope.startSpin();
        fhirService.search(searchStr, true)
          .then(function(response) {
            $scope.stopSpin();
            $scope.showFhirResults(ev, {fhirResults: response.data});
          }, function (err) {
            $scope.stopSpin();
            showFhirResponse(ev, {fhirError: err});
          });
      };


      /**
       * Handle import from FHIR server
       *
       * @param ev - event object
       * @param searchStr - Optional search string
       */
      $scope.importFromFhir = function(ev, searchStr) {
        $scope.showFhirServerDialog(ev).then(function (server) {
          if(server) {
            $scope.searchFhir(ev, searchStr);
          }
        });
      };


      /**
       * Handle FHIR read operation
       *
       * @param ev - event object
       * @param resourceId - id of the FHIR resource to import
       */
      $scope.importFhirResource = function(ev, resourceId) {
        fhirService.read(resourceId).then(function (response) {
          try {
            var fServer = $scope.getFhirServer();
            $scope.$broadcast('REPLACE_FORM', LForms.Util.convertFHIRQuestionnaireToLForms(response.data, fServer.version));
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
        $scope.showFhirServerDialog(ev).then(function (server) {
          if(server) {
            $scope.previewWidget();
            fhirService.create($scope.previewSource[$scope.getFhirServer().version], $scope.userProfile)
              .then(function (response) {
                $scope.formBuilderData.id = response.data.id;
                formBuilderService.getFormBuilderField($scope.formBuilderData.treeData[0].lfData.basic.items, 'id').value = response.data.id;
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
        fhirService.update($scope.previewSource[$scope.getFhirServer().version], $scope.userProfile)
          .then(function () {
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
        localScope.importFhirResource = $scope.importFhirResource;
        localScope.userProfile = $scope.userProfile;
        localScope.showFhirResponse = showFhirResponse;
        localScope.startSpin = $scope.startSpin;
        localScope.stopSpin = $scope.stopSpin;

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
        localScope.startSpin = $scope.startSpin;
        localScope.stopSpin = $scope.stopSpin;

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
        dataConstants.fhirServerList.some(function (server) {
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
        var size = $scope.formBuilderData.treeData.length;
        // The reference of $scope.formBuilderData.treeData is used in ui-tree (side bar). Update content of the array,
        // do not change the reference.
        [].splice.apply($scope.formBuilderData.treeData, [0, size].concat(lfFormData.treeData));
      };


      /**
       * See if edits to this node impacts its ancestors
       *
       * @param node - Node to check for changes.
       */
      $scope.changeThisAndAncestralCustomCodes = function(node) {
        var malignedNodes = formBuilderService.getAncestralNodes($scope.formBuilderData.treeData, node);
        formBuilderService.changeItemCodeToCustomCode(malignedNodes);
      };


      /**
       * Get an lfItem using a field name. Looks at only top level fields, i.e nested items are not returned.
       *
       * @param lfData - LForms data object
       * @param fieldName - Field name
       * @returns {*}
       */
      $scope.getItem = function (lfData, fieldName) {
        var ret = null;
        var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];

        if(indexInfo) {
          ret = formBuilderService.getFormBuilderField(lfData[indexInfo.category].items, fieldName);
        }
        else {
          var key = '/'+fieldName+'/1';
          ret = lfData.basic.itemHash[key];
          ret = ret ? ret : lfData.advanced.itemHash[key];
        }
        return ret;
      };


      /**
       * See if this lforms object represents form node
       *
       * @param lfData - LForms data object of the node.
       * @returns {boolean}
       */
      $scope.isForm = function (lfData) {
        return formBuilderService.isNodeFbLfForm(lfData);
      };


      /**
       * See if this lforms object represents an item node
       *
       * @param lfData - LForms data object of the node.
       * @returns {boolean}
       */
      $scope.isItem = function (lfData) {
        return formBuilderService.isNodeFbLfItem(lfData);
      };


      /**
       * See if this lforms object represents a header item node
       *
       * @param lfData - LForms data object of the node.
       * @returns {*}
       */
      $scope.isHeaderItem = function (lfData) {
        var ret = false;
        if(formBuilderService.isNodeFbLfItem(lfData)) {
          var indexInfo = dataConstants.INITIAL_FIELD_INDICES['header'];
          ret = formBuilderService.getFormBuilderField(lfData[indexInfo.category].items, 'header').value.code;
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
            $scope.$on('LF_FIREBASE_AUTH_SIGNEDIN', function() {
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
      $rootScope.$on('us-spinner:stop', function() {
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

      $rootScope.$on('LF_FIREBASE_AUTH_SIGNEDOUT', function () {
        $scope.userProfile = null;
        $scope.isUserSignedIn = false;
        $scope.$apply();
      });


      $rootScope.$on('LF_FIREBASE_AUTH_RESOURCE_CREATED', function () {
        $scope.$apply();
      });

      $scope.updateLFData($scope.formBuilderData);
    }]);
