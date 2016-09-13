var $cartCount = $('.js-cart_count');

    $(document)
        .on('init', '.js-order_cont', function (event) {
            event.stopPropagation();

            var $cont = $(this);

            initFancyboxDefaultFunctions($cont);

            $('.js-cart-add-form', $cont)
                .removeClass('hide')
                .ajaxForm({
                    delegation: true,
                    dataType: 'json',
                    beforeSubmit: function (arr, $form, options) {
                        var $submit = $('[type="submit"]', $form);
                        $submit.attr('disabled', 'disabled');
                        $form.append('<div class="ajax_loader"></div>');
                    },
                    success: function (response, status, xhr, $form) {
                        var $loader = $('.ajax_loader', $form);
                        $loader.remove();

                        if (response['error'] != 0) {
                            $form.html(response['form']);
                        } else {
                            $form.addClass('hide');
                            $form.after('<div class="success">' + Translator.trans('flash.form.order.success', { 'link': Routing.generate('user_my_order_cart') }) + '</div>');

                            if (typeof response.count != 'undefined') {
                                $cartCount.text(Translator.transChoice('template.cart.link', response.count, {'count': response.count}));
                            }
                        }

                        $form.trigger('ajax_form', response);
                    }
                });


            $('.js-implementation', $cont)
                .on('setName', function () {
                    var $this = $(this);
                    var $name = $('.js-name', $this);
                    var template = $name.attr('data-template');

                    var $parameters = $('input[data-placeholder]', $this).filter(function () {
                        return $(this).attr("type") == 'hidden' || (( $(this).attr("type") == 'radio' || $(this).attr("type") == 'checkbox') && $(this).is(':checked') )
                    });

                    $parameters
                        .each(function () {
                            var $element = $(this);
                            var placeholder = $element.attr('data-placeholder');
                            var value = $element.val();
                            template = template
                                .replace('{' + placeholder + '}', value);
                        });

                    template = template
                        .replace(/\[.*?\]/g, function (match) {
                            if (match.match(/{.*?}/)) {
                                return '';
                            }
                            return match.replace('[', '').replace(']', '');
                        })
                        .replace(/{.*?}/g, '...');
                    $name.text(template);

                })
                .on('change', 'input[type="radio"][data-placeholder],input[type="checkbox"][data-placeholder]', function () {
                    var $this = $(this);
                    var $implementation = $this.parents('.js-implementation').eq(0);

                    $implementation
                        .trigger('setName');
                })
                .trigger('setName');
        })
        .on('click', '.js-cart-add', function (event) {
            event.preventDefault();
            var $this = $(this);
            var type = $this.attr('type');

            if (typeof type != 'undefined' && type == 'post') {
                $.ajax({
                    url: $this.attr('href'),
                    method: 'POST',
                    success: function (response) {
                        if (response['error'] == 0) {
                            $cartCount.text(Translator.transChoice('template.cart.link', response.count, {'count': response.count}));
                            $.fancybox.open('<div class="popup _order_add_form"><div class="form"><div class="success">' + Translator.trans('flash.form.order.success', { 'link': Routing.generate('user_my_order_cart') }) + '</div></div></div>', fancyboxOrderPopupOptions);
                        }
                    }
                })
            } else {
                $.ajax({
                    url: $this.attr('href'),
                    dataType: 'json',
                    success: function (data) {
                        $.fancybox.open(data.form, fancyboxOrderPopupOptions);
                    }
                })
            }
        });
