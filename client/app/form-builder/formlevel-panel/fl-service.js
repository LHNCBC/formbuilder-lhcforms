angular.module('formBuilder')
  .service('flService', ['lodash', function(lodash){
    var flService = this;

    flService.convertFormLevelDataToLForms = function(fbFormLevelData) {
      var lfFormLevelData = flService.convertFBFormLevelItems(fbFormLevelData.basic.items);
      return lodash.assign(lfFormLevelData, flService.convertFBFormLevelItems(fbFormLevelData.advanced.items));
    };


    flService.convertFBFormLevelItems = function (fbFormLevelItems) {
      var lfHeaders = {};
      for(var i = 0; i < fbFormLevelItems.length; i++) {
        var fbItem = fbFormLevelItems[i];
        var item = flService.convertFBFormLevelItem(fbItem);
        if(item !== null) {
          if(isAnArray(fbItem.questionCardinality)) {
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

    flService.convertFBFormLevelItem = function(fbItem) {
      var ret = null, i = 0, children = null;
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
              ret = LForms.Util.dateToString(fbItem.value);
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
             var obj = flService.convertFBFormLevelItems(fbItem.items);
             if(obj && !angular.equals(obj, {})) {
               ret = flService.convertFBFormLevelItems(fbItem.items);
             }
            break;

          default:
            break;
        }
      }
      return ret;
    };


    flService.updateFormLevelFields = function (fbHeaderData, importedHeadersObj) {

      flService.updateFBFormLevelFields(fbHeaderData.basic.items, importedHeadersObj);
      flService.updateFBFormLevelFields(fbHeaderData.advanced.items, importedHeadersObj);

    };

    flService.updateFBFormLevelFields = function (fbHeaders, importedHeadersObj) {
      for(var i = 0; i < fbHeaders.length; i++) {
        var val = importedHeadersObj[fbHeaders[i].questionCode];
        if(val !== null && val !== undefined) {
          if(isAnArray(fbHeaders[i].questionCardinality)) {
            var newItems = [];
            val.forEach(function (v){
              var newItem = angular.copy(fbHeaders[i]);
              flService.updateFBItem(newItem, v);
              newItems.push(newItem);
            });

            if(newItems.length > 0) {
              [].splice.apply(fbHeaders, [i, 1].concat(newItems));
              i = i + (newItems.length - 1);
            }
          }
          else {
            flService.updateFBItem(fbHeaders[i], val);
          }
        }
      }

    };


    flService.updateFBItem = function(fbItem, value) {
      if(fbItem.header) {
        flService.updateFBFormLevelFields(fbItem.items, value);
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


    function isAnArray(cardinality) {
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
    }

  }]);
