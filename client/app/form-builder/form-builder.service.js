/**
 * Created by akanduru on 5/28/15.
 *
 * A form builder service, mainly to convert formbuilder data model to lforms output
 * and vice versa.
 */

var fb = angular.module('formBuilder');
fb.service('formBuilderService', ['$window', 'lodash', '$q', '$http', 'dataConstants', 'flService', function($window, lodash, $q, $http, dataConstants, flService) {

  var thisService = this; // Self reference for promises etc., where 'this' means something else

  /**
   * Cached model of tree data structure.
   *
   * @type {{id: string, title: string, lfData: null, nodes: Array}}
   */
  var treeNodeData = {
    "id": null,
    "title": null,
    "lfData": {
      "basic": null,
      "advanced": null
    },
    "previewItemData": null,
    "isDirty": false,
    "skipLogicDirty": false,
    nodes: []
  };

  this.createTreeNode = function() {
    return angular.copy(treeNodeData);
  };

  this.getHeaders = function() {
    return {
      basic: new LForms.LFormsData(angular.copy(lfDataCached.formLevelFBData.basic)),
      advanced: new LForms.LFormsData(angular.copy(lfDataCached.formLevelFBData.advanced)),
    };
  };
  // Cache the question builder data model.
  var lfDataCached = {
    formLevelFBData: {},
    basic: null,
    advanced: null
  };


  /**
   * Create formbuilder widget structure (equivalent to node in the tree)
   *
   * @returns {*}
   */
  this.createLFData = function() {
    var lfData = {
      basic: new LForms.LFormsData(angular.copy(lfDataCached.basic)),
      advanced: new LForms.LFormsData(angular.copy(lfDataCached.advanced))
    };

    return lfData;
  };


  /**
   * The formBuilderDef widget is defined in form-builder-def.js.
   */
  this.cacheLFData = function() {
    thisService.processAnswerLists(basicFormLevelFieldsDef);
    thisService.processAnswerLists(advFormLevelFieldsDef);
    thisService.processAnswerLists(formBuilderDef);
    thisService.processAnswerLists(advFormBuilderDef);
    lfDataCached.formLevelFBData.basic = angular.copy(basicFormLevelFieldsDef);
    lfDataCached.formLevelFBData.advanced = angular.copy(advFormLevelFieldsDef);
    lfDataCached.basic = angular.copy(formBuilderDef);
    lfDataCached.advanced = angular.copy(advFormBuilderDef);
  };


  /**
   * Fetch the answer list from answer-lists.js.
   *
   * Some of the answer lists are long arrays (ex: units are more than 800 items).
   * Separating the answer lists helps manage the form-builder-def.js better.
   *
   * @param {String} key - The keys are typically used in form-builder-def.js
   * @returns {Array} - List of text/code objects.
   */
  this.fetchAnswerList = function(key) {
    return $window.answerLists[key];
  };


  /**
   * Merge answer lists from answer-lists.js
   * @param {Object} lfData  - Form builder data model
   * @returns {Object} - Return updated input object.
   */
  this.processAnswerLists = function(lfData) {
    traverse(lfData).forEach(function(x) {
      if(this.parent && this.parent.key === 'items' &&
        (x.dataType === 'CNE' || x.dataType === 'CWE')) {
        if(typeof(x.answers) === 'string') {
          x.answers = thisService.fetchAnswerList(x.answers);
        }
        if(x.questionCode === 'units') {
          traverse(x.answers).forEach(function() {
            if(this.key === 'text') {
              // text has ucum description. We want to use code field (smaller text).
              this.update(this.parent.node.code);
            }
          });
        }
        this.update(x);
      }
    });
    return lfData;
  };


  /**
   * Create form builder data model using imported data.
   *
   * @param {Object} importedData - Source of lforms (typically from user saved file) data model
   */
  this.createFormBuilder = function(importedData) {
    var formBuilder = {};
    var flData = angular.copy(lfDataCached.formLevelFBData);
    if(importedData) {
      flService.importFormLevelFields(flData, importedData);
    }
    var flNode = thisService.createTreeNode();
    flNode.lfData = {basic: new LForms.LFormsData(flData.basic), advanced: new LForms.LFormsData(flData.advanced)};
    formBuilder.treeData = [flNode];
    if(importedData && importedData.items && importedData.items.length > 0) {
      thisService.updateTree(flNode.nodes, importedData.items);
    }
    thisService.processNodeTree(formBuilder.treeData[0].nodes);
    return formBuilder;
  };


  /**
   * Create a panel tree from imported data.
   *
   * @param importedData - Data model of a panel (typically from lforms-service)
   */
  this.createPanelTree = function(importedData) {
    var ret = [];
    thisService.updateTree(ret, [importedData]);
    thisService.processNodeTree(ret);
    return ret;
  };


  /**
   * Recursive method to build the tree from imported data.
   *
   * @param {Object} formBuilderTreeData - Tree to be updated.
   * @param {Object} importedItems - Input data
   */
  this.updateTree = function(formBuilderTreeData, importedItems) {
    importedItems.forEach(function(importedItem) {
      var node = thisService.createTreeNode();
      node.lfData =  thisService.createFormBuilderQuestion(importedItem);
      if(importedItem.items) {
        node.nodes = [];
        thisService.updateTree(node.nodes, importedItem.items);
      }
      formBuilderTreeData.push(node);
    });
  };


  /**
   * Convert form builder definition to lforms definition
   *
   * @param {Object} lfData - Form builder
   * @returns {Object} - lforms object.
   */
  this.convertLfData = function(lfData) {
    var ret = null;
    var basicData = lfData.basic.getFormData();
    var advData = lfData.advanced.getFormData();
    if(thisService.isNodeFbLfItem(lfData)) {
      ret = thisService.transformToFormDef(basicData.items.concat(advData.items));
    }
    else if(thisService.isNodeFbLfForm(lfData)) {
      ret = flService.exportFormLevelDataToLForms(lfData);
    }
    return ret;
  };


  /**
   * Create form builder for each lforms question (A node in the side bar tree)
   *
   * @param {Object} importedItem - lforms item structure
   */
  this.createFormBuilderQuestion = function(importedItem) {
    var lfData = {};
    lfData['basic'] = angular.copy(lfDataCached.basic);
    lfData['advanced'] = angular.copy(lfDataCached.advanced);
    updateQuestion(lfData, importedItem);
    lfData.basic = new LForms.LFormsData(lfData.basic);
    lfData.advanced = new LForms.LFormsData(lfData.advanced);
    return lfData;
  };


  /**
   * Fetch loinc panel from lforms-service.
   *
   * @param loincNum
   * @param {function} callback - User callback function
   *   parameters:
   *     arg1: If successful, passes the json from the server.
   *           If error, passes null.
   *     arg2: If successful, passes null.
   *           If error, passes http error
   */
  this.getLoincPanelData = function(loincNum, callback) {
    var dataUrl = dataConstants.formDefURL+'loinc_num='+loincNum;
    $http.get(dataUrl)
      .then(function(response) {
        thisService.processRawLForm(response.data);
        callback(response.data, null);
      })
      .catch(function(error) {
        callback(null, error);
      });
  };
  
  /**
   * Do any pre-processing lforms json object before feeding into form builder.
   * Intended to add missing questionCodeSystem based on the form type.
   *
   * @param rawForm - Initial lforms json object, typically downloaded from
   * clinical table search service.
   */
  this.processRawLForm = function (rawForm) {
    if(!rawForm.codeSystem && rawForm.type) {
      rawForm.codeSystem = rawForm.type;
    }
    if(Array.isArray(rawForm.items) && rawForm.items.length > 0) {
      for(var i = 0; i < rawForm.items.length; i++) {
        thisService.traverseItem(rawForm.items[i], null,function(item, parent) {
          // Assume parent code system where questionCodeSystem is absent.
          // Assume form code system (type) if parent code system is absent.
          // As traversing happens from top to bottom, parents should have the
          // code system, except for top level items. If form code system and
          // parent code system is absent, leave it untouched.
          if(!item.questionCodeSystem) {
            if(parent && parent.questionCodeSystem) {
              item.questionCodeSystem = parent.questionCodeSystem;
            }
            else if (rawForm.codeSystem) {
              item.questionCodeSystem = rawForm.codeSystem;
            }
          }
        });
      }
    }
  };
  
  /**
   * Traverse through lforms.item objects.
   * @param item - lforms item object
   * @param parent - Parent item object.
   * @param callback - Call back function. The function is invoked
   * for every descendant item object.
   * function signature: func(item)
   */
  this.traverseItem = function(item, parent, callback) {
    if(!item) {
      return;
    }
    callback(item, parent);
    if(item.items) {
      for(var i = 0; i < item.items.length; i++) {
        thisService.traverseItem(item.items[i], item, callback);
      }
    }
  };


  /**
   * Top level api to convert form builder data to lforms format.
   *
   * @param formData - Top level form builder structure
   * @returns {{}}
   */
  this.transformFormBuilderToFormDef = function(formData) {
    var ret = {};
    if(formData) {
      ret = flService.exportFormLevelDataToLForms(formData.treeData[0].lfData);
      ret.items = transformTreeToFormDef(formData.treeData[0].nodes);
    }

    return ret;
  };


  /**
   * Capture any run time changes to lforms formbuilder and re-initialize the node.
   *
   * This is mainly intended to propagate changes on repeated items, where changes
   * to item after initialization is not propagated to the subsequent additions of
   * that repeatable item.
   *
   * Typically called whenever the user selects a node on the side bar.
   *
   * @param {Object} node - Node object of the side bar tree.
   */
  this.updateNodeLFData = function(node) {
    var lfData = {};
    lfData.basic = node.lfData.basic.getFormData();
    lfData.basic.name = node.lfData.basic.name;
    lfData.basic.shortName = node.lfData.basic.shortName;
    lfData.basic.code = node.lfData.basic.code;
    lfData.basic.type = node.lfData.basic.type;
    lfData.basic.template = node.lfData.basic.template;
    lfData.basic.templateOptions = node.lfData.basic.templateOptions;

    return updateUnitsURL(lfData.basic).then(function (basicLfData) {
      lfData.basic = new LForms.LFormsData(basicLfData);
      lfData.advanced = node.lfData.advanced.getFormData();
      lfData.advanced.name = node.lfData.advanced.name;
      lfData.advanced.shortName = node.lfData.advanced.shortName;
      lfData.advanced.code = node.lfData.advanced.code;
      lfData.advanced.type = node.lfData.advanced.type;
      lfData.advanced.template = node.lfData.advanced.template;
      lfData.advanced.templateOptions = node.lfData.advanced.templateOptions;
      lfData.advanced = new LForms.LFormsData(lfData.advanced);
      node.lfData = lfData;
      return node;
    });
  };


  /**
   * Get skiplogic/datacontrol sources from the tree.
   * Collects siblings of targetNode, and siblings of ancestors.
   * Excludes any header nodes and target node among them.
   *
   * @param rootArray - All root level nodes
   * @param targetNode - Context node whose source list needs to be collected.
   * @returns {*} List of desired nodes.
   */
  this.getSkipLogicDataControlSources = function(rootArray, targetNode) {
    var targetList = [];
    var parentArray = rootArray;
    targetNode.id.split('.').forEach(function(nodeIndex) {
      var i = parseInt(nodeIndex);
      targetList = targetList.concat(lodash.reject(parentArray, function(o) {
        // Avoid self and any header items
        return (
          (o === targetNode) ||
          ( o.lfData.basic.itemHash[dataConstants.ITEMTYPE_ID].value &&
            o.lfData.basic.itemHash[dataConstants.ITEMTYPE_ID].value.code !== 'question')
        );
      }));
      parentArray = parentArray[i-1].nodes;
    });

    var ret = getFieldData(targetList, ['linkId', dataConstants.QUESTION,
      dataConstants.DATATYPE, dataConstants.ANSWERS]);

    ret.forEach(function(x) {
      x.code = x.linkId;
      x.text = x.question;
      delete x.linkId;
      delete x.question;
    });
    return ret;
  };


  /**
   * Return list of ancestors.
   *
   * @param formbuilderTree - Root level node list
   * @param targetNode - Context node whose ancestor list needs to be collected.
   * @returns {Array} List of desired nodes.
   */
  this.getAncestralNodes = function(formbuilderTree, targetNode) {
    // The root is form node. Don't consider its id, but include it in the return list.
    var ret = [formbuilderTree[0]];
    var parentArray = formbuilderTree[0].nodes;
    // Exclude targetNode from the ancestors list.
    var parentId = targetNode.id.substring(0, targetNode.id.lastIndexOf('.'));
    if(parentId) {
      parentId.split('.').forEach(function(nodeIndex) {
        var i = parseInt(nodeIndex);
        ret.push(parentArray[i-1]);
        parentArray = parentArray[i-1].nodes;
      });
    }

    return ret;
  };


  /**
   * Figure out the list of eligible nodes to which a given node could be inserted as
   * a sibling or as a child.
   *
   * @param rootArray {Array} - Root level node list
   * @param contextNode {Object} - A context node to calculate the list of eligible nodes
   * @param excludeContextNode {Object} - Optional: A flag to include or exclude the
   * context node in the list. Typically, the context node should be excluded if
   * the list is presented for insert as a child option. The default is false.
   * @param collection {Array} - Optional: In which all the nodes are collected. Pass an
   * argument to accumulate the results. If not provided, use the return value to get the
   * results.
   * @returns {Array} Returns the list of eligible nodes.
   */
  this.getMovableTargetNodes = function(rootArray, contextNode, excludeContextNode, collection) {

    if(!collection) {
      collection = [];
    }

    if(rootArray && rootArray.length > 0) {
      rootArray.forEach(function(node) {
        if(contextNode.id === node.id) {
          if(!excludeContextNode) {
            collection.push(node);
          }
        }
        else {
          collection.push(node);
          thisService.getMovableTargetNodes(node.nodes, contextNode, excludeContextNode, collection);
        }
      });
    }

    return collection;
  };


  /**
   * Get field values of desired attributes from the given node list.
   * Intended to collect attributes of skip logic source items.
   *
   * @param nodeList - List of nodes from the tree on the side bar.
   * @param fieldList - List of fields corresponding to the item attributes
   * @returns {Array} - List of objects with item code and labelled with nodes id.
   */
  function getFieldData(nodeList, fieldList) {
    var ret = [];
    nodeList.forEach(function(node) {
      var dataObj = {};
      dataObj.label = node.id;
      var fbItems = [];
      fieldList.forEach(function (field) {
        var fbFieldItems = thisService.getFormBuilderFields(node.lfData.basic.items, field);
        fbFieldItems = fbFieldItems.concat(thisService.getFormBuilderFields(node.lfData.advanced.items, field));
        if(fbFieldItems && fbFieldItems.length) {
          fbItems = fbItems.concat(fbFieldItems);
        }
      });
      var item = thisService.transformToFormDef(fbItems, true);
      fieldList.forEach(function(field) {
        var fieldVal = item[field];

        if(dataConstants.ANSWERS === field) {
          if(!fieldVal || fieldVal.length === 0) {
            if(item.dataType === 'CNE' || item.dataType === 'CWE') {
              fieldVal = [{code: 'invalidAnswer', text: '{No answer list}'}];
            }
          }
        }

        if(typeof fieldVal !== 'undefined' && fieldVal !== null) {
          dataObj[field] = fieldVal;
        }
      });
      ret.push(dataObj);
    });
    return ret;
  }


  /**
   * Takes an array of tree nodes and converts into list of preview items processing the nodes recursively.
   * Each node corresponds to question builder data, which will be converted to its corresponding item in the preview.
   *
   * Used to convert aggregation of all nodes to give complete panel/form.
   *
   * Note: For performance reasons, the conversion is done at the time of loading the item into the form builder
   * and its reference (see node.previewItemData) is stored in the node. Subsequent updates to the form builder are
   * reflected in the node.previewItemData based on any user actions.
   *
   * @param treeData {Array} - Array of node objects.
   * @returns {Array} - Transformed array of preview items
   */
  function transformTreeToFormDef(treeData) {
    var ret = [];

    lodash.forEach(treeData, function(node){
      var questionData = node.previewItemData;
      if(node.nodes && node.nodes.length > 0) {
        questionData.items = transformTreeToFormDef(node.nodes);
      }
      ret.push(questionData);
    });

    return ret;
  }


  /**
   * Create an lforms form data (=> preview item data) from form builder model.
   * This is called at the time of loading the form/panel for each node in the tree.
   *
   * @param {Object} formBuilderItems - Form builder model corresponding to a node.
   * @param {boolean} randomFormBuilderItems - True indicates that array formBuilderItems are
   *   created randomly. It does not represent order specified in form-builder-def.js. Default is false.
   * @returns {Object} Converted preview item object corresponding to an item in the preview/output.
   */
  this.transformToFormDef = function(formBuilderItems, randomFormBuilderItems) {

    var ret = {};
    var answerCardinality = {min: "0",max: "1"};
    var typeMap = {};
    ['dataType', '__itemType'].forEach(function(field) {
      var fbField = null;
      if(randomFormBuilderItems) {
        fbField = lodash.find(formBuilderItems, {questionCode: field});
      }
      else {
        fbField = thisService.getFormBuilderField(formBuilderItems, field);
      }
      if(fbField && fbField.value) {
        typeMap[field] = fbField.value.code;
      }
    });
    var dataType = typeMap.dataType;
    var isHeader = typeMap.__itemType ? typeMap.__itemType === 'group' : false;

    lodash.forEach(formBuilderItems, function(item) {
      var attr = item.questionCode;

      switch (attr) {
        case "linkId":
        case "questionCodeSystem":
        case "questionCode":
        case "localQuestionCode":
        case "codingInstructions":
        case "externallyDefined":
        case "copyrightNotice":
          if(item.value) {
            var val = item.value.trim();
            if(val.length > 0) {
              ret[attr] = val;
            }
          }
          break;

        case "question":
        case "prefix":
          if(item.value) {
            var val = item.value.trim();
            if(val.length > 0) {
              ret[attr] = val;
            }
          }
          var addCss = lodash.find(item.items, {questionCode: '_addCss'}).value.code;
          var fieldName = attr === 'question' ? 'obj_text' : 'obj_prefix';
          var partialField = getHiddenFormBuilderField(formBuilderItems, '_partial_'+fieldName);
          if(partialField) {
            ret[fieldName] = partialField.value;
          }
          if(addCss) {
            var css = lodash.find(item.items, {questionCode: fieldName}).value;
            css = css ? css.trim() : null;
            if(css) {
              if (!ret[fieldName]) {
                ret[fieldName] = {};
              }
              if(!ret[fieldName].extension) {
                ret[fieldName].extension = [];
              }
              var sExt = lodash.find(ret[fieldName].extension,
                  {url: 'http://hl7.org/fhir/StructureDefinition/rendering-style'});
              if(sExt) {
                sExt.valueString = css;
              }
              else {
                ret[fieldName].extension.push({
                  "url": "http://hl7.org/fhir/StructureDefinition/rendering-style",
                  "valueString": css
                });
              }
            }
          }
          break;

        case "defaultAnswer":
          // TODO - Revisit this to account for different data types
          if(item.value && dataType === 'CNE' && dataType === 'CWE') {
            if(item.value.label) {
              ret[attr] = item.value.label;
            }
            else if(item.value.code) {
              ret[attr] = item.value.code;
            }
          }
          else if(item.value) {
            var val = item.value.trim();
            if(val.length > 0) {
              ret[attr] = val;
            }
          }
          break;

        case "type":
        case "editable":
          if(item.value && typeof item.value.code !== 'undefined') {
            ret[attr] = item.value.code;
          }
          break;

        case "__itemType":
          switch(item.value.code) {
            case "TOTALSCORE":
              ret.header = false;
              ret.dataType = 'REAL';
              ret.calculationMethod = 'TOTALSCORE';
              break;

            case "group":
              ret.header = true;
              break;

            case "display":
              ret.header = false;
              ret.dataType = 'TITLE';
              break;
            default:
              ret.header = false;
              break;
          }
          break;

        case "calculatedExpression":
          // Pass, it is handled with _calculationMethod
          break;

        case "_calculationMethod":
          if(item.value && item.value.code === 'TOTALSCORE') {
            ret.calculationMethod = {name: item.value.code};
          }
          else if(item.value && item.value.code === 'calculatedExpression') {
            var calExpr = thisService.getFormBuilderField(formBuilderItems, 'calculatedExpression');
            if(calExpr.value) {
              thisService.addOrReplaceExtension(ret, thisService.createCalculatedExpression(calExpr.value));
            }
          }
          break;

        case "dataType":
          // Don't output data type for headers.
          if(!isHeader && !ret[attr] && item.value && typeof item.value.code !== 'undefined') {
            ret[attr] = item.value.code;
          }
          break;

        case "questionCardinality":
          var questionCardinality = {min: "1",max: "1"};
          if(item.value && item.value.code) {
            questionCardinality.max = "*";
          }
          ret[attr] = questionCardinality;
          break;

        case "answerRequired":
          if(item.value && item.value.code) {
            answerCardinality.min = "1";
          }
          ret['answerCardinality'] = answerCardinality;
          break;

        case "multipleAnswers":
          if(item.value && item.value.code && (dataType === 'CNE' || dataType === 'CWE')) {
            answerCardinality.max = "*";
            ret['answerCardinality'] = answerCardinality;
          }
          break;

        case "answers":
          if(dataType === 'CNE' || dataType === 'CWE') {
            if(!ret[attr]) {
              ret[attr] = [];
            }
            var ans = {};
            item.items.forEach(function(part) {
              if(part.questionCode === 'otherValue') {
                if(!!part.value) {
                  ans['other'] = part.value;
                }
              }
              else if(part.questionCode !== 'other') {
                ans[part.questionCode] = part.value;
              }
            });
            ret[attr].push(ans);
          }
          break;

        case "units":
          if(dataType === 'REAL' || dataType === 'INT' || dataType === 'QTY') {
            var val = [];
            lodash.forEach(item.value, function(x) {
              val.push({name: x.code});
            });
            if(val.length > 0) {
              ret[attr] = val;
            }
          }
          break;

        case "_observationLinkPeriod":
          if(item.value && item.value.code) {
            ans = {
              url: dataConstants.fhirObservationLinkPeriodUrl,
            };
            // First of item.items is value, and second is unit.
            if(!!item.items[0].value) {
              ans.valueDuration = {
                value: item.items[0].value
              };
              if(!!item.items[1].value) {
                ans.valueDuration.code = item.items[1].value.code;
                ans.valueDuration.unit = item.items[1].value.text;
                ans.valueDuration.system = dataConstants.ucumUrl;
              }
            }

            if(ans.valueDuration && ans.valueDuration.value) {
              if(!ret["extension"]) {
                ret["extension"] = [];
              }
              ret["extension"].push(ans);
            }
          }
          break;

        case "_fhirVariables":
          ans = {
            url: dataConstants.fhirVariableUrl,
            valueExpression: {
              language: 'text/fhirpath'
            }
          };
          item.items.forEach(function(part) {
            if(!!part.value) {
              ans.valueExpression[part.questionCode] = part.value;
            }
          });

          // I don't see variable name is as mandatory in the spec, but I think it should be.
          if(ans.valueExpression.name) {
            if(!ret["extension"]) {
              ret["extension"] = [];
            }
            ret["extension"].push(ans);
          }
          break;

        case "useRestrictions":
          if(item.value && item.value.code) {
            var restrictions = thisService.getFormBuilderFields(item.items, 'restrictions');
            var restrictionObj = {};
            restrictions.forEach(function(restriction) {
              if(restriction.items[0].value && restriction.items[0].value.code) {
                var name = restriction.items[0].value.code;
                if(restriction.items[1].value) {
                  var value = restriction.items[1].value;
                  restrictionObj[name] = value;
                }
              }
            });
            if(Object.keys(restrictionObj).length > 0) {
              ret['restrictions'] = restrictionObj;
            }
          }
          break;

        case "useSkipLogic":
          if(item.value && item.value.code) {
            var skipLogic = thisService.getFormBuilderField(item.items, 'skipLogic');
            var skl = thisService.transformFormBuilderSkipLogic(skipLogic);
            if (skl && skl.conditions.length > 0) {
              ret.skipLogic = skl;
            }
          }
          break;

        case "useDataControl":
          if(item.value && item.value.code) {
            var dataControls = thisService.getFormBuilderFields(item.items, 'dataControl');
            ret['dataControl'] = [];
            var dataControlList = [];
            dataControls.forEach(function(dataControl) {
              var construction = null;
              if(dataControl.items[0].value) {
                construction = dataControl.items[0].value.code;
              }
              if(dataControl.items[1].value) {
                var source = {
                  sourceLinkId: dataControl.items[1].value.code,
                  sourceType: 'INTERNAL'
                };

                var dataFormat = null;
                if (dataControl.items[2].value.code) {
                  dataFormat = dataControl.items[2].value.code;
                }
                else {
                  // User typed string. See if it is a valid object type
                  try {
                    dataFormat = JSON.parse(dataControl.items[2].value.text);
                  }
                  catch (err) {
                    dataFormat = dataControl.items[2].value.text;
                  }
                }

                var onAttribute = null;
                if (dataControl.items[3].value) {
                  onAttribute = dataControl.items[3].value.code;
                }

                dataControlList.push({
                  construction: construction,
                  source: source,
                  dataFormat: dataFormat,
                  onAttribute: onAttribute
                });
              }
            });
            if(dataControlList.length > 0) {
              ret['dataControl'] = dataControlList;
            }
          }
          break;

        case "displayControl":
          if(item.value && item.value.code) {
            var displayControl = {};
            if(isHeader) {
              displayControl.questionLayout = thisService.getFormBuilderField(item.items, 'questionLayout').value.code;
            }
            var _dataType = thisService.getFormBuilderField(formBuilderItems, '_dataType').value;
            var _externallyDefined = thisService.getFormBuilderField(formBuilderItems, '_externallyDefined').value;
            if(_dataType === '__CNE_OR_CWE__' && !_externallyDefined) {
              displayControl.answerLayout = {};
              var answerLayout = thisService.getFormBuilderField(item.items, 'answerLayout');
              displayControl.answerLayout.type = thisService.getFormBuilderField(answerLayout.items, 'type').value.code;
              var columns = thisService.getFormBuilderField(answerLayout.items, 'columns').value;
              if(displayControl.answerLayout.type === 'RADIO_CHECKBOX' && columns) {
                displayControl.answerLayout.columns = String(columns);
              }
            }
            else if(_externallyDefined) {
              var listColHeaders = thisService.getFormBuilderFields(item.items, 'listColHeaders');
              var headers = [];
              listColHeaders.forEach(function(h) {
                if(h.value && h.value.trim().length > 0) {
                  headers.push(h.value.trim());
                }
              });
              if(headers.length > 0) {
                displayControl.listColHeaders = headers;
              }
            }

            if(Object.keys(displayControl).length > 0) {
              ret['displayControl'] = displayControl;
            }
          }
          break;

        case "extension":
          if(item.value && ret[attr]) {
            ret[attr] = ret[attr].concat(item.value);
          }
          break;

        default:
          // Unrecognized fields.
          if(item.value && !attr.startsWith('_partial_')) {
            ret[attr] = item.value;
          }
          break;
      }
    });
    return ret;
  };

  /**
   *
   * Hidden (unsupported or partially supported) items are added at the end of advanced items.
   * allFBItems are basic items, followed by advanced items.
   * Search for hidden items starting from end of initial set of both categories.
   * Note that user adding repeating items will extend
   * array by insertion, therefore the hidden items are always found at the end.
   *
   * @param allFBItems - All form builder items including basic, advanced and hidden.
   * @param fieldName - Hidden field name.
   *
   * @return - field item or null if not found.
   */
  function getHiddenFormBuilderField(allFBItems, fieldName) {
    return lodash.find(allFBItems, {questionCode: fieldName}, Object.keys(dataConstants.INITIAL_FIELD_INDICES).length);
  }

  /**
   * Convert form builder skip logic structure to skip logic output.
   *
   * @param formBuilderSkipLogic - Form builder representation of skip logic structure.
   * @returns Object - Skip logic object
   */
  this.transformFormBuilderSkipLogic = function (formBuilderSkipLogic) {
    var skl = {action: 'show'};
    // action
    var value = thisService.getFormBuilderField(formBuilderSkipLogic.items, 'action').value;
    if (value) {
      skl.action = value.code;
    }
    // logic
    value = thisService.getFormBuilderField(formBuilderSkipLogic.items, 'logic').value;
    if (value) {
      skl.logic = value.code;
    }
    var conditions = thisService.getFormBuilderFields(formBuilderSkipLogic.items, 'conditions');
    skl.conditions = [];
    // conditions
    conditions.forEach(function (condition) {
      // source
      var val = thisService.getFormBuilderField(condition.items, 'source').value;
      var source = null;
      if (val) {
        source = val.code;
      }

      if (source) {
        var cond = {};
        cond.source = source;
        var compare;
        var sourceType = thisService.getFormBuilderField(condition.items, 'hiddenItemForSourceType').value;
        if (sourceType === 'BL') {
          // compare.code could be one of true, false, 'TRUE', 'FALSE'
          // The boolean value implies exist/notexists and string counter parts imply trigger.value
          // Refer to '_conditionOperatorBool' in answer-lists.js.
          compare = thisService.getFormBuilderField(condition.items, '_conditionOperatorBool').value;
        } else if (sourceType === 'REAL' || sourceType === 'INT' || sourceType === 'QTY') {
          compare = thisService.getFormBuilderField(condition.items, '_conditionOperatorNumeric').value;
        } else {
          compare = thisService.getFormBuilderField(condition.items, '_conditionOperatorOther').value;
        }
        if (compare && (compare.code === true || compare.code === false)) {
          cond.trigger = {exists: compare.code};
        } else if (compare && compare.code) {
          var triggerVal;
          switch (sourceType) {
            case 'BL':
              cond.trigger = {value: compare.code === 'TRUE'};
              break;

            case 'CWE':
            case 'CNE':
              var trigger = thisService.getFormBuilderField(condition.items, 'triggerCNECWE').value;
              if (trigger) {
                val = {};
                if (trigger.code !== null && trigger.code !== undefined) {
                  val.code = trigger.code;
                  if (trigger.system) {
                    val.system = trigger.system;
                  }
                } else {
                  // Text, only if code is absent
                  val.text = trigger.text;
                }

                if (Object.keys(val).length) {
                  cond.trigger = {value: val};
                }
              }
              break;

            case 'REAL':
            case 'INT':
            case 'QTY':
              triggerVal = thisService.getFormBuilderField(condition.items, 'triggerNumeric').value;
              if(triggerVal !== null && triggerVal !== undefined) {
                cond.trigger = {};
                cond.trigger[compare.code] = triggerVal;
              }
              break;

            default:
              triggerVal = thisService.getFormBuilderField(condition.items, 'triggerOther').value;
              if(triggerVal !== null && triggerVal !== undefined) {
                cond.trigger = {};
                cond.trigger[compare.code] = triggerVal;
              }
              break;
          }
        }
        if (cond.trigger && cond.source) {
          skl.conditions.push(cond);
        }
      }
    });

    return skl;
  };


  /**
   * Get first index of form builder item corresponding to its field name.
   *
   * @param lfFBItems - Items defined in form-builder-def.js.
   * @param fieldName - Name of the field item
   * @returns {integer} - Index of found item
   */
  this.getFormBuilderFieldIndex = function(lfFBItems, fieldName) {
    var index = 0;
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];
    if(indexInfo) {
      index = indexInfo.index;
    }
    return lodash.findIndex(lfFBItems, {questionCode: fieldName}, index);
  };


  /**
   * Get form builder item corresponding to its field name.
   *
   * @param lfFBItems - lfitems defined in form builder.
   * @param fieldName - Name of the field item
   * @returns {Object} - Found item
   */
  this.getFormBuilderField = function(lfFBItems, fieldName) {
    var index = 0;
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];
    if(indexInfo) {
      index = indexInfo.index;
    }
    return lodash.find(lfFBItems, {questionCode: fieldName}, index);
  };


  /**
   * Get indices of form builder items corresponding to its field name.
   *
   * @param lfFBItems - lfitems defined in form builder.
   * @param fieldName - Name of the field item
   * @returns {Object} - Index of found item
   */
  this.getFormBuilderFieldIndices = function(lfFBItems, fieldName) {
    var ret = [];
    var index = 0;
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];
    if(indexInfo) {
      index = indexInfo.index;
    }

    while(index >= 0) {
      index = lodash.findIndex(lfFBItems, {questionCode: fieldName}, index);
      if(index >= 0) {
        ret.push(index);
        index++; // Start from next
      }
    }
    return ret;
  };


  /**
   * Get form builder items (multiple) corresponding to its field name.
   *
   * @param lfFBItems {Array} - lfitems defined in form builder.
   * @param fieldName {String} - Name of the field item
   * @returns {Array} - Found items
   */
  this.getFormBuilderFields = function(lfFBItems, fieldName) {
    var index = 0;
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES[fieldName];
    if(indexInfo) {
      index = indexInfo.index;
    }

    return lodash.filter(lfFBItems.slice(index), {questionCode: fieldName});
  };


  /**
   * Change lforms form to lforms item (header).
   *
   * @param lForm - lforms form
   */
  this.adjustFieldsInImportedLoinc = function (lForm) {
    renameKey(lForm, 'code', 'questionCode');
    renameKey(lForm, 'name', 'question');
    renameKey(lForm, 'type', 'questionCodeSystem');
    lForm.header = true;

    walkRecursiveTree(lForm, 'items', function (item) {
      if(!item.questionCodeSystem) {
        item.questionCodeSystem = 'http://loinc.org';
      }
    });

    thisService.lformsUpdate(lForm);
  };


  /**
   * Traverse a recursive node using a given key of a node to identify the tree node.
   *
   * @param startingNode {Object} - Starting node (an item in lforms context) of a recursive tree
   * @param recursiveNodeKey {String} - Key in the node object to follow the recursion.
   * @param visitCallback(node) {Function} - Call back function invoked on visiting the node.
   *        The function is invoked with visited node as argument.
   */
  function walkRecursiveTree(startingNode, recursiveNodeKey, visitCallback) {
    if(startingNode) {
      visitCallback(startingNode);
      var recursiveNodeValue = startingNode[recursiveNodeKey];
      if(recursiveNodeValue instanceof Array) {
        recursiveNodeValue.forEach(function(item) {
          walkRecursiveTree(item, recursiveNodeKey, visitCallback);
        });
      }
      else if(recursiveNodeValue instanceof Object) {
        walkRecursiveTree(recursiveNodeValue, recursiveNodeKey, visitCallback);
      }
    }
  }


  /**
   * Filters out invalid answers.
   *
   * @param formData
   */
  this.removeInvalidAnswers = function(formData) {
    if(formData) {
      traverse(formData).forEach(function(answerList) {
        if(this.key === 'answers') {
          lodash.remove(answerList, function(answer) {
            return (!answer.text);
          });
          if(answerList && answerList.length === 0) {
            answerList = null;
          }
          this.update(answerList, true);
        }
      });
    }
  };


  /**
   * Change item code of ancestral nodes and make the code editable.
   * Intended to override LOINC code to custom code when the user edits
   * a question.
   *
   * @param ancestorList - List of ancestral nodes.
   */
  this.changeItemCodeToCustomCode = function(ancestorList) {
    ancestorList.forEach(function(ancestor) {
      if(thisService.isNodeFbLfForm(ancestor.lfData)) {
        var codeList = thisService.getFormBuilderFields(ancestor.lfData.advanced.items, 'code');
        codeList.forEach(function(codeObj) {
          var system = lodash.find(codeObj.items, {questionCode: 'system'});
          if(system.value === dataConstants.LOINC || system.value === 'http://loinc.org') {
            system.value = 'http://loinc.org/modified';
            var code = lodash.find(codeObj.items, {questionCode: 'code'});
            code.value = 'Modified_' + code.value;
          }
        });
      }
      else {
        var lfd = ancestor.lfData.basic;
        var type = lfd.itemHash['/_questionCodeSystem/1'];
        if(type.value === dataConstants.LOINC) {
          var cs = lfd.itemHash[dataConstants.CODING_SYSTEM_ID];
          cs.value = 'http://loinc.org/modified'; // Loinc is modified
          type.value = dataConstants.OTHER;
          var code = lfd.itemHash[dataConstants.CODE_ID];
          code.value = 'Modified_' + code.value;
        }
      }
      ancestor.previewItemData = thisService.convertLfData(ancestor.lfData);
    });
  };


  /**
   * Pick the value object from the item's answer list using item's current value as a hint.
   *
   * If there is match in code or text, the value is replaced with object from
   * answer list. Otherwise, the value is untouched.
   *
   *
   * @param item (Object) - lforms item object.
   */
  this.assignValueModelFromAnswers = function(item) {
    // Assign proper model to .value.
    // Take the hint from the .value and pick the model object from .answers.
    var val = item.value;
    if(val) {
      if(Object(val) === val) {
        val = lodash.find(item.answers, {code: val.code});
      }
      else {
        val = lodash.find(item.answers, {code: val});
        val = val ? val : lodash.find(item.answers, {text: val});
      }

      if(val) {
        item.value = val;
      }
    }
  };


  /**
   * Get parent node of a given node
   *
   * @param rootArray - Top level array of the tree.
   * @param targetNode - Whose parent is sought.
   * @returns {object} - Parent node of targetNode.
   * @private
   */
  function _getParentNode(rootArray, targetNode) {
    var paths = targetNode.id.split('.');
    paths.pop(); // Discard self index.
    var pathIndexes = paths.map(function(el){return (parseInt(el) - 1);});
    var arr = rootArray;
    var parent = null;
    for(var i = 0; i < pathIndexes.length; i++) {
      parent = arr[pathIndexes[i]];
      arr = parent.nodes;
    }
    return parent;
  }


  /**
   * Get siblings of target and their (common) path.
   *
   * @param rootArray - Top level array of the tree.
   * @param targetNode - Target node
   * @returns {[]} - Two element array with node list as first one and path as second
   * @private
   */
  function _getSiblingNodesAndItsParentPath(rootArray, targetNode) {
    var ret = rootArray;
    var initialPath = [];
    if(targetNode && targetNode.id) {
      var parentNode = _getParentNode(rootArray, targetNode);
      if(parentNode) {
        initialPath = parentNode.id.split('.');
        ret = parentNode.nodes;
      }
    }

    return [ret, initialPath];
  }


  /**
   * Process the tree to refresh sources of skip logic and data control etc.
   *
   * @param rootArray {Array} - Array of top level nodes in the tree.
   *
   */
  this.processNodeTree = function(rootArray, targetNode) {
    thisService.updateTreeIds(rootArray);
    var nodeListAndPath = _getSiblingNodesAndItsParentPath(rootArray, targetNode);
    var nodeList = nodeListAndPath[0];
    var initialPath = nodeListAndPath[1];

    traverseNodeTree(nodeList, function (node, path) {
      if(thisService.isNodeFbLfItem(node.lfData)) {
        var sources = thisService.getSkipLogicDataControlSources(rootArray, node);
        var skipLogicConditions = lodash.drop(node.lfData.advanced.itemHash[dataConstants.SKIPLOGIC_ID].items, 2);
        skipLogicConditions.forEach(function(x) {
          x.items[0].answers = sources;
          thisService.assignValueModelFromAnswers(x.items[0]);
        });
        var dataControls = node.lfData.advanced.itemHash[dataConstants.USE_DATACONTROL_ID].items;
        dataControls.forEach(function(x) {
          x.items[1].answers = sources;
          thisService.assignValueModelFromAnswers(x.items[1]);
        });

        node.lfData.basic._checkFormControls();
        node.lfData.advanced._checkFormControls();
      }
      node.previewItemData = thisService.convertLfData(node.lfData);
    }, initialPath);
  };


  /**
   * Walk the tree to refresh ids of the node. Needed from time to time
   * when the tree is structurally modified.
   *
   * @param rootArray {Array} - Array of top level nodes in the tree.
   *
   */
  this.updateTreeIds = function(rootArray) {
    traverseNodeTree(rootArray, function (node, path) {
      node.id = path.join('.');
    });
  };


  /**
   * Is this node representing  lforms item object? It is true if the object has representation for questionCode property, otherwise false.
   * Intended to distinguish form level item from lforms item in form builder's data model.
   *
   * @param nodeFbLfData - Form builder's node data object containing basic and advanced objects of lforms data in the form builder.
   * @private
   */

  this.isNodeFbLfItem = function (nodeFbLfData) {
    var ret = false;
    if(nodeFbLfData && nodeFbLfData.basic && nodeFbLfData.basic.itemHash && nodeFbLfData.basic.itemHash[dataConstants.CODE_ID]) {
      ret = true;
    }

    return ret;
  };


  /**
   * Is this node representing  lforms form level field?
   *
   * Intended to distinguish form level item from lforms item in form builder's data model.
   *
   * @param nodeFbLfData - Form builder's node data object containing basic and advanced objects of lforms data in the form builder.
   * @private
   */

  this.isNodeFbLfForm = function (nodeFbLfData) {
    var ret = false;
    if(nodeFbLfData && nodeFbLfData.basic && nodeFbLfData.basic.itemHash && nodeFbLfData.basic.itemHash['/status/1']) {
      ret = true;
    }

    return ret;
  };


  /**
   * Returns one of the strings: 'lforms' | 'R4' | 'STU3'
   *
   * Makes educated guess by looking at some fields in the object
   *
   * @param fhirOrLFormsObj {object} - JSON object representing either LForms or FHIR questionnaire.
   * @private
   */

  this.detectVersion = function (fhirOrLFormsObj) {

    var version = 'lforms';
    if(fhirOrLFormsObj) {
      // Presence of item in Questionnaire is optional, but presence of items implies lforms.
      if(fhirOrLFormsObj.item || !fhirOrLFormsObj.items) { //
        version = LForms.Util.detectFHIRVersion(fhirOrLFormsObj) || LForms.Util.guessFHIRVersion(fhirOrLFormsObj);
      }
    }

    return version;
  };


  /**
   * Prune out insignificant properties from the object.
   * Insignificant properties include undefined, null, empty strings, and empty objects.
   * All numbers, booleans and dates including invalid dates are significant.
   *
   * @param obj
   * @returns {*}
   * @private
   */
  this._pruneObject = function(obj) {
    return lodash.transform(obj, function(ac, v, k){
      var t = typeof v;

      switch(t) {
        case 'string':
          v = v.trim();
          if(v) {
            ac[k] = v;
          }
          break;

        case 'boolean':
        case 'number':
          ac[k] = v;
          break;

        case 'object':
          if(v instanceof Date) {
            ac[k] = v;
          }
          else if(!lodash.isEmpty(v)) {
            ac[k] = thisService._pruneObject(v);
          }
          break;
      }

      return ac;
    }, {});
  };


  /**
   * Compare two objects for any significant differences. Any properties with empty values are ignored for comparison.
   *
   * @param obj1
   * @param obj2
   * @returns {boolean}
   * @private
   */
  this._isEquivalent = function(obj1, obj2) {
    return lodash.isEqual(thisService._pruneObject(obj1), thisService._pruneObject(obj2));
  };


  /**
   * Create calculated expression extension.
   * @param expStr -  FHIR Path expression value
   * @returns {*} - Extension object.
   */
  this.createCalculatedExpression = function (expStr) {
    var ret = null;
    if(expStr) {
      ret = {
        url: dataConstants.calculatedExpressionUrl,
        valueExpression: {
          language: 'text/fhirpath',
          expression: expStr
        }
      };
    }

    return ret;
  };


  /**
   * Update the item.extension array with new extension. If the extension identified by url is already present, it will
   * replace the element, otherwise add it to the array.
   * @param item - item containing item.extension array.
   * @param extensionObj - New extension object to insert.
   */
  this.addOrReplaceExtension = function(item, extensionObj) {
    if(extensionObj && item) {
      if(!item.extension) {
        item.extension = [];
      }
      var ind = lodash.findIndex(item.extension, {url: extensionObj.url});
      if( ind >= 0) {
        item.extension[ind] = extensionObj;
      }
      else {
        item.extension.push(extensionObj);
      }
    }
  };


  /**
   * Node traversal function with a callback to process each node.
   *
   * @param nodes {Array} - Array of top level node objects. Expects each node to
   *   have 'nodes' as children.
   * @param processNodeFn {Function} -  Callback to process the visited node in the tree.
   *   It has two arguments.
   *     node {Object} - First argument is node object visited.
   *     path {Array} - Path of the visited node as an array of indices of its ancestors and itself.

   * @param path {Array} - Optional: Initial path to nodes argument, if any.
   */
  function traverseNodeTree(nodes, processNodeFn, path) {
    if(!nodes || nodes.length === 0) {
      return;
    }

    if (!path) {
      path = [];
    }

    nodes.forEach(function (node, index) {
      path.push(index+1);
      processNodeFn(node, path);
      traverseNodeTree(node.nodes, processNodeFn, path);
      path.pop();
    });
  }


  /**
   * Update fields of a question in the form builder data model.
   *
   * @param {Object} lfData - Question item in form builder data model
   * @param {Object} importedItem - Question item from lforms data model
   */
  function updateQuestion(lfData, importedItem) {
    lodash.forEach(importedItem, function(v, k) {
      if(k !== 'items') {
        updateValue(lfData, importedItem, k, v);
      }
    });
  }


  /**
   * Identify the field in the form builder item, and use _initValue to update
   * its field value.
   *
   * @param {Object} lfItem - Question item (representing a node in the tree) from form builder data model.
   * @param {Object} importedItem - lforms item to be translated to form builder data.
   * @param {String} name - Name of the field.
   * @param {*} val - Value to update. The type is field specific.
   */
  function updateValue(lfItem, importedItem, name, val) {
    var indexInfo = null;
    var subItem = null;
    var parentItem = null;
    var definedItem = false; // Identify unimplemented items.

    /*
      Indented items are lforms properties that show up as children of form builder main item list,
      for example skip logic is a child of useSkipLogic. Identify those form builder items.
     */
    var indentedItemsMap = {
      'restrictions': 'useRestrictions',
      'skipLogic': 'useSkipLogic',
      'dataControl': 'useDataControl',
      'obj_prefix': 'prefix',
      'obj_text': 'question'
    };
    if(indentedItemsMap[name]) {
      indexInfo = dataConstants.INITIAL_FIELD_INDICES[indentedItemsMap[name]];
      parentItem = thisService.getFormBuilderField(lfItem[indexInfo.category].items, indentedItemsMap[name]);
      definedItem = true;
    }
    // These items do not directly map to one on one
    // Theses are not directly defined in form-builder-def, but they translate to other fields.
    else if(name === 'answerCardinality' || name === 'header' || name === 'calculationMethod' || name === 'extension') {
      definedItem = true;
    }
    else {
      indexInfo = dataConstants.INITIAL_FIELD_INDICES[name];
      if(indexInfo) {
        subItem = thisService.getFormBuilderField(lfItem[indexInfo.category].items, name);
        definedItem = true;
      }
    }

    // Save or update the value of unimplemented items at the end.
    if(!definedItem) {
      addAsHidden(lfItem, name, val);
      return;
    }

    // Stop processing for null values. Rely on lforms to assign defaults,
    // except null for dataType which we will make some educated guess.
    if(!val && name !== 'dataType') {
      return;
    }

    // Handle field specific cases.
    switch(name) {
      case "answerCardinality":
        updateAnswerRequiredMultipleAnswers(lfItem, val);
        break;

      case "questionCardinality":
        updateRepeatQuestion(subItem, val);
        break;

      case "skipLogic":
        parentItem.value = {text: 'Yes', code: true};
        updateSkipLogic(parentItem, val);
        break;

      case "dataControl":
        parentItem.value = {text: 'Yes', code: true};
        updateDataControl(parentItem, val);
        break;

      case "displayControl":
        updateDisplayControl(subItem, val);
        break;

      case "restrictions":
        parentItem.value = {text: 'Yes', code: true};
        updateRestrictions(parentItem, val);
        break;

      case "units":
        updateUnits(subItem, val);
        break;

      case "questionCodeSystem":
        var _fbSystem = thisService.getFormBuilderField(lfItem[dataConstants.INITIAL_FIELD_INDICES['_questionCodeSystem'].category].items, '_questionCodeSystem');
        if(val === 'LOINC' || val === 'http://loinc.org') {
          subItem.value = 'http://loinc.org';
          _fbSystem.value = dataConstants.LOINC;
        }
        else {
          // Enable editing of code and system fields for 'other' systems.
          subItem.value = val;
          _fbSystem.value = dataConstants.OTHER;
        }
        break;

      case "editable":
        thisService.updateCNECWE(subItem, val);
        break;

      case "calculationMethod":
        var calFieldName = '_calculationMethod';
        var calMethod = thisService.getFormBuilderField(lfItem[dataConstants.INITIAL_FIELD_INDICES[calFieldName].category].items, calFieldName);
        thisService.updateCNECWE(calMethod, val);
        break;

      case "extension":
        if(val) {
          var varExtensions = [];
          var hiddenList = val.filter(function (ext) {
            var hidden = false;
            var calFieldName = null;
            switch (ext.url) {
              case dataConstants.calculatedExpressionUrl:
                calFieldName = '_calculationMethod';
                var calMethod = thisService.getFormBuilderField(lfItem[dataConstants.INITIAL_FIELD_INDICES[calFieldName].category].items, calFieldName);
                calFieldName = 'calculatedExpression';
                thisService.updateCNECWE(calMethod, calFieldName);
                var calExprField = thisService.getFormBuilderField(lfItem[dataConstants.INITIAL_FIELD_INDICES[calFieldName].category].items, calFieldName);
                calExprField.value = ext.valueExpression.expression;
                break;

              case dataConstants.fhirVariableUrl:
                if(ext.valueExpression && ext.valueExpression.language.toLowerCase() === 'text/fhirpath') {
                  varExtensions.push(ext);
                }
                else {
                  hidden = true;
                }

                break;

              case dataConstants.fhirObservationLinkPeriodUrl:
                if(ext.valueDuration && ext.valueDuration.value !== undefined && ext.valueDuration.value !== null && ext.valueDuration.code) {
                  var fieldName = '_observationLinkPeriod';
                  var obsLinkPeriod = thisService.getFormBuilderField(lfItem[dataConstants.INITIAL_FIELD_INDICES[fieldName].category].items, fieldName);
                  // Only ucum units are valid. If system is absent, assume ucum
                  if(ext.valueDuration.system === undefined || ext.valueDuration.system === dataConstants.ucumUrl) {
                    var duration = thisService.getFormBuilderField(obsLinkPeriod.items, 'duration');
                    var unit = thisService.getFormBuilderField(obsLinkPeriod.items, 'unit');
                    var unitCode = lodash.find(unit.answers, {code: ext.valueDuration.code}); // Match with supported time units
                    if(unitCode) {
                      thisService.updateCNECWE(obsLinkPeriod, {code: true});
                      duration.value = ext.valueDuration.value;
                      thisService.updateCNECWE(unit, unitCode);
                    }
                  }
                }
                break;

              default:
                hidden = true; // Save unhandled extension as it is.
                break;
            }
            return hidden;
          });

          updateVariables(lfItem, varExtensions);

          addAsHidden(lfItem, name, hiddenList);
        }
        break;

      case "header":
        var isHeader = thisService.getFormBuilderField(lfItem.advanced.items, '_isHeader');
        isHeader.value = val ? 'Yes' : 'No';
        if(val) {
          setItemType(lfItem, 'group');
        }
        break;

      case "dataType":
        // Update item type
        var itemType = (importedItem.header || val === 'SECTION') ? 'group' :
          (val === 'TITLE' ? 'display' : 'question');
        setItemType(lfItem, itemType);
        updateDataType(subItem, importedItem, val);
        // Update hidden item
        var dt = thisService.getFormBuilderField(lfItem.advanced.items, '_dataType');
        dt.value = (subItem.value.code === 'CNE' || subItem.value.code === 'CWE') ? '__CNE_OR_CWE__' : subItem.value.code;
        break;

      case "externallyDefined":
        if(val) {
          subItem.value = val;
          var ed = thisService.getFormBuilderField(lfItem.advanced.items, '_externallyDefined');
          ed.value = subItem.value;
        }
        break;

      case "answers":
        var aListItems = createAnswerListValues(subItem, val);
        if(aListItems && aListItems.length > 0) {
          // These items are multiple in the same list (specified as multiple question cardinality in form-builder-def)
          // Replace the default
          var index = thisService.getFormBuilderFieldIndex(lfItem[indexInfo.category].items, name);
          lfItem[indexInfo.category].items.splice.apply(lfItem[indexInfo.category].items, [index, 1].concat(aListItems));
        }
        break;

      case "defaultAnswer":
        updateDefaultAnswer(subItem, val);
        break;

      case "obj_text":
      case "obj_prefix":
        if(val && val.extension && val.extension.length > 0) {
          var cssValue = getRenderingStyle(val.extension);
          if(cssValue) {
            lodash.find(parentItem.items, {questionCode: '_addCss'}).value = {code: true};
            lodash.find(parentItem.items, {questionCode: name}).value = cssValue;
          }
          if(val.extension.length > 0) {
            addAsHidden(lfItem, '_partial_'+name, val);
          }
        }
        break;

      case "linkId":
      case "questionCode":
        if(val) {
          subItem.value = val;
          var f = name === 'linkId' ? '_linkId' : '_questionCode';
          var ed = thisService.getFormBuilderField(lfItem.advanced.items, f);
          ed.value = subItem.value;
        }
        break;

      default:
        if(val) {
          subItem.value = val;
        }
        break;
    }
  }


  /**
   * Extract rendering stylestyle extension from extension array.
   *
   * @param extensionsIncludingRenderingStyles - Extensions to look for rendering style
   */
  function getRenderingStyle(extensionsIncludingRenderingStyles) {
    var ret = null;
    if(extensionsIncludingRenderingStyles && extensionsIncludingRenderingStyles.length > 0) {
      var ext = LForms.Util.findObjectInArray(extensionsIncludingRenderingStyles,
          'url',
          'http://hl7.org/fhir/StructureDefinition/rendering-style');
      if(ext) {
        ret = ext.valueString;
      }
    }
    return ret;
  }


  /**
   * Set itemType value in basic and its hidden counterpart in advanced
   *
   * @param {object} lfItem - Form builder node item.
   * @param {string} value - coded value (question|group|display)
   *
   */
  function setItemType(lfItem, value) {
    // item type field in basic
    var itemTypeField = thisService.getFormBuilderField(lfItem.basic.items, '__itemType');
    // Hidden item type used for skip logic in advanced tab.
    var hiddenItemTypeField = thisService.getFormBuilderField(lfItem.advanced.items, '__itemTypeRef');
    thisService.updateCNECWE(itemTypeField, value);
    hiddenItemTypeField.value = value;
  }
  /**
   * Update formbuilder model with imported display control
   *
   * @param useDisplayControlItem - Use display control item.
   * @param importedDisplayControl - Object of display control from imported panel
   */
  function updateDisplayControl(fbDisplayControl, importedDisplayControl) {
    if(importedDisplayControl) {
      fbDisplayControl.value = {code: true};
      if(importedDisplayControl.questionLayout) {
        var fbQuestionLayout = lodash.find(fbDisplayControl.items, {questionCode: 'questionLayout'});
        fbQuestionLayout.value = {code: importedDisplayControl.questionLayout};
      }

      if(importedDisplayControl.answerLayout) {
        var fbAnswerLayout = lodash.find(fbDisplayControl.items, {questionCode: 'answerLayout'});
        if(importedDisplayControl.answerLayout.type) {
          var fbAnswerLayoutType = lodash.find(fbAnswerLayout.items, {questionCode: 'type'});
          fbAnswerLayoutType.value = {code: importedDisplayControl.answerLayout.type};
        }
        if(importedDisplayControl.answerLayout.columns) {
          var fbAnswerLayoutColumns = lodash.find(fbAnswerLayout.items, {questionCode: 'columns'});
          var columns = parseInt(importedDisplayControl.answerLayout.columns);
          if(!isNaN(columns)) {
            fbAnswerLayoutColumns.value = columns;
          }
        }
      }

      if(importedDisplayControl.listColHeaders && importedDisplayControl.listColHeaders.length > 0) {
        var fbColHeaders = [];
        var fbColHeaderIndex = thisService.getFormBuilderFieldIndex(fbDisplayControl.items, 'listColHeaders');
        importedDisplayControl.listColHeaders.forEach(function(header){
          // Clone the default, and modify with imported values.
          var fbColHeader = angular.copy(fbDisplayControl.items[fbColHeaderIndex]);
          fbColHeader.value = header;
          fbColHeaders.push(fbColHeader);
        });

        if(fbColHeaders.length > 0 ) {
          fbDisplayControl.items.splice(fbDisplayControl.items, [fbColHeaderIndex,1].concat(fbColHeaders));
        }
      }
    }
  }


  /**
   * Update formbuilder model with imported data controls
   *
   * @param useDataControlItem - Use data control item.
   * @param importedDataControls - Array of data controls from imported panel
   */
  function updateDataControl(useDataControlItem, importedDataControls) {
    if(lodash.isArray(importedDataControls) && importedDataControls.length > 0) {
      var fbDataControls = [];
      importedDataControls.forEach(function (dataControl) {
        var fbDataControl = angular.copy(useDataControlItem.items[0]);
        // These are CNE types
        ['construction', 'onAttribute'].forEach(function (k) {
          var field = lodash.find(fbDataControl.items, {questionCode: k});
          field.value = {code: dataControl[k]};
        });
        var source = lodash.find(fbDataControl.items, {questionCode: 'source'});
        source.value = {code: dataControl.source.sourceLinkId};
        var df = lodash.find(fbDataControl.items, {questionCode: 'dataFormat'});
        // If the imported value is valid object, stringify it.
        var dfText = Object(dataControl.dataFormat) === dataControl.dataFormat ?
                   JSON.stringify(dataControl.dataFormat) :
                   dataControl.dataFormat;
        // dataFormat is CWE type. Check if it is in answer list.
        var val = lodash.find(df.answers, {code: dfText});
        df.value = Object(val) === val ? val : {text: val};
        fbDataControls.push(fbDataControl);
      });

      if(fbDataControls.length > 0) {
        // Replace the default
        useDataControlItem.items = fbDataControls;
      }
    }
  }


  /**
   * Update answerRequired and multipleAnswers using answerCardinality
   *
   * @param lfQuestion - Form builder data model representing a question
   * @param answerCardinality - LForms definition of answerCardinality.
   */
  function updateAnswerRequiredMultipleAnswers(lfQuestion, answerCardinality) {
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES['answerRequired'];
    var subItem = thisService.getFormBuilderField(lfQuestion[indexInfo.category].items, 'answerRequired');
    if(parseInt(answerCardinality.min) > 0) {
      subItem.value = subItem.answers[0];
    }

    indexInfo = dataConstants.INITIAL_FIELD_INDICES['multipleAnswers'];
    subItem = thisService.getFormBuilderField(lfQuestion[indexInfo.category].items, 'multipleAnswers');
    if(answerCardinality.max === '*' || parseInt(answerCardinality.max) > 1) {
      subItem.value = subItem.answers[0];
    }
  }


  /**
   * Update repeatQuestion.
   *
   * @param {Object} lfItem - repeatQuestion item from form builder data model.
   * @param {Object} importedVal - {min: x, max: y}
   */
  function updateRepeatQuestion(lfItem, importedVal) {
    if(importedVal && (importedVal.max === '*' || parseInt(importedVal.max) > 1)) {
      lfItem.value = lfItem.answers[0];
    }
  }


  /**
   * Create answer lists for form builder data model.
   *
   * @param {Object} lfItem - Answer item from form builder data model
   * @param {Object} importedVal - Answer item from user saved data.
   * @returns {Array} Array of answer items.
   */
  function createAnswerListValues(lfItem, importedVal) {
    var ret = null;
    if(importedVal && lodash.isArray(importedVal)) {
      ret = [];
      lodash.forEach(importedVal, function(x) {
        var item = angular.copy(lfItem);

        item.items[0].value = x.text;
        item.items[1].value = x.code;
        item.items[2].value = x.system;
        item.items[3].value = x.label;
        item.items[4].value = x.score;
        item.items[5].value = {code: !!x.other};
        item.items[6].value = x.other;
        ret.push(item);
      });
    }

    return ret;
  }


  /**
   * Update form builder model with imported item.extension array.
   *
   * @param lfItem - Form builder model representing a particular node (item).
   * @param importedExtensionsArray - extension array of the item.
   */
  function updateVariables(lfItem, importedExtensionsArray) {
    var field = '_fhirVariables';
    var indexInfo = dataConstants.INITIAL_FIELD_INDICES[field];
    var index = thisService.getFormBuilderFieldIndex(lfItem[indexInfo.category].items, field);
    var aListItems = null;
    if(importedExtensionsArray && lodash.isArray(importedExtensionsArray)) {
      aListItems = [];
      lodash.forEach(importedExtensionsArray, function(x) {
        if(x.valueExpression.language.toLowerCase() === 'text/fhirpath') {
          var item = angular.copy(lfItem[indexInfo.category].items[index]);
          item.items[0].value = x.valueExpression.name;
          item.items[1].value = x.valueExpression.expression;
          item.items[2].value = x.valueExpression.description;
          aListItems.push(item);
        }
      });
    }

    if(aListItems && aListItems.length > 0) {
      lfItem[indexInfo.category].items.splice.apply(lfItem[indexInfo.category].items, [index, 1].concat(aListItems));
    }
  }


  /**
   * TODO -
   * Currently defaultAnswer is defined as ST type. This is a temporary solution
   * to assign an object value to string type item.
   *
   * The real fix should change the type dynamically based on dataType of the item
   * the user has selected.
   *
   * @param lfItem - item to be updated
   * @param importedItem - If the value is not specified, this is used to derive the type.
   * @param importedVal - value to update.
   */
  function updateDefaultAnswer(lfItem, importedVal) {
    if(importedVal && typeof importedVal === 'object') {
      lfItem.value = importedVal.text;
    }
    else if(importedVal) {
      lfItem.value = importedVal.toString();
    }
  }


  /**
   * Update dataType field
   *
   * @param lfItem - item to be updated
   * @param importedItem - If the value is not specified, this is used to derive the type.
   * @param importedVal - value to update.
   */
  function updateDataType(lfItem, importedItem, importedVal) {
    if(!importedVal) {
      importedVal = guessDataType(importedItem);
    }
    thisService.updateCNECWE(lfItem, importedVal);
  }


  /**
   * Makes some ducated guess on the datatype.
   * Some of the forms imported from loinc do not have dataType specified.
   *
   * @param importedItem
   * @returns {*}
   */
  function guessDataType(importedItem) {
    var ret = importedItem.dataType;
    if(!importedItem.dataType) {
      if(importedItem.answers && importedItem.answers.length > 0) {
        ret = 'CNE';
      }
      else if(importedItem.units && importedItem.units.length > 0) {
        ret = 'REAL';
      }
      else if(importedItem.defaultValue !== null && importedItem.defaultValue !== undefined) {
        var type = typeof importedItem.defaultValue;
        switch(type) {
          case 'string':
            ret = 'ST';
            break;
          case 'boolean':
            ret = 'BL';
            break;
          case 'number':
            ret = 'REAL';
            break;
        }
      }
      else if(!importedItem.items) {
        ret = 'ST';
      }
    }

    return ret;
  }


  /**
   * Update units field.
   *
   * @param lfItem - item to update
   * @param importedVal - value to update
   */
  function updateUnits(lfItem, importedVal) {
    var val = createCNECWEMulti(lfItem, importedVal);
    if(val) {
      lfItem.value = val;
    }
  }


  /**
   * Update skip logic fields.
   *
   * @param useSkipLogicItem - Form builder model to update
   * @param importedValue - Imported value of skip logic object.
   */
  function updateSkipLogic(useSkipLogicItem, importedValue) {
    if(importedValue) {
      var skl = useSkipLogicItem.items[0];

      ['action', 'logic'].forEach(function (k) {
        if(importedValue[k]) {
          var sklItem = lodash.find(skl.items, {questionCode: k});
          var val = lodash.find(sklItem.answers, {code: importedValue[k]});
          if(val) {
            sklItem.value = val;
          }
        }
      });
      updateSkipLogicConditions(skl, importedValue.conditions);
    }
  }


  /**
   * Update skip logic conditions array.
   *
   * @param formBuilderSkipLogic {Object} - Forbuilder skip logic object to update with
   *   imported lforms skip logic conditions.
   * @param importedSkipLogicConditions {Array} - Array of lforms skip logic conditions
   */
  function updateSkipLogicConditions(formBuilderSkipLogic, importedSkipLogicConditions) {
    if(lodash.isArray(importedSkipLogicConditions) && importedSkipLogicConditions.length > 0) {
      var fbConditions = [];
      var condIndex = lodash.findIndex(formBuilderSkipLogic.items, {questionCode: 'conditions'});
      importedSkipLogicConditions.forEach(function (cond) {
        var fbCondition = angular.copy(formBuilderSkipLogic.items[condIndex]);
        var source = lodash.find(fbCondition.items, {questionCode: 'source'});
        source.value = {code: cond.source};
        updateSkipLogicTrigger(fbCondition, cond.trigger);
        fbConditions.push(fbCondition);
      });

      if(fbConditions.length > 0) {
        // Replace the default
        formBuilderSkipLogic.items.splice.apply(formBuilderSkipLogic.items, [condIndex, 1].concat(fbConditions));
      }
    }
  }


  /**
   * This updates the input fields of skip logic condition trigger in formbuilder (middle panel).
   *
   * @param fbSkipLogicCondition {Object} - Form builder model of skip logic condition
   * @param lfTrigger {Object} - Lforms skip logic condition trigger object.
   */
  function updateSkipLogicTrigger(fbSkipLogicCondition, lfTrigger) {
    if(!lfTrigger) {
      return;
    }

    var fbTriggerCNE = lodash.find(fbSkipLogicCondition.items, {questionCode: 'triggerCNECWE'});
    var fbTriggerNumeric = lodash.find(fbSkipLogicCondition.items, {questionCode: 'triggerNumeric'});
    var fbTriggerOther = lodash.find(fbSkipLogicCondition.items, {questionCode: 'triggerOther'});
    var fbOpNumeric = lodash.find(fbSkipLogicCondition.items, {questionCode: '_conditionOperatorNumeric'});
    var fbOpBool = lodash.find(fbSkipLogicCondition.items, {questionCode: '_conditionOperatorBool'});
    var fbOpOther = lodash.find(fbSkipLogicCondition.items, {questionCode: '_conditionOperatorOther'});

    var operators = Object.keys(lfTrigger);

    for(var i = 0; i < operators.length; i++) {
      var val = lfTrigger[operators[i]];
      if(operators[i] === 'value' || operators[i] === 'notEqual') {
        var type = Object.prototype.toString.call(val);
        switch(type) {
          case '[object Boolean]':
            // string representation of boolean implies boolean operators where as
            // boolean value itself implies exists/notexists operators. Refer to _conditionOperatorBool in answer-lists.js.
            fbOpBool.value = {code: val.toString().toUpperCase()};
            break;

          case '[object Number]':
            fbOpNumeric.value = {code: operators[i]};
            fbTriggerNumeric.value = val;
            break;

          case '[object Object]':
            fbOpOther.value = {code: operators[i]};
            fbTriggerCNE.value = val;
            break;

          default:
            fbOpOther.value = {code: operators[i]};
            fbTriggerOther.value = val;
            break;
        }
      } else if(operators[i] === 'exists') {
        fbOpBool.value = {code: val};
        fbOpNumeric.value = {code: val};
        fbOpOther.value = {code: val};
      } else {
        fbOpNumeric.value = {code: operators[i]};
        fbTriggerNumeric.value = val;
      }
    }
  }


  /**
   * Test for {} instance, i.e other than inbuilt objects like null, Date, RegExp, Array, String etc.
   *
   * @param obj - Object to test
   * @returns {boolean}
   * @private
   */
  function _isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  /**
   * Update restrictions.
   *
   * @param useRestrictionsItem - useRestrictions item in form builder data to update
   * @param importedValues - values to update
   */
  function updateRestrictions(useRestrictionsItem, importedValues) {
    if(importedValues) {
      var fbRestrictions = [];
      Object.keys(importedValues).forEach(function (key) {
        // Clone the default, and modify with imported values.
        var fbRestriction = angular.copy(useRestrictionsItem.items[0]);
        // Pick 'name' from answer list.
        var fbVal = lodash.find(fbRestriction.items[0].answers, {code: key});
        fbRestriction.items[0].value = fbVal;
        fbRestriction.items[1].value = importedValues[key];
        fbRestrictions.push(fbRestriction);
      });

      if(fbRestrictions.length > 0) {
        // Replace the default
        useRestrictionsItem.items = fbRestrictions;
      }
    }
  }


  /**
   * Update fields of type CNE/CWE in form builder
   *
   * @param {Object} lfItem - Field item from form builder data model.
   * @param {String} importedVal - Value for the field item
   */
  this.updateCNECWE = function (lfItem, importedVal) {
    var val = createCNECWE(lfItem, importedVal);
    if(val) {
      lfItem.value = val;
    }
  };


  /**
   * Create a CNE/CWE item type from saved value.
   *
   * @param {Object} lfItem - Field containing answer list from form builder data model.
   * @param {Object} importedVal - User saved CNE/CWE item
   * @returns {Object} - Created CNE/CWE item, or null for non existing
   *   CNE item
   */
  function createCNECWE(lfItem, importedVal) {
    var ret = null;
    var search;
    if(importedVal === null || importedVal === undefined) {
      search = {code: 'ST'}; // Default
    }
    else if(typeof importedVal === 'string' || typeof importedVal === 'boolean') {
      search = {code: importedVal};
    }
    else if(importedVal && typeof importedVal === 'object') {
      search = {code: importedVal.code || importedVal.name};
    }

    var answer = lodash.find(lfItem.answers, search);
    if(answer) {
      ret = answer;
    }
    else if(lfItem.dataType === 'CWE') {
      // Answer not in the list => user defined.
      ret = search;
      ret.text = search.code;
    }

    return ret;
  }


  /**
   * Create array type field items in form builder data model.
   * Intended for units.
   *
   * @param {Object} lfItem - Field item of CNE/CWE type in form builder data model.
   * @param {Array} importedVal - Array of saved items
   */
  function createCNECWEMulti(lfItem, importedVal) {
    var ret = null;
    if(lodash.isArray(importedVal)) {
      var objArray = null;
      lodash.forEach(importedVal, function(x){
        if(!objArray) {
          objArray = [];
        }
        objArray.push(createCNECWE(lfItem, x));
      });
      ret = objArray;
    }
    return ret;
  }


  /**
   * @param {Object} obj - Object whose keys are renamed.
   * @param {String} oldkey
   * @param {String} newkey
   * @returns none
   */
  function  renameKey(obj, oldkey, newkey) {
    if(newkey !== oldkey) {
      if(obj.hasOwnProperty(oldkey)) {
        obj[newkey] = obj[oldkey];
        delete obj[oldkey];
      }
    }
  }


  /**
   * Create a skip logic with impossible condition, to hide an item. This is to help preserve the unrecognized
   * items as hidden items in the form builder.
   *
   * @param lfItem - Form builder model of the question.
   * @param name - Un recognized field name.
   * @param val - The field's value
   */
  function addAsHidden(lfItem, name, val) {

    lfItem.advanced.items.push({
      questionCode: name,
      linkId: '/'+name,
      // Hide it using impossible condition. _isHeader can be only "Yes" or "No"
      skipLogic: {
        conditions: [
          {
            "source": "/_isHeader",
            "trigger": {
              "value": "notThisString"
            }
          }
        ]
      },
      value: val
    });
  }


  /**
   * Adjust auto-complete search url for units during run time. The modified
   * search floats the units with matching loinc property of the question
   * to the top.
   *
   * @param lfData - Form builder model of the question.
   */
  function updateUnitsURL(lfData) {
    var deferred = $q.defer();
    var httpCall = false;
    var dataType = thisService.getFormBuilderField(lfData.items, 'dataType');
    if(dataType && dataType.value && (dataType.value.code === 'INT' || dataType.value.code === 'REAL')) {
      var unitsItem = thisService.getFormBuilderField(lfData.items, 'units');
      var code = thisService.getFormBuilderField(lfData.items, 'questionCode').value;
      var matched = /^(Modified_)?(\d+\-\d)$/.exec(code);
      if(matched) {
        var loinc = matched[2];
        httpCall = true;
        $http.get(dataConstants.searchLoincPropertyURL+'&terms='+loinc).then(function (resp) {
          var displayFields = resp.data[3][0];
          if(displayFields.length > 0) {
            unitsItem.externallyDefined += '&bq=loinc_property:(' + encodeURIComponent('"' + displayFields[0] + '"') + ')^20';
          }
          deferred.resolve(lfData);
        }, function (err) {
          console.error('Failed to retrieve LOINC property of '+loinc, err);
          deferred.resolve(lfData); // ignore the error.
        });
      }
    }

    if(!httpCall) {
      deferred.resolve(lfData);
    }

    return deferred.promise;
  }

  // Expose for unit testing
  this._updateUnitsURL = updateUnitsURL;

  this.cacheLFData();

  /**
   *
   * Update any previous versions of imported lforms. LOINC items from CTSS could
   * be out of sync with new lforms format.
   *
   * @param lformsData - Form, question or panel in lforms format.
   */
  this.lformsUpdate = function(lformsData) {
    var form = lformsData;
    if(lformsData.questionCode || lformsData.linkId) {
      form = {items: [lformsData]};
    }
    lformsUpdater.update(form);
  }
}]);
