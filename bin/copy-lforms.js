/**
 * This script copies lforms build files from CTSS website.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const destinationFolder = path.join(__dirname, '../src/lib/lforms/lib');
const ctssUrl = 'https://clinicaltables.nlm.nih.gov/lforms-versions';
const version = '30.0.0-beta.1';
const filePathMap = {
  'webcomponent/lhc-forms.es5.js'   : 'elements',
  'webcomponent/styles.css'         : 'elements',
  'fhir/R4/lformsFHIR.min.js'       : 'fhir/R4',
  'fhir/R4/lformsFHIR.min.js.map'   : 'fhir/R4',
  'fhir/STU3/lformsFHIR.min.js'     : 'fhir/STU3',
  'fhir/STU3/lformsFHIR.min.js.map' : 'fhir/STU3',
  'fhir/lformsFHIRAll.min.js'       : 'fhir',
  'fhir/lformsFHIRAll.min.js.map'   : 'fhir'
}

const appFolder = path.dirname(path.dirname(destinationFolder));
if(!fs.existsSync(appFolder)) {
  errorExit(null, `${appFolder} directory does not exist. Please make sure to create it before running this script`);
}


const fileMapArray = getUrlToFilePath(filePathMap);

fileMapArray.forEach((m) => {
  copyFileFromUrl(m.url, m.file);
});


/**
 * Create a map between url to destination file path.
 *
 * @param aFilePathMap - File path map defined above.
 * @returns {*[]}
 */
function getUrlToFilePath(aFilePathMap) {
  const ret = [];
  Object.keys(aFilePathMap).forEach((k) => {
    const map = {};
    let url = [ctssUrl, version, k].join('/');
    let file = [destinationFolder, filePathMap[k], path.basename(k)].join('/');
    ret.push({url, file});
  });

  return ret;
}


/**
 * Copy a url stream to a file.
 *
 * @param url
 * @param filePath
 */
function copyFileFromUrl(url, filePath) {
  // We checked destinationFolder exists. Make sure sub folders are created.
  const dirName = path.dirname(filePath);
  if(!fs.existsSync(dirName)) {
    console.log(`Creating ${dirName}`);
    try {
      fs.mkdirSync(dirName, {recursive: true});
    }
    catch (e) {
      errorExit(e, `Failed to create ${dirName}!`);
    }
  }

  const file = fs.createWriteStream(filePath, {flags: 'w'});
  file.on('finish', () => {
    console.log(`${filePath} is copied.`);
  });
  file.on('error', (e) => {
    errorExit(e, `Error writing file ${filePath}`);
  });
  const request = https.get(url, function(response) {
    if(response.statusCode === 200) {
      response.pipe(file);
    }
    else {
      errorExit(null, `${url} returned ${response.statusCode}` )
    }
  }).on('error', (e) => {
    errorExit(e, `Error copying file from ${url}`);
  });
}


/**
 * Exit process with message
 *
 * @param error - error object
 * @param errorMessage - Crafted message
 */
function errorExit(error, errorMessage) {
  console.error(errorMessage);
  console.error(error);
  process.exit(1);
}

