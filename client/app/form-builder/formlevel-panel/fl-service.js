angular.module('formBuilder')
  .service('flService', ['lodash', function(lodash){
    var flService = this;

    /**
     * Convert form level properties from form builder to lforms.
     *
     * @param fbFormLevelData - Form builder object representing form level properties.
     */
    flService.exportFormLevelDataToLForms = function(fbFormLevelData) {
      var lfFormLevelData = flService._convertFBFormLevelItems(fbFormLevelData.basic.items);
      lodash.assign(lfFormLevelData, flService._convertFBFormLevelItems(fbFormLevelData.advanced.items));
      flService._convertVariableExtensions(lfFormLevelData);
      return lfFormLevelData;
    };


    /**
     * Convert form level properties from lforms to form builder.
     *
     * @param fbHeaderData - Form builder object representing form level properties. This object will be updated
     *   with values from importedHeadersObj.
     * @param importedHeadersObj - The lforms object with form level properties.
     */
    flService.importFormLevelFields = function (fbHeaderData, importedHeadersObj) {

      flService._updateFBFormLevelFields(fbHeaderData.basic.items, importedHeadersObj);
      flService._updateFBFormLevelFields(fbHeaderData.advanced.items, importedHeadersObj);

    };


    /***** Private ****/
    /**
     * Convert form builder items to lforms (same as FHIR Questionnaire) form level fields.
     *
     * @param fbFormLevelItems - An array of form builder items representing form level properties.
     * @private
     */
    flService._convertFBFormLevelItems = function (fbFormLevelItems) {
      var lfHeaders = {};
      for(var i = 0; i < fbFormLevelItems.length; i++) {
        var fbItem = fbFormLevelItems[i];
        var item = flService._convertFBItem(fbItem);
        if(item !== null) {
          if(flService._isAnArray(fbItem.questionCardinality)) {
            if(!lfHeaders[fbItem.questionCode]) {
              lfHeaders[fbItem.questionCode] = [];
            }
            lfHeaders[fbItem.questionCode].push(item);
          }
          else {
            lfHeaders[fbItem.questionCode] = item;
          }
        }
      }

      return lfHeaders;
    };


    /**
     * Convert form builder item to lforms (same as FHIR field) form level field.
     *
     * @param fbItem - Form builder item representing form level property.
     * @returns {*}
     * @private
     */
    flService._convertFBItem = function(fbItem) {
      var ret = null;
      if(fbItem.header || (fbItem.value !== null && fbItem.value !== undefined)) {
        switch (fbItem.localQuestionCode) {
          case 'id':
          case 'uri':
          case 'canonical':
          case 'string':
          case 'markdown':
          case 'xhtml':
          case 'positiveInt':
            ret = fbItem.value;
            break;

          case 'date':
          case 'dateTime':
          case 'instant':
            if(typeof fbItem.value === 'string') {
              ret = fbItem.value;
            }
            else {
              // Some times fbItem.value is date object?
              ret = fbItem.value.toISOString();
            }

            if(fbItem.localQuestionCode === 'date') {
              ret = ret.substr(0, 10);
            }
            break;

          case 'boolean':
            ret = fbItem.value.code;
            break;

          case 'code':
            if(fbItem.dataType === 'ST') {
              ret = fbItem.value;
            }
            else if(fbItem.dataType === 'CNE')
            ret = fbItem.value.code;
            break;

          case 'CodeableConcept':
          case 'Coding':
          case 'ContactDetail':
          case 'ContactPoint':
          case 'Identifier':
          case 'Meta':
          case 'Period':
          case 'Quantity':
          case 'Range':
          case 'SimpleQuantity':
          case 'UsageContext':
          case 'Expression':
            // These are complex types embedded with multiple types defined above. It will go trough
            // an indirect recursion, i.e _convertFBFormLevelItems() calls this function again.
             var obj = flService._convertFBFormLevelItems(fbItem.items);
             if(obj && !angular.equals(obj, {})) {
               ret = obj;
             }
            break;

          default:
            // ret = fbItem; // Copy unsupported field as it is.
            break;
        }
      }
      return ret;
    };


    /**
     * Update form builder items representing form level properties with values from imported lforms form level properties.
     *
     * @param fbHeaders - An array of form builder items representing form level properties.
     * @param importedHeadersObj - lforms object consisting of form level properties.
     * @private
     */
    flService._updateFBFormLevelFields = function (fbHeaders, importedHeadersObj) {
      for(var i = 0; i < fbHeaders.length; i++) {
        var val = importedHeadersObj[fbHeaders[i].questionCode];
        if(val === null || val === undefined) {
          val = flService._getExtensions(fbHeaders[i].questionCode, importedHeadersObj);
        }
        if(val !== null && val !== undefined) {
          if(flService._isAnArray(fbHeaders[i].questionCardinality)) {
            var newItems = [];
            val.forEach(function (v){
              var newItem = angular.copy(fbHeaders[i]);
              flService._updateFBItem(newItem, v);
              newItems.push(newItem);
            });

            if(newItems.length > 0) {
              [].splice.apply(fbHeaders, [i, 1].concat(newItems));
              i = i + (newItems.length - 1);
            }
          }
          else {
            flService._updateFBItem(fbHeaders[i], val);
          }
        }
      }

    };


    /**
     * Update form builder item with a value
     *
     * @param fbItem - Form builder item object
     * @param value - A value to update with.
     * @private
     */
    flService._updateFBItem = function(fbItem, value) {
      if(fbItem.header) {
        flService._updateFBFormLevelFields(fbItem.items, value);
      }
      else {
        if(value !== null && value !== undefined) {
          switch(fbItem.dataType) {
            case 'CNE':
              fbItem.value = _.find(fbItem.answers, {code: value});

              break;

            case 'CWE':
              fbItem.value = _.find(fbItem.answers, {code: value});
              if(!fbItem.value) {
                fbItem.value = {code: value, text: value};
              }
              break;

            default:
              fbItem.value = value;
              break;
          }
        }
      }
    };


    /**
     * Read lforms cardinality to assess if it is an array.
     *
     * @param cardinality - lforms cardinality object.
     * @returns {boolean}
     * @private
     */
    flService._isAnArray = function (cardinality) {
      var ret = false;
      if(cardinality) {
        if(cardinality.min && parseInt(cardinality.min) > 1) {
          ret = true;
        }
        else if(cardinality.max && (cardinality.max === '*' || parseInt(cardinality.max) > 1)) {
          ret = true;
        }
      }

      return ret;
    };


    /**
     * Get required extensions from imported form level extension array.
     *
     * @param fbQuestionCode - Field code in form builder model representing an extension type.
     * @param importedFormLevelFieldsObj - Object with imported form level fields
     * @returns {*}
     * @private
     */
    flService._getExtensions = function (fbQuestionCode, importedFormLevelFieldsObj) {
      var ret = null;
      switch (fbQuestionCode) {
        case '_fhirVariables':
          if(importedFormLevelFieldsObj.extension) {
            ret = importedFormLevelFieldsObj.extension.reduce(importedFormLevelFieldsObj.extension, function(acc, ext) {
              if(ext.url === LForms.FHIR.R4.SDC.fhirExtVariable) {
                acc.push(ext.valueExpression);
              }
              return acc;
            }, []);
            ret = ret.length > 0 ? ret : null;
          }
          break;
      }
      return ret;
    };


    /**
     * Convert internal _fhirVariables to FHIR extension format.
     *
     * @param lfFormData - Form level data object.
     */
    flService._convertVariableExtensions = function (lfFormData) {
      if(lfFormData) {
        // FHIRPath variables
        var vars = lfFormData._fhirVariables;
        delete lfFormData._fhirVariables;
        for(var i = 0; vars && i < vars.length; i++) {
          vars[i].language = 'text/fhirpath';
          if(!lfFormData.extension) {
            lfFormData.extension = [];
          }
          lfFormData.extension.push({
            url: 'http://hl7.org/fhir/StructureDefinition/variable',
            valueExpression: vars[i]
          });
        }
      }
    }

  }]);
