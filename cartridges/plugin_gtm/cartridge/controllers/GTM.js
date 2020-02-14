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

    res.render('/gtm/gtmImpressionData', {
        searchImpressionData: JSON.stringify(searchImpressionData)
    });
    next();
});

module.exports = server.exports();
