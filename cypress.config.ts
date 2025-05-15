import { defineConfig } from 'cypress'
import installLogsPrinter from "cypress-terminal-report/src/installLogsPrinter";

export default defineConfig({
  video: false,
  viewportWidth: 1000,
  viewportHeight: 660,
  watchForFileChanges: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      let options = {};
      if(config.env.CYPRESS_LOG === 'log') {
        options = {
          printLogsToFile: 'always',
          outputRoot: config.projectRoot+'/logs/',
          specRoot: 'cypress/e2e',
          outputTarget: {
            'cypress-logs|txt': 'txt',
            'cypress-logs|json': 'json'
          }
        }
      }
      installLogsPrinter(on, options);
      return require('./cypress/plugins/index.ts')(on, config);
    },
  },
  reporter: 'dot',
})
