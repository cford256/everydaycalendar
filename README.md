# The Everyday Calendar

A web app of Simone Giertz's Every Day Calendar gadget.

This is a fork of an open-sourced project created by Zhen Wang located at https://github.com/zmxv/everydaycalendar. This fork was created by Cody Ford and aims to allow it's users to use multiple calendars, so they can work on forging multiple habits at the same time.

Disclaimer: Zhen Wang is not affiliated with Simone Giertz's Every Day Calendar project. He built this site out of admiration for her engineering ideas. I am not affiliated with Zhen Wang or Simone Gietz.


[demo](https://cford256.github.io/everydaycalendar/)

[Changelog](changelog.md)

## To Do
- There is a bug that seems to delete the calendar background image if you import the same image twice. 
- 
    ```
    ** Change SunEditor image gallary to have all the images that are in any note or a calendar background.**
    get all attachments, then create URL objects for them.
    create an object to pass SunEditor for an image galery of the attachments.
    then SunEditor will add that URL object to its content. 
    Save the urls, then on save search the note for those urls and replace the URLs with refrences to the attachment that was added.
    possilby even add it as a new attachment. 
    would need to only add the uniqe images to the image gallary. The digest from pouchDB can be used for this.
    ```

## Possible Future Changes
 
- [ ] Make page responsive.
- [ ] See about passing SunEditor a json file for the image galery that shows all the images in pouch db.

- [ ] Change the month view to look and work better.
    - Could use a grid like a normal calendar. 
        - Have divs with borders, so the background color could be changed for lit days. 
        - Don't even use the year cell icons for the month view. 

- [ ] should do this change pouchdb.
- [ ] Could change pouchDBHelpers to work with multiple databases.
    - Instead of returning the database, it could return an index refrenceing the database.
    - databaseInfo = {  "name of db" :  { db: actualDatabase, revs: revsObject, attachments: attachmentsObject } }

- [ ] Could change pouchDBHelpers to always get the most recent version of the doc before updating it.
    -  Would not have to store and update the revs and attachments.
    - Would not have to fallback on getting the document again if it conflicts. 
    - Code would be less complex.
    - Would mean getting documents from the database when it does not have to. 
