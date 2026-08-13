using cp as od from '../db/VCPlannerdoc';

service CatalogService @(impl:'./cat-service1.js'){
    function addPAGEHEADER(Flag1 : String, PAGEID : Integer, DESCRIPTION : String, PARENTNODEID : Integer, HEIRARCHYLEVEL : Integer)  returns String;
    function addPAGEPARAGRAPH(Flag1 : String, PAGEID : Integer, DESCRIPTION : String, CONTENT : String)                               returns String;
    function deletePAGEHEADER(Flag1 : String, PAGEID : Integer)                                                                       returns String;
    function deletePAGEPARAGRAPH(Flag1 : String, PAGEID : Integer)                                                                    returns String;
    function addJson(PAGEID : Integer, DESCRIPTION : String, CONTENT : String)                                                        returns String;
    function editJSONHeader(PAGEID : Integer, DESCRIPTION : String, PARENTNODEID : Integer, HEIRARCHYLEVEL : Integer)                 returns String;
    function readJSONHeader()   returns array of od.header;
    function readJSONData()     returns array of od.data;
    function dragDrop(OBJ: String)                                       returns String;
    //Function to upload data
    function uploadData(Flag1: String, DATA:String) returns String;
}