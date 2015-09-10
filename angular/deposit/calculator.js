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
    .module('DepositCalculatorApp', ['ui.slider', 'ui.utils.masks', 'ngSanitize'])
    .filter('floor', function () {
        return function (input) {
            return Math.floor(input);
        };
    })
    .filter('trustAsHTML', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .directive("daysToMonths", function () {
        return {
            priority: 20,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelController) {
6
                ngModelController.$parsers.push(function (data) {
                    //convert data from view format to model format

                    return data * 30; //converted
                });

                ngModelController.$formatters.push(function (data) {
                    //convert data from model format to view format
                    return Math.floor(data / 30); //converted
                });

                element
                    .on('focus', function () {
                        element.val(Math.floor(ngModelController.$modelValue / 30));
                    })
                    .on('blur', function () {
                        // Apply formatting on the stored model value for display
                        element.val(Math.floor(ngModelController.$modelValue / 30));
                    });
            }
        }
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
    .directive('numberFormat', ['$filter', '$parse', function ($filter, $parse) {
        return {
            priority: 5,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelController) {

                var decimals = 0;

                ngModelController.$formatters.push(function (data) {
                    //convert data from model format to view format
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
        }
    }])
    .config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    })
    .controller('DepositCalculatorCtrl', ['$scope', '$filter', function ($scope, $filter) {
        var controller = this;
        $scope.deposit = deposit;
        $scope.deposit_final = 0;

        var $info_table = $('.info_table');
        var $graph_deposit_column = $('.graph .deposit', $info_table);
        var $graph_dohod_column = $('.graph .dohod', $info_table);
        var $add = $('.add', $graph_dohod_column);

        this.initCalculator = function () {
            for (var first in $scope.deposit.currencies) break;
            var currency = first;

            $scope.request = {
                currency: currency,
                deposit: $scope.deposit.currencies[currency].min_deposit,
                term: $scope.deposit.currencies[currency].min_term,
                procent: 'card'//deposit
            };
        };

        this.getRate = function (currency, deposit, term) {
            var rates = $scope.deposit.currencies[currency].rates;
            var rate = false;
            var terms = {};

            for (min_deposit in rates) {
                if (deposit >= min_deposit) {
                    terms = rates[min_deposit];
                }
            }

            if (terms.length == 0) {
                return false;
            }


            for (min_term in terms) {
                min_term = parseInt(min_term);
                if (term <= min_term) {
                    rate = parseFloat(terms[min_term]);
                    break;
                }
            }

            return rate;//rate for year
        };

        this.refreshGraphColumns = function (oldValue, newValue) {
            var profit = newValue - oldValue;
            var part = (profit / oldValue);
            var max_height = $graph_dohod_column.outerHeight() > 160 ? 160 : $graph_dohod_column.outerHeight();
            var part_height = parseInt(max_height * part);

            $graph_deposit_column.css('paddingBottom', max_height - part_height);
            $graph_dohod_column.css('paddingBottom', max_height - part_height);
            $add.css('height', part_height);
        };

        this.refreshCalculator = function (currency) {
            $scope.request = angular.extend({}, $scope.request, {
                currency: currency,
                deposit: $scope.deposit.currencies[currency].min_deposit,
                term: $scope.deposit.currencies[currency].min_term
            });
        };

        this.calculate = function () {

            var term = Math.floor($scope.request.term / 30);
            var deposit = $scope.request.deposit;
            var rate = controller.getRate($scope.request.currency, deposit, $scope.request.term) / 12;//for month


            if ($scope.request.procent == 'card') {
                $scope.deposit_final = parseInt(deposit) + parseInt((deposit * rate * term) / 100);
            } else if ($scope.request.procent == 'deposit') {
                var deposit_final = deposit;
                for (var i = 0; i < term; i++) {
                    deposit_final = deposit_final + parseInt((deposit_final * rate) / 100);
                }
                $scope.deposit_final = deposit_final;
            }

            controller.refreshGraphColumns($scope.request.deposit, $scope.deposit_final);
        };

        this.updateTermUnit = function () {
            $scope.term_unit = num2str($scope.request.term / 30, ['месяц', 'месяца', 'месяцев']);
        };

        $scope.updateTermUnit = function (term) {
            return num2str(term / 30, ['месяц', 'месяца', 'месяцев']);
        };

        $scope.setCurrency = function (currency) {
            if (currency.length > 0 && typeof currency == 'string') {
                controller.refreshCalculator(currency);
            }
        };

        $scope.getCurrencyLabel = function (currency, value) {
            var label = '';
            currency = currency.toLowerCase();
            switch (currency) {
                case 'rub' :
                    label = '<span class="_rouble">i</span>'
                    break;
                case 'usd' :
                    label = '$'
                    break;
                case 'eur' :
                    label = '€'
                    break;
                case 'gbp' :
                    label = '£'
                    break;
            }

            label = $filter('trustAsHTML')(label);

            if (typeof value != 'undefined') {
                value = $filter('number')(value, 0);
                if (currency == 'rub') {
                    return value + ' ' + label;
                } else {
                    return label + ' ' + value;
                }
            }
            return label;
        };

        $scope.setProcent = function (type) {
            if (type.length > 0 && typeof type == 'string') {
                $scope.request.procent = type;
            }
        };

        $scope.$watch('request', function () {
            controller.calculate();
            controller.updateTermUnit();
        }, true);

        controller.initCalculator();

    }]);

