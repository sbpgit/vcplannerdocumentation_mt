context cp {
    type header {
        ![PAGEID]         : Integer;
        ![DESCRIPTION]    : String;
        ![PARENTNODEID]   : Integer;
        ![HEIRARCHYLEVEL] : Integer
    }
    type data {
        ![PAGEID]      : Integer;
        ![DESCRIPTION] : String;
        ![CONTENT]     : hana.CLOB;

    }
}
