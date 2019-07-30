/**
 * Controller for a dialog box to handle moving nodes in the side bar tree
 * using popup menu of 'more options' button.
 *
 */
angular.module('formBuilder')
  .controller('moveDlgCtrl', [
    '$scope',
    '$mdDialog',
    'formBuilderService',
    'dataConstants',
    function($scope, $mdDialog, formBuilderService, dataConstants) {

      var thisCtrl = this;
      thisCtrl.selectedTarget = {text: '', code: '', label: '', node: null};

      // Dialog titles for different use cases.
      thisCtrl.moveDialogTitle = {};
      thisCtrl.moveDialogTitle[dataConstants.INSERT_AFTER] = 'Move this item after';
      thisCtrl.moveDialogTitle[dataConstants.INSERT_BEFORE] = 'Move this item before';
      thisCtrl.moveDialogTitle[dataConstants.INSERT_AS_CHILD] = 'Make this item as a child of';

      // auto completer options.
      thisCtrl.autocompNodes = {
        opts: {
          listItems: []
        }
      };


      /**
       *  Load all the nodes in the tree into auto complete prefetch plugin.
       *
       *  @param aScope - The context scope of the node.
       *
       */
      function init(aScope) {
        var excludeSelf = aScope.moveType === dataConstants.INSERT_AS_CHILD;
        var list = formBuilderService.getMovableTargetNodes(aScope.formBuilderData.treeData[0].nodes, aScope.selectedNode, excludeSelf, []);
        var listItems = [];
        list.forEach(function (node) {
          listItems.push({
            text: node.id + ': ' +
              $scope.getItem(node.lfData, 'question').value + ' [' +
              $scope.getItem(node.lfData, 'questionCode').value + ']',
            code: $scope.getItem(node.lfData, 'questionCode').value,
            label: node.id
          });
        });
        thisCtrl.autocompNodes = {
          opts: {
            addSeqNum: false,
            matchListValue: true,
            listItems: listItems
          }
        };
      }


      /**
       * Move button handler
       *
       * Moves the current node to insert at the destination chosen by the user.
       *
       * @param scope - Angular scope.
       * @param moveType {INSERT_BEFORE | INSERT_AFTER | INSERT_AS_CHILD}
       * - An enumerated constant to indicate different use cases on which the
       *   insertion at the target location is based on.
       *
       */
      thisCtrl.move = function(scope, moveType) {
        var nodeId = thisCtrl.selectedTarget.label;
        var rootNodesScope = scope.getRootNodesScope();
        var targetNodeScope = scope.getNodeScopeById(rootNodesScope, nodeId);
        var sourceNode = scope.selectedNode;
        scope.remove();
        switch(moveType) {
          case dataConstants.INSERT_BEFORE:
            targetNodeScope.$parentNodesScope.insertNode(parseInt(nodeId.substring(nodeId.lastIndexOf('.')+1)) - 1, sourceNode);
            break;
          case dataConstants.INSERT_AFTER:
            targetNodeScope.$parentNodesScope.insertNode(parseInt(nodeId.substring(nodeId.lastIndexOf('.')+1)), sourceNode);
            break;
          case dataConstants.INSERT_AS_CHILD:
            targetNodeScope.$childNodesScope.insertNode(targetNodeScope.childNodes().length, sourceNode);
            break;
        }

        scope.selectNode(sourceNode);

        $mdDialog.hide();
      };


      /**
       * Close/cancel button handler.
       */
      thisCtrl.cancel = function() {
        $mdDialog.hide();
      };


      init($scope);
    }]);