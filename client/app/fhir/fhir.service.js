var fb = angular.module('formBuilder');
fb.service('fhirService', [
  '$window',
  '$fhir',
  function($window, $fhir) {
  var thisService = this;


  /**
   * Creates a resource on the fhir server, assigning publisher field from the user profile.
   *
   * @param resourceStr {string} - A string representation of json fhir resource.
   * @param userProfile {object} - User's login profile.
   * @returns {object} - An http promise
   */
  thisService.create = function(resourceStr, userProfile) {
    // There is no equivalent field to identify the author/publisher in lforms.
    // This field could be handy to retrieve user's resources from fhir server.
    // For now combine name and email to make it unique and searchable by name.
    var resource = JSON.parse(resourceStr);
    resource.publisher = getPublisherStr(userProfile);

    return $fhir.create({resource: resource});
  };


  /**
   * Creates a resource on the fhir server.
   *
   * @param resourceStr {string} - A string representation of json fhir resource.
   * @param userProfile {object} - User's login profile.
   * @returns {object} - An http promise
   */
  thisService.update = function(resourceStr, userProfile) {
    var resource = JSON.parse(resourceStr);
    var resource = JSON.parse(resourceStr);
    resource.publisher = getPublisherStr(userProfile);
    return $fhir.update({resource: resource});
  };


    /**
   * Read a questionnaire fhir resource.
   * @param id {string} - Id of the resource.
   * @returns {object} - An http promise
   */
  thisService.read = function(id) {
    return $fhir.read({type: 'Questionnaire', id: id});
  };


  /**
   * Delete a questionnaire fhir resource.
   *
   * @param id {string} - Id of the resource.
   * @returns {object} - An http promise
   */
  thisService.delete = function (id) {
    return $fhir.delete({type: 'Questionnaire', id: id});
  };


  /**
   *
   *
   * @param searchStr - A search term to search FHIR resources
   * @param selfOnly - Restrict the results owned by this account.
   * @returns {*} Http promise
   */
  thisService.search = function(searchStr, selfOnly) {
    var query = {};
    if(searchStr) {
      query['name'] = searchStr;
    }
    if(selfOnly) {
      query['thisUserOnly'] = 'true';
    }

    return $fhir.search({type: 'Questionnaire', query: query});
  };


  /**
   * Get fhir resources using url. This url is typically found in the resource,
   * which typically specifies fhir server url. That server may not be accessible to
   * clients directly. Form builder server acts as a proxy to
   * backend fhir server. This calls revises the url to proxy server, before
   * sending the request.
   *
   * @param url {string} - fhir server url referred in the fhir resource.
   * @returns {object} - An http promise
   */
  thisService.bundleUrlLink = function (url) {
    var baseUrl = $window.location.href + '/fhir-api?';
    var url = url.replace(/^.*\/baseDstu3\?/, baseUrl);
    return $fhir.getBundleByUrl(url);
  };


  /**
   * Get FHIR results using a url. The paginated results are obtained using a url in the result bundle
   * @param url - The URL referring to the resource bundle on the FHIR server.
   * @param userProfile - A user profile with login information
   * @returns {Object} - FHIR resource bundle
   */
  thisService.getBundleByUrl = function (url) {
    return $fhir.getBundleByUrl(url);
  };

  /**
   * Get FHIR pagination results using a current bundle. The paginated results are
   * obtained using a url in the current results bundle
   *
   * @param bundle - The FHIR bundle from which to extract the relation url.
   * @param relation - A string specifying the relation ('prev' | 'next')
   * @returns {Object} - FHIR resource bundle
   */
  thisService.getPage = function (bundle, relation) {
    var fn = null;
    if(relation === 'next') {
      fn = $fhir.nextPage;
    }
    else {
      fn = $fhir.prevPage;
    }

    return fn({bundle: updateLinkRelationUrls(bundle)});
  };


  /**
   * The URLs in the results are specific to backend FHIR server, which may not
   * be accessible to clients. Change the url to this origin server, which
   * handles all the FHIR server requests.
   *
   * @param bundle
   * @returns {*}
   */
  function updateLinkRelationUrls(bundle) {
    if(bundle && bundle.link) {
      var baseUrl = $window.location.href;
      baseUrl += baseUrl.match(/\/$/) ? '' : '/';
      baseUrl += 'fhir-api?';
      bundle.link.forEach(function(relation){
        relation.url = relation.url.replace(/^.*\/baseDstu3\?/, baseUrl);
      });
    }

    return bundle;
  }

  /**
   * Create publisher string out of user profile.
   *
   * @param userProfile {object} - User's login profile
   * @returns {string}
   */
  function getPublisherStr(userProfile) {
    var ret = '';
    if(userProfile) {
      if(userProfile.displayName) {
        ret = userProfile.displayName;
        if(userProfile.email) {
          ret += '; ' + userProfile.email;
        }
      }
    }

    if(!ret) {
      ret = null;
    }

    return ret;
  }
}]);