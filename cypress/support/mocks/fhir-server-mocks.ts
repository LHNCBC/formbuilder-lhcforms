export const searchFHIRServer = (titleSearchTerm, fixtureFile) => {
  cy.intercept(`**title:contains=${titleSearchTerm}**`, {fixture: fixtureFile}).as('searchFHIRServer');
};
