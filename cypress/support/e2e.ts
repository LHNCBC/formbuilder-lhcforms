// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-real-events';
import failOnConsoleError from 'cypress-fail-on-console-error';

const config = {
  consoleMessages: [
    // Ignore the simulated console error to test non-existent FHIR server.
    'Http failure response for http://localhost/metadata:',
    // TODO -
    //  The following is a result of bug in lforms while processing answerValueSet field. Remove it
    // after the bug is fixed in lforms.
    /Access to XMLHttpRequest at 'https:\/\/lforms-fhir.nlm.nih.gov\/baseR4\/ValueSet%2F%24expand\?/,
    /the list of LForms versions from https:\/\/lhcforms-static.nlm.nih.gov\/lforms-versions/,
    / /
  ]
};

failOnConsoleError(config);

