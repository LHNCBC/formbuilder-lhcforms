/**
 * Created by akanduru on 4/24/17.
 *
 * Controller for for pop up menu items triggered by '...' button on the nodes
 * of side bar tree.
 */
angular.module('formBuilder')
  .controller('popupMenuCtrl', [
    '$scope',
    '$mdDialog',
    "$timeout",
    "$compile",
    "$templateCache",
    "$templateRequest",
    function($scope, $mdDialog, $timeout, $compile, $templateCache, $templateRequest) {

      var thisCtrl = this;

      var menuEl = null;
      var popupMenuUrl = 'app/form-builder/popup-menu.html';

      // Popup menu template is not ng-included. Load it into template cache.
      $templateRequest(popupMenuUrl);

      /**
       * Show move dialog
       *
       * @param scope {Object} - Angular scope invoking the method.
       * @param event {Object} - Event object invoking the method.
       * @param moveType {String} - One of the enumerated types defined in dataConstants.
       */
      thisCtrl.showMoveDialog = function (scope, event, moveType) {
        scope.moveType = moveType;
        $mdDialog.show({
          scope: scope,
          preserveScope: true,
          templateUrl: 'app/form-builder/move-dialog.html',
          targetEvent: event
        });
      };


      /**
       * Listen to menu's close event to clean up the menu. Remove the menu from
       * the DOM, after it is closed.
       * @param Callback to handle the event which passes event and menu objects
       */
      $scope.$on("$mdMenuClose", function(event, menu) {
        if (menu[0] === menuEl) {
          // Pause for a while. This gives a chance to invoke subsequent dialogs,
          // and also escape current digest cycle.
          $timeout(
            function() {
              thisCtrl.removeMenu();
            },
            500, // Pause until the actions of menu item
                 // clicks are initialized
            false
          );
        }
      });


      /**
       * Remove menu from the dom. Note that menu content is attached to the body
       * element.
       *
       */
      thisCtrl.removeMenu = function() {

        var menuContent = angular.element('.nodeMenuContent').parent().remove();
        if (menuEl) {
          menuEl.remove();
          menuEl = null;
        }
      };


      /**
       * Create a popup menu on the fly when the user clicks the 'more' button
       * on the node. It attaches the menu template to the DOM and does angular
       * compile. After the user is done with it, make sure to remove it from the
       * DOM.
       *
       * The statically created menus in the html could potentially
       * create dozens or tens of dozens of menu elements. So, the html content
       * is cached at boot up time, and used it to recreate the menu on
       * 'more' button click.
       *
       * @param scope {Object} - Angular scope
       * @param event {Object} - Event object that triggered popup menu.
       */
      thisCtrl.showPopupMenu = function(scope, event) {
        // Remove if there is an old one hanging around.
        if (menuEl) {
          thisCtrl.removeMenu();
        }

        var target = angular.element(event.target);
        target.append($templateCache.get(popupMenuUrl));

        // Angularize the new template
        $compile(target.contents())(scope);

        menuEl = target.find('md-menu');
        if(scope.selectedNode.id !== scope.$modelValue.id) {
          scope.selectNode(scope.$modelValue);
        }
        menuEl.scope().$mdMenu.open(event);
      };

    }]);