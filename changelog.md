# Changelog


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