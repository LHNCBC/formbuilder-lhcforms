/**
 * Controller for for preview widget
 */
angular.module('formBuilder')
  .controller('FormBuilderPreviewCtrl', [
    '$scope', '$mdDialog', 'formBuilderService',
    function($scope, $mdDialog, formBuilderService) {
      /**
       * Return the included template name in 'ng-include'
       * @returns {string}
       */
      $scope.getTemplateUrl = function() {
        return $scope.selectedTemplate;
      };


      /**
       * Invoke preview dialog
       *
       * @param {Object} event - DOM event object
       */
      $scope.showPreview = function (event) {
        $mdDialog.show({
          scope: $scope,
          preserveScope: true,
          templateUrl: 'app/form-builder/preview-dialog.html',
          parent: angular.element(document.body),
          targetEvent: event
        });
      };


      /**
       * Close button handler
       */
      $scope.closeDialog = function() {
        $mdDialog.hide();
      };


      /**
       * Refresh button handler
       */
      $scope.refreshPreview = function() {
        if($scope.selectedNode) {
          $scope.selectedNode.previewItemData = formBuilderService.convertLfData($scope.selectedNode.lfData);
        }
        $scope.previewWidget();
      };
    }]);