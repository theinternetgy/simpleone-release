var app = angular.module('myapp', ['LocalStorageModule','ngSanitize','ngRoute','ngAnimate','angular-growl','ngTagsInput']);
app.config(function (localStorageServiceProvider,$routeProvider) {
  localStorageServiceProvider.setPrefix('releasemgmt');
  
  $routeProvider
            .when('/', {templateUrl : 'dashboard.html',controller  : 'MainCtrl'})
            .when('/add', {templateUrl : 'addexpense.html',controller  : 'MainCtrl'})
            .when('/add/:ind',{controller: 'MainCtrl',templateUrl: 'addexpense.html'});

  //localStorageServiceProvider.setStorageType('sessionStorage');//default: localStorage
  //https://github.com/grevory/angular-local-storage
});
app.directive('monthControl', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      template: '<div class="btn-group"><button type="button" class="btn btn-default">{{currentMonth}} 2016</button><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="#" ng-repeat="m in months" ng-click="changeMonth($index)">{{m}} 2016</a></li></ul></div>'
  };
}).directive('datetimePicker', function() {
    var link = function(scope, element, attrs) {
      var datetimeformat='YYYY-MM-DD HH:mm:ss';
      var dateformat='YYYY-MM-DD'; 
        var modelName = attrs['datetimePicker'];
        $(element).datetimepicker({format: datetimeformat});
              $(element).blur(function(){scope.$apply(function(){
                var sv='if(scope.'+modelName+')scope.'+modelName+'="'+$(element).val()+'";';
                  eval(sv);
                  });});
    };
    return {
        require: 'ngModel',
        restrict: 'A',
        link: link
    }
});

app.service('ReleaseService', ['$q', function ($q) {
    var mode = 'local';
    var Items = [];
    var init = function () {
        var a = localStorage.getItem('__ReleaseTracker');
        if (a && a != '') Items= JSON.parse(a); else Items= [];
    }
    init();
    var now = function () {
        return moment().format("DD-MM-YYYY hh:mm:ss");
    }
    var addItem = function (item) {
        var d = $q.defer();
        item.uid = Items.length + 1;
        item.Created = now();
        Items.push(item);
        commit().then(function () { d.resolve('Release detail added.'); });
        return d.promise;
    };

    var getItems = function () {
        return Items;
    };

    var updateItem = function (index, item) {
        var d = $q.defer();
        item.Updated = now();
        Items[index] = item;
        commit().then(function () { d.resolve('Release detail updated.'); });
        return d.promise;
    };

    var commit = function () {
        var d = $q.defer();
        if (mode == 'local') {
            localStorage.setItem('__ReleaseTracker', JSON.stringify(Items));
            console.log('local commit - done');
            d.resolve();
        }
        return d.promise;
    }
    var getMasterData = function () {
        var s = {
  "Masters": {
    "Customers": [
      {
        "text": "Dell",
        "value": "1"
      },
      {
        "text": "Hp",
        "value": "2"
      },
      {
        "text": "Lenovo",
        "value": "3"
      },
      {
        "text": "Compaq",
        "value": "4"
      }
    ],
    "Environments": [
      {
        "text": "On-Premise",
        "value": "On-Premise"
      },
      {
        "text": "Cloud",
        "value": "Cloud"
      }
    ],
    "ReleaseTypes": [
      {
        "text": "Production",
        "value": "1"
      },
      {
        "text": "Implementation",
        "value": "2"
      },
      {
        "text": "POC",
        "value": "3"
      },
      {
        "text": "Testing",
        "value": "4"
      }
    ],
    "Locations": [
      {
        "text": "India",
        "value": "1"
      },
      {
        "text": "US",
        "value": "2"
      },
      {
        "text": "Singapore",
        "value": "3"
      },
      {
        "text": "London",
        "value": "4"
      }
    ],
    "Subscriptions": [
      {
        "text": "South-Asia",
        "value": "1"
      },
      {
        "text": "West-Asia",
        "value": "2"
      },
      {
        "text": "East-Asia",
        "value": "3"
      }
    ]
  }
};
        return s.Masters;
    }
    var selectedItem;
    var selectedRow = function (o) {
        selectedItem = o;
    }
    var getSelectedRow = function () {
        console.log('getSelectedRow:', selectedItem);
    }

    return {
        add: addItem,
        get: getItems,
        update: updateItem,
        master: getMasterData,
        selected: selectedRow,
        getSelected: getSelectedRow
    };
}]);
app.factory('DataService',function($q,$http){
  var service={};
  var config={};
  service.init=function(p){
    if(p)config=p;
    config.url='/Service/api/master';
  }
  service.getdata=function(){
     var d = $q.defer();
        var response = $http({
                method: "GET", url: config.url, params: {}, headers: { 'Accept': 'application/json, text/javascript', 'Content-Type': 'application/json; charset=utf-8' }
        }).success(function (data, status, headers, config) {
            d.resolve(data);
        }).error(function (data, status, headers, config) {
            console.log('error');
            return null;
        });
        
        return d.promise;
  }
  service.savedata=function(item){
    
    
  }
  return service;
});
app.controller('MainCtrl', function($scope,localStorageService,$location,$routeParams,growl,DataService) {
  var remotedb=true;
  $scope.Items=[];
  var key='release_tracker';
  var datetimeformat='YYYY-MM-DD HH:mm:ss';
  var dateformat='YYYY-MM-DD'; 
  var data;
  $scope.selectedIndex=undefined;
  
        
  $scope.changeView = function(view){$location.path(view);}
  $scope.changeMonth=function(index){
    $scope.currentMonth=$scope.months[index];
  }
  $scope.init=function(){
    data = DataService;
    data.init();
    
    data.getdata().then(function(d){
        $scope.Customers = d.Customers;
        $scope.ReleaseTypes = d.ReleaseTypes;
        $scope.Environments = d.Environments;
        $scope.Locations = d.Locations;
        $scope.Subscriptions = d.Subscriptions;
    });
    
    $scope.Item={};
    $('.datetimepicker').datetimepicker({format: datetimeformat});
    
    $scope.months=moment.monthsShort();
    $scope.changeMonth(moment().month());
     
    var v=localStorageService.get(key);
    if(v && v!='')$scope.Items=JSON.parse(v);
    $scope.newmode=true;
    if($routeParams.ind){
      $scope.newmode=false;
      //console.log('edit index:',$routeParams.ind);
      $scope.loadData($routeParams.ind);
    }else{
      
    }
  }
  $scope.init();
  
  $scope.savetodb=function(){
    if(!remotedb){
      var value=JSON.stringify($scope.Items);
      localStorageService.set(key,value);
    }else{
      
      
    }
  }
  
  $scope.edit=function(index){
    $location.path('/addnew/'+index);
  }
  $scope.loadData=function(index){
    $scope.selectedIndex=index;
    $scope.Item=$scope.Items[index];
  }
  $scope.saveTrans=function(t){
    //if(t.due && t.due!='')t.due=moment(t.due).format(datetimeformat);
    if($scope.selectedIndex)
      $scope.Items[$scope.selectedIndex]=t;
    else
      $scope.Items.push(t);
       
    $scope.savetodb();
    
    //growl.warning("This adds a warn message", {title: 'Warning!'});
    //growl.info("This adds a info message", {title: 'Random Information'});
    growl.success("Release saved."); //no title here
    //growl.error("This adds a error message", {title: 'ALERT WE GOT ERROR'});
    $scope.cancel();
  }
   
  $scope.clear=function(){
    $scope.selectedIndex=undefined;
    $scope.Item={};
  }
   $scope.cancel=function(){
    $scope.clear();
    $scope.changeView('/');
  }
});