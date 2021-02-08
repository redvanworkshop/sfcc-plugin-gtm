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
			var gtmdata = $.parseJSON($(this).closest('.product').attr('data-gtmdata'));
			productClick(gtmdata);
		});
	},
	cartshow: function () {},
	checkoutbegin: function () {},
	orderconfirm: function() {},
	// events that should happen on every page
	all: function () {
		// Add to Cart
	    $('body').on('click', '.add-to-cart, .add-to-cart-global', function () {
			var gmtData = $.parseJSON($(this).attr('data-gtmdata'));
			var qty = $(this).closest('.product-wrapper').find('.quantity-select').val();
			addToCart(gmtData, qty);
		});

		//Remove from Cart
		$('body').on('click', '.remove-product', function () {
			var gmtData = $.parseJSON($(this).attr('data-gtmdata'));
			var qty = $(this).closest('.card').find('select.quantity').val();
			$('body').on('click', '#removeProductModal .cart-delete-confirmation-btn', function () {
				removeFromCart(gmtData, qty);
			});
		});
		
		// update GTM data attribute 
		$('body').on('product:updateAddToCart', function (e, response) {
			$('button.add-to-cart, button.add-to-cart-global', response.$productContainer).attr('data-gtmdata', JSON.stringify(response.product.gtmData));
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
	dataLayer.push(obj);
}

/**
 * @function removeFromCart
 * @description Click event for remove product from cart
 */
function removeFromCart (productObject, quantity) {
	var quantObj = {'quantity': quantity},
		obj = {
			'event': 'removeFromCart',
			'ecommerce': {
				'remove': {
					'products': []
				}
			}
		};
	obj.ecommerce.remove.products.push($.extend(productObject,quantObj));
	dataLayer.push(obj);
}

/**
 * @function pushEvent
 * @description Convenience method for creating a click event.
 * @param {String} event
 * @param {String} eventCategory
 * @param {String} eventAction
 * @param {String} eventlabel
 */
function pushEvent (event, eventCategory, eventAction, eventLabel) {
	dataLayer.push({
		'event': event,
		'eventCategory': eventCategory,
		'eventAction': eventAction,
		'eventLabel': eventLabel
	});
}

/**
 * @function init
 * @description Initialize the tag manager functionality
 * @param {String} nameSpace The current name space
 */
$(document).ready(function () {
	if (pageAction && events[pageAction]) {
		events[pageAction]();
	}
	events.all();
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
						if (gtmEvent) { dataLayer.push(gtmEvent) }
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
