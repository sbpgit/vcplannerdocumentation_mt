sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/export/library",
    "sap/base/security/URLListValidator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, RichTextEditor, Dialog, mobileLibrary, Text, Button, exportLibrary, URLListValidator) {
        "use strict";
        // Allow inline base64 images. UI5's HTML sanitizer only permits
        // http(s)/ftp URLs by default and strips "data:" URIs, which would drop
        // the base64 images produced in onShown. Registering "data" keeps
        // <img src="data:image/...;base64,..."> intact in the RTE, the preview
        // (idHTML) and the saved CONTENT.
        URLListValidator.add("data");
        var that, k = 0;
        var DialogType = mobileLibrary.DialogType;
        var ButtonType = mobileLibrary.ButtonType;
        var ExportTypePDF = exportLibrary.ExportTypePDF;
        var ExportUtils = exportLibrary.ExportUtils;

        return Controller.extend("cpapp.maintenanceapp.controller.View1", {
            onInit: function () {
                that = this;
                if (!this._cDialog) {
                    this._cDialog = sap.ui.xmlfragment("cpapp.maintenanceapp.view.edit", this);
                    this._cDialog.setModel(this.getView().getModel());
                    this.getView().addDependent(this._cDialog);
                }
                if (!this._pDialog) {
                    this._pDialog = sap.ui.xmlfragment("cpapp.maintenanceapp.view.create", this);
                    this._pDialog.setModel(this.getView().getModel());
                    this.getView().addDependent(this._pDialog);
                }
            },
            /**
             * Shows the video/RTE panel and hides the other detail panels.
             * Extracted from the duplicated visibility blocks.
             */
            _showVideoPanelOnly: function () {
                that.byId("videoPanel").setVisible(true);
                that.byId("content").setVisible(false);
                that.byId("image").setVisible(false);
                that.byId("textContent").setVisible(false);
            },
            /**
             * Destroys the previous RichTextEditor (if any) and creates a new
             * one seeded with sValue, then adds it to the video panel.
             * Extracted from the three duplicated RTE-creation blocks.
             * @param {string} sValue initial HTML content for the editor
             */
            _renderRTE: function (sValue) {
                if (k > 0) {
                    that.oRichTextEditor.destroy();
                }
                k = k + 1;
                // Keep the raw content (may contain inline base64 images) so the
                // ready handler can load it through the native TinyMCE API, which
                // preserves data: image sources that UI5's value sanitizer strips.
                that._sPendingContent = sValue;
                that.oRichTextEditor = new RichTextEditor("myRTE" + k, {
                    width: "100%",
                    height: "55vh",
                    editable: true,
                    customToolbar: true,
                    showGroupFont: true,
                    showGroupLink: true,
                    showGroupInsert: true,
                    value: sValue,
                    editorType: "TinyMCE6",
                    beforeEditorInit: that._onRTEBeforeInit,
                    ready: that._onRTEReady
                });
                that.getView().byId("videoPanel").addContent(that.oRichTextEditor);
            },
            onAfterRendering: function () {
                sap.ui.core.BusyIndicator.show();
                var dataArray = [];
                that.oGModel = that.getOwnerComponent().getModel("oGModel");
                this.getView().getModel("oModel").callFunction("/readJSONHeader", {
                    success: function (data) {
                        that.oGModel.setProperty("/COMBOID", data.results);
                        for (var i = 0; i <= data.results.length - 1; i++) {
                            dataArray.push({
                                NodeID: data.results[i].PAGEID,
                                HierarchyLevel: data.results[i].HEIRARCHYLEVEL,
                                Description: data.results[i].DESCRIPTION,
                                ParentNodeID: data.results[i].PARENTNODEID
                            });
                        }
                        var treeTable = that.byId("nodes");
                        var data = dataArray;
                        var flat = {};
                        for (var i = 0; i < data.length; i++) {
                            var key = 'id' + data[i].NodeID;
                            flat[key] = data[i];
                            flat[key].__metadata = "";
                        }
                        // child container array to each node
                        for (var i in flat) {
                            flat[i].children = []; // add children container
                        }
                        // populate the child container arrays
                        for (var i in flat) {
                            var parentkey = 'id' + flat[i].ParentNodeID;
                            if (flat[parentkey]) {
                                flat[parentkey].children.push(flat[i]);
                            }
                        }
                        // find the root nodes (no parent found) and create the hierarchy tree from them
                        var root = [];
                        for (var i in flat) {
                            var parentkey = 'id' + flat[i].ParentNodeID;
                            if (!flat[parentkey]) {
                                root.push(flat[i]);
                            }
                        }
                        var oJsonModel = new sap.ui.model.json.JSONModel();
                        oJsonModel.setData({ itemsPath: root });
                        treeTable.setModel(oJsonModel);
                        var TreeTable = that.byId("nodes").getItems();
                        for (var ii = 0; ii < TreeTable.length; ii++) {
                            TreeTable[ii].removeStyleClass("red");
                        }
                        TreeTable[0].addStyleClass("red");
                    }
                });
                //*End of local Header json file*//            
                this.getView().getModel("oModel").callFunction("/readJSONData", {
                    success: function (oData) {
                        that.oGModel.setProperty("/Content", oData.results);
                        that._showVideoPanelOnly();
                        var firstNode = that.byId("nodes").getItems()[0].getTitle();
                        var firstContent;
                        for (var i = 0; i < oData.results.length; i++) {
                            if (firstNode === oData.results[i].DESCRIPTION) {
                                firstContent = oData.results[i];
                                that.oGModel.setProperty("/PAGEID", oData.results[i].PAGEID);
                            }
                        }
                        if (firstContent === undefined) {
                            firstContent = {
                                CONTENT: "",
                                DESCRIPTION: that.oGModel.getProperty("/COMBOID")[0].DESCRIPTION
                            };
                            that.oGModel.setProperty("/PAGEID", "");
                        }
                        that._renderRTE(firstContent.CONTENT);
                        that.oGModel.setProperty("/DetailsData", firstContent);
                        that.byId("detailTitle").setText(firstContent.DESCRIPTION);
                        that.oGModel.setProperty("/editData", oData.results);

                        sap.ui.core.BusyIndicator.hide();
                    }
                });
                that.byId("idHTML").setContent();
                // onAfterRendering is also invoked manually as a refresh, so load
                // the PDF library only once to avoid appending duplicate <script> tags.
                if (!that._bPdfScriptLoaded) {
                    that.addScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
                    that._bPdfScriptLoaded = true;
                }
            },
            /**
             * On click of nodes in master page.
             * @param {*} oEvent 
             */
            onSelectionChange: function (oEvent) {
                that.byId("htmlText").setValue();
                that.byId("textLength").setText();
                that.byId("idHTML").setContent("");
                var pageId = oEvent.getSource().getBindingContext().getProperty().NodeID;
                var sDescp = oEvent.getSource().getBindingContext().getProperty().Description;
                var oTree = that.byId("nodes");
                var aItems = oTree.getItems();
                for (var ii = 0; ii < aItems.length; ii++) {
                    if (pageId === aItems[ii].getBindingContext().getObject().NodeID) {
                        that.oGModel.setProperty("/PAGEID", pageId);
                        aItems[ii].addStyleClass("red");
                    }
                    else {
                        aItems[ii].removeStyleClass("red");
                    }
                }
                var data = that.oGModel.getProperty("/Content") || [];
                var oMatch = null;
                for (var i = 0; i < data.length; i++) {
                    if (pageId === data[i].PAGEID) {
                        oMatch = data[i];
                        break;
                    }
                }
                that._showVideoPanelOnly();
                that._renderRTE(oMatch ? oMatch.CONTENT : "");
                that.byId("detailTitle").setText(oMatch ? oMatch.DESCRIPTION : sDescp);
                that.oGModel.setProperty("/DetailsData", oMatch || "");

                for (var kk = 0; kk < aItems.length; kk++) {
                    if (pageId === aItems[kk].getBindingContext().getProperty().NodeID) {
                        oTree.onItemExpanderPressed(aItems[kk], true);
                        break;
                    }
                }
            },
            /**
             * on click of show button oin detail page.
             */
            onShown: function () {
                that.byId("idHTML").setContent();
                var htmlText = that._getRTEContentWithInlineImages();
                that.byId("htmlText").setValue(htmlText);
                that.byId("textLength").setText(htmlText.length);
                that.byId("idHTML").setContent(htmlText);

            },
            /**
             * Returns the RichTextEditor content with every pasted / dragged &
             * dropped image turned into an inline base64 data URI.
             *
             * Pasted images are already base64 (paste_data_images). Drag & drop
             * images are inserted as temporary "blob:" URLs that would be lost on
             * save/reload; TinyMCE keeps their bytes in its blob cache, so we swap
             * each blob: URL for a "data:...;base64,..." URI. base64() is
             * synchronous (the cache holds it), so no promise handling is needed.
             * @returns {string} HTML content with images inlined as base64
             */
            _getRTEContentWithInlineImages: function () {
                var oRTE = that.oRichTextEditor;
                var oEditor = oRTE && oRTE.getNativeApi && oRTE.getNativeApi();
                if (!oEditor) {
                    return oRTE ? oRTE.getValue() : "";
                }
                var sHtml = oEditor.getContent();
                var oCache = oEditor.editorUpload && oEditor.editorUpload.blobCache;
                if (oCache && oCache.getAll) {
                    oCache.getAll().forEach(function (oInfo) {
                        var sBlobUri = oInfo.blobUri();
                        var sDataUri = "data:" + oInfo.blob().type + ";base64," + oInfo.base64();
                        sHtml = sHtml.split(sBlobUri).join(sDataUri);
                    });
                }
                return sHtml;
            },
            /**
             * Creation of new node.
             */
            onSaved: function () {
                var htmlText = that.byId("htmlText").getValue();
                if (htmlText.length > 0) {
                    htmlText = that.sanitizeContent(htmlText);
                    sap.ui.core.BusyIndicator.show();
                    that.byId("textLength").setText();
                    that.byId("htmlText").setValue("");
                    var detData = that.oGModel.getProperty("/DetailsData");
                    var pageid = detData.PAGEID;
                    var description = detData.DESCRIPTION;
                    var oModel = this.getView().getModel("oModel");
                    oModel.callFunction("/addJson", {
                        method: "GET",
                        urlParameters: {
                            PAGEID: pageid,
                            DESCRIPTION: description,
                            CONTENT: htmlText
                        },
                        success: function (oData, response) {
                            sap.ui.core.BusyIndicator.hide();
                            that.onAfterRendering();
                            sap.m.MessageToast.show("Paragraph file updated successfully");
                        },
                        error: function (e) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show(e.Message);
                        }
                    });
                }
                else {
                    sap.m.MessageToast.show("No data selected")
                }
            },
            /**
             * On collapse click on master page.
             */
            onCollapsePress: function () {
                var selected = that.byId("nodes").getSelectedItems();
                var multiData = that.oGModel.getProperty("/COMBOID");
                // var newID = multiData[multiData.length-1].PAGEID + 1;
                if (multiData.length === 0) {
                    var newID = 1;
                } else {
                    var maxId = Math.max.apply(
                        Math,
                        multiData.map(obj => obj.PAGEID || 0)
                    );
                    var newID = maxId + 1;
                }
                sap.ui.getCore().byId("Pageid").setValue(newID);
                if (selected.length === 0) {
                    this._pDialog.open();
                    sap.ui.getCore().byId("idCreate").setVisible(true);
                    sap.ui.getCore().byId("idCreate").setValue("New Parent Node");
                    sap.ui.getCore().byId("idNodeID").setValue("0");
                    var newLevel = 1;
                    sap.ui.getCore().byId("idHL").setValue(newLevel);
                }
                else if (selected.length === 1) {
                    this._pDialog.open();
                    var oSelectedObj = selected[0].getBindingContext().getObject();
                    var newLevel = oSelectedObj.HierarchyLevel + 1;
                    sap.ui.getCore().byId("idCreate").setVisible(true);
                    sap.ui.getCore().byId("idCreate").setValue(oSelectedObj.Description);
                    sap.ui.getCore().byId("idNodeID").setValue(oSelectedObj.NodeID);
                    sap.ui.getCore().byId("idHL").setValue(newLevel);
                }
                else {
                    sap.m.MessageToast.show("Select only one node");
                }
            },
            onClose: function () {
                if (this._pDialog) {
                    this._pDialog.close();
                    sap.ui.getCore().byId("idHL").setValue("");
                    sap.ui.getCore().byId("Desc").setValue("");
                    sap.ui.getCore().byId("idContent").setValue("");
                }
            },
            /**
             * On creation of new node.
             */
            onCreate: function () {
                sap.ui.core.BusyIndicator.show();
                var oCore = sap.ui.getCore();
                var aRequiredFields = ["Pageid", "idHL", "Desc", "idCreate", "idContent"];
                var bMissing = aRequiredFields.some(function (sId) {
                    return oCore.byId(sId).getValue() === "";
                });
                if (bMissing) {
                    sap.m.MessageToast.show("Please fill your details");
                    sap.ui.core.BusyIndicator.hide();
                }
                else {
                    var pageid = oCore.byId("Pageid").getValue();
                    var description = oCore.byId("Desc").getValue();
                    var parentnodeid = oCore.byId("idNodeID").getValue();
                    var heirarchylevel = oCore.byId("idHL").getValue();
                    var content = oCore.byId("idContent").getValue();
                    var oModel = this.getView().getModel("oModel");
                    if (content) {
                        var content = this.sanitizeContent(this.strTOHTML(content));
                    }
                    oModel.callFunction("/addPAGEHEADER", {
                        method: "GET",
                        urlParameters: {
                            Flag1: "n",
                            PAGEID: pageid,
                            DESCRIPTION: description,
                            PARENTNODEID: parentnodeid,
                            HEIRARCHYLEVEL: heirarchylevel,
                        },
                        success: function (oData, response) {
                            sap.m.MessageToast.show("Successfully updated in Header File");
                        },
                        error: function (e) {
                            sap.m.MessageToast.show("Failed to Update in PAGEHEADER");
                        }
                    });
                    oModel.callFunction("/addPAGEPARAGRAPH", {
                        method: "GET",
                        urlParameters: {
                            Flag1: "n",
                            PAGEID: pageid,
                            DESCRIPTION: description,
                            CONTENT: content
                        },
                        success: function (oData, response) {
                            sap.m.MessageToast.show("Successfully updated in Content File");
                            that.onClose();
                            that.onAfterRendering();
                            that.byId("idHTML").setContent();
                            sap.ui.core.BusyIndicator.hide();
                        },
                        error: function (e) {
                            sap.m.MessageToast.show("Failed to Update in PAGEPARAGRAPH");
                        }

                    });
                }
            },
            /**
             * Return of html code
             * @param {*} str 
             * @returns 
             */
            strTOHTML: function (str) {
                var dom = document.createElement('p');
                dom.innerHTML = str;
                var content1 = dom.outerHTML;
                return content1;
            },
            /**
             * On edit select in master page
             * @param {*} oEvent 
             */
            onEdit: function (oEvent) {
                var aSelected = that.byId("nodes").getSelectedItems();
                if (aSelected.length === 1) {
                    this._cDialog.open();
                    var oSelectedObj = aSelected[0].getBindingContext().getObject();
                    var pageID = oSelectedObj.NodeID;
                    sap.ui.getCore().byId("Pageidedit").setValue(pageID);
                    sap.ui.getCore().byId("Pnodeedit").setValue(oSelectedObj.Description);
                    sap.ui.getCore().byId("Pnodeedid").setValue(oSelectedObj.ParentNodeID);
                    sap.ui.getCore().byId("idHLedit").setValue(oSelectedObj.HierarchyLevel);
                    var paraData = that.oGModel.getProperty("/editData");
                    var content;
                    for (var jj = 0; jj < paraData.length; jj++) {
                        if (pageID === paraData[jj].PAGEID) {
                            content = paraData[jj].CONTENT;
                        }
                    }
                    sap.ui.getCore().byId("idContentedit").setValue(content);
                }
                else if (aSelected.length === 0) {
                    sap.m.MessageToast.show("Select atleast one node");

                }
                else {
                    sap.m.MessageToast.show("Select only one node");
                }
            },
            /**
             * On click of save in masterpage
             */
            onSubmit: function () {
                sap.ui.core.BusyIndicator.show();
                var pageID = sap.ui.getCore().byId("Pageidedit").getValue();
                var descriptioN = sap.ui.getCore().byId("Pnodeedit").getValue();
                var parentNodeID = sap.ui.getCore().byId("Pnodeedid").getValue();
                var heirarchyLevel = sap.ui.getCore().byId("idHLedit").getValue();
                var content = sap.ui.getCore().byId("idContentedit").getValue();
                var oModel = this.getView().getModel("oModel");
                oModel.callFunction("/editJSONHeader", {
                    urlParameters: {
                        PAGEID: pageID,
                        DESCRIPTION: descriptioN,
                        PARENTNODEID: parentNodeID,
                        HEIRARCHYLEVEL: heirarchyLevel,
                    },
                    success: function (oData, response) {
                        that.onClose1();
                        that.onAfterRendering();
                        that.byId("idHTML").setContent();
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Updated successfully in header/data Page");
                    },
                    error: function (e) {
                        sap.m.MessageToast.show("Failed to Update in PAGEHEADER");
                    }
                });
            },

            onClose1: function () {
                if (this._cDialog) {
                    this._cDialog.close();
                }
            },
            /**
             * On load of tree
             * @param {*} event 
             */
            onTreeChange: function (event) {
                if (event.getParameters().reason === "filter") {
                    const model = this.getOwnerComponent().getModel("oGModel");
                    const query = model.getProperty("/query");
                    this.byId("nodes").expandToLevel(query ? 99 : 0);
                }
            },
            /**
             * On click of delete branch
             */
            onDelete: function () {
                var aSelected = that.byId("nodes").getSelectedItems();
                if (aSelected.length === 1) {
                    var pageTitle = aSelected[0].getBindingContext().getObject().Description;
                    if (!this.oApproveDialog) {
                        this.oApproveDialog = new Dialog({
                            type: DialogType.Message,
                            title: pageTitle,
                            content: new Text({ text: "Do you want to delete this node?" }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Submit",
                                press: function () {
                                    sap.ui.core.BusyIndicator.show();
                                    var pageID = that.byId("nodes").getSelectedItems()[0].getBindingContext().getObject().NodeID;
                                    var oModel = this.getView().getModel("oModel");
                                    oModel.callFunction("/deletePAGEHEADER", {
                                        method: "GET",
                                        urlParameters: {
                                            Flag1: "d",
                                            PAGEID: pageID,
                                        },
                                        success: function (oData, response) {
                                            sap.m.MessageToast.show("Deletion successfull in Header Json File");
                                        },
                                        error: function (e) {
                                            sap.m.MessageToast.show("Failed to delete in PAGEHEADER");
                                        }
                                    });
                                    oModel.callFunction("/deletePAGEPARAGRAPH", {
                                        method: "GET",
                                        urlParameters: {
                                            Flag1: "d",
                                            PAGEID: pageID,
                                        },
                                        success: function (oData, response) {
                                            sap.m.MessageToast.show("Deletion successfull in Data Json File");
                                            that.onAfterRendering();
                                            that.byId("idHTML").setContent();
                                            that.oApproveDialog.close();
                                            sap.ui.core.BusyIndicator.hide();
                                        },
                                        error: function (e) {
                                            sap.ui.core.BusyIndicator.hide();
                                            sap.m.MessageToast.show("Failed to delete in PAGEPARAGRAPH");
                                        }
                                    });
                                }.bind(this)
                            }),
                            endButton: new Button({
                                text: "Cancel",
                                press: function () {
                                    this.oApproveDialog.close();
                                }.bind(this)
                            })
                        });
                    }
                    // Dialog is created once, so refresh the title for the currently selected node.
                    this.oApproveDialog.setTitle(pageTitle);
                    this.oApproveDialog.open();
                }
                else if (aSelected.length === 0) {
                    sap.m.MessageToast.show("Select atleast one node");
                }
                else {
                    sap.m.MessageToast.show("Select only one node");
                }
            },
            /**
             * Function to move to required page on click of a link
             * @param {*} oEvent 
             */
            myJsFunc: function (oEvent) {
                that.byId("idHTML").setContent();
                var pageId = 8;
                var oBinding = that.byId("nodes");
                oBinding.expandToLevel(3);
                var TreeTable = that.byId("nodes").getItems();
                var data1 = that.oGModel.getProperty("/Content");
                for (var ij = 0; ij <= TreeTable.length - 1; ij++) {
                    if (pageId === TreeTable[ij].getBindingContext().getObject().NodeID) {
                        TreeTable[ij].addStyleClass("red");
                        oBinding.expand[ij];
                    }
                    else {
                        TreeTable[ij].removeStyleClass("red");
                    }
                }
                for (var i = 0; i <= data1.length - 1; i++) {
                    if (pageId === data1[i].PAGEID) {
                        that.byId("idHTML").setContent(data1[i].CONTENT);

                        that.byId("detailTitle").setText(data1[i].DESCRIPTION);
                    }
                }
            },
            /**
             * Function for navigation to VCPLanner Document
             */
            onNavPress: function () {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    // generate the Hash to display 
                    var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "VCPDocument",
                            action: "Display"
                        }
                    })) || "";
                    //Generate a  URL for the second application
                    var url = window.location.href.split('#')[0] + hash;
                    //Navigate to second app
                    sap.m.URLHelper.redirect(url, true);
                }
            },

            onDragStart: function (oEvent) {
                var oTree = this.byId("nodes");
                var oBinding = oTree.getBinding("items");
                var oDragSession = oEvent.getParameter("dragSession");
                var oDraggedItem = oEvent.getParameter("target");
                var iDraggedItemIndex = oTree.indexOfItem(oDraggedItem);
                var aSelectedIndices = oTree.getBinding("items").getSelectedIndices();
                var aSelectedItems = oTree.getSelectedItems();
                var aDraggedItemContexts = [];
                if (aSelectedItems.length > 0) {
                    // If items are selected, do not allow to start dragging from a item which is not selected.
                    if (aSelectedIndices.indexOf(iDraggedItemIndex) === -1) {
                        oEvent.preventDefault();
                    } else {
                        for (var i = 0; i < aSelectedItems.length; i++) {
                            aDraggedItemContexts.push(oBinding.getContextByIndex(aSelectedIndices[i]));
                        }
                    }
                } else {
                    aDraggedItemContexts.push(oBinding.getContextByIndex(iDraggedItemIndex));
                }
                oDragSession.setComplexData("hierarchymaintenance", {
                    draggedItemContexts: aDraggedItemContexts
                });
                that.aSelected = oDraggedItem.getBindingContext().getObject();
            },
            onDrop: function (oEvent) {
                var oTree = this.byId("nodes");
                var oBinding = oTree.getBinding("items");
                var oDragSession = oEvent.getParameter("dragSession");
                var oDroppedItem = oEvent.getParameter("droppedControl");
                var aDraggedItemContexts = oDragSession.getComplexData("hierarchymaintenance").draggedItemContexts;
                var iDroppedIndex = oTree.indexOfItem(oDroppedItem);
                var oNewParentContext = oBinding.getContextByIndex(iDroppedIndex);

                if (aDraggedItemContexts.length === 0 || !oNewParentContext) {
                    return;
                }
                const dragObject = aDraggedItemContexts[0].getObject();
                const dropObject = oDroppedItem.getBindingContext().getObject();

                var oModel = this.getView().getModel("oModel");
                oModel.callFunction("/dragDrop", {
                    method: "GET",
                    urlParameters: {
                        OBJ: JSON.stringify({
                            dragObject: dragObject,
                            dropObject: dropObject
                        })
                    },
                    success: function (oData, response) {
                        that.onAfterRendering();
                        sap.m.MessageToast.show("Move successfull");
                    },
                    error: function (e) {
                        sap.m.MessageToast.show("Failed to move");
                    }
                });
            },
            onDownLoad: function () {
                var jsonHeader = that.oGModel.getProperty("/COMBOID");

                var headerStr = JSON.stringify(jsonHeader);

                // Create a Blob containing the JSON data 
                var blobHeader = new Blob([headerStr], { type: "application/json" });

                // Create a temporary anchor element    
                var a = document.createElement("a");
                a.style.display = "none";
                document.body.appendChild(a);

                a.href = window.URL.createObjectURL(blobHeader);
                a.download = "Header.json";
                a.click();
                window.URL.revokeObjectURL(a.href);
                document.body.removeChild(a);
                that.downloadDataFile();

            },
            downloadDataFile: function () {
                var jsonData = that.oGModel.getProperty("/Content");
                var dataStr = JSON.stringify(jsonData);
                var blobData = new Blob([dataStr], { type: "application/json" });
                var b = document.createElement("b");
                b.style.display = "none";
                //   document.body.appendChild(b);

                // //   Set the URL to the Blob    

                b.href = window.URL.createObjectURL(blobData);
                // //   Set the file name    

                //   b.download = "Data.json";
                //   // Simulate a click to trigger the download    

                //   b.click();  
                // // Cleanup    

                //     window.URL.revokeObjectURL(b.href);     
                //     document.body.removeChild(b); 
                fetch(b.href, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json', // Adjust content type as per your file type
                    },
                })
                    .then((response) => {
                        if (response.ok) {
                            return response.blob();
                            // Get the response as a Blob
                        } else {
                            throw new Error('Download failed.');
                            sap.ui.core.BusyIndicator.hide();
                        }
                    })
                    .then((blob) => {
                        // Create a temporary anchor element to trigger the download
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = "none";
                        a.href = url;
                        a.download = "Data.json";
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        sap.ui.core.BusyIndicator.hide();
                    })
                    .catch((error) => {
                        console.error(error);
                        sap.ui.core.BusyIndicator.hide();
                        // Handle the error gracefully in your UI
                    });
            },
            uploadData: function (e) {
                sap.m.MessageToast.show("File Import in-Process");
                that.sID = e.getSource().getId();
                this.importJson(e.getParameter("files") && e.getParameter("files")[0]);
            },
            importJson: function (file) {
                if (file.type.includes("application/json") == false) {
                    return sap.m.MessageToast.show("Please upload only files of type Json");
                }
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        try {
                            var data = JSON.parse(e.target.result);
                            if (that.sID.includes("FileUploader")) {
                                var Flag = "H";
                            }
                            else if (that.sID.includes("idDataUpload")) {
                                var Flag = "N"
                            }
                            var oModel = that.getView().getModel("oModel");
                            oModel.callFunction("/uploadData", {
                                method: "GET",
                                urlParameters: {
                                    Flag1: Flag,
                                    DATA: JSON.stringify(data)
                                },
                                success: function (oData, response) {
                                    sap.m.MessageToast.show("Successfully updated");
                                    that.onAfterRendering();
                                },
                                error: function (e) {
                                    sap.m.MessageToast.show("Failed to update");
                                }
                            });

                        }
                        catch (ex) { //If json is invalid
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show(ex.message);
                        }
                    };
                    reader.onerror = function (ex) {
                        sap.ui.core.BusyIndicator.hide();
                        console.log(ex);

                    };
                    reader.readAsBinaryString(file);
                } else {
                    sap.ui.core.BusyIndicator.hide();
                }
            },
            // Search function on Master Page
            onMasterSearch: function (sValue) {
                var searchVal = sValue.getParameter("newValue");
                var oBinding = this.byId("nodes").getBinding("items");
                this.byId("nodes").getBinding("items").filter(searchVal ? new sap.ui.model.Filter({
                    path: "Description",
                    operator: "Contains",
                    value1: searchVal,
                }) : null);
                if (searchVal.length > 1) {
                    oBinding.expandToLevel(3);
                }
                else {
                    var pageID = that.oGModel.getProperty("/PAGEID");
                    var treeTable = this.byId("nodes").getItems();
                    for (var i = 0; i < treeTable.length; i++) {
                        if (pageID === treeTable[i].getBindingContext().getObject().NodeID) {
                            treeTable[i].addStyleClass("red");
                        }
                        else {
                            treeTable[i].removeStyleClass("red");
                        }
                    }
                }
            },
            /**
             * Fired when an RTE instance is ready. Forces paste to insert
             * plain text so Word/browser markup (inline styles, mso-* junk,
             * nested spans) never enters the stored CONTENT.
             */
            _onRTEBeforeInit: function (oEvent) {
                var oConfig = oEvent.getParameter("configuration");
                if (!oConfig) {
                    return;
                }
                // Keep pasted images (inserted directly as base64 data URIs).
                oConfig.paste_data_images = true;
                // Drag & drop images stay as blob: URLs in the editor (converted
                // to base64 in onShown via the blob cache); don't auto-upload.
                oConfig.automatic_uploads = false;
                // Don't rewrite URLs; TinyMCE's URL conversion can corrupt long data URIs.
                oConfig.convert_urls = false;
            },
            /**
             * Fired when an RTE instance is ready. Allows rich paste so pasted
             * images come through; Word/Office markup (inline styles, mso-* junk)
             * is stripped by sanitizeContent() on save instead of by forcing
             * plain-text paste, which would also drop images.
             */
            _onRTEReady: function () {
                var oEditor = this.getNativeApi && this.getNativeApi();
                if (!oEditor) {
                    return;
                }
                if (oEditor.settings) {
                    oEditor.settings.paste_as_text = false;
                }
                // Load the content directly via TinyMCE so inline base64 (data:)
                // images render. Going through the UI5 "value" property runs the
                // sanitizer, which drops data: image sources; setContent() here
                // bypasses it. The editor's live DOM is the source of truth we
                // read back in onShown.
                if (typeof that._sPendingContent === "string") {
                    oEditor.setContent(that._sPendingContent);
                }
            },
            /**
             * Safety net applied on save: strips presentational/Office noise
             * from HTML that may still have slipped in, keeping CONTENT clean.
             * @param {string} sHtml
             * @returns {string}
             */
            sanitizeContent: function (sHtml) {
                if (!sHtml) {
                    return sHtml;
                }
                var oDoc = new DOMParser().parseFromString(sHtml, "text/html");
                Array.prototype.forEach.call(oDoc.body.querySelectorAll("*"), function (el) {
                    Array.prototype.slice.call(el.attributes).forEach(function (attr) {
                        var name = attr.name.toLowerCase();
                        if (name === "style" || name === "class" || name === "lang" ||
                            name.indexOf("mso") === 0 || name.indexOf(":") > -1) {
                            el.removeAttribute(attr.name);
                        }
                    });
                });
                return oDoc.body.innerHTML;
            },
            addScript: function (url) {
                var script = document.createElement('script');
                script.type = 'application/javascript';
                script.src = url;
                document.head.appendChild(script);
            }
        });
    });