# Change log

This project follows [Semantic Versioning](http://semver.org/).

## [10.0.2] 2025-03-24
### Fixed
- Fixed a playwright test.

## [10.0.1] 2025-03-20
### Fixed
- Avoid angular@19.2.x versions in the dependency tree

## [10.0.0] 2025-01-09
### Added
- Added R5 features

## [9.7.7] 2025-03-04
### Changed
- Fixed an accessibility issue.

## [9.7.6] 2025-02-20
### Changed
- Upgraded to angular19

## [9.7.5] 2025-01-31
### Added
- Added item control list for display data type.

## [9.7.4] 2025-01-06
### Changed
- Updated README.md

## [9.7.3] 2024-12-11
### Changed
- Added validation and error handling for invalid enableWhen question.

## [9.7.2] 2024-12-10
### Added
- Added meta.tag field to form level attributes.

## [9.7.1] 2024-12-20
### Changed
- Remove unused ItemJsonEditorComponent.

## [9.7.0] 2024-12-09
### Added
- Added feature to re-order answer options in a question item.
### Changed
- Change background color of the focused node on the sidebar tree.
### Fixed
- Fixed intermittent failures of unit tests
- Fixed alignment of node with children in the sidebar tree.

## [9.6.13] 2024-11-18
### Changed
- Display the questionnaire title as 'Untitled Form' if it is empty.

## [9.6.12] 2024-11-20
### Added
- Added a message for FHIR server validation.

## [9.6.11] 2024-10-24
### Fixed
- Fix bug in units when adding a number type question from LOINC.
### Changed
- Added aria-labels to radio group elements to improve accessibility.

## [9.6.10] 2024-11-01
### Added
- Added functionality for item validation and corresponding error display.
- Added editable link id field.

## [9.6.9] 2024-10-17
### Changed
- Added Group Item Control options.

## [9.6.8] 2024-09-18
### Fixed
- Fixed help item showing as a node in the tree.
### Added
- Added support for extensions of rendering styles and rendering xhtml to
- question text, prefix and help text fields.

## [9.6.7] 2024-10-03
### Changed
- Split the 'header (group/display)' data type option into separate options.

## [9.6.6] 2024-09-27
### Added
- Added a reset button for the Answer Choices Default selection.

## [9.6.5] 2024-09-18
### Fixed
- Change protocol of hapi.fhir.org urls to https.

## [9.6.4] 2024-07-10
### Added
- Use $validate API on FHIR server to validate Questionnaire.
- Added `canceled` event type to messages sent to parent window when using window.open() API.

## [9.6.3] 2024-07-15
### Fixed
- Fixed the issue where the 'Terminology server' field was not refreshed when the 'SNOMED answer value set' option was selected and the ECL field changed.
### Changed
- Changed tooltip font, background and link colors.
- Updated the tooltip text to be read by screen reader.

## [9.6.2] 2024-07-03
### Changed
- Fix a bug to retain contained field in Questionnaire.

## [9.6.1] 2024-06-17
### Changed
- Update @lhncbc/ngx-schema-form to address a performance issue.

## [9.6.0] 2024-06-06
### Changed
- Accept terms of use only once a week.

## [9.5.1] 2024-06-04
### Added
- Added sequence numbers to questions in conditional display source field. (Thanks to @ghaliouss)

## [9.5.0] 2024-06-04
### Changed
- Upgraded to angular 17.

## [9.4.3] 2024-06-04
### Added
- Feature to add a copy of a selected node of a questionnaire item tree
  (contributed by @ghaliouss).

## [9.4.2] 2024-05-08
### Added
- Menu option to download LHC-Forms format.

## [9.4.1] 2024-04-29
### Added
- Added notice for window opener invocation.
### Fixed 
- Display error messages in preview reported by lforms widget.

## [9.4.0] 2024-04-01
### Added 
- Added a feature to invoke formbuilder from a parent window,
  in a new child window and optionally initialize it with a questionnaire.
- If opened from another window, the formbuilder will post a message
  back the parent window with the updated questionnaire. It will post a final message,
  when the child window is closed, with final version of questionnaire.

## [9.3.3] 2024-04-11
### Changed
- Added a tagline to header.
- Changed text in terms of use.
- Added text to preview dialog

## [9.3.2] 2024-04-08
### Fixed
- Fixed flaky unit tests.

## [9.3.1] 2024-03-28
### Fixed
- Fixed a cypress test.


## [9.3.0] 2024-02-013
### Changed
- Always use the latest lforms version for preview. The package is loaded
  at run time from the CDN.

## [9.2.8] 2024-02-06
### Fixed
- Fixed missing nested extensions.

## [9.2.7] 2024-02-06
### Fixed
- Disable unsupported date/time restrictions (Thanks to @ghaliouss)

## [9.2.6] 2024-02-06
### Fixed
- Fix enableWhen condition when source item is an answerValueSet.

## [9.2.5] 2024-01-30
### Fixed
- Fixed README.

## [9.2.4] 2024-01-22
### Fixed
- Fixed a bug where a wrong node in the sidebar tree is highlighted.

## [9.2.3] 2023-10-27
### Fixed
- Fixed a bug where the unit extensions are not removed when deleted from the input field.
- Fixed a bug where the system field is missing after loading an item with a non-ucum unit.
- Changed the help text field to allow multi-line input.

## [9.2.2] 2023-10-13
### Added
- Added item control extension to support radio and checkbox layout for answer list.

## [9.2.1] 2023-08-28
### Added
- Added support for stu3 export and import.

## [9.2.0] 2023-08-03
### Added
- Added these fields to advanced section in the form level fields: 
  implicit rules, version, name, date, publisher, copyright, approvalDate, lastReviewDate
### Changed
- Converted schema and layout json files to json5 format.
- Refactored the widget configuration code for better organization of widgets defined in schema.

## [9.1.6] 2023-08-22
### Changed
- Updated the copy-lforms.js script to use the latest version (v34) of lforms.

## [9.1.5] 2023-08-08
### Changed
- Changed code field to be multiple instances.

## [9.1.4] 2023-07-21
### Fixed
- Fixed a bug which was missing scores in answerOption field.
- Replaced initial[x] objects with answerOption[x].initialSelected flag to indicate
  default answers in choice/open-choice type items.

## [9.1.3] 2023-07-21
### Fixed
- Updated lforms to 33.4.1 to fix a bug with list positioning of autocomplete input box
  in preview dialog.

## [9.1.2] 2023-07-11
### Added
- Add item control extension. For now, the support restricted to autocomplete in ValueSet fields.

## [9.1.1] 2023-07-07
### Fixed
- Fix z-index of autocomplete #searchResults window.

## [9.1.0] 2023-05-17
### Added
- Support for SNOMED value set URI.

## [9.0.3] 2023-05-17
### Fix
- Fix layout issues in answer-option-methods component.
- Upper case 'uri' in a label.

## [9.0.2] 2023-05-10
### Fix
- Fix display of validation errors for string component.
- Change Questionnaire.url validation to FHIR specified pattern.

## [9.0.1] 2023-05-08
### Added
- Added support for Questionnaire.url.

## [9.0.0] 2023-03-28
### Changed (Breaking changes)
- Updated angular to version 15.x.x
- Updated bootstrap version to 5.x.x
- Updated ngBootstrap version to 14.x.x
- Refactored radio button groups.

## [8.0.11] 2023-03-08
### Added
- Added support for answerValueSet field.
- Added display column to code field.
- Added terminology server field to form level fields and item level fields.
- Added collapse/expand panel for advanced fields.

### Changed
- Changed code field labels.
- Moved conditional display, observation link period, and observation extract fields to advanced panel.

### Fixed
- Fixed visibleIf issue with answerOption and code when visibility is false.

## [8.0.10] 2023-01-25
### Changed
- Display LOINC terms of use acceptance dialog after displaying home page.

## [8.0.9] 2023-01-09
### Fixed
- Fix screen reader announcing blank on tooltip icons.

## [8.0.8] 2023-01-06
### Added
- Support extension for observation extract.

## [8.0.7] 2022-12-14
### Added
- Support import of forms that are in LForms format.

## [8.0.6] 2022-12-13
### Fixed
- Fix display of decimal answer field in conditional display when source item is decimal type.

## [8.0.5]  2022-12-05
### Fixed
- Fix loading initial component when switched type from choice to decimal.

## [8.0.4] 2022-11-28
### Fixed
- Fix placing cursor position in integer input when invalid character is typed.

## [8.0.3] 2022-11-28
### Fixed
- Fixed item type and missing answer display strings when importing a LOINC question from CTSS.

## [8.0.2]  2022-11-22
### Fixed
 - Fix number type fields to accept decimal numbers.

## [8.0.1] 2022-11-21
### Changed
- Updated lforms to 33.0.0, which removed support for IE 11.

## [8.0.0]  2022-10-04
### Changed
 - Update angular version to 14.x.x
 - Update angular-tree-component to @bugsplat/angular-tree-component@13.0.1
 - Update ngx-schema-form to @lhncbc/ngx-schema-form@2.8.4-forked
### Added
 - Added context menu for nodes on the sidebar tree

## [7.0.15]  2022-07-14
### Fixed
 - Fix units in valueQuantity of initial field.
### Added
 - Add app version information to the header.
 - Add tabindex to active node in sidebar tree to improve accessibility.

## [7.0.14]  2022-07-07
### Fixed
 - In Conditional Display field, fixed missing answerBoolean field
 when condition is empty or not empty.
 - In Conditional Display field, fixed missing answer field when the
 first condition is based on empty or not empty.

## [7.0.13]  2022-06-09
### Changed
- Removed total score calculation.

## [7.0.12]  2022-05-24
### Fixed
- Fixed a bug which overwrites a node when clicking two nodes rapidly.
### Added
- Added a spinner to indicate loading of item into the editor.

## [7.0.11]  2022-05-04
### Fixed
- Fixed a bug in deleting last item in the tree.
- Fixed a bug in missing form level field values.

## [7.0.10]  2022-04-21
### Changed
- Load LOINC forms from CTSS.
### Added
- Add observation link period field.

## [7.0.9]  2022-04-06
### Fixed
- Fix test descriptions.

## [7.0.8]  2022-03-16
### Fixed
- Add warning dialog when replacing an existing form.

## [7.0.7]  2022-02-14
### Fixed
- Fix type display/group based on presence of child items.

## [7.0.6]  2022-02-10
### Fixed
- Fix missing answer coding in conditional display.

## [7.0.5]  2022-01-26
### Feature
- Add user specified FHIR server.
- Fix scrolling in conditional display source field.

## [7.0.4]  2022-01-20
### Maintenance
- Update LForms down load script.

## [7.0.3]  2022-01-18
### Fixed
- Fix setting FHIR context for lforms preview.

## [7.0.0]  2021-12-30
### Feature
- This version of form builder is revised using angular2 framework.
  The user interface is revised aligning with FHIR questionnaire definition.

## [6.5.2]  2021-10-05
### Fixed
- Fixed a bug that fails to load forms after loading a form with ValueSet
  having no terminology server.

## [6.5.1]  2021-09-30
### Fixed
- Changed broken CTSS url.

## [6.5.0]  2021-08-24
### Added
- Added support for attachment type.
- Updated nodejs to 14.17.5.

## [6.4.6]  2021-07-23
### Fixed
- Updated lforms to version 29.1.2, to get an update to fhirpath.js to fix an
  issue with choice types.

## [6.4.5]  2021-05-14
### Fixed.
- Fixed a bug in outputting FHIR choice orientation extension when
  displayControl.answerLayout.columns is one.
- Fixed a bug in changing the loinc code with prefix 'Modified_' when a loinc item is edited

## [6.4.4]  2021-05-12
### Updated.
- Updated formbuilder package to 29.0.3.

## [6.4.3]  2021-05-10
### Changed.
- Updated npm packages to address security vulnerabilities
- Updated link to contact us page.

## [6.4.2]  2021-04-16
### Added
- New NLM logo

## [6.4.1]  2021-02-09
### Updated
- Merged dependabot PR.

## [6.4.0]  2021-02-03
### Added
- Added functionality to narrow down the results from FHIR Server
  using a search term.
### Removed
- Removed delete buttons from search results of a FHIR server.

## [6.3.2]  2020-12-21
### Fixed
- Upgrade AngularJS to 1.8.x to address a security alert.

## [6.3.1]  2020-12-01
### Fixed
- Display FHIR search results, even if `Bundle.total` is absent.

## [6.3.0]  2020-10-14
### Added
- Import LOINC forms.

## [6.2.0]  2020-10-01
### Added
- Added support for FHIR Identifier. Thanks to contribution from https://github.com/ps-astangl

## [6.1.1]  2020-10-02
### Fixed
- Updated an npm package to address npm audit vulnerability.

## [6.1.0]  2020-09-08
### Added
- Added support for observation link period.
### Fixed
- Fixed a bug in skip logic, when skip logic source is pointing to its parent which is a question type.

## [6.0.1]  2020-08-05
### Fixed
- Fixed missing node id labels in the auto complete box for skip logic sources.
- Fixed problem with updating skip logic source list when link id is updated.

## [6.0.0]  2020-08-05
### Changed
- The range definition of skip logic trigger for numeric types is changed to align with FHIR enableWhen definition.
  This could be a breaking change if you have a form definition like the following.
    skipLogic = {
      condition = [{
        source: '1',
        trigger = {minExclusive: 10, maxExclusive: 100}
      }]
    }

  The above definition can be changed to the following to specify the range.
    skipLogic = {
      logic: 'ALL',
      condition = [{
        source: '1',
        trigger = {minExclusive: 10}
      },{
        source: '1',
        trigger = {maxExclusive: 100}
      }]
    }
- Changed UI to build skip logic condition to support exists and not exists operators.
- Fixed a bug in loading a FHIR questionnaire with enable when source of type boolean.
- Added a setting export format to R4 as default in the file export dialog.

## [5.2.0]  2020-06-22
### Updated
- Update lforms version to 25.0.0. It changed the FHIR extension url of calculated expression.

## [5.1.0]  2020-05-22
### Added
- Added input fields to support CSS styles on item name and prefix.

## [5.0.1]  2020-04-17
### Fixed
- Fixed a bug in selection of display item type.

## [5.0.0]  2020-04-17
### Changed
- Changed unique key of an item, from questionCode to linkId as per lforms version 24.0.0.
  Updated lforms package to 24.0.0.

## [4.1.0]  2020-04-02
### Changed
- Changed questionCodeSystem to accept any input, still defaults to 'Custom'.

## [4.0.0]  2020-03-03
### Fixed.
- Fixed skip logic trigger equal and not equal operators.
### Changed.
- Updated lforms package to 21.2.1. Since lforms package has a major version update,
  bumped up the major version in this package as well.

## [3.4.1]  2019-01-30
### Fixed.
- Fix import of lforms having calculationMethod field.

## [3.4.0]  2019-12-31
### Added.
- Support FHIR calculatedExpression extension. The extension will take FHIRPath expression.
  Validation of expression is not supported yet. The user is expected to enter a valid FHIRPath
  expression.
- Support FHIR display (LForms TITLE) type.
- Added a new field to select item type to align with FHIR notion of group, display and question.

## [3.3.1]  2019-12-19
### Changed.
- Improved performance on collection of skip logic sources.
- Fixed a problem in conversion of lforms panel after importing from lforms-service.

## [3.3.0]  2019-10-09
### Added.
- Updated lforms to support change in skip logic trigger definition.

## [3.2.0]  2019-10-09
### Added.
- Added support to specify third party fhir servers by the user.

## [3.1.6]  2019-09-16
### Fixed.
- Fixed a bug importing a file with an item having answer list and answerRequired fields.

## [3.1.5]  2019-09-10
### Added.
- Added support for TX data type.
### Changed.
- Remove default form name.
### Fixed.
- Fix a bug converting restrictions to corresponding FHIR extensions.

## [3.1.4]  2019-08-28
### Fixed.
- Fix a bug in conversion of `Questionnaire.code` in form level fields.
- Fix a bug in importing FHIR Questionnaire without meta field.

## [3.1.3]  2019-08-15
### Fixed.
- Fixed overwriting of linkId in `enableWhen.question`, when converted to FHIR Questionnaire.

### Changed
- Removed restriction on insisting code for answer lists.
### Added
- Added support for Questionnaire.item.prefix field

## [3.1.2]  2019-08-13
### Fixed.
- Fix file export problem.

## [3.1.1]  2019-07-30
### Fixed.
- Fix missing file in bower.json for wiredep output.

## [3.1.0]  2019-07-24
### Added.
- Added form level fields defined in FHIR Questionnaire.

## [3.0.10]  2019-07-19
### Added.
- Added a warning message about losing the changes when the browser tab is closed or new form is imported.

## [3.0.9]  2019-06-06
### Changed.
- Update node dependencies to fix npm audit vulnerabilities.

## [3.0.8]  2019-06-04
### Changed.
- Update lforms package.

## [3.0.7]  2019-05-20
### Changed.
- Remove CSP middleware, let the package users handle the csp headers.
- Fix critical npm audit alerts.

## [3.0.6]  2019-05-14
### Fixed.
- Fixed a bug in importing items with CNE/CWE type triggers in skip logic.

## [3.0.5]  2019-04-16
### Fixed.
- Fixed a bug in ui-tree display for multiple items on the root.
- Fixed a bug in importing R4 version of Questionnaire from the local disk.

## [3.0.4]  2019-04-11
### Fixed.
- Fixed restrictions output format to conform to latest lforms spec.
- Removed hard coded templateOptions in the lforms format for export.

## [3.0.3]  2019-03-22
### Fixed.
- Fix next/previous page display in FHIR results dialog.
- Fix errors in mocking FHIR server for protractor tests.

## [3.0.2]  2019-03-08
### Fixed.
- Fix errors in tests.

## [3.0.1]  2019-03-08
### Fixed.
-  Whitelist apis.google.com to allow google/facebook/twitter logins.

## [3.0.0]  2019-02-07
### Added.
-  Support exporting/importing R4 versions of FHIR format.
### Changed.
-  Breaking change: Added FHIR version number to the FHIR server definition in client/config.js. It is mandatory that the
servers are tagged with supported FHIR version such as R4, STU3 etc.

## [2.2.0]  2019-01-29
### Added.
-  Added displayControl. Supports questionLayout, answerLayout, and listColHeaders for now.

## [2.1.4]  2019-01-16
### Fixed.
-  Fixed a bug to include answer list and units when importing a LOINC question.

## [2.1.3]  2018-12-26
### Changed.
-  Updated lforms package which has support for parsing argonaut questionnaires.

## [2.1.2]  2018-11-27
### Fixed.
-  Add Google Analytics to white list of content security policy.

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
this as a npm package.

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
  service and used table format display for auto-completion.

## [0.8.4]  2018-06-01
### Added
- Used grunt wiredep to inject bower components into karma.conf.js

## [0.8.3]  2018-05-24
### Added
- Added tags for Google Analytics

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
- Added popup menu to the nodes on the sidebar.
- Added dialog box to capture target item to
  move nodes on the sidebar using popup menu items.
### Fixed
- Addressed some accessibility issues.
- Fixed converting section/header to regular item
- Fixed displaying other in answer list item.
### Changed
- Changed Text and Code fields to be required.

