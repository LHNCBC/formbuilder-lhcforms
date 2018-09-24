
const fhirMock = require('./formbuilder/fhir-mock');

fhirMock('http://hapi.fhir.org').persist();
let app = require('../../server')(require('../../formbuilder.conf'));
app.start();
