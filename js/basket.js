var $basket = $('.js-basket');
    var $items = $('.js-item', $basket);
    var $cartCount = $('.js-cart_count');

    $basket
        .off('click', '.js-spoiler_switcher')
        .on('click', '.js-spoiler_switcher', function (event) {
            event.preventDefault();

            var $this = $(this);
            var id = $this.attr('href');
            var $info = $(id, $basket);

            if ($info.length <= 0) {
                return false;
            }

            if ($this.hasClass('_open')) {
                $this.removeClass('_open');
                $info.slideUp(200);
            } else {
                $this.addClass('_open');
                $info.slideDown(200);
            }

        })
        .on('click', '.js-minus,.js-plus', function () {
            var $this = $(this);
            var $tr = $this.parents('.js-item').eq(0);
            var type = $this.hasClass('_minus') ? -1 : 1;
            var $input = $('.js-quantity', $tr);

            $input.val(parseInt($input.val()) + type);

            if ($input.val() < 1) {
                $input.val(1);
            }

            $basket.trigger('calculate');

        })
        .on('click', '.js-remove', function (event) {
            event.preventDefault();

            var $this = $(this);
            var $tr = $this.parents('.js-item').eq(0);
            var $desc = $($('.js-spoiler', $tr).attr('href'));

            $.ajax({
                url: this.href,
                dataType: 'json',
                type: 'POST',
                success: function (data) {
                    $tr.remove();
                    $desc.remove();
                    if (typeof response.count != 'undefined') {
                        $cartCount.text(Translator.transChoice('template.cart.link', response.count, {'count': response.count}));
                    }
                }
            })
        })
        .on('calculate', function () {
            var length = $items.length;
            var total = 0;
            var $order_total = $('.js-order_total', $basket);

            for (var i = 0; i < length; i++) {
                var $price = parseInt(delSpaces($('.js-price', $items[i]).text()));
                var $quantity = parseInt(delSpaces($('.js-quantity', $items[i]).val()));
                var $total = $('.js-total', $items[i]);
                $total.text(numberFormat($price * $quantity, '', '.', ' '));
                total += $price * $quantity;
            }

            $order_total.text(numberFormat(total, '', '.', ' '));
        })
        .trigger('calculate');
