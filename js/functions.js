/**
 * Created by ALEX
 */

var initMainMenu = function ($cont) {
    $cont = $cont || null ? $cont : $('body');

    var $menu_cont = $('.js-main_menu_widget', $cont);
    var $menu = $('.js-main_menu', $menu_cont);
    var $switcher = $('.js-menu_switcher', $menu_cont);


    $menu_cont
        .on('open', function () {
            $switcher.addClass('_open');
            $menu.addClass('_open');
            setTimeout(function () {
                $cont
                    .on('click.js-main_menu', function (e) {

                        if (($(e.target).parents().hasClass('js-main_menu') || $(e.target).hasClass('js-main_menu')) && (!$(e.target).is('a'))) {
                            e.preventDefault();
                            return false;
                        }
                        $menu_cont.trigger('close');
                    })
            }, 20);

        })
        .on('close', function () {
            $menu.removeClass('_open');
            $switcher.removeClass('_open');
            $cont
                .off('click.js-main_menu');
        })
        .on('click', '.js-menu_switcher', function (e) {
            e.preventDefault();
            if ($switcher.hasClass('_open')) {
                $menu_cont.trigger('close');
            } else {
                $menu_cont.trigger('open');
            }
        })
        .on('click', '.js-close', function (e) {
            e.preventDefault();
            $menu_cont.trigger('close');
        })
};

var initSelect2 = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $selects = $('select', $cont);

    for (var i = 0; i < $selects.length; i++) {
        var $select = $selects.eq(i);

        if ((!$select.is(':hidden') && !$select.hasClass('default')) || $select.hasClass('_custom')) {
            if ($select.hasClass('_no-search')) {
                select2Options.minimumResultsForSearch = -1;
            }
            $select.select2(select2Options);
        }
        if ('undefined' === typeof $select.attr('placeholder')) {
            continue;
        }

        $select.siblings('.select2-container').eq(0).attr('title', $select.attr('placeholder'));
    }
};

var initSwitcher = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $switchers = $('.js-switcher.btns_cont', $cont);
    if ($switchers.length <= 0) {
        return;
    }

    $switchers
        .each(function () {
            var $switcher = $(this);
            var $items = $switcher.children();
            if ($items.length <= 1) {
                return;
            }

            var setRequest = function ($swither, data) {
                var old_data = getRequest($swither);
                $swither.data('request', $.merge({}, old_data, data));
                return $switcher;
            };

            var getRequest = function ($swither) {
                return $swither.data('request');
            };

            $switcher
                .on('click', '> a', function (e) {
                    e.preventDefault();
                    var $this = $(this);
                    $items.removeClass('_active');
                    $this.addClass('_active');
                    $switcher.trigger('update', $this);
                })
                .on('init', function () {
                    var hash = window.location.hash;
                    if (hash.length > 0) {
                        var $item = $items.filter('[href*=' + hash + ']');
                        if ($item.length > 0) {
                            $items.removeClass('_active');
                            $item.addClass('_active');
                        }
                    }
                    if (!$items.hasClass('_active')) {
                        setTimeout(function () {
                            $($items.eq(0)).click()
                        }, 20);
                    } else {
                        setTimeout(function () {
                            $items.filter('._active').click()
                        }, 20);

                    }
                })
                .trigger('init');
        })

};

var initNumericInput = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $inputs = $('input.js-numeric', $cont);
    if ($inputs.length <= 0) return false;

    for (var i = 0; i < $inputs.length + 1; i++) {
        $($inputs[i])
            .on('keydown', function (e) {
                // Allow: space, backspace, delete, tab, escape, enter and ,             Allow: Ctrl+A                          Allow: Ctrl+C                                    Allow: home, end, left, right
                if ($.inArray(e.keyCode, [32, 46, 8, 9, 27, 13, 110, 188]) !== -1 || (e.keyCode == 65 && e.ctrlKey === true) || (e.keyCode == 86 && e.ctrlKey === true) || (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            })
            .on('format', function () {
                var $this = $(this);
                var value = $this.val();

                if (value.length <= 0) return false;
                $this.val(numberFormat(delLetters(delSpaces(value)), 0, ',', ' '));
            })
            .on('keyup', function () {
                $(this).trigger('format');
            })
            .trigger('format');
    }
};

var initSpoiler = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $spoilers = $('.js-spoiler', $cont);
    if ($spoilers.length <= 0) {
        return;
    }

    $spoilers
        .each(function () {
            var $spoiler = $(this);
            $spoiler
                .on('click', '.js-spoiler_switcher', function (e) {
                    e.preventDefault();
                    var $spoiler = $(e.delegateTarget);

                    if ($spoiler.hasClass('_open')) {
                        $spoiler.trigger('close');
                    } else {
                        $spoiler.trigger('open');
                    }
                })
                .on('open', function () {
                    var $spoiler = $(this);
                    $spoiler.addClass('_open');
                    $('.js-spoiler_content', $spoiler).slideDown(500);
                })
                .on('close', function () {
                    var $spoiler = $(this);
                    $spoiler.removeClass('_open');
                    $('.js-spoiler_content', $spoiler).slideUp(500);
                });
        })
};

var initHiddenContent = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $contents = $('.js-hidden_content', $cont);

    if ($contents.length > 0) {
        $contents
            .each(function () {
                var $content = $(this);
                var $btn = $('<span/>', {
                    'class': 'btn _blue _min',
                    text: 'Далее'
                });
                $content.data('min-height', $content.outerHeight());

                $btn
                    .on('click', function (e) {
                        e.preventDefault();
                        $content.trigger('open');
                        $(this).remove();
                    });

                $content
                    .wrapInner('<div class="full"></div>')
                    .after($btn)
                    .on('open', function () {
                        var height = $('> .full', $(this)).outerHeight() + 'px';
                        $(this).animate({
                            height: height,
                            maxHeight: height
                        }, 200)
                    })
                    .on('close', function () {
                        $(this).animate({
                            height: parseInt($(this).data('min-height')) + 'px'
                        }, 200)
                    })
                ;

            })
    }
};

var initUnitHeight = function ($cont) {
    $cont = $cont || null ? $cont : $('body');
    var $rows = $('.js-unit_height', $cont);

    $rows
        .each(function () {
            var $row = $(this);
            var $gs = $('> *', $row);
            var max_screen = parseInt($row.attr('data-max-screen'));

            $gs.removeAttr('style');

            if (($gs.length > 0 && isNaN(max_screen) ) || ($gs.length > 0 && !isNaN(max_screen) && max_screen < $(window).width())) {
                var $gs_array = $.makeArray($gs);
                var max = Math.max.apply(null, $.map($gs_array, function (g, i) {
                    return $(g).outerHeight();
                }));
                $gs.outerHeight(max);
            }
        });
};