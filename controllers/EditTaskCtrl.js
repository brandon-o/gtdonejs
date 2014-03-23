var util = require('util')
  , alertService = require('../lib/alert-service')
  , gtdService = require('../lib/gtd-service');

module.exports = function ($scope, $rootScope, $location, $, $routeParams, moment, $route) {

  $scope.task = {};
  $scope.dueFreqItems = [
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'yearly', name: 'Yearly' }
  ];

  $scope.initTask = function () {
    var task;
    $rootScope.disableKeyboardShortcuts();
    $scope.taskId = parseInt($routeParams.taskId);
    task = gtdService.getTasks()[$scope.taskId];
    $scope.task.description = task.description;
    $scope.task.priority = task.priority;
    $scope.task.dueFreq = task.dueFreq;
    if (task.projects && task.projects.length) {
      $scope.task.projectsLine = task.projects.join(' ');
    }
    if (task.contexts && task.contexts.length) {
      $scope.task.contextsLine = task.contexts.join(' ');
    }
    if (task.dueDate) {
      $scope.task.dueDateStr = moment(task.dueDate).format('YYYY-MM-DD');
    }
    $scope.task.completed = task.completed;
    $('#description').focus();
  };

  $scope.save = function () {
    var task;
    task = {
      id: $scope.taskId,
      date: new Date(),
      description: $scope.task.description,
      priority: $scope.task.priority,
      completed: $scope.task.completed,
      dueFreq: $scope.task.dueFreq
    };
    if ($scope.task.dueDateStr) {
      task.dueDate = gtdService.parseDate($scope.task.dueDateStr, 'YYYY-MM-DD');
    }
    if ($scope.task.projectsLine) {
      task.projects = $scope.task.projectsLine.split(' ');
    }
    if ($scope.task.contextsLine) {
      task.contexts = $scope.task.contextsLine.split(' ');
    }
    task.completionDate = task.completed ? gtdService.formatDate(new Date()) : null;
    gtdService.updateTask(task);
    $rootScope.disableWatchers();
    gtdService.saveFileData(
      $rootScope.settings.todoFile,
      $rootScope.settings.archiveEnabled ? $rootScope.settings.archiveFile : null
    );
    $rootScope.enableWatchers();
    $rootScope.loadData();
    $rootScope.$apply();
    alertService.showAlertMessage($, 'success', 'Task successfully saved.');
    $rootScope.goBack();
  };
  
  $scope.undoRemoveCb = function(args) {
    var task = {
      date: args[0],
      description: args[1],
      priority: args[2],
      dueFreq: args[3],
      dueDate: args[4],
      projects: args[5],
      contexts: args[6]
    };
    gtdService.addTask(task);
    $rootScope.disableWatchers();
    gtdService.saveFileData(
      $rootScope.settings.todoFile,
      $rootScope.settings.archiveEnabled ? $rootScope.settings.archiveFile : null
    );
    $rootScope.enableWatchers();
    $rootScope.loadData();
    $route.reload();
    $rootScope.$apply();
  }
  $scope.remove= function () {
    $('#removeConfirmContainer').modal({keyboard: true, show: true});
  };
  $scope.removeYes = function () {
    $('#removeConfirmContainer').modal('hide');
    $('#removeConfirmContainer').on('hidden.bs.modal', function () {
      $scope.$apply(function () {
        var args, task;
        task  = gtdService.getTaskById($scope.taskId);
        args = [task.date, task.description, task.priority, task.dueFreq, task.dueDate, task.projects, task.contexts];
        gtdService.removeTask($scope.taskId);
        $rootScope.disableWatchers();
        gtdService.saveFileData(
          $rootScope.settings.todoFile,
          $rootScope.settings.archiveEnabled ? $rootScope.settings.archiveFile : null
        );
        $rootScope.enableWatchers();
        $rootScope.loadData();
        $rootScope.$apply();
        alertService.showAlertMessage($, 'success', 'Task successfully removed.', '', 15000, $scope.undoRemoveCb, args);
        $scope.goBack();
      });
    });
  };
};