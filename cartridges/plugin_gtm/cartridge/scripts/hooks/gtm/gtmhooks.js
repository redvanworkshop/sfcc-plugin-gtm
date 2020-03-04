'use strict';

var Site = require('dw/system/Site');
var velocity = require('dw/template/Velocity');
var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

/**
 * Should be executed inside of the head tags
 * Renders GTM code.
 */
function htmlHead(pdict) {
    var datalayer = gtmHelpers.getDataLayer(pdict);

    velocity.render('$velocity.remoteInclude(\'GTM-HtmlHead\', \'action\', $action, \'datalayer\', $datalayer)',
    {
        velocity: velocity,
        action: pdict.action,
        datalayer: JSON.stringify(datalayer)
    });
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
            res.viewData.__gtmEvents.push(gtmHelpers.getDataLayer(res.viewData));
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function(listener){
        route.on('route:Complete', listener);
    });
}

// Ensure gtm is enabled before registering hooks
if (gtmHelpers.isEnabled) {
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
