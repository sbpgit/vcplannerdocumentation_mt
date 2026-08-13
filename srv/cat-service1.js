const path = require("path");
module.exports = srv => {
    console.log(`Service name:${srv.name} is served at ${srv.path}`)

    srv.on("readJSONHeader", async req => {
        var fs = require("fs");
        var response1 = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"));
        var response = JSON.parse(response1);
        return response;
    });

    srv.on("readJSONData", async req => {
        var fs = require("fs");
            var words = fs.readFileSync(path.join(process.cwd(), "srv/util", "data.json"));
            var words1 = JSON.parse(words);
        return words1;
    });

    srv.on("addJson", async req => {
        let deleteNode = {};
        deleteNode.PAGEID = req.data.PAGEID;
        deleteNode.DESCRIPTION = req.data.DESCRIPTION;
        deleteNode.CONTENT = req.data.CONTENT;
        var fs = require("fs");
        var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "data.json"));
        var words = JSON.parse(json);
        for (i = 0; i < words.length; i++) {
            if (deleteNode.PAGEID === words[i].PAGEID) {
                const file = words;
                file[i].CONTENT = deleteNode.CONTENT;
                fs.writeFile(path.join(process.cwd(), "srv/util", "data.json"), JSON.stringify(file), (err) => {
                    if (err) { console.error(err); return; };
                    console.log("File has been updated in data.json");
                });
            }
        }
    });

    srv.on("editJSONHeader", async req => {
        let editNode = {};
        editNode.PAGEID = req.data.PAGEID;
        editNode.DESCRIPTION = req.data.DESCRIPTION;
        editNode.CONTENT = req.data.CONTENT;
        var fs = require("fs");
        var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"), 'utf8');
        var words = JSON.parse(json);
        for (i = 0; i < words.length; i++) {
            if (editNode.PAGEID === words[i].PAGEID) {
                const file = words;
                file[i].DESCRIPTION = editNode.DESCRIPTION;
                fs.writeFile(path.join(process.cwd(), "srv/util", "header.json"), JSON.stringify(file), (err) => {
                    if (err) { console.error(err); return; };
                    console.log("File has been updated in header.json");
                });
            }
                }

                var json1 = fs.readFileSync(path.join(process.cwd(), "srv/util", "data.json"), 'utf8');
        var words1 = JSON.parse(json1);
        for (i = 0; i < words1.length; i++) {
            if (editNode.PAGEID === words1[i].PAGEID) {
                const file = words1;
                file[i].DESCRIPTION = editNode.DESCRIPTION;
                fs.writeFile(path.join(process.cwd(), "srv/util", "data.json"), JSON.stringify(file), (err) => {
                    if (err) { console.error(err); return; };
                    console.log("File has been updated in data.json");
                });
            }
                }
    });
    srv.on("addPAGEHEADER", async req => {
        let masterData = {};
        var responseMessage1;
        var Flag1 = req.data.Flag1;
        if (Flag1 === 'n') {
            masterData.PAGEID = req.data.PAGEID;
            masterData.DESCRIPTION = req.data.DESCRIPTION;
            masterData.PARENTNODEID = req.data.PARENTNODEID;
            masterData.HEIRARCHYLEVEL = req.data.HEIRARCHYLEVEL;
            var fs = require("fs");
            var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"));
            var words = JSON.parse(json);
            const file = words;
            var i = words.length;
            file[i] = masterData;
            fs.writeFile(path.join(process.cwd(), "srv/util", "header.json"), JSON.stringify(file), (err) => {
                if (err) { console.error(err); return; };
                responseMessage1 = "File has been updated in Maintenance header.json";
            });
        }
        return responseMessage1;
    });

    srv.on("addPAGEPARAGRAPH", async req => {
        let detailData = {};
        var responseMessage1;
        var Flag1 = req.data.Flag1;
        if (Flag1 === 'n') {
            detailData.PAGEID = req.data.PAGEID;
            detailData.DESCRIPTION = req.data.DESCRIPTION;
            detailData.CONTENT = req.data.CONTENT;
            var fs = require("fs");
            var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "data.json"));
            var words = JSON.parse(json);
            const file = words;
            var i = words.length;
            file[i] = detailData;
            fs.writeFile(path.join(process.cwd(), "srv/util", "data.json"), JSON.stringify(file), (err) => {
                if (err) { console.error(err); return; };
                responseMessage1 = "File has been updated";
            });
        }
        return responseMessage1;
    });

    srv.on("deletePAGEHEADER", async req => {
        let deleteNode = {};
        var responseMessage1;
        var Flag = req.data.Flag1;
        deleteNode.PAGEID = req.data.PAGEID;
        if (Flag === "d") {
            var fs = require("fs");
            var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"));
            var words = JSON.parse(json);
            for (i = 0; i < words.length; i++) {
                if (deleteNode.PAGEID === words[i].PAGEID) {
                    let file = words;
                    delete file[i];
                    file = file.filter(function (obj) { if (obj != null) return obj })
                    fs.writeFile(path.join(process.cwd(), "srv/util", "header.json"), JSON.stringify(file), (err) => {
                        if (err) { console.error(err); return; };
                        responseMessage1 = "File has been updated in  header.json";
                    });
                }
            }
        }
        return responseMessage1;
    });

    srv.on("deletePAGEPARAGRAPH", async req => {
        let deleteNode = {};
        var responseMessage1;
        var Flag = req.data.Flag1;
        deleteNode.PAGEID = req.data.PAGEID;
        if (Flag === "d") {
            var fs = require("fs");
            var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "data.json"));
            var words = JSON.parse(json);
            for (i = 0; i < words.length; i++) {
                if (deleteNode.PAGEID === words[i].PAGEID) {
                    let file = words;
                    delete file[i];
                    file = file.filter(function (obj) { if (obj != null) return obj })
                    fs.writeFile(path.join(process.cwd(), "srv/util", "data.json"), JSON.stringify(file), (err) => {
                        if (err) { console.error(err); return; };
                        console.log("File has been updated in data.json");
                    });
                }
            }
        }
        return responseMessage1;
    });
    srv.on("dragDrop", async (req) => {
        try {
            const fs = require('fs');
            const data1 = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"), 'utf8');
            const data = JSON.parse(data1);
            let count =1;
            data.forEach((obj, index) => { data[index].index = count++ });
            const dragObjectId = JSON.parse(req.data.OBJ).dragObject.NodeID;
            const dropObjectId = JSON.parse(req.data.OBJ).dropObject.NodeID;
            const dragObject = data.find(obj => obj.PAGEID === dragObjectId);
            const dropObject = data.find(obj => obj.PAGEID === dropObjectId);
            const dragObjectIndex = data.findIndex(obj => obj.PAGEID === dragObjectId);
            const dropObjectIndex = data.findIndex(obj => obj.PAGEID === dropObjectId);
            data[dragObjectIndex].index= dropObject.index;
            data[dragObjectIndex].PARENTNODEID= dropObject.PARENTNODEID;
            data[dropObjectIndex].index = Number(dropObject.index) + 1;
            data.sort((a, b) => a.index - b.index );
            let indexs = Number(dropObject.index) + 1;
            const tempIndex = indexs;
            data.forEach((obj, index) => {
              if (index >= tempIndex) {
                data[index].index = indexs++;
              }
            })
            data.sort((a, b) => a.index - b.index );
            fs.writeFile(path.join(process.cwd(), "srv/util", "header.json"), JSON.stringify(data), (err) => {
                            if (err) { console.error(err); return; };
                            console.log("File has been updated in header.json");
                        });
          } catch (e) {
            console.log(e)
            throw e;
          }
        // }

    });
    srv.on("uploadData", async req => {
        var Flag = req.data.Flag1;
        if (Flag === "H") {
            var fs = require("fs");
            var json = fs.readFileSync(path.join(process.cwd(), "srv/util", "header.json"));
            var words = JSON.parse(json);
            let file = words;
            delete file;  
            var uploadData =   JSON.parse(req.data.DATA);                
                    fs.writeFile(path.join(process.cwd(), "srv/util", "header.json"),JSON.stringify(uploadData) , (err) => {
                        if (err) { console.error(err); return; };
                        console.log("File has been updated in header.json");
                    });
        }
        else{
            var fs1 = require("fs");
            var json1 = fs1.readFileSync(path.join(process.cwd(), "srv/util", "data.json"));
            var words1 = JSON.parse(json1);
            let file1 = words1;
            delete file1;  
            var uploadData1 =   JSON.parse(req.data.DATA);                
                    fs1.writeFile(path.join(process.cwd(), "srv/util", "data.json"),JSON.stringify(uploadData1) , (err) => {
                        if (err) { console.error(err); return; };
                        console.log("File has been updated in data.json");
                    });
        }
    });
  
}