/**
 * Created by ALEX on 02.03.2016.
 */

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
    .module('base', ['ui.slider', 'ui.utils.masks', 'ngSanitize'])
    .config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    })
    .filter('floor', function () {
        return function (input) {
            return Math.floor(input);
        };
    })
    .filter('num2str', function () {
        return function (input, translation) {
            input = Math.abs(input) % 100;
            var temp = Math.round(input % 10);
            if (input > 10 && input < 20) {
                return translation[2];
            }
            if (temp > 1 && temp < 5) {
                return translation[1];
            }
            if (temp == 1) {
                return translation[0];
            }
            return translation[2];
        };
    })
    .filter('trustAsHTML', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
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
    .directive('repeatComplete', function ($rootScope) {
        var uuid = 0;

        function compile(tElement, tAttributes) {
            var id = ++uuid;
            tElement.attr("repeat-complete-id", id);
            tElement.removeAttr("repeat-complete");
            var completeExpression = tAttributes.repeatComplete;
            var parent = tElement.parent();
            var parentScope = ( parent.scope() || $rootScope );
            var unbindWatcher = parentScope.$watch(
                function () {
                    var lastItem = parent.children("*[ repeat-complete-id = '" + id + "' ]:last");
                    if (!lastItem.length) {
                        return;
                    }
                    var itemScope = lastItem.scope();
                    if (itemScope.$last) {
                        unbindWatcher();
                        itemScope.$eval(completeExpression);
                    }
                }
            );
        }

        return ({
            compile: compile,
            priority: 2001,
            restrict: "A"
        });
    })
    .directive("daysToMonths", function () {
        return {
            priority: 20,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelController) {

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
    .directive('ngMinCustom', function factory() {
        var directiveDefinitionObject = {
            priority: 10,
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                scope.$watch(attr.ngMinCustom, function () {
                    ctrl.$setViewValue(delSpaces(ctrl.$viewValue));
                });

                var minValidator = function (value) {
                    var min = scope.$eval(attr.ngMinCustom) || 0;
                    value = isNaN(parseFloat(value)) ? 0 : parseFloat(value);

                    if (value < min) {
                        ctrl.$setValidity('ngMinCustom', false);
                        return min;
                    } else {
                        ctrl.$setValidity('ngMinCustom', true);
                        return value;
                    }
                };

                ctrl.$parsers.push(minValidator);
                ctrl.$formatters.push(minValidator);
            }
        };
        return directiveDefinitionObject;
    })
    .directive('ngMaxCustom', function factory() {
        var directiveDefinitionObject = {
            priority: 10,
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                scope.$watch(attr.ngMaxCustom, function () {
                    ctrl.$setViewValue(delSpaces(ctrl.$viewValue));
                });

                var maxValidator = function (value) {
                    var max = scope.$eval(attr.ngMaxCustom) || Infinity;
                    value = isNaN(parseFloat(value)) ? Infinity : parseFloat(value);

                    if (value > max) {
                        ctrl.$setValidity('ngMaxCustom', false);
                        return max;
                    } else {
                        ctrl.$setValidity('ngMaxCustom', true);
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
    }]);
