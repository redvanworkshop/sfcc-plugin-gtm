'use strict';

var server = require('server');
server.extend(module.superModule);

var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

server.append('UpdateGrid', function (req, res, next) {
    var viewData = res.getViewData();

    if (gtmHelpers.isEnabled) {
        var searchImpressionData = gtmHelpers.getSearchImpressionData(viewData);
        searchImpressionData.event = 'searchImpressions';
        viewData.searchImpressionData = JSON.stringify(searchImpressionData);

        var ga4SearchImpressionData = gtmHelpers.getGA4SearchImpressionData(viewData);
        ga4SearchImpressionData.event = 'view_item_list';
        viewData.ga4SearchImpressionData = JSON.stringify(ga4SearchImpressionData);
    }

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
