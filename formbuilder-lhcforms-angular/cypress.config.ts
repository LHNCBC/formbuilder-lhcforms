import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  viewportWidth: 1000,
  viewportHeight: 660,
  watchForFileChanges: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
  },
  reporter: 'dot',
})
