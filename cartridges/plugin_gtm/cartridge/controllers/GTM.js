'use strict';

var server = require('server');

var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

server.get('CustomerData', function (req, res, next) {
    var customerData = gtmHelpers.getCustomerData(req);

    res.render('/gtm/gtmCustomerData', {
        customerData: JSON.stringify(customerData)
    });
    next();
});

// should be used if search pages load products via ajax instead of using pagination
server.get('ImpressionData', function (req, res, next) {
    var searchImpressionData = gtmHelpers.getSearchImpressionData(req);
    searchImpressionData.event = 'searchImpressions';

    var ga4SearchImpressionData = gtmHelpers.getGA4SearchImpressionData(req);
    ga4SearchImpressionData.event = 'view_item_list';

    res.render('/gtm/gtmImpressionData', {
        searchImpressionData: JSON.stringify(searchImpressionData),
        ga4SearchImpressionData: JSON.stringify(ga4SearchImpressionData)
    });
    next();
});

// render helpers for velocity template use from hooks
server.get('HtmlHead', server.middleware.include, function (req, res, next) {
    res.render('gtm/gtmScript', {
        id: gtmHelpers.gtmContainer,
        action: req.querystring.action,
        datalayer: req.querystring.datalayer,
        ga4datalayer: req.querystring.ga4datalayer,
        gtmEnabled: req.querystring.gtmEnabled
    });

    next();
});

// render helpers for velocity template use from hooks
server.get('BeforeHeader', server.middleware.include, function (req, res, next) {
    res.render('gtm/gtmNoScript', {
        id: gtmHelpers.gtmContainer
    });

    next();
});

module.exports = server.exports();
