'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');

var Site = require('dw/system/Site');
var gtmEnabled = Site.getCurrent().getCustomPreferenceValue('GTMEnable') || false;
var gtmContainerId = Site.getCurrent().getCustomPreferenceValue('GTMID') || '';

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object of containing customer data
 */
function getCustomerData(res) {
    var system = require('dw/system/System');
    var customer = res.currentCustomer.raw,
        profile = customer.profile,
        session = request.session,
        customerObject = {};

    customerObject.environment = (system.getInstanceType() === system.PRODUCTION_SYSTEM ? 'production' : 'development');
    customerObject.demandwareID = customer.ID;
    customerObject.loggedInState = customer.authenticated;
    customerObject.pageLanguage = request.httpLocale;
    customerObject.registered = customer.registered;

    if (customer.registered && profile != null) {
        customerObject.email = profile.email.toLowerCase();
        customerObject.emailHash = dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(profile.email.toLowerCase())));
        customerObject.user_id = profile.getCustomerNo();
    } else {
        var email = (session.custom.email == null) ? '' : session.custom.email;
        var emailHash = (session.custom.emailHash == null) ? '' : session.custom.emailHash;
        customerObject.email = email;
        customerObject.emailHash = emailHash;
        customerObject.user_id = '';
    }

    return customerObject;
}

/**
 * @returns {Object} an object of containing home page data
 */
function getHomeData() {
    var obj = {
        'event': 'home'
    };
    return obj;
}

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
function getProductObject(product) {
    var obj = {};
    obj.id = product.getID();
    var master = product;
    if (product.variant) {
        master = product.variationModel.master;
        obj.id = master.ID;
    }
    obj.name = product.getName();
    if (product.primaryCategory != null) {
        obj.category = product.primaryCategory.displayName;
        obj.categoryID = product.primaryCategory.ID.replace(/_/gi, '/');
    } else if (master.primaryCategory != null) {
        obj.category = master.primaryCategory.displayName;
        obj.categoryID = master.primaryCategory.ID.replace(/_/gi, '/');
    }
    if (product.priceModel.maxPrice.valueOrNull != null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
    }
    return obj;
};

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object of containing pdp data
 */
function getPdpData(res) {
    var obj = {
        'event': 'pdp',
        'ecommerce': {
            'detail': {
                'actionField': {
                    'list': Resource.msg('ecommerce.list.pdp', 'googletagmanager', null)
                },
                'products': []
            }
        }
    };

    if ('product' in res) {
        var product = ProductMgr.getProduct(res.product.id);
        obj.ecommerce.detail.products.push(getProductObject(product));
    }
    return obj;
}

/**
 * @param {dw.util.Iterator} productList - Iterator composed of Products, ProductListItems, or ProductLineItems
 * @param {Function} callback - Callback that constructs the object that will be added to the returned Array
 * @returns {Array} an array containing product data
 */
function getProductArrayFromList(productList, callback) {

    var productArray = new Array(),
        position = 1;

    while (productList.hasNext()) {
        var item = productList.next(),
            prodObj = {};

        if (item instanceof dw.catalog.Product || item instanceof dw.catalog.Variant) {
            prodObj = callback(item);
            prodObj.position = position;
            prodObj.list = 'Search Results';

        } else if (item instanceof dw.customer.ProductListItem || item instanceof dw.order.ProductLineItem) {
            prodObj = callback(item);
        }
        productArray.push(prodObj);
        position++;
    }
    return productArray;
}

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object containing a product list
 */
function getSearchProducts(res) {

    var products = new dw.util.ArrayList();
    if ('productSearch' in res) {
        for (var i = 0; i < res.productSearch.productIds.length; i++) {
            var product = ProductMgr.getProduct(res.productSearch.productIds[i].productID);
            products.add1(product);
        }
    }
    return products;
}

/**
 * @param {Object} res - current route response object
 * @return {Object} Object containing search impression data.
 */
function getSearchImpressionData(res) {
    var ecommerce = {
        'event': 'search',
        'ecommerce': {
            'impressions': getProductArrayFromList((getSearchProducts(res)).iterator(), getProductObject)
        }
    };
    return ecommerce;
}

/**
 * @param {Object} productLineItem - a product line item
 * @returns {Object} an object containing order product data
 */
function getOrderProductObject(productLineItem) {
    var obj = getProductObject(productLineItem.getProduct());
    obj.quantity = productLineItem.getQuantityValue();
    return obj;
}

/**
 * @param {String} step - string of the current step
 * @return {Object} Object containing checkout step data.
 */
function getCheckoutData(step) {
    var obj = {
        'event': 'checkout',
        'ecommerce': {
            'checkout': {
                'actionField': {
                    'step': step
                },
                'products': []
            }
        }
    };

    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    if (currentBasket != null) {
        obj.ecommerce.checkout.products = getProductArrayFromList(currentBasket.getProductLineItems().iterator(), getOrderProductObject);
        obj.currency = currentBasket.currencyCode;
    }
    return obj;
}

/**
 * @param {CouponLineItems} coupons - a collection of all the order coupons
 * @return {Array} an array of all the coupons in the order
 */
function getCoupons(coupons) {
    var text = new Array();

    while (coupons.hasNext()) {
        var coupon = coupons.next();
        text.push(coupon.promotion.campaign.ID);
    }

    return text.join(',');
}

/**
 * @param {Order} order - the current order
 * @param {String} step - string of the current step
 * @return {Object} obj containing confirmation page transaction details
 */
function getConfirmationActionFieldObject(order, step) {
    var discount = order.merchandizeTotalNetPrice.decimalValue - order.adjustedMerchandizeTotalNetPrice.decimalValue;
    var obj = {
        id: order.getOrderNo(),
        step: step,
        affiliation: dw.system.Site.getCurrent().getID(),
        revenue: order.getAdjustedMerchandizeTotalPrice(true).getValue().toFixed(2),
        tax: order.getTotalTax().getValue().toFixed(2),
        shipping: order.getAdjustedShippingTotalPrice().getValue().toFixed(2),
        discount: discount.toFixed(2),
        coupon: getCoupons(order.getCouponLineItems().iterator())
    };

    return obj;
}

/**
 * @param {object} res - current route response object
 * @param {String} step - string of the current step
 * @return {Object} Object containing confirmation page data.
 */
function getConfirmationData(res, step) {
    var obj = {
        'event': 'order-confirmation',
        'ecommerce': {
            'purchase': {
                'actionField': {},
                'products': []
            }
        }
    };

    if ('order' in res) {
        var order = dw.order.OrderMgr.getOrder(res.order.orderNumber);
        obj.ecommerce.purchase.products = getProductArrayFromList(order.getProductLineItems().iterator(), getOrderProductObject);
        obj.ecommerce.purchase.actionField = getConfirmationActionFieldObject(order, step);
        obj.orderEmail = order.getCustomerEmail();
        obj.orderUser_id = order.getCustomerNo();
        obj.currency = order.currencyCode;
    }
    return obj;
}

/**
 * @param {object} res - current route response object
 * @returns {Object} Object containing full datalayer
 */
function getDataLayer(res) {
    switch (res.action) {
        case 'Home-Show':
            return getHomeData();
        case 'Product-Show':
            return getPdpData(res);
        case 'Search-Show':
            return getSearchImpressionData(res);
        case 'Cart-Show':
            return getCheckoutData(1);
        case 'Checkout-Login':
            return getCheckoutData(2);
        case 'Checkout-Begin':
            return getCheckoutData(3);
        case 'CheckoutShippingServices-SubmitShipping':
            return getCheckoutData(4);
        case 'CheckoutServices-SubmitPayment':
            return getCheckoutData(5);
        case 'CheckoutServices-PlaceOrder':
            return getCheckoutData(6);
        case 'Order-Confirm':
            return getConfirmationData(res, 7);
    };
}

module.exports = {
    isEnabled: gtmEnabled,
    gtmContainer: gtmContainerId,
    getDataLayer: getDataLayer,
    getProductObject: getProductObject,
    getCustomerData: getCustomerData,
    getSearchImpressionData: getSearchImpressionData
}