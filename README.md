# The Everyday Calendar

A web app of Simone Giertz's Every Day Calendar gadget.

This is a fork of an open-sourced project created by Zhen Wang located at https://github.com/zmxv/everydaycalendar. This fork was created by Cody Ford and aims to allow it's users to use multiple calendars, so they can work on forging multiple habits at the same time.

Disclaimer: Zhen Wang is not affiliated with Simone Giertz's Every Day Calendar project. He built this site out of admiration for her engineering ideas. I am not affiliated with Zhen Wang or Simone Gietz.


[demo](https://cford256.github.io/everydaycalendar/)

[Changelog](changelog.md)

## To Do
- Change pouchDB functions to make sure that an attachment name is not starting with a _

- maybe remove the tags from the image gallery since I can't add it to multiple attachments. 
    - sunEditor will be updated to allow for multiple tags.
- maybe save if sunEditor is open, and open it on when the page is opened again. 


## Possible Future Changes
 
- [ ] Make page responsive.

- [ ] Maybe rework the export and import so that there is not duplicate attachment files. 
    - just put all attachments in a folder.
    - then all the other data could be in one json file.

- [ ] Could change pouchDBHelpers to work with multiple databases.
    - Instead of returning the database, it could return an index refrenceing the database.
    - databaseInfo = {  "name of db" :  { db: actualDatabase, revs: revsObject, attachments: attachmentsObject } }

- [ ] Could change pouchDBHelpers to always get the most recent version of the doc before updating it.
    -  Would not have to store and update the revs and attachments.
    - Would not have to fallback on getting the document again if it conflicts. 
    - Code would be less complex.
    - Would mean getting documents from the database when it does not have to. 
