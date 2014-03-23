var util = require('util')
  , alertService = require('../lib/alert-service')
  , gtdService = require('../lib/gtd-service');

module.exports = function ($, $scope, $rootScope, $route, $location, $routeParams, moment, $timeout) {
  $scope.tags = [];
  $scope.refreshExtLinks = false;

  $scope.init = function (populateFunc, title) {
    var loc;
    $rootScope.enableKeyboardShortcuts();
    loc = $location.path().split('/')[1];
    switch (loc) {
      case 'inbox':
        $scope.populateFunc = gtdService.getInboxTasks;
        $scope.populateFuncParams = null;
        $scope.listTitle = 'Inbox tasks';
        $scope.showDueDate = false;
        $scope.showProjects = false;
        $scope.showContexts = true;
        $scope.showCompleted = false;
        $scope.sortField = 'date';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'No item, all tasks are planned ?';
        break;
      case 'today':
        $scope.populateFunc = gtdService.getTodayTasks;
        $scope.listTitle = "Today tasks";
        $scope.showDueDate = true;
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.showCompleted = false;
        $scope.sortField = 'priority';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'Congratulations ! You have nothing to do today :-)';
        break;
      case 'next':
        $scope.populateFunc = gtdService.getNextTasks;
        $scope.listTitle = "Next tasks";
        $scope.showDueDate = true;
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.showCompleted = false;
        $scope.sortField = 'dueDate';
        $scope.sortOrder = 0;
        $scope.noItemMessage = 'Nothing to do in the future, maybe you should organize your inbox ;-)';
        break;
      case 'project':
        $scope.populateFunc = gtdService.getProjectTasks;
        $scope.populateFuncParams = $routeParams.name;
        $scope.listTitle = "Tasks for project '" + $routeParams.name + "'";
        $scope.showDueDate = true;
        $scope.showProjects = false;
        $scope.showContexts = true;
        $scope.showCompleted = false;
        $scope.sortField = 'priority';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'Nothing to do for this project :-)';
        break;
      case 'context':
        $scope.populateFunc = gtdService.getContextTasks;
        $scope.populateFuncParams = $routeParams.name;
        $scope.listTitle = "Tasks for context '" + $routeParams.name + "'";
        $scope.showDueDate = true;
        $scope.showProjects = true;
        $scope.showContexts = false;
        $scope.showCompleted = false;
        $scope.sortField = 'priority';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'Nothing to do for this context :-)';
        break;
      case 'completed':
        $scope.populateFunc = gtdService.getCompletedTasks;
        $scope.populateFuncParams = null;
        $scope.listTitle = 'Completed tasks';
        $scope.showDueDate = true;
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.showCompleted = true;
        $scope.sortField = 'completionDate';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'Nothing has been done, maybe you should do something ;-)';
        break;
      case 'search':
        $scope.populateFunc = gtdService.getTasks;
        $scope.populateFuncParams = decodeURIComponent($routeParams.q);
        $scope.listTitle = "Tasks matching '" + $scope.populateFuncParams + "'";
        $scope.showDueDate = true;
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.showCompleted = true;
        $scope.sortField = 'date';
        $scope.sortOrder = 1;
        $scope.noItemMessage = 'Nothing found, maybe you should try another search ;-)';
        break;
    }
    $scope.loadTasks();
    if ($scope.sortField) {
      $scope.sort(null, $scope.sortField);
    }
    $rootScope.title = util.format('(%s) %s - %s', $scope.tasks.length, $scope.listTitle, $rootScope.appTitle);
    $scope.$watch('refreshExtLinks', function (newVal, oldVal) {
      if (!oldVal && newVal) {
        $rootScope.handleExtLinks();
      }
    });
  };

  $scope.loadTasks = function () {
    var words, tagPattern, match;
    $scope.tasks = $scope.populateFunc($scope.populateFuncParams);
    $scope.tags.length = 0;
    tagPattern = new RegExp('^#(.*)$');
    $scope.tasks.forEach(function (task) {
      task.description.split(' ').forEach(function (word) {
        var tag;
        match = word.match(tagPattern);
        if (match) {
          tag = match[1];
          if ($scope.tags.indexOf(tag) === -1) {
            $scope.tags.push(tag);
          }
        }
      });
    });
  };

  $scope.isSortAsc = function (field) {
    return $scope.sortField === field && $scope.sortOrder > 0;
  };

  $scope.isSortDesc = function (field) {
    return $scope.sortField === field && $scope.sortOrder < 0;
  };

  $scope.sort = function ($event, field) {
    if ($event) {
      $event.preventDefault();
    }
    if (field !== $scope.sortField) {
      $scope.sortOrder = 0;
    }
    $scope.sortOrder = $scope.sortOrder || 0;
    $scope.sortOrder = (($scope.sortOrder + 2) % 3) - 1;
    $scope.sortField = $scope.sortOrder === 0 ? null : field;
    if ($scope.sortOrder === 0) {
      $scope.loadTasks();
    } else {
      $scope.tasks.sort(function (a, b) {
        var result, date;
        if (!a[field] && !b[field]) {
          return false;
        } else if (!a[field]) {
          result = -1;
        } else if (!b[field]) {
          result = 1;
        } else if (field === 'priority') {
          if (a[field].toLowerCase() > b[field].toLowerCase()) {
            result = -1;
          } else if (a[field].toLowerCase() < b[field].toLowerCase()) {
            result = +1;
          } else {
            result = 0;
          }
        } else if (a[field] instanceof Date) {
          date = moment(a[field]);
          if (date.isAfter(b[field])) {
            result = 1;
          } else if (date.isBefore(b[field])) {
            result = -1;
          } else {
            result = 0;
          }
        } else {
          if (a[field].toLowerCase() > b[field].toLowerCase()) {
            result = 1;
          } else if (a[field].toLowerCase() < b[field].toLowerCase()) {
            result = -1;
          } else {
            result = 0;
          }
        }
        /*
         if ((a[field] === undefined || a[field] === null) && (b[field] === undefined || b[field] === null)) {
         result = 0;
         } else if (a[field] === undefined || a[field] === null) {
         result = 1;
         } else if (b[field] === undefined || b[field] === null) {
         result = -1;
         } else if (a[field] instanceof Date) {
         date = moment(a[field]);
         if (date.isAfter(b[field])) {
         result = 1;
         } else if (date.isBefore(b[field])) {
         result = -1;
         } else {
         result = 0;
         }
         } else {
         if (a[field].toLowerCase() > b[field].toLowerCase()) {
         result = 1;
         } else if (a[field].toLowerCase() < b[field].toLowerCase()) {
         result = -1;
         } else {
         result = 0;
         }
         }
         */
        return result * $scope.sortOrder;
      });
    }
  };
  
  $scope.undoCb = function(args) {
      var task = args[0];
      task.completed = !task.completed;
      $scope.toggleComplete(task, true);
      $rootScope.$apply();
  };

  $scope.toggleComplete = function (task, doNotShowAlert) {
    task.completionDate = task.completed ? new Date() : null;
    $rootScope.disableWatchers();
    gtdService.saveFileData(
      $rootScope.settings.todoFile,
      $rootScope.settings.archiveEnabled ? $rootScope.settings.archiveFile : null
    );
    $rootScope.enableWatchers();
    $rootScope.loadData();
    if (!doNotShowAlert) {
      alertService.showAlertMessage($, 'success', 'Task successfully saved.', '', 15000, $scope.undoCb, [task]);
    }
    $route.reload();
  };

  $scope.enrichText = function (text, last) {
    var words, urlPattern, tagPattern, result, content, compiledContent;
    result = [];
    urlPattern = new RegExp('^http|https|ftp|ssh|mailto$');
    tagPattern = new RegExp('^#.*$');
    words = text.split(' ');
    words.forEach(function (word) {
      if (word.match(urlPattern)) {
        result.push('<a href="' + word + '" target="_blank">' + word + '</a>');
      } else if (word.match(tagPattern)) {
        result.push('<a href="#/search/' + encodeURIComponent('#' + word.substring(1)) + '">' + word + '</a>');
      } else {
        result.push(word);
      }
    });
    if (last) {
      $scope.refreshExtLinks = true;
    }
    return result.join(' ');
  };
};