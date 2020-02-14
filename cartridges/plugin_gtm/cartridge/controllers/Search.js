'use strict';

var server = require('server');
server.extend(module.superModule);

var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

server.append('UpdateGrid', function (req, res, next) {
    if (gtmHelpers.isEnabled) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();
            var searchImpressionData = gtmHelpers.getSearchImpressionData(viewData);
            searchImpressionData.event = 'searchImpressions';
            viewData.searchImpressionData = JSON.stringify(searchImpressionData);
            res.setViewData(viewData);
        });
    }
    next();
});

module.exports = server.exports();
