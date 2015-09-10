'use strict';
angular
    .module('ui.slider', [])
    .value('uiSliderConfig', {})
    .directive('uiSlider', ['uiSliderConfig', '$timeout', function (uiSliderConfig, $timeout) {
        uiSliderConfig = uiSliderConfig || {};
        return {
            require: 'ngModel',
            compile: function () {
                return function (scope, elm, attrs, ngModel) {

                    function parseNumber(n, decimals) {
                        return (decimals) ? parseFloat(n) : parseInt(n);
                    };

                    var options = angular.extend(scope.$eval(attrs.uiSlider) || {}, uiSliderConfig);
                    // Object holding range values
                    var prevRangeValues = {
                        min: null,
                        max: null
                    };

                    // convenience properties
                    var properties = ['min', 'max', 'step'];
                    var useDecimals = (!angular.isUndefined(attrs.useDecimals)) ? true : false;

                    var init = function () {
                        // When ngModel is assigned an array of values then range is expected to be true.
                        // Warn user and change range to true else an error occurs when trying to drag handle
                        if (angular.isArray(ngModel.$viewValue) && options.range !== true) {
                            console.warn('Change your range option of ui-slider. When assigning ngModel an array of values then the range option should be set to true.');
                            options.range = true;
                        }

                        // Ensure the convenience properties are passed as options if they're defined
                        // This avoids init ordering issues where the slider's initial state (eg handle
                        // position) is calculated using widget defaults
                        // Note the properties take precedence over any duplicates in options
                        angular.forEach(properties, function (property) {
                            if (angular.isDefined(attrs[property])) {
                                options[property] = parseNumber(attrs[property], useDecimals);
                            }
                        });

                        elm.slider(options);
                        init = angular.noop;
                    };

                    // Find out if decimals are to be used for slider
                    angular.forEach(properties, function (property) {
                        // support {{}} and watch for updates
                        attrs.$observe(property, function (newVal) {
                            if (!!newVal) {
                                init();
                                elm.slider('option', property, parseNumber(newVal, useDecimals));
                                ngModel.$render();
                            }
                        });
                    });
                    attrs.$observe('disabled', function (newVal) {
                        init();
                        elm.slider('option', 'disabled', !!newVal);
                    });

                    // Watch ui-slider (byVal) for changes and update
                    scope.$watch(attrs.uiSlider, function (newVal) {
                        init();
                        if (newVal != undefined) {
                            elm.slider('option', newVal);
                        }
                    }, true);

                    // Late-bind to prevent compiler clobbering
                    $timeout(init, 0, true);

                    // Update model value from slider
                    elm.bind('slide', function (event, ui) {
                        ngModel.$setViewValue(ui.values || ui.value);
                        scope.$apply();
                    });

                    // Update slider from model value
                    ngModel.$render = function () {
                        init();
                        var method = options.range === true ? 'values' : 'value';

                        if (!options.range && isNaN(ngModel.$viewValue) && !(ngModel.$viewValue instanceof Array)) {
                            ngModel.$viewValue = 0;
                        }
                        else if (options.range && !angular.isDefined(ngModel.$viewValue)) {
                            ngModel.$viewValue = [0, 0];
                        }

                        // Do some sanity check of range values
                        if (options.range === true) {

                            // Check outer bounds for min and max values
                            if (angular.isDefined(options.min) && options.min > ngModel.$viewValue[0]) {
                                ngModel.$viewValue[0] = options.min;
                            }
                            if (angular.isDefined(options.max) && options.max < ngModel.$viewValue[1]) {
                                ngModel.$viewValue[1] = options.max;
                            }

                            // Check min and max range values
                            if (ngModel.$viewValue[0] > ngModel.$viewValue[1]) {
                                // Min value should be less to equal to max value
                                if (prevRangeValues.min >= ngModel.$viewValue[1])
                                    ngModel.$viewValue[0] = prevRangeValues.min;
                                // Max value should be less to equal to min value
                                if (prevRangeValues.max <= ngModel.$viewValue[0])
                                    ngModel.$viewValue[1] = prevRangeValues.max;
                            }

                            // Store values for later user
                            prevRangeValues.min = ngModel.$viewValue[0];
                            prevRangeValues.max = ngModel.$viewValue[1];

                        }
                        elm.slider(method, ngModel.$viewValue);
                    };

                    scope.$watch(attrs.ngModel, function () {
                        if (options.range === true) {
                            ngModel.$render();
                        }
                    }, true);

                    function destroy() {
                        elm.slider('destroy');
                    }

                    elm.bind('$destroy', destroy);
                };
            }
        };
    }]);


angular
    .module('MortgageCalculatorApp', ['ui.slider', 'ui.utils.masks'], function ($locationProvider) {
        $locationProvider.html5Mode(true);
    })
    .directive('ngMin', function factory() {
        var directiveDefinitionObject = {
            priority: 10,
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                scope.$watch(attr.ngMin, function () {
                    ctrl.$setViewValue(delSpaces(ctrl.$viewValue));
                });

                var minValidator = function (value) {
                    var min = scope.$eval(attr.ngMin) || 0;
                    value = isNaN(parseFloat(value)) ? 0 : parseFloat(value);

                    if (value < min) {
                        ctrl.$setValidity('ngMin', false);
                        return min;
                    } else {
                        ctrl.$setValidity('ngMin', true);
                        return value;
                    }
                };

                ctrl.$parsers.push(minValidator);
                ctrl.$formatters.push(minValidator);
            }
        };
        return directiveDefinitionObject;
    })
    .directive('ngMax', function factory() {
        var directiveDefinitionObject = {
            priority: 10,
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                scope.$watch(attr.ngMax, function () {
                    ctrl.$setViewValue(delSpaces(ctrl.$viewValue));
                });

                var maxValidator = function (value) {
                    var max = scope.$eval(attr.ngMax) || Infinity;
                    value = isNaN(parseFloat(value)) ? Infinity : parseFloat(value);

                    if (value > max) {
                        ctrl.$setValidity('ngMax', false);
                        return max;
                    } else {
                        ctrl.$setValidity('ngMax', true);
                        return value;
                    }
                };

                ctrl.$parsers.push(maxValidator);
                ctrl.$formatters.push(maxValidator);
            }
        };
        return directiveDefinitionObject;
    })
    .directive('numberFormat', ['$filter', '$parse', function factory($filter) {
        var directiveDefinitionObject = {
            priority: 0,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelController) {

                var decimals = 0;

                ngModelController.$formatters.push(function (data) {
                    return $filter('number')(data, decimals); //converted
                });

                element
                    .on('focus', function () {
                        element.val(ngModelController.$modelValue);
                    })
                    .on('blur', function () {
                        // Apply formatting on the stored model value for display
                        var formatted = $filter('number')(ngModelController.$modelValue, decimals);
                        element.val(formatted);
                    });
            }
        };
        return directiveDefinitionObject;
    }])
    .config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    })
    .controller('MortgageCalculatorCtrl', function ($scope, $filter, $location) {
        var controller = this;

        var type_current = $location.path().split('/').pop();

        $scope.mortgages = mortgages;

        if (type_current.length > 0 && type_current.indexOf('.html') > -1) {
            type_current = type_current.replace('.html', '');
        } else {
            for (var first in $scope.mortgages) break;
            type_current = first;
        }

        $scope.mortgage_current = mortgages[type_current];

        $scope.changeProgram = function (value) {
            $scope.mortgage_current = $scope.mortgages[value];
            var url = Routing.generate('page_mortgage_show', { pageSlug: mortgage_slug, slug: value });
            $location.path(url);
            controller
                .initCalculator()
                .updateTerm()
                .calculate()
            ;
        };

        this.initCalculator = function () {

            $scope.result = {
                term: '',
                credit: '',
                percent: '',
                payment: '',
                overpayment: '',
                responsibilityInsurance: false,
                creditError: false
            };

            $scope.slider = {
                cost: {
                    min: $scope.mortgage_current.cost.min
                },
                initialPayment: {
                    min: $scope.mortgage_current.cost.min * $scope.mortgage_current.initialPayment.min,
                    max: $scope.mortgage_current.cost.max - $scope.mortgage_current.credit.min
                },
                term: {
                    value: ''
                }
            };

            $scope.request = {
                region: current_region,
                cost: $scope.mortgage_current.default.cost,
                initialPayment: $scope.mortgage_current.default.initialPayment,
                term: $scope.mortgage_current.default.term,
                personalInsurance: true
            };

            return this;
        };

        this.updateInitialPayment = function () {
            var min = Math.round($scope.request.cost * $scope.mortgage_current.initialPayment.min);
            var max = Math.round($scope.request.cost - $scope.mortgage_current.credit.min);

            if ($scope.request.initialPayment < min) {
                $scope.request.initialPayment = min;
            } else if ($scope.request.initialPayment > max) {
                $scope.request.initialPayment = max;
            }


            $scope.slider.initialPayment.min = min;
            $scope.slider.initialPayment.max = max;
            return this;
        };

        this.updateTerm = function () {
            if ($scope.request.term < $scope.mortgage_current.term.min) {
                $scope.request.term = $scope.mortgage_current.term.min;
            } else if ($scope.request.term > $scope.mortgage_current.term.max) {
                $scope.request.term = $scope.mortgage_current.term.max;
            }
            $scope.slider.term.value = num2str($scope.request.term, ['год', 'года', 'лет']);
            return this;
        };

        this.getRatio = function () {
            return ($scope.result.credit / $scope.request.cost).toFixed(2);
        };

        this.calculate = function () {
            var credit_current = $scope.request.cost - $scope.request.initialPayment;
            $scope.result.term = $scope.request.term + ' ' + $scope.slider.term.value;
            $scope.result.credit = credit_current;

            var ratio = controller.getRatio();

            var rate = $scope.mortgage_current.rate(ratio, $scope.result.credit);

            var credit_min = $scope.mortgage_current.credit.min;
            var credit_max = $scope.mortgage_current.credit.max(ratio, current_region_code);

            if (credit_current < credit_min){
                $scope.result.creditError = 'Минимальная сумма кредита \n'+ $filter('number')(credit_min,0) + ' руб.';
            }else if (credit_current > credit_max){
                $scope.result.creditError = 'Максимальная сумма кредита \n'+ $filter('number')(credit_max,0) + ' руб.';
            }else {
                $scope.result.creditError = false;
            }


            if (!$scope.request.personalInsurance) {
                rate += $scope.mortgage_current.personalInsuranceRate;
            }
            $scope.result.rate = rate;

            $scope.result.responsibilityInsurance = ($scope.request.initialPayment / $scope.request.cost) >= 0.30;

            var term = $scope.request.term * 12;
            var monthlyRate = rate / 12;

            $scope.result.payment = $scope.result.credit * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -(term - 2))));
            $scope.result.overpayment = $scope.result.payment * term - $scope.result.credit;
            return this;
        };

        $scope.$watch('request.cost', function () {
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

    });