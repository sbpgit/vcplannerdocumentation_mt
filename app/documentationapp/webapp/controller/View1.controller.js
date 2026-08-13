
sap.ui.define([
    "cpapp/documentationapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Text",
    "sap/m/Button"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, RichTextEditor, Dialog, mobileLibrary, Text, Button) {
        "use strict";
        var that, k = 0;
        var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
        return BaseController.extend("cpapp.documentationapp.controller.View1", {
            onInit: function () {
                that = this;
                this.getOwnerComponent().getRouter().getRoute("TargetView1").attachPatternMatched(this._onPatternMatched.bind(this));
            },
            /**
             * Adds the "red" highlight style to the tree item matching nodeId and
             * removes it from all others. Extracted from the highlight loops that
             * were duplicated across the selection/search/expand handlers (several
             * of which re-fetched getItems() on every iteration).
             * @param {*} nodeId NodeID of the item to highlight
             */
            _highlightNode: function (nodeId) {
                var aItems = that.byId("nodes").getItems();
                for (var i = 0; i < aItems.length; i++) {
                    if (nodeId === aItems[i].getBindingContext().getObject().NodeID) {
                        aItems[i].addStyleClass("red");
                    } else {
                        aItems[i].removeStyleClass("red");
                    }
                }
            },
            /**
             * Wraps stored CONTENT in the justified detail container used by the
             * detail panel. Extracted from the repeated firstLine/lastLine blocks.
             * @param {string} sContent
             * @returns {string}
             */
            _wrapContent: function (sContent) {
                return '<div style="padding: 25px" style="text-align: justify">' + sContent + '</div>';
            },
            _onPatternMatched: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var dataArray = [];
                that.oGModel = that.getOwnerComponent().getModel("oGModel");
                that.byId("idHTML").setContent();
                this.getView().getModel("oModel").callFunction("/readJSONHeader", {
                    success: function (odata) {
                        that.oGModel.setProperty("/headerData", odata.results);
                        for (var i = 0; i < odata.results.length; i++) {
                            dataArray.push({
                                NodeID: odata.results[i].PAGEID,
                                HierarchyLevel: odata.results[i].HEIRARCHYLEVEL,
                                Description: odata.results[i].DESCRIPTION,
                                ParentNodeID: odata.results[i].PARENTNODEID
                            });
                        }
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
                        oJsonModel.setData({ items: root });
                        var treeTable = that.byId("nodes");
                        treeTable.setModel(oJsonModel);
                    },
                    error: function (e) {
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
                this.getView().getModel("oModel").callFunction("/readJSONData", {
                    success: function (oData) {
                        that.oGModel.setProperty("/Content", oData.results);
                        that.oGModel.setProperty("/flag", "X");
                        var firstNode = that.byId("nodes").getItems()[0].getTitle();
                        for (var i = 0; i < oData.results.length; i++) {
                            if (firstNode === oData.results[i].DESCRIPTION) {
                                var firstLine = `<div style="padding: 25px">`;
                                var lastLine = `</div>`;
                                that.byId("idHTML").setContent(firstLine + oData.results[i].CONTENT + lastLine);
                                that.oGModel.setProperty("/initialData", oData.results[i].CONTENT);
                                that.byId("detailTitle").setText(oData.results[i].DESCRIPTION);
                                that.oGModel.setProperty("/PAGEID", oData.results[i].PAGEID);
                            }
                        }
                        var reqData = oStorage.get("nodeId");
                        
                        if (reqData) {
                            that.onNavChange(reqData);
                        }
                        else {
                            sap.ui.core.BusyIndicator.hide();
                            that.byId("nodes").getItems()[0].addStyleClass("red");
                            var treeTable = that.byId("nodes");
                            treeTable.expand(0);
                        }
                        oStorage.put("nodeId", null);
                    }
                });
            },
            //on Nav button clicked 
            onNavChange: function (oEvent) {
                var count = 0; that.pageIDArray = [];
                var pageId = oEvent;
                that.pageIDArray.push(oEvent);
                var totalNodes = that.oGModel.getProperty("/headerData");
                var filteredData = totalNodes.find(a => a.PAGEID === pageId);
                for (var i = 0; i < totalNodes.length; i++) {
                    if (pageId === totalNodes[i].PAGEID) {
                        if (totalNodes[i].PARENTNODEID !== 0) {
                            pageId = totalNodes[i].PARENTNODEID;
                            that.pageIDArray.push(totalNodes[i].PARENTNODEID);
                            i = -1;
                            count++;
                        }

                        else {
                            var TreeTable = that.byId("nodes").getItems();
                            if (count === 0) {
                                for (var ii = 0; ii <= TreeTable.length - 1; ii++) {
                                    if (pageId === TreeTable[ii].getBindingContext().getObject().NodeID) {
                                        TreeTable[ii].addStyleClass("red");
                                        var aTree = that.byId("nodes");
                                        aTree.onItemExpanderPressed(aTree.getItems()[ii], true);
                                    }
                                    else {
                                        TreeTable[ii].removeStyleClass("red");
                                    }
                                }
                            }
                            else {
                                that.pageIDArray.sort(function (a, b) {
                                    return a - b;
                                });
                                for (var k = 0; k < that.pageIDArray.length; k++) {
                                    var aTreeTable = that.byId("nodes").getItems();
                                    for (var ii = 0; ii <= aTreeTable.length - 1; ii++) {
                                        if (that.pageIDArray[k] === aTreeTable[ii].getBindingContext().getObject().NodeID) {
                                            var aTree = that.byId("nodes");
                                            aTree.onItemExpanderPressed(aTree.getItems()[ii], true);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                var data = that.oGModel.getProperty("/Content");
                for (var q = 0; q < data.length; q++) {
                    if (oEvent === data[q].PAGEID) {
                        that.byId("idHTML").setContent(that._wrapContent(data[q].CONTENT));
                        that.oGModel.setProperty("/oContent", data[q].CONTENT)
                        that.byId("detailTitle").setText(data[q].DESCRIPTION);
                    }
                }
                that.oGModel.setProperty("/PAGEID", pageId);
                that._highlightNode(oEvent);
                sap.ui.core.BusyIndicator.hide();
            },


            // On press of any node
            onSelectionChange: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                that.byId("detailSearch").setValue();
                that.oGModel.setProperty("/flag", '');
                that.byId("idHTML").setContent();
                var pageId = oEvent.getSource().getBindingContext().getProperty().NodeID;
                that.oGModel.setProperty("/PAGEID", pageId);
                that._highlightNode(pageId);
                var oTree = that.byId("nodes");
                var aItems = oTree.getItems();
                var data = that.oGModel.getProperty("/Content");
                for (var i = 0; i < data.length; i++) {
                    if (pageId === data[i].PAGEID) {
                        that.byId("idHTML").setContent(that._wrapContent(data[i].CONTENT));
                        that.oGModel.setProperty("/oContent", data[i].CONTENT)
                        that.byId("detailTitle").setText(data[i].DESCRIPTION);
                        for (var kk = 0; kk < aItems.length; kk++) {
                            if (data[i].PAGEID === aItems[kk].getBindingContext().getProperty().NodeID) {
                                oTree.onItemExpanderPressed(aItems[kk], true);
                                break;
                            }
                        }
                    }
                }
                sap.ui.core.BusyIndicator.hide();
            },
            // Search function on Master Page
            onMasterSearch: function (sValue) {
                var searchVal = sValue.getParameter("newValue");
                var treeFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, searchVal);
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
                    that._highlightNode(that.oGModel.getProperty("/PAGEID"));
                }
            },
            onTreeChange: function (event) {
                if (event.getParameters().reason === "filter") {
                    const model = this.getOwnerComponent().getModel("oGModel");
                    const query = model.getProperty("/query");
                    this.byId("nodes").expandToLevel(query ? 99 : 0);
                }
            },

            //Function for onClick to open a specific node. On change of pageId in this function and required pageId to be given, we will open the required page.
            myJsFunc: function (oEvent) {
                that.oGModel.setProperty("/flag", "Y");
                that.byId("idHTML").setContent();
                var pageId = 8;
                var pageId1 = 5;
                var pageId2 = 6;
                var oBinding = that.byId("nodes");
                var kBinging = that.byId("nodes").getItems();
                for (var kl = 0; kl < kBinging.length; kl++) {
                    if (kBinging[kl].getBindingContext().getObject().NodeID === pageId1) {
                        that.byId("nodes").onItemExpanderPressed(kBinging[kl], true);
                        break;
                    }
                }
                var lBinding = that.byId("nodes").getItems();
                for (var lk = 0; lk < lBinding.length; lk++) {
                    if (lBinding[lk].getBindingContext().getObject().NodeID === pageId2) {
                        that.byId("nodes").onItemExpanderPressed(lBinding[lk], true);
                        break;
                    }
                }
                var data1 = that.oGModel.getProperty("/Content");
                that._highlightNode(pageId);
                for (var i = 0; i < data1.length; i++) {
                    if (pageId === data1[i].PAGEID) {
                        that.byId("idHTML").setContent(data1[i].CONTENT);
                        that.oGModel.setProperty("/clickContent", data1[i].CONTENT)
                        that.byId("detailTitle").setText(data1[i].DESCRIPTION);
                    }
                }
            },

            // Search on detail page
            ondetSearch: function (dValue) {
                if (that.oGModel.getProperty("/flag") === "X") {
                    var data = that.oGModel.getProperty("/initialData");
                }
                else if (that.oGModel.getProperty("/flag") === "Y") {
                    var data = that.oGModel.getProperty("/clickContent");
                }
                else {
                    var data = that.oGModel.getProperty("/oContent");
                }

                this.byId("idHTML").setContent(that._wrapContent(data));
                var searchVal = that.byId("detailSearch").getValue();
                var oBinding = this.byId("idHTML").getContent();
                if (searchVal !== "") {
                    var textNodes = [];
                    var doc = document.getElementById("container-cpapp.documentationapp---View1--detail-cont");
                    if (doc === null) {
                        var doc = document.getElementById("application-VCPDocument-Display-component---View1--detail-cont");
                    }
                    that.onFunChange(doc, textNodes);
                    that.onSearchFunction(textNodes, searchVal);
                }
                else {
                    this.byId("idHTML").setContent(oBinding);
                }
            },
            onFunChange: function (node, ret) {
                var c = node.childNodes, i, l = c.length;
                for (i = 0; i < l; i++) {
                    switch (c[i].nodeType) {
                        case 1: // element node
                            that.onFunChange(c[i], ret);
                            break;
                        case 3: // text node
                            ret.push(c[i]);
                            break;
                    }
                }
                return ret;
            },
            onSearchFunction: function (nodes, search) {
                var results = [], l = nodes.length, i,
                    regex = new RegExp(search, 'i'), match,
                    span;
                for (i = 0; i < l; i++) {
                    while ((match = nodes[i].nodeValue.search(regex)) > -1) {
                        nodes[i] = nodes[i].splitText(match);
                        span = document.createElement('span');
                        span.classList.add('highlight');
                        nodes[i].parentNode.insertBefore(span, nodes[i]);
                        nodes[i].splitText(search.length);
                        span.appendChild(nodes[i]);
                        nodes[i] = span.nextSibling;
                    }
                }
            },

            // For collapse all in master page button
            onCollapseBtn: function () {
                var oBinding = that.byId("nodes");
                oBinding.collapseAll();
                var aTreeTable = that.byId("nodes").getItems();
                for (var kk = 0; kk <= aTreeTable.length - 1; kk++) {
                    aTreeTable[kk].removeStyleClass("red");
                }
                var pageID = that.oGModel.getProperty("/PAGEID");
                var detailDes = that.byId("detailTitle").getText();
                if (aTreeTable.length === 6) {
                    for (var ll = 0; ll < aTreeTable.length; ll++) {
                        if (detailDes === aTreeTable[ll].getTitle() && pageID === aTreeTable[ll].getBindingContext().getObject().NodeID) {
                            aTreeTable[ll].addStyleClass("red");
                        }
                    }
                }
            },

            // For expand button in master page
            onExpandBtn: function () {
                var oBinding = that.byId("nodes");
                oBinding.expandToLevel(999);
                that._highlightNode(that.oGModel.getProperty("/PAGEID"));
            },

            // ToggleOpenState property function
            onChange: function (oEvent) {
                that._highlightNode(that.oGModel.getProperty("/PAGEID"));
            },
            onPdfDownload: function () {
                sap.ui.core.BusyIndicator.show();
                var content = this.byId("idHTML");
                if (content && content.getContent()) {
                    var pdf = new jsPDF('p', 'pt', 'letter');
                    var source = content.getContent();
                    var specialElementHandlers = {
                        '#bypassme': function (element, renderer) {
                            return true;
                        }
                    };
                    var margins = {
                        top: 30,
                        bottom: 10,
                        left: 40,
                        right: 20,
                        width: 522

                    };
                    var firstLine = `<div style="padding: 15px;font-size: 24pt; font-family: '72',Arial,sans-serif; color: #333;">`;
                    var lastLine = `</div>`;
                    var header = that.byId("detailTitle").getText();
                    var finalHeader = firstLine + header + lastLine;
                    function addHeader(pdf, pageNumber) {
                        var headerImage = 'data:image/png;base64,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';
                        var vcPlannerLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsSAAALEgHS3X78AAAAAXNSR0IArs4c6QAAIABJREFUeF7tXQd4VEXXnrt9N8mmF0gCSSgJIF3qDx8aVLCBDUEEFaUIHzZEEEWxoIKFYoEfREH9RBEEQQUURZAmSI9AgABJSEIKpGyS7Xfv/5+F5dskW26Ze/fu5s7z8OTh2Zkz55yZ987MmTPnEEgqfGlAjlB0uDJMkS7XxfVUqMLTkFwWTyjD4hEhT6IISk8o5IkyuSLeGwMU5TA4bPbLyEHVEIiqQRSqcViqCwhKZrBb6/JJ4+VDtnr7BYSq6hBCJF+CNGe6RHMWHovsYWGJanVCF6SM6ChXqMIJgkpQhMV1dhCoEyGX6wmC0GDpxwsRiqLMFEnWEw500mGp+cdhtxeTlvp60lJ3yF578S+EkI3P/kOdtgQQZiOsUoWntpcp5HFIF9lXqYu9XabW9EMEoWRGRpDaFEWSlchu3W+tv7KLqjccttRU/o1QTZUgvYdIJxJAfA+kTBWe2FEeFpstD4u5WaYOH0DI5XFBO/YUZaXs5DFbfUWuw2LZT5ku77TWlZ1ECDmCViaeGZcA0lTBKkV4Sj9FRPRQZUSLu2UqZUeEUKjqiaJIe66t9vLP9sqSNTbjpeMIISvPcy6oyIfqwDMfBJ2uhTai9YPKqNbPE0p5KnMCIdCCJIttddUbrFVF6+x1RbuklSV0v4y0ZqtGE5WGols9LNfo+8l1+lsIglDTahj6lSjSVP+no77qd9JY8o3FUJEX+iJ7lrBZriBqdXw7eUL6c0p93HiRHrDFMx8pymarvfwFWVW0yVJbsgUhZBcPc/xz0owAEhmtTWz5qCIi6WGZWttVAgbzyUXZ7KdsVRdXmMqLVzYXa1hzAIhKFZ1xvyYpcyEhlyUynxZSi8YaoEhHmbnizLPWy+c2IoRMoayhUAaIVp3Q8RFVdOo0mVLRPpQHMVCyUXbygqWycL6l/OSXoQqUUASIQhXX7kF1bMYcCRjCQIci7ees5QVvmq/kfh1qZ5RQAohMHZ1+pzou4w1CrekmzNSQenHXAGk25ZCGklWm8tylobKihARAVGEJXZSJ7ecpdJFDQ/hSL2jQ6LCaTlgr8mdYqs5vDhqmvTAa7ADR65JvnKmISnheusMQ11SkKMrqMNZusJXkvmKxVJwVF3f0uQlagKgj029Tt8hcSijkGfTFlWoKrQHK4TDYKgpmmypOfhKMN/NBCBB9THirDvPkEXGPIwLJhR5wqT9WGqBstTXfGysOP42MxkusKASoUVABRB2dcZcmMXMpUshSAqQvqVsOGnDen5Sefd5albcmWKxdQQKQqKjw1Mx5cqdriLRqcJijomjqMBt3Wi/+MyEYziaiB4gyLLmbJjnrS5lK01kUoysxgUUDcDYxX8p70lp19hssBHkiImaAyNQJHSap49LeJWSycJ7kl8gGVgMUWXNlWd3FvBkIXa4NLCueexcrQLS6Vn2XKvWxj0j3GmKcNnh5Ik31e+rOHb0LoepqvJS5UxMfQDTRrSJSu6+VqbW9uYsnUQgWDTis5hxzcc5YW335MTHxLCqAKPWJfbXJ3TcRcrnXUDhiUp7EC2YNUI46S3n+s+aKU59hpsyanGgAoo3vMFKVkLYCEdJ5g/VohkZDyl556cX6ksPvikEcMQBEpo7v+G9NQvpCyYQrhikhAh4oRNqqSt42lhx5LdC374EGiELbsvdcVUz8DOkwLoKJKTIWbIbLXxoLz00NpIUrkABR6FJ7f6yMjJ8ksnGR2BGRBkiTcXfduYP3IlR7ORBsBQogirDWfZYpwJ9KKpIG/GiAtJkP150+MCQQIAkEQCRwSJBgrIFAgURogEjgYDw1pAYuDQQCJEICRKZL7b1EOnNIE56LBq6eSXLuEOrgLhhAtC17z1PFxM/kohypraQB0MBV69b+J4RwmRcEIOqEjk9qEtKXSKZcaYLj0oCtsuRNY8mRV3HR80aHd4Bo4zNHqBLafiNdAvI9lM2MPlwmXs6fbCw78SmfkvMKEPCt0qX22Ca5j/A5hM2YNoVIS9m5yebLubyBhD+A6HQtIlr964BMIZeexzbjOcy36BRFWYwFx4fY64p28tEXXwDRRrS9eZtMo/sfPpiWaEoacNcAabcX1uXu78rHexI+AALmXHAhmSwNo6QBoTRAGms21J3f/SBuyxZ2gGjiOzyhTsyAPSF22kIpW+onODVgLS983lSeswAn91gnMQRY0LbuspOQyfQ4mZRoSRqgowGI5mgsPHqzvbZkL536dOrgBIhW327wXilwNB21S3X40gBlJ88bcvf0weXYiA0gupSeHyqjkp7iS3CJrqQBuhqw1dasMxbsHonjsRUWgECcXE1Kx83SZSDdIZTq8awBylR8Zoy16uxqrv1gAEhUlD6r7yEpiDTXoZDa49QARZIVhoI/u3KNBcwZIOGpfZfKI2OfxCmcREvSAA4N2Opq1hvzd4/gstXiBBBFZHJ2WEq3X6WtFY7hlGjwoQHTxROjrDX5ECybVeECEG1Eu+wDMrX2BlY9S40kDQigAYp0FBpO7WN9y84aIJqkrq+q41JeF0BGqQtJA5w0YKsu/chYdOhpNkRYAUStjm+nbtsrR0p7xkblUhvBNUAh0njhcB+b8dIhpn2zAkh4xoANcl3kPUw7k+pLGgiUBkiL6VDd2e0DmWbfZQwQRUSrAWGtO/8p+VoFaqilftlqwFpx/jlT2alFTNozBYgiou3gXTKNpi+TTqS6kgbEoAFIAWc4tbsTQrVX6PLDCCCq6IyHtMkdON9O0mVOqidpALcGrGUXnjZVnPyILl0mAFFEtM8+KlNpO9ElLtWTNCA2DVw1+27JonsWoQ0QVUzaSG3LTt+KTWCJH0kDTDVgLrvwtIXmKkIXIIrwttn75RptD6bMSPUlDYhNA0xWEVoAUUen361J7rhJbIJK/EgaYKsBc/n5KZbyU0v9tacDEFlE28F7JMuVP1VKvzfWgFwmQ906tUVajRqplAqqc2YGodWqvSqqrt6EcnLPU6TD4ZyXp88VoorKGl4US9nspwynf+ni7w27X4AoIhL6h7XutbvxvUfbtBQUHqblhXncREvLr6DSikqPZJPiY1BSQizuLrHRy8svQjBxxFxUSgXq3a0D6nlDe9SxXWuUnBSP+vXohORyGRa2a2rrATjowsVLKC+/GB365ww6cPQUstrsnOibik7cY63O3+iLiF+AhKcPXCcP09/fmMhPn7+DBvTqzIlBoRrPW7oazVvi2Tr94pTR6MXJo4VihXE/dz0+C+3+O4dxOz4bACBuHXijc/wH3NgZdc7K4LM7r7QBNLsP5qCdfx1D23YdRKTDwYgPh9n0Z23e9kGsAaLRRKWp2vTP9eRzJQGE0ViwriwWgERGhKE7s/tSd2b3I+7MFt89sclsQZu27UE/b/8LbfqNdswGynj+cC9fPlo+VxBdy66vK2NSPAYI3vv9R6hj+3TWAy9kQ2kFYa/t7P7d0WMjbkfDbunPnojALe96fBa1++8cv7sjYIs0XFlRV/jXBG8s+iKi0mcOzSOU8lRPjXO3f4WS4qMFFp1dd8EKEJJ0oJtGPevcfwtZ4Gz5wO2DqGkTHiRatUwQsmssfTFZdSmHw2A4ua+1t6iMXgGiikobrk3p9IM3jmHJfWfmBDR6+C1YhMJFBCbVmp/+cO7b4VAHhzl/e1OQBfbRcMiEv7C3hsN7IMvy1T9S7y1bQ1RUVgvGBgBj6qP3ookP3Y1ioiJ89gt6Pn2+0GlAyGzTCoEOxVKYAAR4tlw6M8585ewqT/x7BYg+/V/fEWER8J7XZwGALJn7rL9qgvwOX9qHn3kLFZaUce5vUJ+u6ImRd6BhtwofXvipOYvRV+u3cZaBCYGx992KXp461u+HobK6FgF/sNdvXGC1cX1ghg7qjdJTWzBhAVvdTrc8horL6CfFvXZYv9nT23UvAImI1XccUEDIZLQ+C6Dcj15/BpuAbAn1GT4ZnT5/kW1zj+1gNVkx/wW/EwdXp5+t2Yyenwu5hoQp3Tq2RYvmTEXw118Bc+vtj85EJ8/m+6vq/L1juzQ0ecww9MAdg5x3IUKVqM53Me2Kqi84Pshee3FX44YeAaKJazdRndR+GZNePnr9aTT2vtuYNMFaF4ABAOGjwPYBrHZ8mzNhBRw8ehpn+z5dHTA1cfs6y/nqE7ZrE0ffjV6YOArb3Yiv/lgABNmrKhbUFx94nhZAItpmb5dptLDk0C6wf/199QKUmeHxTE+bDtuKcOaAvSdfpW3rZPT7Nwt43WsPHPE0lZN7npb1hYuc6alJaOX7L9JaNdz7aTdoDOJyJmrVMhF9MHuy8w6FrwKXhwk9mD92pez2fEPuL20ab7OaDIZWG5usyuhzARGEkqkQcHu65Yv5TJthqc83QIDJZ8bdj16fNg4Lv42JvLfsW/TWx//hhbY7UbjDWDL3OcZAP3oyD900Es9ZE3Yac6c/wZgHOsoB95Q+90yhU7VxHcqUf7CLta7sH/cfmgBEE9v+UXWLdh5P9HR6fWfmBGrymOG8fwUb8wJWldhuw+iwyLoOrJIntq3CPrDFpRXOQeXbpeSxB4Y6zxtsysdfbECz3/+MTVOPbeB8smL+dOc5BWfh8qG0VuRPM5WdWOgTIOHpA7+Vh+kh8C+rAvv1I5tX+DUTsiLupxF84eBLx2fh46w1bvp8tOGXJudDrGJw5XvSSx9Qa378A+uHD+bKtx+/6vTbwlW4AIQ0mw7X5W3v5b7NaiiwJqp1ZJt+/3BNuhkoq9Ybi79AC1asxaVrj3TA3eLrxbOxTRQuA0pXUNhSjR4+mG51j/WY3i3Q7Qz8uhbNeYozf67+du4/hoaPf5lu9022Weazf7ezWMrPuX5oMNC6hA5TlAkZn7Cl7t5u19oPebf6NOYTzI/972O3haArc3JSHHVi2ypsAAGz6b7DJ+h2z7jeB7OnOO9zuJbW/UdSNbX12ORuzA8OEAPNz9b8jJ6f6/eZh1d1WErPTXTPmttA4PC0Ad/LwyPv46pMaA/3B2AaFbp0v2M8unCxlNdurxzdhMVcuW7zTjR+5nu88crlzNGYKTamU6aCfblgFueLWbamaBevZF3N+rr83de9190BotJnDTlOKBSZTAXzVn/9sjcROLsJWYSwBu1d/zGWw2WXIU9gufX3pF/QO+gfR2FrOmXaNxhBtqyaz2nnwRUglJ28YMjdCkEdrMD/dYAoIlr2D2vdfQ9ToXzVh9vZHWsYxeni3H1hSTnqMuRxznR8EcDh6r964+9oyuwGBhNsPCcnxaG96z/BZm07lHMaDR7d5A4NG7/uhODgvn/jUtaeC1wBArwYC4/1sRmKDjQAiDIq7VFdSifW5l1v2lr29jQ08u5sXpTpjShfB0pXf1wBAm8XYPXgcunmS6G/fvWe84UfriKEIcGdV/BY2PHtIlbb2Gdf/xitWreVk+jGS6en2K7kOQ8y11cQTcuuL6pjUrAfGuD29Pgv+OzndCTn8+sM/XMFyIJPv0NvfPglHVEY1+HjMlNogIDQbM9PTN6CeFOuvbrsvfqigzMaAETfNvtHQqNl7OVFZwRxWSjo9AV14Audlf0IAuc6PgoXgNTU1lPd7xhPgFcs7gIfo/0bl2B3DAwEQEA3Xy+eDa8YGakJx+6Bstr2GM78OsAdIHJ95tAL3h5HMeLQQ+VArCI4llpvcnMBCI49sje+4NIN3Mxxl0ABhM2lMxaAOBx1hpNb4uCpiHOLxcX/iu5gCL2KwGOp7nd4fUlJl22P9dgCBFY0MCDwsbLxaVbfuvNvNGpqYHIlAeAB+HQLDoBAX/UFR/vba4v3OQGiiUobpE7ptIMuE2zqBWIVgRtVuFnFXcAfCyxFTAufqwdb0NKRYfUPv6EprwhrjXTn68uFL9F+E8/0sZQ3+V3hSa+uIEldpqviUvm7sbrGhdCrCF8XcdU5P9GZVw3qBOvqAUIs/nwdmrMQu4GTtg7jY6LQwZ+W0TJbR3W+i8KRu8ZWXbbcWHRwkhMgutS+HykjY/n10UAIBWIV6XTrY6i4lP7zSzqjxgYgfK4ebA6zdOR01eGTd7p80LXO4brxJ+sNG+su7LrHCZDI9kN+QyoFN282mpIKvYrMW7Kamrd0NTYfIq1aRV06uJ4RPT5XDyE+OmIACEyvI5s/9fvOHRdAHDbb8drTv3aFgZZHZA0pkSkUgsR3EWJA3bEK5tR2gx72G9mEJr5Z+ZjxOcFemDSKennqGEaApSurmFYQ4IWO+wwugFwNB7QlgUAoOlLfqV8pQRAapopjW1/oVWTK7EVo9cbf2LLboB1TaxGfqwfdrypXwfkEOFPefBkj4GOYMfAhpiS91afA9Z1Q6lr01GX0OIiLKh06Qq8iON3gJ48Z7owHRrfwObngNR44TvJd+Lz5Z8p758wMtGvdhx6b4fYZsxbnDiDUCR2f1CSks3egZyrhtfpCryK47ONMIoHweWsOaqR7cGU5RNebLV+9Cc14ZzlXMtjae3sdiftC01RyciQRntzrTXl0wmxs3NMkBJE14GmuUGXD1l1o3AvcA0owscnz7XoPATJwPlf1NhaBvCj0xJM3sy9ugFgqCl4idCk3fqSMSuTdxOtJUKE9fXG8v6B7Ice3xy4kp7lyTJikX9v3HkH3TXpFqG8ZrX48reS4AWKvLv2QCE/pt0geFROQsIgQQwt8/4Uqy1f/iGa8wygeXhPWiv5aSytxEI6+fOmFqbGAi45xTzwuvLjawlt2MPtCsh5Xwc0nWV//NRHRPvuUTKWFF1QBKeDWnJQgTKBoCKsD4Wu4FPhy0SmffbuZt/ce0H/Pzu15DcDmLmNhcTk2KyAd3dGt40zg45bECfzv1vz4B93mfutRdnshEXnDnXA1LxVJA5IGPGhAtACBV2XvzPBuToX7BdjGMHFGdNGEB1W47kXAJRtcPeqMJjRq6husJxmYjsGEOevdT33mA3HVGzF5DjJZnM+m/RaIwA9hf/zJ7arnjwf3Dv2Nk3tdJqFhF736bwR5ML0VSLm2eOX3WPyufClQtABx7bFhWwSJLN0LPO53Ke/hZ+Z6DMXvSWgXTZx3ExCU+d1Zk5zdTXrpA9ZLvOvwD8CHieQtaY6rXkqfB1Cd0ewXHFDB/UDr69LUVY+JSdyl04or1QgiRPoqN416jha/UGnHtwtRt07t0NETZ5u0gXwkEC1+zY/b0aSXFtCmyaai6AHi7eAF+Ts2rnjLOZEGjnialux8AAQOinK53OlpCheSEOeKTXG3jsGNMExST2kGuAIEePP2UeECkFVrt6Bn38ASUs2pPhdAPLmOgK53rfsIQT6SG++ahPIKitmonFaboAUISOfyqqXrf4MbINn9u1Prl71JQNBpyEgFAdoGPvA0yjnNPGWaa+Iv/+YnNPGhu5weyINHP4dKK6oaDCQXgKz5aQcaOqgX5CxHd42b5Uyn7F6CBSDOVXHyaOrFKaMJJqsdLUQ0qhS0AOndNQv9+p/3nQlz6OYFwQ2QtUteQ9n9ezjfv4eHaZwXn2wDRrgmPmxDOrZt7czaBasjTAD3F4hcADL7/c/Rzv1Hrwf0a7yVCxaASCuIW2RGVxJ5d2C7cgr62i7wfQZxeQK4AwK2fJA3vN1NDyOmQRncAQL77sceGOKMWdsYJFwB8vEX6yEvCLXli/kEBIRzBwkXgJRWVKK8fO9bHVhVZ83/lPZH3LXF8pAjnurZuT1x9QzyBzXppQ949WQW/QriCSCgZbAaLf1qIyMrFs4VxOUP5B5b994hA9HK92c683yAmwmT0hgg0PbVZx5B08Y/2AAkOAACtCFayJcLXnLq0QWSYAAIWM3gA7n0PxvR7Pc+w/aMwdtYiR4gOG9HcQEEBuj4L59TxaUVRONg2Se2rXQe2mHbxaR4Agi0dwHxUM4ZdPujM5zhREEONlYs2GLBCuIqrgSsFZU16KYHn0Fj778N9vZOwHj4cnsUx6VToQ7prnhZuPOVSABx27ZxNfO6TLswiXYfzGmgW4jCASFXmZp8vQEEiLs8nzdt24NiovTYAAK0XSA5eTafgjslSH4kZoC4khhBwqSs7LG853OUVhAmn/lrdY//8rnTxOirQH7228a+QJu6L4C4g8RFEMcK8t+VZDC1ZO5z1/fyYgaI+6qK8yGctIK4rSCV1QYE/9zL8tU/ITCx+iu3DuiJ1i593XkTv/ybnz1WnzZ+hDNMDROTrz+AIISorxe9TNw5uJ+zT5wAAXpTH7kHzX1hvJM2G4B40mlj5dx495P+1Hv9d1/3IJBQFaKcMP0I0e7craJoVxCXCwNT64cvJfhyi/DnhuGiCwdZsFQ9NWex1zwksMWCJJU/b//LeZikU1wuJHDZ1thzwNUetheQjz4+JhKxcTWBHOy+Ur0Bz8C7mFxNvLmnwNksPbWFcyuLO2qN+3iJFiB0JpVUR9IA3xog9G1u3kZodbfw3REb+jf364Ytdx2d/l9b9EWTrxHcOn/yZtPnMkdP5KFPvqK3OtDpm0kdeEczfeKDTJpgqetJP1gIsyQCOgBduJf3l3/nvDzGUix1G4jw1BvfkkcmvoSFIGYi18yptCLq4ejak+nQW6gZ8NzdutOZY0XwEqh89HyFcmWrwNztXzZJtANb36/Wb2NLskE7c8mpZwMWtIGuBEyCJNCl6a0eeA53Gfp4g1tw2JdPffTeBk3AOQ6c5AJVVEoFVX74B15vkD3JxtU8jlNf8C797M7/NCGJk0dTyckRhDIsvpsuvfcRnMzjpAWrCASLhgOqEKWxgj1l6xXCvOhPVlyJRP314/47GB3AE1gMxeXN3ZgXeCcyYsprWFh0hv25FjiuhCAIHRaqPBBxuVzwQLoJSfdAb56+UkLkQKQjJ+40a3T6BH8rph4CdOiyqeNtZ4ExBtrVwHHXQo8WyxSKRDaMCtEGUg0c3/o5q5x1bPhz+VK5bpndaYhh9QB+mIQfYqMDb22ESLNNh19fyYLoPn/w1Q91LYmO4MGr6QjvqY6QgebAExfcGKDPB+4YdJ0dsawewJCQZzP38cB5CGY7F6Ad5L2ECJ2eCjx/4GrJcthsx2pP/9rNCZCwlJ6LFVFJ9J7lcZGKQ1uhw5U+NWcxNXf6eLCgXT8MT5m9kFq98XfBD8ee1OZtD85BxbSabvptL3rkubdp1eWrEpxLC/au8Uoeh7WtQfoDoRLocFWYkKtIY17hvTUEniMdDq5iYGkPRguI0SV0AUtfSt8RQnfboD9/McFwWLJs1aWfGosOTRQsBRsOjQodrtSd5xlv/y8tXy0cctKlsWPNIqdriNCFSaAMPngDszuY372Vr9b/ip6a4znANV1+GqZg08YmqzL6XEAEoaRLIFD1Vr43E907dKCg3cOZBO5H4OsppiKkdc9dbrbPinHpzlvwahd9HG+IGiTxBEsWn2mgcSkG6PgKf4+zH3dabF4I8sWLO11YPWAVEbrwnYfenzz+Vk6u20BX8pzraaCBofCMgRvkOv09/pgTw+/w9hsOqUIUuBeBPIdiWz1cstN5m8KHnvjMQ++HX6o65ye/hpKEHvdQVpvdbz1PfVFW2x7DmV8HwG/XCWhadn1RHZPyDh/KxE3T3yENZ384Dnw4+WlMK1DbrECZvOn6oTF509JYp9bq8vmmor9fbAAQZVTao7qUToHL9ctwFtFNQ8CQbIPqfKdP48Kbq63Q5m93ngNxaTp5zHDqnZkT/K4Mk176gFrz4x9+63kaA2PxiSdtVfnONADXCSj1yX11rbrtwzFoQtAQ4h5A7KuHS898p4H2Np5g+u5+xwTe34W7979i/gsNLm+98cZl7IyFx/rYDEVOV213hKn0WUOOEwpFphATHEcffGZY8uTZi4NnPmjQ3Xbw0TeXiciGH4ga454TxBsNto6VlJ28YMjdCulAnJHBGyxBuhZd5ipjU19mw3gg2rjeh/PRt5gSV9KRD8IBwduVQJSbRj6Ljp7M471rJvdgbE29ZL1hXd2FXddvQhsARBGZnB2W2u133iXF2AE83odH/DjL1ZAyj/CaAAcnv0CLyeTB3TckrgGQuIdIxd0H0HPFxKJDG8YwttswOlUb1LGUnptovpx7PQRko0NMYpi+Q4+LhFwWzZhygBqAMyHsS3GWVeu2IjBjBlsJlEUL9OQKbAfhTPkqTD2YE3rcw+x8RCHScm53O7O55oJLhianfH36v74jwiIC62zDUMOQggAiXOAo8OWBW3M+I2Xg4NMTDXg/D5dokD89EGXrjv1o/Ivv83JnBL5nBXvWMHry4B4Wlo4+HGbTn7V52//rvt34DAJEgsVx0V1gT+826CjEU51Au1Gw5dvVDkIbwWMqCO4ciALBtodPeJlx8G5/vDIdYzbjaKksmmUuOTbPnZcmK4giPGVQWFrXHf4YFtvvuG6UcaSKDrRumE4m3PzCWWTSrA+wBrVgctZc/Pk6NGch8yu9+vxjN9nrinb6BAhCSKXPHJpHKOUN46ng1iJmejgmBZuvDmYxsJF7YeJI9PJTY7HRY0MIYv2CHxtEQORS3NPc+aIDwHzq1cUI3qwwLZSNvGg4vRVcoxskfvR406hNyJqmSmjzAdNOAl2f6yoSCquH+xgsmjPVafkJdAGArFq3ldq26xBRUVnNiB1Id73x07f8Bu0Asy6XKIvWykvvm0oON7H2eLmKj4jVdxxQSMhkog3k4EnLXFaRUFo93HUjhpXEnR+4LwHAgC+X6+7kQuElVFpRSZEOByGXycjMNqlycKEZduv/+A0cCKsGrFKQ8ZhDoerzj93ceHsF9Lz6qgSjNQsEYruKiCUYAYdB9toUPhwfzJ4csIM7HzIBTXgYNWfhSs4GgWvWq5v/P2dRk+eiXgGiikobrk3p9ANfwvFFl80qsm7zDjR+5vt8sSQKumDdWvb2tICZgHEqYfveI2jG20tRXkEJFrKWS2fGma+c9Xiq9+XtGJSHdblM5ox4Qcdfx6VdHFEwsIwUz0TgnuSFSaOcad3kchnPveEnv2HokWq1AAAKc0lEQVTrLrR45fdY3VquPo7a1xqhao+HI5/uwLqWXV9XxqS8il9UfimOve9WZ5oAOgWyNj0yLSiewdARh1Yd2N/Pnf64c48v9gLPnVet24JWrf0FFZaUYWeXNFxeVle432viEp8A0Wii0tRt+p8Jhrfq7ppjsopAFiiuZkjsoyYQQYiM/szjD/g9CAvEzvVuwJvh5z/+Qut+3sHKZMuAX8p4/nAvm/HSIW9t/D4oCU8fuE4epr+fQaeiqEpnFYG97H2TXhEFv4FkAkKsgk8b6CxQbioQ1hTGA9xVtu87wou7SmMde3ItaVzHL0AUES0GhrXuAbeLfusGcpA99e3PosXlWabYZMXFT6uWCdTQm/oQ8Ky5d9esJukFcPUDMXSPnjznXL0PHMtF8H+hi7Ukb6Sp8vR3vvqlM+llEW2z98o02j5CC8C1P7BowWUZHE4bF7bvBbjyFGzt42Miqcw2rSCzLgERDSGqDBRwDoWYyZ4KbJHABR5WBSgw+StratHJM/mouOyy0/M30IUiHWWGU1vaI4QaJqtsxBgdgCBVVOv7tCk3fB9ooZj2T1GUJU1XP+Lwvu2bGlttpNWDqTZDq76t8tJrxpLDr/uTihZAEEKK8LbZh+UabWd/BMX2u63m0rI5Ux8yzZgx/VkXb9LqIbZREpYfp2n3wv5OyFRZ5K9nugBBquiMh7TJHVb7Iyi63ylEpkUr3vt4wZvOMC5Q4B01gEQqzVMD1srSeaaSQ7PoSE8bILCKRLTPPipTaTvRISzVkTQgRg1QJHnJUPBnT2Q0XqLDHxOABO1ZhI4ipDrNQwPm8vP/tpSfWkJXWkYAca4ibbN3B6NFi65CpHqhqwGH1XSi9sz2Xggh2lHImQIEaSJbDVandoY8u4zbhq7qJcmCQQOQtdZaeWEdE15ZTfLwjAEb5LrIoAh0zUQZUt3Q1YDDbNxZm/dHtieXdl9SswKIWh3fTt22Vw5BEIGJDBC64yhJxocGKEQaLxzu48vnylu3rAACxHQtu7+hjGkpOTLxMaASTawasFWXfWIsOjiVDVHWAIEIQRHtbzkuU6mFzwHGRlKpTbPUwFWXkn1Z3t57+FMKF4AgdWT6bZqUjpsRgeT+OpJ+lzQQAA1QpuIzD1urzn7Dtm9OAIFOw1v1WS7Xx01gy4DUTtIAXxogjTU/1J3fDU81WKcm5gwQhKKi9Fl9DhMKRTpfgkp0JQ0w1QDlcFwx5O/sTPfGHPsh3Z2gWp82RJPa6Wdpq8V0GKX6PGkAtlZjrFVnOfsOYlhBrooYntp3qTwy1uvbXp4UIZGVNNBEA3ZDxXf1hQce4rK1chHFBhDASET7wXtlKk3QucRLcyx0NEDZyfOG3L29EDJcfa3FseAECFKGJXfTtu6yk5DJ9Bz5kppLGmCsAXggZyw8mm2vLWEenNdLb1gBAn1o4js8oU7MgAw92Gkz1pjUoFlpwFpeMN1U/g/WmNJ8TGJZWOu+KxQRseOa1ehIwgZUA7baK98bC/4ahRDCmuKKD4CAorQR7bJ3yNTa3gHVmtR5s9CAw2rOqT1z6F9sb8t9KYkvgCCk07WIaPWvAzKFPKVZjJIkZEA0APcd5rwDA63WK9ySkAh1BnHvR6lL6qVN6/6bdGgPyNwJ+U4pirJai/65w1xTyFtmZv5WkGvDo4ptc682KWutdIkY8vNVWAEpRNou5082lp24nrKZDwZ4BwgwrUvsNEEZl7ZUAgkfQ9g8adoqS940lhzhPbC6IABxmn8Tu7ykjk+dK5l/m+eExik1aahYUVd4YBKOm3J/fAkGEISQTJvc511VdNzz/piSfpc04E0D9trL39QX7H8EtznXW39CAgR4UGhTei9URcWzet0lTZvmrQGytvKHuoJ9cNdhEUoTQgPECRJdcu8PldHxk4USUuon+DVAmoy/1Z37YxiTkD04pA4EQCSQ4Bi5ZkTDYTJurj2XMwqhy7VCix0ogEjbLaFHOkj7sxkq1xkL940RclvlrqpAAgT4kGlb9n5bFRM/Q7JuBekM5pHta9Yq2Ipj9a9iwnKgAeIEiTq+4781CekLpXsSJkMXwnXhErCq5G1jyZHXhDDl+tKkGADi5E8b32GkKiFtBSJk4SE89JJofjQA7iP2ywVT+b4hpzsQogEIMAy+W5pW3dZLDo50hy+06oHjobX4xEg+fauYakxUAHEyD17AyX03ytRaiMItlWaiAXBZtxYcG2GxXD4tJpHFB5Cr2tHqWvVdqtTHwo2pWHkU0zgGNS+ksWZD3fl/HufjPQdXxYh58sk08R3GqRPSP0QEoeMqqNRefBqAN+S2K0WvmEqPLwykpSooDunemIRAEJqWmV/J1NobxDfEEkdsNQDRR4zFx8fiDLDAlpegBshV5qOiwlMz58kj4yZKWy4+poGgNCm74crq+sLcqWLcUjXWhJi3WE1GTR2VPkzdIms5IZclCjqkUmdYNECRZIW59Nwz1qqzawJ9v0FXoKACyFWhwpLCWt0wX6GPGyutJnSHOeD1KFtdzQZj+eGpXGPlCi1JEALkqoogHrC6ZdYSQiHPEFppUn8MNGB3FJkunZpurclfGyyrhrt0QQuQa0KE6ZJ7zFJEJU2X0sExmLRCVKUQaaku/dRcfG5WMJw1vKkk2AFydTVRx2UqkrMWKnSRQ6VtlxCz33cfkDDTXJL7PJucgIHnviEHIQGQayLJ1NEZQ5WxaW/KNdoeYlN0c+AH8pBbys+/bK3O/zEYt1OexiiUAOKST6GKa/egJjZjNqFUdGgOEzPQMjrsZJG1suAdS/mplUK/+ONb9lAEiEtnWk185kPKmLSZMqWiPd+KbI70KdJRaKnMX2ApO7UCIVQfijoIZYC4xkulimv3gCa+7QLp/gTPFIbMsfaakmXGkoKFwXwAp6ON5gCQa3qIjNYmJI9T6BMfkql13aXHWXSmR4M6lMNs2mWvLP7EVHl6K0LIwJhCEDZoRgD57+iowlt0UEYmT5Tr48YQcnlcEI6bYCxTDofBUVf1neVy/nKbsfRvwToWSUfNEiBuug/TxrUbJotIfFQRFnmbZCK+rhnnamGrurjSfKXih1DfRvnCYnMHyHXdKMJTBikjEocpI+PuJ+TylogglCL5iAnGBmUjL9pqy9fYDOU/2euKdoWKqZaLAiWANNWeXBWelKWMTBkv18cOIeSKrFBdWSiKMlMW8wGb8coWu+HKPntd0T6EkJXLhAq1thJAfI+oDGljWqrVkT0U4TGDZWGxN8kUig5BvLqQFGk/4zDW7LDWlP9mtZXtQfX1ZaE2qXHKIwGEmTZlKCw+Qa0M760Ii+kr10beiFTqPmJNEAQHbGQnc2zGqt3IaDhMGUv/NptrCqStE/1BlwBCX1feaqoV4al9lGH6nnKFLgapNFkytTYVyeQdCJksQoDtGUU5HPUUSZ6jLMZzyGY5Sdrqa2yW6qP2mhI4RwgW6Jm7KsVHQQIIf2OiVqsTUmS6iCSSIuPlmrBMQq5ppdBExToIFCMjCJlMpbyBInw//iIcZIndajsBbBJWcwlJWs5QpNlGWusvyCnZJYexttRiKS+SgMDPQP4f9iHOn6nWkKIAAAAASUVORK5CYII=';
                        pdf.addImage(vcPlannerLogo, 'PNG', 550, 10, 0, 30, 30);
                        pdf.addImage(headerImage, 'PNG', 30, 10, 0, 30, 20); // Adjust the size and position as needed
                        pdf.setFontSize(10);
                    }
                    // Add footer function
                    function addFooter(pdf, pageNum) {
                        // pdf.text(`Page ${pageNum}`, pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - margins.bottom, { align: 'center' });
                        pdf.text(`Page ${pageNum}`, 30, pdf.internal.pageSize.height - margins.bottom);
                        pdf.text("Confidential", 550, pdf.internal.pageSize.height - margins.bottom);
                    }
                    // Use setTimeout to allow more time for the PDF generation
                    setTimeout(function () {
                        pdf.fromHTML(
                            finalHeader + source,
                            margins.left,
                            margins.top,
                            {
                                'width': margins.width,
                                'elementHandlers': specialElementHandlers
                            },
                            function (dispose) {
                                const totalPages = pdf.internal.getNumberOfPages();
                                // Add header, footer to each page
                                for (let i = 1; i <= totalPages; i++) {
                                    pdf.setPage(i);
                                    addHeader(pdf, i);
                                    addFooter(pdf, i);
                                }
                                var header1 = that.byId("detailTitle").getText();
                                var fileName = `${header1}.pdf`;
                                pdf.save(fileName);
                                sap.ui.core.BusyIndicator.hide();
                            },
                            margins
                        );
                    }, 10000);
                } else {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("No content exists");
                }
            }
        });
    });