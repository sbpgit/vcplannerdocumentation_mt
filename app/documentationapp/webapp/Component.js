/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "cpapp/documentationapp/model/models"
],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("cpapp.documentationapp.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                //Image path
                var oRootPath = jQuery.sap.getModulePath("cpapp.documentationapp");
                var oImageModel = new sap.ui.model.json.JSONModel({ path: oRootPath });
                this.setModel(oImageModel, "imageModel");

                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js');
                document.head.appendChild(jQueryScript);
            }
        });
    }
);