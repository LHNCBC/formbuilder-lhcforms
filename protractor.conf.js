// Protractor configuration
// https://github.com/angular/protractor/blob/master/referenceConf.js

'use strict';

var FirefoxProfile = require('firefox-profile');
var q = require('q');

var envConfig;
try {
  envConfig = require('./formbuilder.conf');
} catch(e) {
  envConfig = {};
}

var prot = envConfig.https ? 'https' : 'http';
var baseUrl = prot + '://localhost:' + envConfig.port;

function getMultiCapabilities() {
  "use strict";
  var deferred = q.defer();
  var firefoxProfile = new FirefoxProfile();
  firefoxProfile.setPreference("browser.download.folderList", 2);
  firefoxProfile.setPreference("browser.download.manager.showWhenStarting", false);
  firefoxProfile.setPreference("browser.download.dir", '/tmp');
  firefoxProfile.setPreference("browser.download.useDownloadDir", true);
  firefoxProfile.setPreference("browser.helperApps.neverAsk.saveToDisk", "application/json");

  firefoxProfile.setPreference("network.http.phishy-userpass-length", 255);
  firefoxProfile.setPreference("network.automatic-ntlm-auth.trusted-uris", "localhost");

  firefoxProfile.encoded(function(encodedProfile) {
    var multiCapabilities = [/*{
      browserName: 'firefox',
      firefox_profile : encodedProfile
    },*/{
      browserName: 'chrome',
      chromeOptions: {
        prefs: {
          download: {
            'prompt_for_download': false,
            'directory_upgrade': true,
            'default_directory': '/tmp'
          }
        },
        args: ['disable-infobars', 'allow-insecure-localhost', 'window-size=1600,1400']
      }
    }];
    deferred.resolve(multiCapabilities);
  });
  return deferred.promise;
}

exports.config = {
  // The timeout for each script run on the browser. This should be longer
  // than the maximum time your application needs to stabilize between tasks.
  allScriptsTimeout: 110000,

  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: baseUrl,

  // If true, only chromedriver or firefox driver will be started, not a standalone selenium.
  // Tests for browsers other than chrome and firefox will not run.
  directConnect: true,

  // list of files / patterns to load in the browser
  specs: [
    'test/e2e/**/*.spec.js'
  ],

  // Patterns to exclude.
  exclude: [],

  // ----- Capabilities to be passed to the webdriver instance ----
  //
  // For a full list of available capabilities, see
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities
  // and
  // https://code.google.com/p/selenium/source/browse/javascript/webdriver/capabilities.js
  //capabilities: {'browserName': 'chrome'},
  // Fix the port number so we can restrict access to it via iptables
  seleniumPort: 4444,
  getMultiCapabilities: getMultiCapabilities,
  // ----- The test framework -----
  //
  // Jasmine and Cucumber are fully supported as a test and assertion framework.
  // Mocha has limited beta support. You will need to include your own
  // assertion framework if working with mocha.
  framework: 'jasmine2',

  // ----- Options to be passed to minijasminenode -----
  //
  // See the full list at https://github.com/juliemr/minijasminenode
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000,
    print: function() {}
  },

  onPrepare: function(){
    /**
     * By default, protracotor expects it to be angular application. This is used
     * to switch between angular and non angular sites.
     *
     * @param {Boolean} flag
     * @returns {void}
     */
    global.setAngularSite = function(flag){
      browser.ignoreSynchronization = !flag;
    };

    // Replace default dot reporter with something better.
    var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
    // add jasmine spec reporter
    jasmine.getEnv().addReporter(new SpecReporter({spec: {displayStacktrace: true}}));

    // Copied from lforms project to disable animation for testing. -Ajay 04/20/2017
    // disable animation
    // http://stackoverflow.com/questions/26584451/how-to-disable-animations-in-protractor-for-angular-js-appliction
    var disableNgAnimate = function() {
      angular
        .module('disableNgAnimate', [])
        .run(['$animate', function($animate) {
          $animate.enabled(false);
        }]);
    };

    var disableCssAnimate = function() {
      angular
        .module('disableCssAnimate', [])
        .run(function() {
          var style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = '* {' +
            '-webkit-transition: none !important;' +
            '-moz-transition: none !important' +
            '-o-transition: none !important' +
            '-ms-transition: none !important' +
            'transition: none !important' +
            '}';
          document.getElementsByTagName('head')[0].appendChild(style);
        });
    };

    // disable ng-animate during the testing
    browser.addMockModule('disableNgAnimate', disableNgAnimate);
    browser.addMockModule('disableCssAnimate', disableCssAnimate);
  }
};
