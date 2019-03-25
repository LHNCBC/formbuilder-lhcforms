"use strict";

let nock = require('nock');
const dateformat = require('dateformat');
const fs = require('fs');
const resourceFilepath = '/tmp/tmp-questionnaire-resource';
const updateResp = require('./fixtures/update-response.json');
const deleteResp = require('./fixtures/delete-response.json');

let defSearchBundle = {};
defSearchBundle['Dstu3'] = [];
defSearchBundle['R4'] = [];
defSearchBundle['Dstu3'].push(require('./fixtures/stu3-search-bundle-0.json'));
defSearchBundle['Dstu3'].push(require('./fixtures/stu3-search-bundle-1.json'));
defSearchBundle['Dstu3'].push(require('./fixtures/stu3-search-bundle-2.json'));
defSearchBundle['Dstu3'].push(require('./fixtures/stu3-search-bundle-3.json'));
defSearchBundle['R4'].push(require('./fixtures/r4-search-bundle-0.json'));
defSearchBundle['R4'].push(require('./fixtures/r4-search-bundle-1.json'));
defSearchBundle['R4'].push(require('./fixtures/r4-search-bundle-2.json'));
defSearchBundle['R4'].push(require('./fixtures/r4-search-bundle-3.json'));

let pathIdExp = /^\/base(Dstu3|R4)\/Questionnaire\/([0-9]+)$/;
let searchByIdExp = /^\/base(Dstu3|R4)\/Questionnaire\?.*\b_id=([\w]+)\b.*$/;
let questionnaireExp = /^\/base(Dstu3|R4)\/Questionnaire.*$/;
let versionExp = /^\/base(Dstu3|R4)(\/|\?)/;
let getPageExp = /^\/base(Dstu3|R4)\?.*\b(_getpagesoffset=(\d+))\b/;


/**
 * Parse id from the uri
 * @param uri - Request uri
 * @returns {*}
 */
function parseId(uri) {
  let match = searchByIdExp.exec(uri);
  let id = null;
  if(match) {
    id = match[2];
  }
  
  if(!id) {
    match = pathIdExp.exec(uri);
    if(match) {
      id = match[2];
    }
  }
  return id;
}


/**
 * Save the resource to the file
 * @param res - Resource object
 */
function saveResource(res) {
  let filename = resourceFilepath+res.id;
  fs.writeFileSync(filename, JSON.stringify(res, null, 2), 'utf-8');
}


/**
 * Read saved resource from the file.
 */
function readResource(id) {
  let ret = null;
  if(fs.existsSync(resourceFilepath+id)) {
    ret = JSON.parse(fs.readFileSync(resourceFilepath+id, 'utf-8'));
  }
  return ret;
}


/**
 * Handle general GET method
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function searchReply(uri, requestBody) {
  let id = parseId(uri);
  let ret = null;
  let entry = [];
  if(id) {
    // id based search
    let res = readResource(id);
    if(res) {
      entry.push({
        fullUrl: suppressDefPortFromUrl(this.basePath)+this.req.path.replace(/\?.*$/, '/')+id,
        resource: res,
        search: {
          mode: "search"
        }
      });
    }

    ret = {
      resourceType: "Bundle",
      id: "589a6863-02d0-4353-b944-7787f40b5d28",
      meta: {
        lastUpdated: dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo")
      },
      type: "searchset",
      total: entry.length,
      link: [
        {
          relation: "self",
          "url": suppressDefPortFromUrl(this.basePath)+this.req.path
        }
      ],
      entry: entry
    };
  }
  else {
    // Search all questionnaires
    let ver = versionExp.exec(uri)[1];
    ret = defSearchBundle[ver][0]; // First page
    ret.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
    let createdRes = readResource("1");
    if(createdRes) {
      ret.entry[0] = { // Replace with first one. This will be used in the read call
        fullUrl: suppressDefPortFromUrl(this.basePath)+this.req.path.replace(/\?.*$/, '/')+createdRes.id,
        resource: createdRes,
        search: {
          mode: "search"
        }
      };

    }
  }

  return ret;
}


/**
 * Handle get next/prev page
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function getPageReply(uri, requestBody) {
  let ret = null;
  const match = getPageExp.exec(uri);
  if(match) {
    let pageOffset = match[3];
    // The search bundles on the disk are tagged with
    const pageOffsetToPage = {
      '0': 0,
      '5': 1,
      '10': 2,
      '15': 3
    };

    const ver = versionExp.exec(uri)[1];
    ret = defSearchBundle[ver][pageOffsetToPage[pageOffset]];
    ret.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
  }
  return ret;
}



/**
 * Remove def port such as :80 and :443 from url
 *
 * @param url {string} - Url to parse.
 * @returns {string} - Modified url
 */
function suppressDefPortFromUrl(url) {
  let ret = url;
  const exps = [
    /(?<=https:\/\/[^\/:]+)(:443)(?:\b)/,
    /(?<=http:\/\/[^\/:]+)(:80)(?:\b)/
  ];
  exps.forEach((exp) => {
    ret = ret.replace(exp, '');
  });

  return ret;
}

/**
 * Handle general GET method
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function stockReply(uri, requestBody) {
  console.log('Untrapped calls to '+this.req.host +': '+ uri);
  return [404, 'Resource not found'];
}


/**
 * Handle FHIR create
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function createReply (uri, requestBody) {
  // Mock server changes and store it for later read.
  requestBody.id = "1";
  requestBody.meta.versionId = "1";
  requestBody.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
  
  if(fs.existsSync(resourceFilepath+requestBody.id)) {
    fs.unlinkSync(resourceFilepath+requestBody.id);
  }
  saveResource(requestBody);
  
  return [201, requestBody];
}


/**
 * Handle FHIR read
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function readReply (uri, requestBody) {
  // Check id, and send the created resource.
  let id = parseId(uri);
  let res = readResource(id);
  if(id === res.id) {
    return [200, res];
  }
  else {
    return [401, 'Resource not found'];
  }
}


/**
 * Handle update
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function updateReply (uri, requestBody) {
  // Not really updating anything. Check id, and send a positive reply.
  let id = parseId(uri);
  let res = readResource(id);
  if (id === res.id) {
  
    requestBody.meta.versionId = "2";
    requestBody.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
    saveResource(requestBody);
    return [200, updateResp];
  }
  else {
    return [400, 'Resource mismatch'];
  }
}


/**
 * Handle delete
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function deleteReply (uri, requestBody) {
  
  let id = parseId(uri);
  let res = readResource(id);
  if (id === res.id) {
    fs.unlink(resourceFilepath+id, (err) => {
      if(err) {
        if(err) throw err;
      }
    });
    return [200, deleteResp];
  }
  else {
    return [400, 'Resource mismatch'];
  }
}


/**
 * Create nock for a given URL. Should only use origin part of the URL
 *
 * @param url - Web url
 * @returns {*}
 */
function fhirNock(url) {
  
  let ret = nock(url).defaultReplyHeaders({
    'Content-Type': 'application/json',
    'Content-Length': function (req, res, body) {
      return body.length;
    }
  });
  
  ret.get(pathIdExp).reply(readReply);
  ret.get(searchByIdExp).reply(searchReply);
  ret.get(questionnaireExp).reply(searchReply);
  ret.get(getPageExp).reply(getPageReply);

  ret.post(questionnaireExp).reply(createReply);
  ret.put(questionnaireExp).reply(updateReply);
  ret.delete(questionnaireExp).reply(deleteReply);

  ret.get(/^.*/).reply(stockReply);
  return ret;
}

module.exports = fhirNock;
