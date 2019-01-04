# Change log

This project follows [Semantic Versioning](http://semver.org/).

## [2.1.3]  2018-12-26
### Changed.
-  Updated lforms package which has support for parsing argonaut questionnaires.

## [2.1.2]  2018-11-27
### Fixed.
-  Add google analytics to white list of content security policy.

## [2.1.1]  2018-11-27
### Fixed.
-  Fix bower package name.

## [2.1.0]  2018-10-29
### Added.
-  Support to export and import FHIR Questionnaire to local disk.

## [2.0.0]  2018-10-29
### Changed.
- Changed module exports of the server. Newly exported functions 
will help to pre-configure the express app with customized middlewares before doing 
form builder specific configurations. 

This is a breaking change due to signature changes in import/require statements if using
this as an npm package.

## [1.0.4]  2018-10-17
### Fixed
- Fixed bower packaging issues.

## [1.0.3]  2018-10-05
### Fixed
- Fixed npm audited vulnerabilities.

## [1.0.2]  2018-10-02
### Added
- In units field, units associated with item's loinc property are 
ranked higher during the auto-completion.
### Fixed
- Fixed a bug in usage clause of the server.

## [1.0.1]  2018-09-28
### Changed
- Rename package 

## [1.0.0]  2018-09-12
### Changed
- Cleanup code to release as open source

## [0.8.8]  2018-08-20
### Changed
- Updated node version to 8.11.4

## [0.8.7]  2018-07-20
### Changed
- Switch protractor browser from firefox to chrome and update protractor to 5.x.x

## [0.8.6]  2018-06-08
### Changed
- Used lforms-util logger to create web server access logs.
- Upgraded nodejs to version 8.11.3.

## [0.8.5]  2018-06-07
### Changed
- Changed units lookup from static list to ajax call to clinical table search 
  service and used table format display for auto completion.

## [0.8.4]  2018-06-01
### Added
- Used grunt wiredep to inject bower components into karma.conf.js

## [0.8.3]  2018-05-24
### Added
- Added tags for google analytics

## [0.8.2]  2018-05-14
### Fixed
- Fixed the behavior of the autocompleting field and Import button in the Import
  dialog so that the currently selected field value is what gets imported.

## [0.8.1]  2018-05-09
### Fixed
- Fixed a bug in importing questionCardinality and answerCardinality fields.

## [0.8.0]  2018-04-27
### Added
- Added support to access multiple FHIR servers.

## [0.7.1]  2018-04-05
### Added
- Added server redirect from urls with alias names to main production url.

## [0.7.0]  2018-04-03
### Added
- Added firebase authentication.
- Added Export and import from FHIR server
- moved advanced panel items under their boolean as skip logic items.

## [0.6.6]  2017-11-29
### Changed
- Update pm2 package and remove nsp exception on moment package.

## [0.6.5]  2017-11-21
### Changed
- Updated npm packages and nodejs.

## [0.6.1]  2017-06-15
### Changed
- The scroll bars on the preview panel are moved from
  whole panel to tab content.

## [0.6.0]  2017-06-12
### Added
- Added FHIR output to preview source tabs.
### Fixed
- Fixed popup menu display under production environment.

## [0.5.0]  2017-05-31
### Added
- Added popup menu to the nodes on the side bar.
- Added dialog box to capture target item to
  move nodes on the side bar using popup menu items.
### Fixed
- Addressed some accessibility issues.
- Fixed converting section/header to regular item
- Fixed displaying other in answer list item.
### Changed
- Changed Text and Code fields to be required.

