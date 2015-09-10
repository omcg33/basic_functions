'use strict';

var app = angular.module('mortgagesFilter', ['ui.select2', 'ui.utils.masks', 'ngSanitize'],function($locationProvider){
    $locationProvider.html5Mode(true);
});

app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{[').endSymbol(']}');
});

app
    .filter('trustAsHTML', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .filter('filter', function () {

        return function (mortgages, request) {

            var output = [];

            for (var i = 0; i < mortgages.length; i++) {
                var mortgage = mortgages[i];

                var category = parseInt(mortgage.category);

                if ((request.mortgage_category == category) || (request.mortgage_category == 0)) {
                    output.push(mortgage);
                }
            }
            return output;

        }

    })
    .filter('toArray', function () {
        'use strict';

        return function (obj) {
            if (!(obj instanceof Object)) {
                return obj;
            }

            return Object.keys(obj).map(function (key) {
                return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
            });
        }
    })
    .controller('filterCtrl', ['$scope', '$filter','$location', function ($scope, $filter,$location) {
        if (typeof mortgages_list == 'undefined') {
            console.error('Value "mortgages_list" is not defined');
            return;
        }
        if (typeof mortgages_list != 'object') {
            console.error('Value "mortgages_list"(' + typeof mortgages_list + ') is not an object');
            return;
        }

        var controller = this;
        var search = $location.search();


        var emptyRequest = {
            mortgage_category: 0
        };

        $scope.request = $.extend(true, {},emptyRequest, search);
        $scope.visible_mortgages = mortgages_list;
        $scope.filtered = false;

        controller.clearFilter = function(){
            $scope.request = $.extend(true, {}, emptyRequest);
            $scope.$apply();
        };

        $scope.$watch('request', function (newValue,oldValue) {
            if (angular.equals(newValue,oldValue) && $.isEmptyObject(search) ){
                return;
            }
            $location.search($.param($scope.request));
            $scope.visible_mortgages = $filter('filter')(mortgages_list, $scope.request);
        }, true);

        $scope.$watch('mortgages_list', function () {
           $scope.filtered = $scope.visible_mortgages.length != mortgages_list.length;
        });

    }]);
