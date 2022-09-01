'use strict';

var velocity = require('dw/template/Velocity');
var UUIDUtils = require('dw/util/UUIDUtils');
var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

/**
 * Should be executed inside of the head tags
 * Renders GTM code.
 */
function htmlHead(pdict) {
    if (gtmHelpers.isEnabled) {
        var datalayer = gtmHelpers.getDataLayer(pdict, false);
        var ga4datalayer = gtmHelpers.isGA4Enabled ? gtmHelpers.getDataLayer(pdict, true) : false;

        velocity.render(
            "$velocity.remoteInclude('GTM-HtmlHead', 'action', $action, 'datalayer', $datalayer, 'ga4datalayer', $ga4datalayer, 'gtmEnabled', $gtmEnabled)",
            {
                velocity: velocity,
                action: pdict.action,
                datalayer: datalayer ? JSON.stringify(datalayer) : false,
                ga4datalayer: ga4datalayer ? JSON.stringify(ga4datalayer) : false,
                gtmEnabled: gtmHelpers.isEnabled
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

                var dataLayerGA4Event = gtmHelpers.getDataLayer(res.viewData, true);

                if (dataLayerGA4Event) {
                    res.viewData.__gtmEvents.push(dataLayerGA4Event);
                }
            }
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function(listener){
        route.on('route:Complete', listener);
    });
}

/**
 * Inject GTM JSON attributes against product DOM element
 * @param {Object} pdict - The current pdict
 * @returns {String} attributes string for product DOM element
 */
function productTile(pdict) {
    if (pdict && pdict.product && !empty(pdict.product.gtmData) && !empty(pdict.product.gtmGA4Data)) {
        var obj = {
            'uuid': [pdict.product.id,UUIDUtils.createUUID()].join('-'),
            'gtmData': JSON.stringify(pdict.product.gtmData),
            'gtmGA4Data': JSON.stringify(pdict.product.gtmGA4Data)
        };
        velocity.render('<script id=\"$uuid\"> var s = document.getElementById(\'$uuid\'), p = s.parentNode; p.dataset.gtmdata = JSON.stringify($gtmData); p.dataset.gtmGA4Data = JSON.stringify($gtmGA4Data); p.removeChild(s); </script>',obj);
    }
}

// Ensure gtm is enabled before registering hooks
if (gtmHelpers.isEnabled) {
    module.exports = {
        htmlHead: htmlHead,
        beforeHeader: beforeHeader,
        registerRoute: registerRoute,
        productTile: productTile
    }
} else {
    module.exports = {
        htmlHead: function () {},
        beforeHeader: function () {},
        registerRoute: function () {},
        productTile: function () {}
    }
}
