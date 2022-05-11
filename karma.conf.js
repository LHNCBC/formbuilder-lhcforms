// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [
      'dist/formbuilder-lhcforms/lforms/lib/elements/assets/lib/zone.min.js',
      'dist/formbuilder-lhcforms/lforms/lib/elements/runtime-es5.js',
      'dist/formbuilder-lhcforms/lforms/lib/elements/polyfills-es5.js',
      'dist/formbuilder-lhcforms/lforms/lib/elements/scripts.js',
      'dist/formbuilder-lhcforms/lforms/lib/elements/main-es5.js',
      'dist/formbuilder-lhcforms/lforms/lib/fhir/lformsFHIRAll.min.js',
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
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
