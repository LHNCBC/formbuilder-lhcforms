// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const lformsVersion = '36.0.3';

module.exports = function (config) {
  config.set({
    files: [
      `https://lhcforms-static.nlm.nih.gov/lforms-versions/${lformsVersion}/webcomponent/styles.css`,
      `https://lhcforms-static.nlm.nih.gov/lforms-versions/${lformsVersion}/webcomponent/zone.min.js`,
      `https://lhcforms-static.nlm.nih.gov/lforms-versions/${lformsVersion}/webcomponent/lhc-forms.js`,
      `https://lhcforms-static.nlm.nih.gov/lforms-versions/${lformsVersion}/fhir/lformsFHIRAll.min.js`,
    ],
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/formbuilder-lhcforms'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless_without_password_security'],
    customLaunchers: {
      ChromeHeadless_without_password_security: {
        base: 'ChromeHeadless',
        flags: ['--password-store=basic']
      },
      ChromeDebug: {
        base: 'Chrome',
        flags: ['--password-store=basic']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
