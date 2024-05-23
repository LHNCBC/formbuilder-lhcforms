// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html


module.exports = function (config) {
  config.set({
    files: [
      {
        pattern: './node_modules/lforms-loader/dist/lformsLoader.js',
        type: 'module'
      },
      {
        pattern: './src/app/testing/karma-lforms-loader.js',
        type: 'module'
      },
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
        flags: ['--password-store=basic', '--disable-crash-reporter']
      },
      ChromeDebug: {
        base: 'Chrome',
        flags: ['--password-store=basic', '--disable-crash-reporter']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
