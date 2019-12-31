exports.run = function(browser, baseUrl) {
  browser.addMockModule('httpMocker', function() {
    angular.module('httpMocker', ['App', 'ngMockE2E'])
      .run(function($httpBackend, config) {
        if(!baseUrl) {
          baseUrl = config.backEndUrl;
        }

        var r4Resp = {
          resourceType: 'CapabilityStatement',
          implementation: {
            description: 'UHN Test Server (R4 Resources)',
            url: baseUrl
          },
          fhirVersion: '4.0.0'
        };

        var r3Resp = {
          resourceType: 'CapabilityStatement',
          implementation: {
            description: 'UHN Test Server (STU3 Resources)',
            url: baseUrl
          },
          fhirVersion: '3.0.1'
        };

        var resp = baseUrl.match(/\/(baseDstu3|r3)\//i) ? r3Resp : r4Resp;

        $httpBackend.whenGET(baseUrl + '/metadata')
          .respond(resp);

        $httpBackend.whenGET(/.*/).respond(401);
      });
  });
};