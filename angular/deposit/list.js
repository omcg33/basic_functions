'use strict';

var app = angular.module('depositsFilter', ['ui.select2', 'ui.utils.masks', 'ngSanitize'],function($locationProvider){
    $locationProvider.html5Mode(true);
});

app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{[').endSymbol(']}');
});

app
    .directive('a', function () {
        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                if (attrs.href === '#') {
                    elem.on('click', function (e) {
                        e.preventDefault();
                        elem.toggleClass('_selected');
                        var model = elem.attr('ng-model');

                        if (elem.hasClass('_selected')) {
                            scope.$apply(function(){
                                scope.request[model] = true;
                            });
                        } else {
                            scope.$apply(function(){
                                scope.request[model] = false;
                            });
                        }

                    });
                }
            }
        };
    })
    .filter('filter', function () {

        return function (deposits, request) {

            var output = [];
            var currency = request.currency;
            var correct = 10;

            if (currency == null) { return deposits; }

            for (var i = 0; i < deposits.length; i++) {
                var deposit = deposits[i];

                if ( typeof deposit.currencies[currency] == 'undefined'){
                    continue;
                }

                var min_deposit = deposit.currencies[currency].min_deposit;
                var min_term = deposit.currencies[currency].min_term;
                var max_term = deposit.currencies[currency].max_term;
                var replenishment = deposit.replenishment;
                var partial_with_drawal = deposit.partial_with_drawal;

                var request_deposit = parseInt(request.deposit);
                var request_period = parseInt(request.period);
                var request_replenishment = typeof request.replenishment == 'boolean' ? request.replenishment : request.replenishment === 'true';
                var request_partial_with_drawal = typeof request.partial_with_drawal == 'boolean' ? request.partial_with_drawal : request.partial_with_drawal === 'true';

//                console.group();
//                console.log(request_deposit == null || request_deposit >= min_deposit,request_deposit , min_deposit);
//                console.log(request_period == null || request_period >= min_term,request_period , min_term);
//                console.log(request_period == null || request_period <= max_term,request_period , max_term);
//                console.log(request_replenishment == null || request_replenishment == replenishment,request_replenishment , replenishment);
//                console.log(request_partial_with_drawal == null || request_partial_with_drawal == partial_with_drawal,request_partial_with_drawal , partial_with_drawal);
//                console.groupEnd();

                if ((request_deposit == null || request_deposit >= min_deposit) && (request_period == null || request_period >= (min_term - correct)) && (request_period == null || request_period <= (max_term + correct)) && ( (request_replenishment == null || request_replenishment == replenishment) && (request_partial_with_drawal == null || request_partial_with_drawal == partial_with_drawal) )) {
                    output.push(deposit);
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
        if (typeof deposits_list == 'undefined') {
            console.error('Value "deposits_list" is not defined');
            return;
        }
        if (typeof deposits_list != 'object') {
            console.error('Value "deposits_list"(' + typeof deposits_list + ') is not an object');
            return;
        }

        var controller = this;
        var search = $location.search();

        var emptyRequest = {
            deposit: null,
            currency: null,
            period: null,
            replenishment: null,
            partial_with_drawal: null
        }

        $scope.request = $.extend(true, {},emptyRequest, search);
        $scope.visible_deposits = deposits_list;
        $scope.filtered = false;

        controller.clearFilter = function(){
            $scope.request = $.extend(true, {}, emptyRequest);
//            $scope.filtered = false;
            $scope.$apply();
        };

        $scope.$watch('request', function (newValue,oldValue) {
            if (angular.equals(newValue,oldValue) && $.isEmptyObject(search) ){
                return;
            }

            $location.search($.param($scope.request));
            $scope.visible_deposits = $filter('filter')(deposits_list, $scope.request);
        }, true);

        $scope.$watch('visible_deposits', function () {
           $scope.filtered = $scope.visible_deposits.length != deposits_list.length;
        });

        $('.show_all')
            .on('click',function(e){
                e.preventDefault();
                controller.clearFilter();
            });

    }]);
