## What is NLM Form Builder?
[NLM Form Builder](https://formbuilder.nlm.nih.gov) is an open source web application to create and edit a
[FHIR Questionnaire](https://hl7.org/fhir/questionnaire.html) resource. The application
creates input forms supporting medical terminologies such as
[LOINC](https://loinc.org) and [SNOMED](https://www.snomed.org). This tool is
written in the Angular framework and is developed by the [Lister Hill National Center
for Biomedical Communications (LHNCBC)](https://lhbcbc.nlm.nih.gov), [National
Library of Medicine (NLM)](https://www.nlm.nih.gov), part of the [National
Institutes of Health (NIH)](https://www.nih.gov). It includes a preview of the
generated form using [LHC-Forms](https://lhncbc.github.io/lforms/)
widget.

## Licensing and Copyright Notice
See [LICENSE.md](LICENSE.md).

## Customizing and Contributing
If you wish to revise this package, the following steps will allow you install
and to make changes and test them.

### Installation

**Note**: The application is developed on a Linux platform. Therefore, the following
instructions are for those who are familiar with Linux systems.

1. **Install Node.js**:
  - Ensure that you install a version of Node.js that is compatible with the application. You can check the required version in the `bashrc.formbuilder` file included in the root of the project folder.
  - You can use a version manager like `nvm` (Node Version Manager) to install Node.js:
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install <version>
    nvm use <version>
    ```

2. **Clone the repository**:
  - Clone the repository from GitHub and navigate to its directory:
    ```bash
    git clone https://github.com/LHNCBC/formbuilder-lhcforms.git
    cd formbuilder-lhcforms
    ```

3. **Install dependencies**:
  - Run the following command to install the necessary dependencies:
    ```bash
    npm ci
    ```

4. **Build the application**:
  - Run the build command to create the build files in the `./dist` folder:
    ```bash
    npm run build
    ```

5. **Start the development server**:
  - To start the development server, run:
    ```bash
    npm run start
    ```
  - Navigate to the provided local development server URL (this is usually `http://localhost:9030`).

    **OR**

  - If you need to access the dev server from a different machine, use:
    ```bash
    npm run start-public
    ```

6. **Run tests**:
  - To run the unit tests and end-to-end (e2e) tests, use the following command:
    ```bash
    npm run test
    ```

### Environment configuration

This project uses `dotenv-cli` with cascading env files so each user can override ports/URLs locally without changing scripts.

- Default settings live in `.env`.
- User-specific overrides go in `.env.local` (this file is not committed).

To customize your ports/URLs:

```bash
cp .env .env.local
# Edit .env.local as needed
```

The npm scripts automatically load `.env` plus `.env.local` (when present), with `.env.local` taking precedence.

### Choosing the LHC-Forms version and server

By default, the form builder loads the latest version of LHC-Forms from
https://lhcforms-static.nlm.nih.gov/lforms-versions/ at run time. To change that, set `source` and/or
`version` in `assets/lforms-config.json5`. Edit `src/assets/lforms-config.json5` before building, or the copy
in the `assets` folder of the built application. The file is in [JSON5](https://json5.org/) format, and its
comments describe both values.

To load a specific version from the NLM server, set only `version`:

```json5
{
  source: "",
  version: "44.1.0"
}
```

To use a fixed copy served by your own server instead (for example a version that matches the forms renderer
of your application), set both values:

```json5
{
  // Base URL of the LHC-Forms files.
  source: "/path/to/lforms-44.1.0",
  // X.Y.Z version of the LHC-Forms files at source.
  version: "44.1.0"
}
```

`source` is the base URL of the extracted
[LHC-Forms release](https://lhcforms-static.nlm.nih.gov/lforms-versions/) (or of `dist/lforms` of the
`lforms` npm package). A relative URL is resolved against the form builder's base URL (`<base href>`), and
`/` is the root of the server. The base URL must contain `webcomponent/styles.css`,
`webcomponent/assets/lib/zone.min.js`, `webcomponent/lhc-forms.js` and `fhir/lformsFHIRAll.min.js`. `version`
must be the `X.Y.Z` version, 37.0.0 or later, of that copy, or of the release on the NLM server if `source` is
not set; older versions lack features the form builder requires, such as FHIR R5 support. The form builder
logs a warning in the browser console if the version of the loaded copy differs from `version`. Use a recent
LHC-Forms version; the form builder is developed and tested with the latest one.

The default behavior applies if the file is missing or empty, or if both values are empty or omitted. It also
applies if the file cannot be read: on an HTTP error other than 404, the form builder logs a warning in the
browser console and loads the latest version from the NLM server, even if the file sets `source`. A response
with the content type `text/html` is treated as a missing file, without a warning, because single-page
application servers return their HTML page for missing files. Make sure the file is served as-is (for
example, not behind a login page) if your deployment must not load LHC-Forms from the NLM server. If the
file is not valid JSON5, has `source` without `version`, or has an invalid `version`, the form builder reports
an error instead of loading LHC-Forms. It also reports an error, without falling back to another version, if
the configured version cannot be loaded. Browsers may cache the file, so configure your server to revalidate
it if you change it after deployment.

## **Contributing**
  - If you plan to contribute new functionality, it is important to coordinate with the maintainers to ensure proper integration and to avoid duplicating efforts. Reach out to the maintainers for guidance on contributing.

If you encounter any issues during the installation or setup process, consult the project's documentation or reach out to the maintainers for further assistance.
## Application Programming Interface (API)
The form builder is an application. However, it is possible to control it via
JavaScript from another web page. Refer to [API.md](API.md)
for documentation.
