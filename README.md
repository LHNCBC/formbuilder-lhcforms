## What is NLM Form Builder?
NLM Form Builder is an open source web application to create and edit a
[FHIR questionnaire](https://hl7.org/fhir/questionnaire.html) resource, which
creates input forms supporting medical terminologies such as
[LOINC](https://loinc.org) and [SNOMED](https://www.snomed.org). This tool is
written in Angular framework and is developed by the [Lister Hill National Center
for Biomedical Communications (LHNCBC)](https://lhbcbc.nlm.nih.gov), [National
Library of Medicine (NLM)](https://www.nlm.nih.gov), part of the [National
Institutes of Health (NIH)](https://www.nih.gov). It includes a preview of the
generated form using [LHCForms](https:lhncbc.github.io/lforms/)
widget.

## Licensing and Copyright Notice
See [LICENSE.md](LICENSE.md).

## Customizing and Contributing
If you wish to revise this package, the following steps will allow you install
and to make changes and test them.
### Installation
- Install **Node.js** (For currently supported version check
  `bashrc.formbuilder`).
- Clone the [repository from github](https://github.com/LHNCBC/formbuilder-lhcforms)
  and cd to its directory.
- `source bashrc.formbuilder` # (make sure node dir is available at ~/).
- `npm ci`
- `source bashrc.formbuilder` # to add node_modules/.bin to your path.
- `npm run build` # build the application.
- `npm run start` # starts the dev server. Navigate to https://localhost:9030.
- `npm run start-public` # if you need to access to the dev server from a
  different machine. For example, to run Narrator from a Windows PC.
- `npm run test` # runs the unit tests and e2e tests. The e2e tests are written
in [Cypress](https://www.cypress.io) and [Playwright](https://playwright.dev) frameworks.

If you are planning to contribute new functionality back to us, please
coordinate with us, so that the new code is in the right places, and so that
you don't accidentally add something that we are also working on.

## Application Programming Interface (API)
The form builder is an application. However, it is possible to control it via
JavaScript from another web page. Refer to [API.md](API.md)
for documentation.
        

        
