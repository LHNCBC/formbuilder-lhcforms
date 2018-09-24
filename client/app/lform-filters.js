/**
 * Define an angular filter to transform object into a string.
 *
 */
angular.module('formBuilder')
  .filter('toJson', function() {

  /**
   * Angular filter to stringify object with an option to exclude certain fields.
   *
   * @param {Object} input -  Any javascript object
   * @param {Array} exclude_key_prefix_list - Include prefix of keys to exclude
   *   ex: ['_'] will exclude keys like _value
   * @param {Array} ignore_from_exclude_list - Any particular keys to include, that might
   *   otherwise be excluded from exclude list.
   */
  return function(input, exclude_key_prefix_list, ignore_from_exclude_list) {
    if (!angular.isArray(ignore_from_exclude_list)) {
      ignore_from_exclude_list = [];
    } 

    if (!angular.isArray(exclude_key_prefix_list)) {
      exclude_key_prefix_list = [];
    }

    // Return json string
    return JSON.stringify(input, function(k, v) {
      // Check for inclusion/exclusion.
      if(angular.isString(k) && ignore_from_exclude_list.indexOf(k) < 0) { // k for array value is index.
        for(var i = 0; i < exclude_key_prefix_list.length; i++) {
          if(k.indexOf(exclude_key_prefix_list[i]) === 0) {
            return undefined;
          }
        }
      }
      if(angular.isUndefined(v)) {
        return null;
      }
      else {
        return v;
      }
    }, 2);
  };
})
  .filter('truncateFilter', function (lodash) {
    return function (input, options) {
      return lodash.truncate(input, options);
    }
  });
