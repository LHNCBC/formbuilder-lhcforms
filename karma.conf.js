// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'https://www.gstatic.com/firebasejs/4.13.0/firebase.js',

      /* bower:js */
      'client/bower_components/jquery/dist/jquery.js',
      'client/bower_components/jquery-ui/ui/core.js',
      'client/bower_components/jquery-ui/ui/widget.js',
      'client/bower_components/jquery-ui/ui/button.js',
      'client/bower_components/jquery-ui/ui/dialog.js',
      'client/bower_components/jquery-ui/ui/datepicker.js',
      'client/bower_components/lodash/lodash.js',
      'client/bower_components/angular/angular.js',
      'client/bower_components/angular-animate/angular-animate.js',
      'client/bower_components/angular-aria/angular-aria.js',
      'client/bower_components/angular-messages/angular-messages.js',
      'client/bower_components/angular-cookies/angular-cookies.js',
      'client/bower_components/angular-file-upload/dist/angular-file-upload.min.js',
      'client/bower_components/angular-material/angular-material.js',
      'client/bower_components/angular-material-icons/angular-material-icons.min.js',
      'client/bower_components/angular-resource/angular-resource.js',
      'client/bower_components/angular-route/angular-route.js',
      'client/bower_components/angular-sanitize/angular-sanitize.js',
      'client/bower_components/angular-strap/dist/angular-strap.js',
      'client/bower_components/angular-strap/dist/angular-strap.tpl.js',
      'client/bower_components/angular-touch/angular-touch.js',
      'client/bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js',
      'client/bower_components/angular-ui-date/src/date.js',
      'client/bower_components/angular-ui-layout/src/ui-layout.js',
      'client/bower_components/angular-ui-tree/dist/angular-ui-tree.js',
      'client/bower_components/es5-shim/es5-shim.js',
      'client/bower_components/bootstrap/dist/js/bootstrap.js',
      'client/bower_components/json3/lib/json3.js',
      'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'client/bower_components/autocomplete-lhc/source/polyfill.js',
      'client/bower_components/autocomplete-lhc/source/prototype_api.js',
      'client/bower_components/autocomplete-lhc/source/effects.js',
      'client/bower_components/autocomplete-lhc/source/effectScroll.js',
      'client/bower_components/autocomplete-lhc/source/event.simulate.js',
      'client/bower_components/autocomplete-lhc/source/observable.js',
      'client/bower_components/autocomplete-lhc/source/screenReaderLog.js',
      'client/bower_components/autocomplete-lhc/source/recordDataRequester.js',
      'client/bower_components/autocomplete-lhc/source/fieldAlarms.js',
      'client/bower_components/autocomplete-lhc/soundmanager/bonk.js',
      'client/bower_components/autocomplete-lhc/source/dialog.js',
      'client/bower_components/autocomplete-lhc/source/autoCompBase.js',
      'client/bower_components/autocomplete-lhc/source/suggestionDialog.js',
      'client/bower_components/autocomplete-lhc/source/autoCompPrefetch.js',
      'client/bower_components/autocomplete-lhc/source/autoCompSearch.js',
      'client/bower_components/autocomplete-lhc/source/autoCompEvents.js',
      'client/bower_components/autocomplete-lhc/source/autocomplete-lhc.js',
      'client/bower_components/ngSmoothScroll/lib/angular-smooth-scroll.js',
      'client/bower_components/element-resize-detector/dist/element-resize-detector.js',
      'client/bower_components/lforms/app/lforms.js',
      'client/bower_components/lforms/app/scripts/lforms-constants.js',
      'client/bower_components/lforms/app/scripts/lforms-config.js',
      'client/bower_components/lforms/app/scripts/lforms-controllers.js',
      'client/bower_components/lforms/app/scripts/lforms-directives.js',
      'client/bower_components/lforms/app/scripts/bootstrap-decorators.js',
      'client/bower_components/lforms/app/scripts/lib/date.js',
      'client/bower_components/lforms/app/scripts/lib/js-class.js',
      'client/bower_components/lforms/app/scripts/lib/cross_browser.js',
      'client/bower_components/lforms/app/scripts/lib/lforms-util.js',
      'client/bower_components/lforms/app/scripts/lib/polyfill.js',
      'client/bower_components/lforms/app/scripts/lib/lforms-hl7.js',
      'client/bower_components/lforms/app/scripts/lib/lforms-validate.js',
      'client/bower_components/lforms/app/scripts/lib/lforms-data.js',
      'client/bower_components/lforms/app/scripts/fhir/versions.js',
      'client/bower_components/lforms/app/lforms.tpl.js',
      'client/bower_components/traverse/traverse.js',
      'client/bower_components/spin.js/spin.js',
      'client/bower_components/angular-spinner/angular-spinner.js',
      'client/bower_components/fhir.js/ngFhir.js',
      /* endbower */

      'client/bower_components/lforms/app/scripts/fhir/STU3/lformsFHIR.js',
      'client/bower_components/angular-mocks/angular-mocks.js',

      'client/app/**/*.js',
      'client/app/**/*.html',
      'test/client/**/*.js'
    ],

    preprocessors: {
//      '**/*.jade': 'ng-jade2js',
//      '**/*.html': 'html2js',
//      '**/*.coffee': 'coffee'
    },

    ngHtml2JsPreprocessor: {
      stripPrefix: 'client/'
    },

    ngJade2JsPreprocessor: {
      stripPrefix: 'client/'
    },

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    reporters: ['spec'],

    plugins: [
      'karma-spec-reporter',
      'karma-jasmine',
      'karma-phantomjs-launcher'
    ],
    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
