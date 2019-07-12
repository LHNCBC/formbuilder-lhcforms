/**
 * Setup application related constants
 * */

angular.module('formBuilderConfig', ['ngMaterial'])
  .factory('beforeUnload', function ($rootScope, $window) {

    $window.onbeforeunload = function () {
      var event = $rootScope.$broadcast('BEFORE_UNLOAD');
      if (event.defaultPrevented) {
        return '';
      }
    };

    $window.onunload = function () {
      $rootScope.$broadcast('UNLOAD');
    };
    return {};
  })
  .constant('dataConstants', {
    TARGET_FHIR_HEADER: 'x-target-fhir-endpoint',
    TARGET_FHIR_AUTH_HEADER: 'x-target-fhir-server-authorization',

    formDefURL: 'https://clin-table-search.lhc.nlm.nih.gov/loinc_form_definitions?',
    searchLoincPropertyURL: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?type=question&df=PROPERTY&sf=LOINC_NUM',
    searchQuestionsURL: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?type=question&ef=text,answers,units,datatype&df=LOINC_NUM,text',
    searchFormsURL: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?type=form_and_section&available=true&df=LOINC_NUM,text',

    QUESTION_ID: '/question/1',
    CODING_SYSTEM_ID: '/questionCodeSystem/1',
    CODE_ID: '/questionCode/1',
    HEADER_ID: '/header/1',
    DATATYPE_ID: '/dataType/1',
    SKIPLOGIC_ID: '/useSkipLogic/skipLogic/1/1',
    USE_SKIPLOGIC_ID: '/useSkipLogic/1',
    USE_DATACONTROL_ID: '/useDataControl/1',

    QUESTION: 'question',
    CODE: 'questionCode',
    DATATYPE: 'dataType',
    ANSWERS: 'answers',
    PANEL: 'panel',
    INITIAL_FIELD_INDICES: {},
    INSERT_BEFORE: 'INSERT_BEFORE',
    INSERT_AFTER: 'INSERT_AFTER',
    INSERT_AS_CHILD: 'INSERT_AS_CHILD',
    APPEND_TO_ROOT: 'APPEND_TO_ROOT',
    LOINC: 'LOINC',
    CUSTOM: 'Custom',

    /*

    List of fhir servers.
    The server object definition:
     {
         id:          // Helps to track the object in angular template binding
         displayName: // Name as seen by the user
         endpoint:    // The url of the FHIR API endpoint to be assigned to
                      // x-target-fhir-endpoint
         basicAuth:   // Optional basic authentication string to be assigned to
                      // x-target-fhir-server-authorization header.
         version:     // FHIR version, ex: STU3, R4 ...
     }
    */
    fhirServerList: [
      {
        id: 1,
        displayName: 'UHN HAPI Server - R4',
        endpoint: 'http://hapi.fhir.org/baseR4',
        desc: "Public FHIR server at fhir.org",
        version: 'R4'
      },
      {
        id: 2,
        displayName: 'UHN HAPI Server - STU3',
        endpoint: 'http://hapi.fhir.org/baseDstu3',
        desc: "Public FHIR server at fhir.org",
        version: 'STU3'
      },
      // {
      //   id: 3,
      //   displayName: 'HealthConnex STU3 server',
      //   endpoint:'http://sqlonfhir-stu3.azurewebsites.net/fhir',
      //   version:'STU3',
      //   everythingOperation:true
      // },
      {
        id: 4,
        displayName: 'clinFHIR R3',
        endpoint:'http://snapp.clinfhir.com:8081/baseDstu3',
        version: 'STU3'
      }
    ] /*,
    // TODO - Uncomment this after merges with form level properties changes.
    // To compare changes to form level properties.
    defaultFormProps: {
      name: 'New Form',
      status: 'draft'
    }*/

}).run(function($rootScope, dataConstants, beforeUnload) {
    // Cache indices of initial form builder items.
    formBuilderDef.items.forEach(function (item, index) {
      dataConstants.INITIAL_FIELD_INDICES[item.questionCode] = {category: 'basic', index: index};
    });

    advFormBuilderDef.items.forEach(function (item, index) {
      dataConstants.INITIAL_FIELD_INDICES[item.questionCode] = {category: 'advanced', index: index};
    });

    $rootScope.dataConstants = dataConstants;
  }).config(function ($mdThemingProvider) {
    var lhcPalette = $mdThemingProvider.extendPalette('blue', {
        '500': '#337AB7' // Matching with lforms widget header
    });
    // Register the new color palette map with the name
    $mdThemingProvider.definePalette('lhcPalette', lhcPalette);
    // Use that theme for the primary intentions
    $mdThemingProvider.theme('default')
      .primaryPalette('lhcPalette');
  });
