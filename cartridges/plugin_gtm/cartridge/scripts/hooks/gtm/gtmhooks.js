'use strict';

var velocity = require('dw/template/Velocity');
var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

/**
 * Should be executed inside of the head tags
 * Renders GTM code.
 */
function htmlHead(pdict) {
    if (gtmHelpers.isEnabled || gtmHelpers.isGA4Enabled) {
        var datalayer = false;
        var ga4datalayer = false;
        var gtmEnabled = gtmHelpers.isEnabled;
        var gtmGA4Enabled = gtmHelpers.isGA4Enabled;

        if (gtmHelpers.isEnabled) {
            datalayer = gtmHelpers.getDataLayer(pdict, false);
        }

        if (gtmHelpers.isGA4Enabled) {
            ga4datalayer = gtmHelpers.getDataLayer(pdict, true);
        }

        velocity.render(
            "$velocity.remoteInclude('GTM-HtmlHead', 'action', $action, 'datalayer', $datalayer, 'ga4datalayer', $ga4datalayer, 'gtmEnabled', $gtmEnabled, 'gtmGA4Enabled', $gtmGA4Enabled)",
            {
                velocity: velocity,
                action: pdict.action,
                datalayer: datalayer ? JSON.stringify(datalayer) : false,
                ga4datalayer: ga4datalayer ? JSON.stringify(ga4datalayer) : false,
                gtmEnabled: gtmEnabled,
                gtmGA4Enabled: gtmGA4Enabled
            }
        );
    }
}

/**
 * Should be executed right after body tag
 * Renders GTM code.
 */
function beforeHeader(pdict) {
    velocity.render('$velocity.remoteInclude(\'GTM-BeforeHeader\')', { velocity: velocity});
}

function registerRoute(route) {
    var onCompleteListeners = route.listeners('route:Complete');
    // deregister existing Complete listeners
    route.off('route:Complete');

    // ensuring our listener executes first
    route.on('route:Complete', function onRouteCompleteHandler(req, res) {
        var isJson = false;
        if (res.renderings.length) {
            for (var i = res.renderings.length - 1; i >= 0; i--) {
                if (res.renderings[i].type === 'render' && res.renderings[i].subType === 'json') {
                    isJson = true;
                    break;
                }
            }
        }

        if (isJson) {
            res.viewData.__gtmEvents = [];

            if (gtmHelpers.isEnabled) {
                var dataLayerEvent = gtmHelpers.getDataLayer(res.viewData, false);

                if (dataLayerEvent) {
                    res.viewData.__gtmEvents.push(dataLayerEvent);
                }
            }

            if (gtmHelpers.isGA4Enabled) {
                var dataLayerEvent = gtmHelpers.getDataLayer(res.viewData, true);

                if (dataLayerEvent) {
                    res.viewData.__gtmEvents.push(dataLayerEvent);
                }
            }
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function(listener){
        route.on('route:Complete', listener);
    });
}

// Ensure gtm is enabled before registering hooks
if (gtmHelpers.isEnabled || gtmHelpers.isGA4Enabled) {
    module.exports = {
        htmlHead: htmlHead,
        beforeHeader: beforeHeader,
        registerRoute: registerRoute
    }
} else {
    module.exports = {
        htmlHead: function(){},
        beforeHeader: function(){},
        registerRoute: function(){}
    }
}
