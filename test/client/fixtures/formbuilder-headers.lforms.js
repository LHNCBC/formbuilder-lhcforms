var lformsFormBuilderHeaders = {
  "id": "11",
  "meta": {
    "versionId": "m1.0",
    "source": "http://lforms-fhir.nlm.nih.gov/test.html",
    "profile": [
      "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire"
    ],
    "security": [
      {
        "system": "http://www.nlm.nih.gov/security",
        "version": "s1.0",
        "code": "securitycode",
        "display": "Security Code",
        "userSelected": true
      }
    ],
    "tag": [
      {
        "system": "http://www.nlm.nih.gov/tag",
        "version": "t1.0",
        "code": "tagcode",
        "display": "Tag Code",
        "userSelected": true
      }
    ]
  },
  "implicitRules": "http://www.nlm.nih.gov/umplicitrules",
  "language": "English",
  "url": "http://lforms-fhir.nlm.nih.gov/testQuestionnaire.html",
  "version": "q1.0",
  "shortName": "Test Form",
  "name": "Test Title",
  "deriveFrom": [
    "http://lforms-fhir.nlm.nih.gov/draftQuestionnaire.html"
  ],
  "status": "draft",
  "experimental": true,
  "subjectType": [
    "Provider",
    "Device"
  ],
  "publisher": "LHC",
  "description": "test description",
  "purpose": "test purpose",
  "copyright": "MIT license",
  "approvalDate": "2019-04-01",
  "lastReviewDate": "2019-04-02",
  "effectivePeriod": {
    "start": "2019-04-04T04:00:00.000Z",
    "end": "2019-04-30T04:00:00.000Z"
  },
  "codeList": [
    {
      "system": "http://loinc.org",
      "version": "c1.0",
      "code": "123456-7",
      "display": "Test LOINC code",
      "userSelected": false
    }
  ]
};