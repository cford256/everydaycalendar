# Changelog

## [1.0.5]

### Changed
- The content for the image gallery is not created on load. Then when a new images is added to the background, or a note with a new image is saved, the image gallery is updated. Rather than fetching every image when the editor is opened. 
    - There is no need to update the image gallery when an image is deleted. It makes sense to keep the image in the gallery in case they want to add it to something after it's deletion. 
    - The deleted images in the image gallery will be removed once the page is reloaded. 
- The textarea of sunEditor is now initally set to display: none. So it won't be visible while the content is being built for sunEditor.
- The Sweet alert close button now has a lower z-index. It was appearing above sunEditor's image gallery. 
- Now updating a calendar's title in the sidebar directly, when changing the title. Rather than updating the entire sidebar.
- The calendar icon in the sidebar now has flex-shrink: 0 on it.


## [1.0.4]

### Added
- The image gallery in sunEditor now contains all the images that are in the notes, or the calendar background images. 
- Created a new function saveConfigAfterDelay that waits to see if the user makes anymore changes before saving the changes. 
    - It now uses this function most of the time when saving the config file.
- Now using saveCurrentCalendarAfterDelay in more places, so it does not try to save when it does not need to.
- Added a callback option to the save calendar function. 
    - Saving a calendars title now only saves after the user stops typing for long enough. The callback is used to update the sidebar to have the new name. 

## [1.0.3]

### Added
-  A function called saveCurrentCalendarAfterDelay that waits a short time before saving the calendars contents. If durring this time it is called again then it will restart its timmer for when it should save. This can be used in situations where the user is making changes rapidly and you don't want it to save after all of these changes.
    - This function is being used when a user toggles a day between being on and off. 

### Fixed
- Fixed the issue where it would delete a calendar background if you added an image that has the same name as the old background image.
- Changed the id on the image drop box on the back of the board. It was the same id as the full page dropbox.
- Added code to remove _ from the begining of backgrounds names, since pouchDB attachments can't start with that. Should move it to the pouchDB helpers.

### Removed
- Got rid of the sweet alert pop alert that would show that the user hit cancel, when deleting a calendar or all data.

## [1.0.2]

### Added
- Changed the calendar backgounds to be from lorem picsum. So there is a lot more images that the background could randomly be set to. 

### Changed
- Removed all of the divs that were for displaying a day in it's lit up state. Now just adding a class to the dim divs that changes the background image to be of the lit state.
    - Pro: Removes a lot of divs from the HTML.
    - Con: There is no longer an opacity transition on the cells, that made it look like they were turning on. 
- Reworked the dislpayMonthView function.

### Fixed
- Removed position fixed from the body, that was added in the last commit. It was causing an the background to not be displayed in firefox.

## [1.0.1]

### Changed
- Instead of using display: none to hide the days before the calendar was created, it has them at a lower opacity.
- Changed the dots to now appear on the monthview page.
- Now using transform Scale to enlarge the days while it is in month view.  
- Added a main container div to position the calendar. 

### Fixed
- Chrome no longer constently adds and removes the file drop overlay when you hover a file over the window. 
- Draging a sidebar item was sometimes showing the full page drop window.
- Changed statements that were checking if a variable is undefiend to use === and !== rather than == and !=
- Fixed the tooltip for draging to rearange the note items in the sidebar. Then deleted it.

## [1.0.0]
- [x] Inital commit of fork.