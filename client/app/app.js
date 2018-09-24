'use strict';

var fhirProvider = null;

angular.module('formBuilder', [
  'angularSpinner',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngAnimate',
  'formBuilderConfig',
  'lformsWidget',
  'angularFileUpload',
  'ngMaterial',
  'ngMdIcons',
  'ng-fhir',
  'smoothScroll',
  'ui.layout',
  'ui.tree'
])
// Use bower lodash instead of ngLodash. Ng lodash is missing some functionality,
// does not have its own documentation, and maintained by a third party.
.constant('lodash', window._)
.config(['$mdIconProvider', '$fhirProvider', function ($mdIconProvider, $fhirProvider) {
  $mdIconProvider
    .iconSet('social', 'img/icons/sets/social-icons.svg', 24)
    .defaultIconSet('img/icons/sets/core-icons.svg', 24);

  $fhirProvider.baseUrl = '/fhir-api';
  fhirProvider = $fhirProvider;

}])
.run(function ($rootScope, lodash, firebaseService) {
  $rootScope.lodash = lodash;
  firebaseService.initFirebase();
  $rootScope.fhirHeaders = {};
  fhirProvider.headers = $rootScope.fhirHeaders;

  $rootScope.auth = {};
  fhirProvider.auth = $rootScope.auth;
});

