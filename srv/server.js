"use strict";

const cds = require("@sap/cds");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const cors = require("cors");
// app.use(cors());

cds.on("bootstrap", app => app.use(proxy()));
cds.on("bootstrap", app => app.use(cors()));
cds.on("bootstrap", app => app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  }));
module.exports = cds.server;