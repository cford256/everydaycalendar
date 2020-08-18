/**
 * Helper functions for using pouchDB for localStorage. 
 *  By Cody Ford
 *
 *  Misc Notes:
 * 
 *  btoa('hello world')      // "aGVsbG8gd29ybGQ="   // to base64
 *  atob('aGVsbG8gd29ybGQ=') // "hello world"
 * 
 * 'text/plain' for plain text, 'image/png' for PNG images, and 'image/jpeg' for JPG images. 
 *  URL.createObjectURL()
 *  getAttachment() returns blobs, other methods default to base64.
 *  Check if a var is a blob:  console.log(myBlob.constructor.name === 'Blob'); // true
 *  new Blob(['Is there life on Mars?'], {type: 'text/plain'})
 * 
 *  If you're worried about ID collisions, you could also use new Date().toJSON() + Math.random(). 
 * 
 *  should maybe have a function to define the save functions. // if i wrote it as a module.
 */

var dbs = {};

/**************************************************************************************/
function getDB(dbName, revLimit, compact){
    if(typeof revLimit == "undefined") revLimit = 1;
    if(typeof compact == "undefined") compact = true;
    dbs[dbName] = {
        "db": new PouchDB(dbName, {revs_limit: revLimit, auto_compaction: compact}),
        "revisions": {},
        "attachments": {}
    };
    return dbName;
}

/**************************************************************************************/
function getDBInfo(dbName){
    return Promise.resolve(
        dbs[dbName].db.info().then(function(info){
            return info; // {"doc_count":0,"update_seq":0,"db_name":"kittens"}
        })
    );
}

/**************************************************************************************/
function dbDelete(dbName){
    if(showSave) showSave();
    return Promise.resolve(
        dbs[dbName].db.destroy().then(function(){
            delete dbs[dbName];
            console.log("Database Deleted");
            return {"ok": true};
        }).catch(function(e){
            console.error("dbDelete: \t" + e);
            return {"error": true};
        }).finally(function(){
            if(hideSave) hideSave();
        })
    ); 
}

/**************************************************************************************/
function dbGetAllDocs(dbName, options){
    if(showSpinner) showSpinner();
    var opt = {};
    if(typeof options !== "undefined") opt = options;
    return Promise.resolve(
        dbs[dbName].db.allDocs(opt).then(function(result){
            result.rows.forEach(function(row){
                dbs[dbName].revisions[row.key] = row.value.rev;
                if(row.doc) dbs[dbName].attachments[row.key] = row.doc._attachments;
            });
            return result;
        }).catch(function(e){
            console.error("dbGetAllDocs: \t" + e);
            return {error: true};
        }).finally(function(){
            if(hideSpinner) hideSpinner();
        })
    );
}

/**************************************************************************************/
function dbLogAllDocs(dbName){
    return Promise.resolve(
        dbGetAllDocs(dbName, {include_docs: true, attachments: true}).then(function(docs){
            if(!docs.error) console.log(docs.rows);
            return {"ok": true};
        })
    );
}

/**************************************************************************************/
function dbGetAllPrefixedDocs(dbName, prefix, incDocs, incAtt, attAsBlob){
    var options = { startkey: prefix, endkey: prefix + "\ufff0" };
    if(typeof incDocs !== "undefined") options.include_docs = incDocs;
    if(typeof incAtt !== "undefined") options.attachments = incAtt;
    if(typeof attAsBlob !== "undefined") options.binary = attAsBlob;
    return Promise.resolve(
        dbGetAllDocs(dbName, options)
    );
}

/**************************************************************************************/
function dbPutDoc(dbName, docId, content){
    if(showSave) showSave();
    var putData = { _id: docId, docContent: content };
    if(typeof dbs[dbName].revisions[docId] !== "undefined") putData._rev = dbs[dbName].revisions[docId];
    if(typeof dbs[dbName].attachments[docId] !== "undefined") putData._attachments = dbs[dbName].attachments[docId];    
    return Promise.resolve(
        dbs[dbName].db.put(putData).then(function(result){            
            if(result.ok) dbs[dbName].revisions[result.id] = result.rev;
            return result;
        }).catch(function(e){
            if(e.name === "conflict"){
                return dbEnsureDocUpdate(dbName, docId, content);
            }else{
                console.error("dbPutDoc: \t" + e);
                return {error: true}
            }             
        }).finally(function(){
            if(hideSave) hideSave();
        })
    );
}

/**************************************************************************************/
function dbEnsureDocUpdate(dbName, docId, content){
    return Promise.resolve(
        dbGetDoc(dbName, docId).then(function(){ // revisions is updated with the new Rev.
            return dbPutDoc(dbName, docId, content);
        })
    );
}

/**************************************************************************************/
function dbGetDoc(dbName, docId, defaultDoc, att, attAsBlob){  
    if(showSpinner) showSpinner();
    var options = {};
    if(typeof att !== "undefined") options.attachments = att; // Include attachment data.
    if(typeof attAsBlob !== "undefined") options.binary = attAsBlob; // Return attachment data as Blobs/Buffers, instead of as base64-encoded strings.
    return Promise.resolve(
        dbs[dbName].db.get(docId, options).then(function(doc){
            dbs[dbName].revisions[doc._id] = doc._rev;
            dbs[dbName].attachments[doc._id] = doc._attachments;          
            return doc;
        }).catch(function(e){ // If defaultDoc is provided, it will return that if the doc does not exist.
            if(e.name === 'not_found' && typeof defaultDoc !== "undefined") return JSON.parse(JSON.stringify(defaultDoc));
            console.error("dbGetDoc: \t" + e);
            return {error: true}
        }).finally(function(){
            if(hideSpinner) hideSpinner();
        })    
    );
}

/**************************************************************************************/
function dbRemoveDoc(dbName, docId){
    if(showSave) showSave();
    return Promise.resolve(
        dbGetDoc(dbName, docId).then(function(doc){ // Get the most recent rev rather than trying it with a stored rev that could be wrong. 
            return dbs[dbName].db.remove(docId, doc._rev);
        }).then(function(){
            delete dbs[dbName].revisions[docId];
            delete dbs[dbName].attachments[docId];  
            return {"ok": true}
        }).catch(function(e){
            console.error("dbRemoveDoc: \t" + e);
            return {error: true}
        }).finally(function(){
            if(hideSave) hideSave();
        })    
    );
}

/**************************************************************************************/
// Attachments are duplicated based on their MD5 sum, so duplicate attachments won't take up extra space.
// So it might make sense to append a timestamp to the filename, just in case two diffrent files have the same filename. 
/* attachmentsArray = {
        "att.txt": {
            "content_type": "text/plain",
            "data": new Blob(["And she's hooked to the silver screen"], {type: 'text/plain'})
        },
} */
function dbBulkPutAttachments(dbName, docId, attachmentsArray, removeAnyOtherAttachments){
    if(showSave) showSave();
    return Promise.resolve(
        dbs[dbName].db.get(docId, {attachments: true, binary: false}).then(function(doc){
            if(typeof doc._attachments == "undefined" || removeAnyOtherAttachments == true) doc._attachments = {};
            
            for(var i in attachmentsArray){
                var attachmentName = i;
                while(attachmentName.indexOf("_") == 0){ // Make sure that the file does not start with a _
                    attachmentName = attachmentName.slice(1);
                    if(attachmentName == "") attachmentName = "attachment" + new Date().getTime();
                }
                doc._attachments[attachmentName] = attachmentsArray[i];
            }
            
            dbs[dbName].attachments[docId] = doc._attachments;
            return dbs[dbName].db.put(doc);  
        }).then(function(result){
            if(result.ok) dbs[dbName].revisions[docId] = result.rev;            
            return {"ok": true};
        }).catch(function(e){
            console.error("dbBulkPutAttachments: \t" + e);
            return {error: true};
        }).finally(function(){
           if(hideSave) hideSave();
        })
    );
}

/**************************************************************************************/
function dbPutAttachment(dbName, docId, attachmentName, data, mimeType){   
    if(showSave) showSave();

    while(attachmentName.indexOf("_") == 0){ // Make sure that the file does not start with a _
        attachmentName = attachmentName.slice(1);
        if(attachmentName == "") attachmentName = "attachment" + new Date().getTime();
    }

    var rev = ""; // Not using the spread operator since I am not out ruling supporting IE11.
    if(typeof dbs[dbName].revisions[docId] !== "undefined") rev = dbs[dbName].revisions[docId];
    if(rev != ""){ // putAttachment requires a rev if it is updatating an existing doc. 
        return Promise.resolve(
            dbs[dbName].db.putAttachment(docId, attachmentName, rev, data, mimeType).then(function(result){
                if(result.ok) dbs[dbName].revisions[docId] = result.rev;
                return dbGetDoc(dbName, docId); // update the stored attachments. // might be better to always just get the doc and not store the revs at all. 
            }).then(function(){
                return {"ok": true}
            }).catch(function(e){
                if(e.name === "conflict"){
                    return dbEnsureAttachmentPut(dbName, docId, attachmentName, data, mimeType);
                }else{
                    console.error("dbPutAttachment: \t" + e);
                    return {error: true}
                } 
            }).finally(function(){
                if(hideSave) hideSave();
            }) 
        ); 
    }else{ // try and put the attachment without the rev, in case the doc does not exist. 
        return Promise.resolve(
            dbs[dbName].db.putAttachment(docId, attachmentName, data, mimeType).then(function(result){
                if(result.ok) dbs[dbName].revisions[docId] = result.rev;
                return dbGetDoc(dbName, docId);
            }).then(function(){
                return {"ok": true}
            }).catch(function(e){
                if(e.name === "conflict"){
                    return dbEnsureAttachmentPut(dbName, docId, attachmentName, data, mimeType);
                }else{
                    console.error("dbPutAttachment: \t" + e);
                    return {error: true}
                }     
            }).finally(function(){
                if(hideSave) hideSave();
            }) 
        ); 
    }
}

/**************************************************************************************/
function dbEnsureAttachmentPut(dbName, docId, attachmentName, data, mimeType){
    return Promise.resolve(
        dbGetDoc(dbName, docId).then(function(){ // revisions is updated with the new Rev.
            return dbPutAttachment(dbName, docId, attachmentName, data, mimeType);
        })
    );
}

/**************************************************************************************/
function dbGetAttachment(dbName, docId, attachmentName){
    if(showSpinner) showSpinner();
    return Promise.resolve(
        dbs[dbName].db.getAttachment(docId, attachmentName).then(function(blob){
            return blob;
        }).catch(function(e){
            console.error("dbGetAttachment: \t" + e);
            return {"error": true};
        }).finally(function(){
            if(hideSpinner) hideSpinner();
        }) 
    );
}

/**************************************************************************************/
function dbDeleteAttachment(dbName, docId, attachmentName){
    if(showSave) showSave();
    return Promise.resolve(
        dbGetDoc(dbName, docId).then(function(doc){ // Guarantee that it has the lastest rev, rather than trying to remove first. 
            if(doc._attachments){ // Save the attachments without the one that is geing deleted.
              delete doc._attachments[attachmentName];
              dbs[dbName].attachments[docId] = doc._attachments;
            }
            return dbs[dbName].db.removeAttachment(docId, attachmentName, dbs[dbName].revisions[docId])  
        }).then(function(result){
            if(result.ok) dbs[dbName].revisions[docId] = result.rev;
            return {"ok": true};
        }).catch(function(e){
            console.error("dbDeleteAttachment: \t" + e);
            return {"error": true};
        }).finally(function(){
            if(hideSave) hideSave();
        }) 
    );
}

/**************************************************************************************/
/*  docs = [{
        _id
        _attachments
        docContent
}] */ 
function dbBulkCreateDoc(dbName, docs){
    if(showSave) showSave();

    for(var i = 0; i < docs.length; i++){ // an attachment in docs can't start with _
        var attachmentsClone = JSON.parse(JSON.stringify(docs[i]._attachments));
        for(var orgName in attachmentsClone){
            var attachmentName = orgName;
            var nameChanged = false;
            while(attachmentName.indexOf("_") == 0){ // Make sure that the file does not start with a _
                nameChanged = true;
                attachmentName = attachmentName.slice(1);
                if(attachmentName == "") attachmentName = "attachment" + new Date().getTime();
            }
            if(nameChanged){
                docs[i]._attachments[attachmentName] = docs[i]._attachments[orgName];
                delete docs[i]._attachments[orgName];
            }
        }
    }

    return Promise.resolve(
        dbs[dbName].db.bulkDocs(docs).then(function(result){ 
            for(var i = 0; i < result.length; i++){
                var thisResultDoc = result[i];
                if(thisResultDoc.ok) dbs[dbName].revisions[thisResultDoc.id] = thisResultDoc.rev; // Save the rev.

                for(var j = 0; j < docs.length; j++){ // Save the attachments as well.
                    if(docs[j]._id == thisResultDoc.id){
                        dbs[dbName].attachments[thisResultDoc.id] = docs[j]._attachments;
                        break;
                    }
                }
            }
            return {"ok": true};
        }).catch(function(e){
            console.error("dbBulkCreateDoc: \t" + e);
            return {"error": true};
        }).finally(function(){
            if(hideSave) hideSave();
        }) 
    );
}
