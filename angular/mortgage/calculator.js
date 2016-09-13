'use strict';

angular
    .module('MortgageCalculatorApp', ['base'], function ($locationProvider) {
        $locationProvider.html5Mode(true);
    })
    .controller('MortgageCalculatorCtrl', function ($scope, $filter, $location) {
        var controller = this;

        var type_current = $location.path().split('/').pop();

        //$scope.mortgages = mortgages;

        if (type_current.length > 0 && type_current.indexOf('.html') > -1) {
            type_current = type_current.replace('.html', '');
        }

        if (typeof mortgages[type_current] != 'undefined') {
            $scope.mortgage_current = mortgages[type_current];
        } else {
            $('.mortgage_calculator').hide();
            return false;
        }


        $scope.changeProgram = function (value) {
            $scope.mortgage_current = $scope.mortgages[value];
            var url = Routing.generate('page_mortgage_show', {pageSlug: mortgage_slug, slug: value});
            $location.path(url);
            controller
                .initCalculator()
                .updateTerm()
                .calculate()
            ;
        };

        controller.initCalculator = function () {
            $scope.result = {
                term: '',
                credit: $scope.mortgage_current.default.cost - $scope.mortgage_current.default.initialPayment,
                percent: '',
                payment: '',
                overpayment: '',
                responsibilityInsurance: false,
                creditError: false
            };

            if (typeof $scope.mortgage_current.halfPayment != 'undefined' && $scope.mortgage_current.halfPayment) {
                $scope.result_halfPayment = {
                    term: '',
                    payment: ''
                };
            }

            var initialPaymentMin = $scope.mortgage_current.default.cost * $scope.mortgage_current.initialPayment.min;

            $scope.slider = {
                cost:{
                    min: Math.round($scope.mortgage_current.credit.min(current_region_code) / (1 - $scope.mortgage_current.initialPayment.min)),
                    max: Math.round($scope.mortgage_current.credit.max(0,current_region_code) / (1 - $scope.mortgage_current.initialPayment.min)),
                },
                initialPayment: {
                    min: initialPaymentMin,
                    max: $scope.mortgage_current.default.cost - initialPaymentMin
                }
            };

            $scope.request = {
                region: current_region,
                cost: $scope.mortgage_current.default.cost,
                initialPayment: $scope.mortgage_current.default.initialPayment,
                term: $scope.mortgage_current.default.term,
                personalInsurance: true,
                childrens: false,
                //is_ownRate: false,
                //is_maternalCapital: false,
                ownRate: typeof $scope.mortgage_current.ownRate != 'undefined' ? $scope.mortgage_current.ownRate[getKey($scope.mortgage_current.ownRate, 0)].rate : 0,
                subType: typeof $scope.mortgage_current.subTypes != 'undefined' ? $scope.mortgage_current.subTypes[getKey($scope.mortgage_current.subTypes, 0)].rate : 0
            };

            return this;
        };

        controller.updateInitialPayment = function () {
            var min_coef = $scope.mortgage_current.initialPayment.min;

            if (typeof $scope.mortgage_current.maternalCapital != 'undefined' && $scope.request.is_maternalCapital) {
                min_coef += $scope.mortgage_current.maternalCapital;
                if (min_coef < 0.05) {
                    min_coef = 0.05;
                }
            }

            var min = Math.round($scope.request.cost * min_coef);
            var max = Math.round($scope.request.cost - $scope.mortgage_current.credit.min(current_region_code));

            if (max <= 0){
                return this;
            }
            if ($scope.request.initialPayment < min) {
                $scope.request.initialPayment = min;
            } else if ($scope.request.initialPayment > max) {
                $scope.request.initialPayment = max;
            }

            $scope.slider.initialPayment.min = min;
            $scope.slider.initialPayment.max = max;
            return this;
        };

        controller.updateTerm = function () {
            if ($scope.request.term < $scope.mortgage_current.term.min) {
                $scope.request.term = $scope.mortgage_current.term.min;
            } else if ($scope.request.term > $scope.mortgage_current.term.max) {
                $scope.request.term = $scope.mortgage_current.term.max;
            }
            return this;
        };

        controller.getRatio = function () {
            return (($scope.request.cost - $scope.request.initialPayment) / $scope.request.cost).toFixed(2);
        };

        controller.getRate = function(ratio,credit_current){
            var rate = $scope.mortgage_current.rate(ratio, credit_current);

            if ($scope.mortgage_current.type == 'social' && typeof $scope.request.childrens != 'undefined' && $scope.request.childrens){
                rate = 0.1225;
                return rate;
            }

            if (typeof $scope.request.childrens != 'undefined' && $scope.request.childrens){
                rate += $scope.mortgage_current.childrensDiscount;
            }

            if (typeof $scope.request.personalInsurance != 'undefined' && !$scope.request.personalInsurance) {
                rate += $scope.mortgage_current.personalInsuranceRate;
            }

            if (typeof $scope.request.is_ownRate != 'undefined' && $scope.request.is_ownRate) {
                rate += $scope.request.ownRate;
            }

            if (typeof $scope.request.subType != 'undefined' && $scope.request.subType) {
                rate += $scope.request.subType;
            }

            return rate;
        };

        controller.getTermMonths = function(rate){
            var monthlyRate = rate / 12;
            var term = $scope.request.term * 12;

            var xStavka = 1 / (1 + rate / 365 * 14);
            var yStavka = 1 - (2 * rate / 365 * 14) / monthlyRate * (1 - Math.pow(1 / (1 + monthlyRate),term));

            return Math.round(((Math.log(yStavka) / Math.log(xStavka))*14/365)*12);
        };

        controller.getPayment = function (rate) {
            var monthlyRate = rate / 12;
            var term = $scope.request.term * 12;

            if ($scope.mortgage_current.type == 'delta') {
                return $scope.result.credit * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -(term - 1))));
            }

            return $scope.result.credit * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -(term - 2))));
        };

        controller.calculate = function () {
            var credit_current = $scope.request.cost - $scope.request.initialPayment;
            var ratio = controller.getRatio();
            var rate = controller.getRate(ratio,credit_current);
            var credit_min = $scope.mortgage_current.credit.min(current_region_code);
            var credit_max = $scope.mortgage_current.credit.max(ratio, current_region_code);
            var term = $scope.request.term * 12;

            if (credit_current < credit_min) {
                $scope.result.creditError = 'Минимальная сумма кредита \n' + $filter('number')(credit_min, 0) + ' руб.';
            } else if (credit_current > credit_max) {
                $scope.result.creditError = 'Максимальная сумма кредита \n' + $filter('number')(credit_max, 0) + ' руб.';
            } else {
                $scope.result.creditError = false;
            }

            if ($scope.mortgage_current.responsibilityInsurance) {
                $scope.result.responsibilityInsurance = ($scope.request.initialPayment / $scope.request.cost) <= $scope.mortgage_current.responsibilityInsurance;
            }

            $scope.result.term = $scope.request.term;
            $scope.result.credit = credit_current;
            $scope.result.rate = rate;
            $scope.result.payment = controller.getPayment(rate);
            $scope.result.overpayment = $scope.result.payment * term - $scope.result.credit;

            if (typeof $scope.mortgage_current.halfPayment != 'undefined' && $scope.mortgage_current.halfPayment) {
                $scope.result_halfPayment.term = controller.getTermMonths(rate);
                $scope.result_halfPayment.payment = $scope.result.payment / 2;
            }
            return this;
        };

        $scope.$watchGroup(['request.cost', 'request.is_maternalCapital'], function () {
            controller
                .updateInitialPayment()
            ;
        });

        $scope.$watch('request', function () {
            controller
                .updateTerm()
                .calculate()
            ;
        }, true);

        controller.initCalculator();

    })
;
