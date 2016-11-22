/**
 * Created by Alex on 12.08.2016.
 */

var initCatalog, initCategoryCatalog;

(function ($) {
    initCatalog = function ($cont) {
        var $catalog = $('.js-catalog', $cont);
        if ($catalog.length <= 0) {
            return false;
        }

        var $categories = $('.js-category', $catalog);
        var $category_conts = $('.js-category_cont', $catalog);
        var $subcategories = $('.js-subcategory', $catalog);
        var $subcategory_cont = $('.js-subcategory_cont', $catalog);
        var $products = $('.js-product', $catalog);
        var $product_cont = $('.js-product_cont', $catalog);
        var $category_menu = $('.js-category_menu', $catalog);
        var hash = parseHash();
        var owlOptions = {
            center: true,
            autoWidth: true,
            loop: false,
            margin: 0,
            nav: false,
            dots: false
        };

        $catalog
            .on('click', '.js-category', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var $this = $(this);
                var category = $this.data('category');

                $catalog.trigger('set.active-category', [category]);
            })
            .on('click', '.js-subcategory', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var $this = $(this);
                var subcategory = $this.data('subcategory');

                $catalog.trigger('set.active-subcategory', [subcategory]);
            })
            .on('click', '.js-product', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var $this = $(this);
                var product = $this.data('product');

                $catalog.trigger('set.active-product', [product]);
            })
            .on('init.subcategory-menu', function (event, $cont) {
                var $subcategory_menu = $('.js-subcategory_menu', $cont);
                if ($subcategory_menu.length > 0) {
                    $subcategory_menu
                        .owlCarousel(owlOptions);

                    $(window)
                        .off('hashchange.owl.navigation');
                }
            })
            .on('init.product-menu', function (event, $cont) {
                var $product_menu = $('.js-product_menu', $cont);
                if ($product_menu.length > 0 && !$product_menu.is(':hidden')) {
                    $product_menu
                        .owlCarousel(owlOptions);
                    $(window)
                        .off('hashchange.owl.navigation');
                }
            })
            .on('set.active-category', function (event, category) {
                event.stopPropagation();

                var $category_cont_active = $category_conts.filter(function () {
                    return $(this).data('category') == category;
                });
                var $category = $categories.filter(function () {
                    return $(this).data('category') == category;
                });

                $categories
                    .removeClass('is-active');

                $category
                    .addClass('is-active');

                $category_conts
                    .removeClass('is-active');

                $category_cont_active
                    .addClass('is-active');


                $catalog
                    .trigger('set.active-subcategory', [null])
                    .trigger('set.hash')
                    .trigger('init.subcategory-menu', [$category_cont_active]);

                setTimeout(function () {
                    $category_menu
                        .trigger('to.owl.carousel', [$categories.index($category), 100, true]);
                }, 10);


                if (typeof hash['subcategory'] == 'undefined') {
                    $catalog.trigger('set.active-subcategory', [$('.js-subcategory', $category_cont_active).eq(0).data('subcategory')]);
                }
            })
            .on('set.active-subcategory', function (event, subcategory) {
                event.stopPropagation();

                var $subcategory_cont_active = $subcategory_cont.filter(function () {
                    return $(this).data('subcategory') == subcategory;
                });
                var $subcategory = $subcategories.filter(function () {
                    return $(this).data('subcategory') == subcategory;
                });

                var $subcategory_menu = $subcategory.parents('.js-subcategory_menu').eq(0);

                $subcategories
                    .removeClass('is-active');

                $subcategory
                    .addClass('is-active');

                $subcategory_cont
                    .removeClass('is-active');

                $subcategory_cont_active
                    .addClass('is-active');

                if ($subcategory_cont_active.length <= 0) {
                    // Если нет 2 подкатегории, а сразу товары
                    $subcategory_cont_active = $category_conts.filter('.is-active');
                }

                $catalog
                    .trigger('set.active-product', [null])
                    .trigger('set.hash')
                    .trigger('init.product-menu', [$subcategory_cont_active])

                $subcategory_menu
                    .trigger('to.owl.carousel', [$('.js-subcategory', $subcategory_menu).index($subcategory), 100, true]);

                if (typeof hash['product'] == 'undefined') {
                    $catalog.trigger('set.active-product', [$('.js-product', $subcategory_cont_active).eq(0).data('product')]);
                }

            })
            .on('set.active-product', function (event, product) {
                event.stopPropagation();

                var $product = $products.filter(function () {
                    return $(this).data('product') == product;
                });
                var $product_menu = $product.parents('.js-product_menu').eq(0);

                $products
                    .removeClass('is-active');

                $product
                    .addClass('is-active');

                $product_cont
                    .removeClass('is-active')
                    .filter(function () {
                        return $(this).data('product') == product;
                    })
                    .addClass('is-active');

                $catalog.trigger('set.hash');

                $product_menu
                    .trigger('to.owl.carousel', [$('.js-product', $product_menu).index($product), 100, true]);
            })
            .on('set.hash', function () {
                var $category = $categories.filter('.is-active');
                var $subcategory = $subcategories.filter('.is-active');
                var $product = $products.filter('.is-active');
                var new_hash = {};

                if ($category.length > 0) {
                    new_hash['category'] = $category.data('category');
                }
                if ($subcategory.length > 0) {
                    new_hash['subcategory'] = $subcategory.data('subcategory');
                }
                if ($product.length > 0) {
                    new_hash['product'] = $product.data('product');
                }
                setHash(new_hash);
                hash = new_hash;
            })
            .on('init.main', function () {
                $catalog
                    .addClass('is-loaded');

                if ($category_menu.length > 0 && isMobile()) {
                    $category_menu
                        .owlCarousel(owlOptions);
                    $(window)
                        .off('hashchange.owl.navigation');
                }

                if (hash) {
                    var category = hash['category'];
                    var subcategory = hash['subcategory'];
                    var product = hash['product'];

                    if (typeof category != 'undefined') {
                        $catalog.trigger('set.active-category', [category]);
                    }
                    if (typeof subcategory != 'undefined') {
                        $catalog.trigger('set.active-subcategory', [subcategory]);
                    }
                    if (typeof product != 'undefined') {
                        $catalog.trigger('set.active-product', [product]);
                    }

                } else {
                    $catalog
                        .trigger('set.active-category', [$categories.eq(0).data('category')]);
                }

            })
            .trigger('init.main');
    };

    initCategoryCatalog = function ($cont) {
        var $catalog = $('.js-catalog_category', $cont);
        if ($catalog.length <= 0) {
            return false;
        }

        var $categories = $('.js-category', $catalog);
        var $category_conts = $('.js-category_cont', $catalog);
        var $category_menu = $('.js-category_menu', $catalog);

        $catalog
            .on('click', '.js-category', function (event) {
                event.preventDefault();
                var $this = $(this);
                var category = $this.data('category');

                $catalog
                    .trigger('set.active-category', [category]);

                $category_menu
                    .trigger('to.owl.carousel', [$categories.index($this), 100, true]);
            })
            .on('set.active-category', function (event, category) {
                event.stopPropagation();

                var $category_cont_active = $category_conts.filter(function () {
                    return $(this).data('category') == category;
                });
                var $slider = $('.js-category_slider', $category_cont_active);

                $categories
                    .removeClass('is-active')
                    .filter(function () {
                        return $(this).data('category') == category;
                    })
                    .addClass('is-active');

                $category_conts
                    .removeClass('is-active');

                $category_cont_active
                    .addClass('is-active');

                $('ul', $slider)
                    .bxSlider({
                        controls: false,
                        auto: true,
                        autoHover: true,
                        pause: 3000,
                        pagerCustom: $('.js-category_slider-pager', $slider)
                    });

            })
            .on('init', function () {
                $(window)
                    .load(function () {
                        $catalog.trigger('set.active-category', [$categories.eq(0).data('category')]);
                    });

                if ($category_menu.length > 0 && isMobile()) {
                    $category_menu
                        .owlCarousel({
                            center: true,
                            autoWidth: true,
                            loop: false,
                            margin: 0,
                            nav: false,
                            dots: false,
                            URLhashListener: false
                        });
                    $(window)
                        .off('hashchange.owl.navigation');
                }
            })
            .trigger('init');
    };

})(jQuery);