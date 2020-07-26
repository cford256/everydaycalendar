# The Everyday Calendar

A web app of Simone Giertz's Every Day Calendar gadget.

This is a fork of an open-sourced project created by Zhen Wang located at https://github.com/zmxv/everydaycalendar. This fork was created by Cody Ford and aims to allow it's users to use multiple calendars, so they can work on forging multiple habits at the same time.

Disclaimer: Zhen Wang is not affiliated with Simone Giertz's Every Day Calendar project. He built this site out of admiration for her engineering ideas. I am not affiliated with Zhen Wang or Simone Gietz.

## Possible Future Changes
 
- [ ] Make page responsive. 
- [ ] Change the month view to look and work better.
    - Zoom currently seems to work diffrently in chrome than in firefox.
    - Could use a grid like a normal calendar. 
        - Have divs with borders, so the background color could be changed for lit days. 
        - Don't even use the year cell icons for the month view. 
- [ ] Could show the days since last cell was lit, but that could be discouraging. Also a streak of 0 is already showing enough. 

- [ ] Could change pouchDBHelpers to work with multiple databases.
    - Instead of returning the database, it could return an index refrenceing the database.
    - databaseInfo = {  "name of db" :  { db: actualDatabase, revs: revsObject, attachments: attachmentsObject } }

- [ ] Could change pouchDBHelpers to always get the most recent version of the doc before updating it.
    -  Would not have to store and update the revs and attachments.
    - Would not have to fallback on getting the document again if it conflicts. 
    - Code would be less complex.
    - Would mean getting documents from the database when it does not have to. 
