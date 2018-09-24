'use strict';

angular.module('formBuilder')
  .config(['$routeProvider', '$locationProvider', '$compileProvider',
    function($routeProvider, $locationProvider, $compileProvider) {

      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
  
    $routeProvider
      .when('/', {
        templateUrl: 'app/form-builder/form-builder.html',
        controller: 'FormBuilderCtrl'
      })
      .when('/form-?builder/:source?/:formId?', {
        templateUrl: 'app/form-builder/form-builder.html',
        controller: 'FormBuilderCtrl'
      });

      $locationProvider.html5Mode(true);

  }]);
