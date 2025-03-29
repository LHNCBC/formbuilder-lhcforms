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

## **Contributing**
  - If you plan to contribute new functionality, it is important to coordinate with the maintainers to ensure proper integration and to avoid duplicating efforts. Reach out to the maintainers for guidance on contributing.

If you encounter any issues during the installation or setup process, consult the project's documentation or reach out to the maintainers for further assistance.
## Application Programming Interface (API)
The form builder is an application. However, it is possible to control it via
JavaScript from another web page. Refer to [API.md](API.md)
for documentation.
        

        
