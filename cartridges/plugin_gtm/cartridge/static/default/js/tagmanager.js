'use strict';

/**
 * Events are divided up by name space so only the
 * events that are needed are initialized.
 */
var events = {
    homeshow: function () {},
    productshow: function () {},
    productshowincategory: function () {},
    searchshow: function () {
        $('body').on('click', '.product .image-container a:not(.quickview), .product .pdp-link a', function () {
            var $ele = $(this).closest('.product');
            var gtmdata = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
            productClick(gtmdata);
        });
    },
    cartshow: function () {},
    checkoutbegin: function () {},
    orderconfirm: function () {},
    // events that should happen on every page
    all: function () {
        // Add to Cart
        $('body').on('click', '.add-to-cart, .add-to-cart-global', function () {
            if (!$(this).hasClass('isDisabled') && !$(this).hasClass('disabled')) {
                var $ele = $(this);
                var gtmData = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
                var gtmGA4Data = $ele.data('gtmga4data') || $.parseJSON($ele.attr('data-gtmga4data'));
                var qty = $ele.closest('.product-wrapper').find('.quantity-select').val();
                qty = qty ? qty : 1;

                addToCart(gtmData, qty);
                addToCartGA4(gtmGA4Data, qty);
            }
        });

        // Remove from Cart
        $('body').on('click', '.remove-product', function () {
            var $ele = $(this);
            var gtmData = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
            var gtmGA4Data = $ele.data('gtmga4data') || $.parseJSON($ele.attr('data-gtmga4data'));
            var qty = $ele.closest('.card').find('select.quantity').val();
            qty = qty ? qty : 1;

            $('body').on('click', '#removeProductModal .cart-delete-confirmation-btn', function () {
                removeFromCart(gtmData, qty);
                removeFromCartGA4(gtmGA4Data, qty);
            });
        });

        // Update GTM data attribute
        $('body').on('product:updateAddToCart', function (e, response) {
            $('button.add-to-cart, button.add-to-cart-global', response.$productContainer)
                .attr('data-gtmdata', JSON.stringify(response.product.gtmData))
                .attr('data-gtmga4data', JSON.stringify(response.product.gtmGA4Data));
        });
    }
};

/**
 * @param {String} productId The product ID
 * @description gets the data for a product click
 */
function productClick (productObject) {
    var obj = {
            'event': 'productClick',
            'ecommerce': {
                'click': {
                    'actionField': {'list': 'Search Results'},
                    'products': []
                }
            }
        };
    obj.ecommerce.click.products.push(productObject);
    dataLayer.push(obj);
}

/**
 * @param productId
 * @description Click event for add product to cart
 */
function addToCart (productObject, quantity) {
    var quantObj = {'quantity': quantity},
        obj = {
            'event': 'addToCart',
            'ecommerce': {
                'add': {
                    'products': []
                }
            }
        };
    obj.ecommerce.add.products.push($.extend(productObject,quantObj));

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
}

/**
 * @param productId
 * @description Click event for add product to cart
 */
function addToCartGA4(productObject, quantity) {
    var quantObj = { quantity: quantity };
    var obj = {
        'event': 'add_to_cart',
        'ecommerce': {
            'currency': productObject.currency,
            'items': [$.extend(productObject, quantObj)],
            'value': (Number(productObject.price) * Number(quantity)).toFixed(2)
        }
    };

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
}

/**
 * @function removeFromCart
 * @description Click event for remove product from cart
 */
function removeFromCart (productObject, quantity) {
    var quantObj = {'quantity': quantity};
    var obj = {
        'event': 'removeFromCart',
        'ecommerce': {
            'remove': {
                'products': []
            }
        }
    };
    obj.ecommerce.remove.products.push($.extend(productObject,quantObj));

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
}

/**
 * @function removeFromCartGA4
 * @description Click event for remove product from cart
 */
function removeFromCartGA4(productObject, quantity) {
    var quantObj = { quantity: quantity };
    var obj = {
        'event': 'remove_from_cart',
        'ecommerce': {
            'currency': productObject.currency,
            'items': [$.extend(productObject, quantObj)],
            'value': (Number(productObject.price) * Number(quantity)).toFixed(2),
        }
    };

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
}

/**
 * @function init
 * @description Initialize the tag manager functionality
 * @param {String} nameSpace The current name space
 */
$(document).ready(function () {
    if (window.gtmEnabled) {
        if (pageAction && events[pageAction]) {
            events[pageAction]();
        }
        events.all();
    }
});

/**
 * listener for ajax events
 */
function gtmEventLoader() {
    try {
        $(document).ajaxSuccess(function(event, request, settings, data) {
            if (settings.dataTypes.indexOf('json') > -1) {
                if (data && '__gtmEvents' in data && Array.isArray(data.__gtmEvents)) {
                    data.__gtmEvents.forEach(function gtmEvent(gtmEvent) {
                        if (gtmEvent) {
                            dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
                            dataLayer.push(gtmEvent);
                        }
                    });
                }
            }
        });
        document.removeEventListener('DOMContentLoaded', gtmEventLoader);
    } catch (e) {
        console.error(e);
    }
}

/**
 * setup ajax event listener
 */
if (document.readyState === 'complete') {
    gtmEventLoader();
} else {
    document.addEventListener('DOMContentLoaded', gtmEventLoader);
}
