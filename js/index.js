var db;
const dbName = "EverydayCalendar";
var frame;
var board;
var sidebar;
var headerTitleDiv;
var calContainer;
var spinElement;
var spinner;
var saveIcon;
var fullPageDropBox;
var editor;
var sortingSidebar = false;
var currentStreakDiv;
var longestStreakSpan;
var totalLitSpan;
var percentLitSpan;
var currentState;
var saveCalendarTimmer;
var saveConfigTimmer; 
const intialState = "*************************************************************";
var currentTime = new Date();
var currentMonth = currentTime.getMonth();
var currentYear = currentTime.getFullYear();
var creationDate;
var todaysCellIndex;
var creationCellIndex;
var totalCellsInYear;
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let loremPicsum = "https://picsum.photos/seed/";
var yearTemplate;
var restOfYearTemplate;
var currentMonthTemplate;
var sinceCreationTemplate;
var currentCalendarId;
var currentCalendar;
var newCalendar = {
    id: "Cal_",
    title: "Calendar 1",
    states: {},
    hideDaysBeforeCreation: true,
    image:"",
    notes: "",
    lastYearViewed: null
}
const defaultConfig = {
    lastCalendarOpened: null,
    sidebarOpened: true,
    sidebarSort: "chronological",
    sidebarManualOrder: [],
    monthview: false, // currently these settings affect all calendars rather than each calendar having it's own setting. 
    lastMonthViewed: currentMonth,
    numberOfCalendars: 0,
    flipped: false
}
var config;
var initialImgGallery = {"statusCode":200, "result":[] };
var imgGallery;
var imgGalleryContent = [];
var imgGalleryURL;

/**************************************************************************************/
document.addEventListener('DOMContentLoaded', function(){ // Main
    frame = document.querySelector(".frame");
    board = document.getElementById("board");
    sidebar = document.querySelector("#sidebar");
    calContainer = document.querySelector(".calendars-container");
    spinElement = document.querySelector("#spinner");
    saveIcon = document.querySelector("ion-icon[name='save-sharp']");
    currentStreakDiv = document.querySelector("#stats-current-streak");
    longestStreakSpan = document.querySelector("#stats-longest-streak span");
    totalLitSpan = document.querySelector("#stats-total-lit span");
    percentLitSpan = document.querySelector("#stats-percent-lit span");
    fullPageDropBox = document.querySelector(".full-page-drop");
    headerTitleDiv = document.querySelector(".editable-title");
    setupSpinner();
    addListener('click', '.flip', flipBoard);
    addListener('mousedown', '.dim', toggleCell);
    addListener('touchstart', '.dim', toggleCell);
    addListener('mouseover', '.dim', toggleCell, function(event){
        return 'buttons' in event && event.buttons > 0; // Check that a mouse button is pressed down. 
    });
    addListener('click', '.mon', toggleSpecificMonthView);
    addDragAndDrop();
    addTooltips();
    loadCalendars();
});

//***************************************************************************************
//* Calendar Management Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function loadCalendars(){
        db = getDB(dbName);
        dbGetDoc(db, "Config", defaultConfig).then(function(response){
            config = typeof response._rev === "undefined" ? response : response.docContent;
            config.sidebarOpened ? sidebar.classList.add("opened") : sidebar.classList.remove("opened");
            config.flipped ? inner.className = "flipped" : inner.className = "";

            if(config.lastCalendarOpened != null){
                openCalendar(config.lastCalendarOpened);
                loadCalendarsIntoSidebar().then(function(){
                    buildImageGaleryContent();
                });
            }else{ // Inital Load.
                addNewCalendar();
            }
        })
    }

    /**************************************************************************************/
    function addNewCalendar(){
        var dateNow = new Date();
        var timestamp = dateNow.toJSON();
        var thisYear = dateNow.getFullYear();
        var thisCalendar = JSON.parse(JSON.stringify(newCalendar));
        config.numberOfCalendars++;     
        thisCalendar.title = "Calendar " + config.numberOfCalendars; 
        thisCalendar.id += timestamp; 
        thisCalendar.states[thisYear] = intialState;
        thisCalendar.lastYearViewed = thisYear;
        currentCalendar = thisCalendar;
        setRandomDefaultBackground();
        openCalendar(currentCalendar.id);
        saveCurrentCalendar()
        .then(loadCalendarsIntoSidebar);
    }

    /**************************************************************************************/
    function openCalendar(id){
        config.lastCalendarOpened = id;      
        saveConfigAfterDelay();
        currentCalendarId = id;  
        creationDate = new Date(id.replace("Cal_", ""));
        if(typeof currentCalendar !== "undefined" && id == currentCalendar.id){ // This is being called from addNewCalendar. 
            openCalendarSub();
        }else{ // need to get the calendar from the database. 
            dbGetDoc(db, id).then(function(res){               
                currentCalendar = res.docContent;
                openCalendarSub();
            })
        }
       
    }

    /**************************************************************************************/
    function openCalendarSub(){
        changeHeaderTitle(currentCalendar.title);
        renderBoard();     
        currentState = decodeState(currentCalendar.states[currentCalendar.lastYearViewed]);   
        loadBoardState(currentState);   
        config.monthview ? displaySpecificMonthView(config.lastMonthViewed, true) : displayYearView();
        loadBackgroundImage(currentCalendar.image); 
        document.querySelector("#display-days-before-creation").checked = currentCalendar.hideDaysBeforeCreation;
        showHideDaysBeforeDate();
        updateCalendarStats();
    }

    /**************************************************************************************/
    function setRandomDefaultBackground(){
        currentCalendar.image = loremPicsum + new Date().getTime() +  "/"; // set it to a random lorem picsum image with the time as a seed.
    }

    /**************************************************************************************/
    function loadBackgroundImage(image){
        if(image.indexOf("ATT_") != -1){ // Need to get the image from the database as an attachment. 
            var attachmentName = image.replace("ATT_", "");
            dbGetAttachment(db, currentCalendarId, attachmentName).then(function(loadedBlob){
                if(document.body.style.backgroundImage.indexOf("blob:") != -1 ){ // Revoke the old blobURL. 
                    var blobURL = document.body.style.backgroundImage.slice(5).slice(0, -1);
                    URL.revokeObjectURL(blobURL);
                }
                document.body.style.backgroundImage = "url("+ URL.createObjectURL(loadedBlob) +")";
            });
        }else{ // Else it is a lorem picsum image. 
            document.body.style.backgroundImage = "url(" + image + screen.width + "/" + screen.height + ")";
        }
    }

    /**************************************************************************************/
    function addTooltips(){
        tippy(".toggle-sidebar", {content: 'Toggle the Visablity of the Sidebar', placement: "right"});
        tippy(".editable-title", {content: 'Edit this Calendar\'s Title', placement: "bottom"});
        tippy(".chronological-icon", {content: 'Calendar\'s are in Chronological Order', placement: "right"});
        tippy(".alphabetical-icon", {content: 'Calendar\'s are in Alphabetical Order', placement: "right"});
        tippy(".manual-sort-icon", {content: 'Calendar\'s are are Sorted Manually', placement: "right"});
        tippy(".month-view-toggle", {content: 'Switch Between Year View and Month View', placement: "top"});
        tippy(".previous-year-button", {content: 'View the Previous Year'});
        tippy(".next-year-button", {content: 'View the Next Year'});
        tippy(".flip:not(.mirrored)", {content: 'View Calendar\'s Stats and Settings'});
        tippy(".flip.mirrored", {content: 'View the Calendar'});   
    }

    /**************************************************************************************/
    function addMonthTooltips(){
        tippy(".mon", {content: 'View this Month'});
    }

//#endregion

//***************************************************************************************
//* Sidebar Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function toggleSidebar(){
        var opened = sidebar.classList.contains("opened");
        opened ? sidebar.classList.remove("opened") : sidebar.classList.add("opened");
        config.sidebarOpened = !opened;
        saveConfigAfterDelay();
    }

    /**************************************************************************************/
    function loadCalendarsIntoSidebar(){
        return Promise.resolve(
            dbGetAllPrefixedDocs(db, "Cal_", true).then(function(res){ 
                var calNodes = [];
                for(var i = 0; i < res.rows.length; i++){
                    var cal = res.rows[i].doc.docContent;
                    calNodes.push({id: cal.id, title: cal.title})
                }
                calContainer.innerHTML = "";

                var sortContainer = document.querySelector(".sort-container");
                switch(config.sidebarSort){
                    case "manual": // load the saved manual order of the calendars.
                        sortContainer.classList.add("sort-manual");
                        sortContainer.classList.remove("sort-alphabetical");                
                        var tempNodes = [];
                        for(var id  of config.sidebarManualOrder){
                            for(var ob of calNodes){
                                if(ob.id == id) tempNodes.push(ob);
                            }
                        }

                        // Need to also add any new ones that did not exist when it was manually sorted last.
                        calNodes = calNodes.filter(function(item){
                            return tempNodes.indexOf(item) < 0;
                        });
                        calNodes = tempNodes.concat(calNodes);
                        break;
                    case "alphabetical":
                        sortContainer.classList.remove("sort-manual");
                        sortContainer.classList.add("sort-alphabetical");
                        calNodes.sort(function(a, b){
                            return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
                        });
                        break;
                    case "chronological":
                        sortContainer.classList.remove("sort-manual");
                        sortContainer.classList.remove("sort-alphabetical");
                        break;
                }
            
                for(var i in calNodes){
                    var calDiv = "<div class='cal-div' data-calendar-id='" + calNodes[i].id + "' onclick='sidebarCalendarClicked(event);' >" 
                    + "<ion-icon class='drag-cal' name='calendar-sharp'></ion-icon>"
                    + "<div class='cal-title' >" + calNodes[i].title + "</div>"
                    + "</div>";
                    calContainer.insertAdjacentHTML("beforeend", calDiv);
                }
                Sortable.create(calContainer, {
                    animation: 150,
                    handle: '.drag-cal',
                    onStart: function(){
                        sortingSidebar = true;
                    },
                    onEnd: function(e){
                        sortContainer.classList.add("sort-manual");
                        config.sidebarSort = "manual";
                        var order = [];
                        calContainer.childNodes.forEach(function(item){
                            order.push(item.getAttribute("data-calendar-id"));
                        })  
                        config.sidebarManualOrder = order;
                        saveConfigAfterDelay();
                        sortingSidebar = false;
                    }
                });
                return {"ok": true};
            })
        )
    }

    /**************************************************************************************/
    function toggleSidebarSort(){
        switch(config.sidebarSort){
            case "manual":
                config.sidebarSort = "chronological";
                break;
            case "alphabetical":
                config.sidebarSort = "chronological";
                break;
            case "chronological":
                config.sidebarSort = "alphabetical";
                break;
            default: 
                config.sidebarSort = "chronological";
        }
        saveConfigAfterDelay();
        loadCalendarsIntoSidebar();
    }
        
    /**************************************************************************************/
    function sidebarCalendarClicked(e){
        var el = e.srcElement;
        if(el.classList.contains("drag-cal")) el = el.parentElement;
        var openId = el.getAttribute("data-calendar-id");
        if(openId != currentCalendar.id) openCalendar(openId);
    }

    /**************************************************************************************/
    function showImportData(){
        Swal.fire({
            title: '<h1>Import Calendar Data</h1>',
            width: 660,
            padding: '50px',
            // calling the import asset function here would mean they could change the backgound image, from the import calendar data modal. 
            html: 
                '<div class="dropbox-container">\
                <form method="post" enctype="multipart/form-data" novalidate="" class="dropbox">\
                    <div class="dropbox__input">\
                    <ion-icon  class="dropbox__icon" name="push-outline"></ion-icon>\
                    <input type="file" name="img-input" id="file" class="drop_box_file" onchange="importAsset(event);">\
                    <label for="file"><strong>Choose a file</strong><span class="box__dragndrop"> or drag it here</span>.</label>\
                    </div>\
                    <div class="dropbox__uploading">Uploading…</div>\
                </form>\
                </div>',
            showCloseButton: true,
            showConfirmButton: false,
        })
    }

    /**************************************************************************************/
    function exportCalendarJson(){
        showSpinner();
        var zip = new JSZip();
        var outputData = { 
            cal: {},
            notes: {}
        };
        dbGetAllDocs(db, {include_docs: true, attachments: true}).then(function(res){
            var imgFolder = zip.folder("attachments");
            var attachmentInfo = {};
            var rows = res.rows;
            for(var i = 0; i < rows.length; i++){
                var id = rows[i].doc._id;
                var theseAttachments = rows[i].doc._attachments;
                var isNote = id.indexOf("Note_") == 0;
                var contentData = rows[i].doc.docContent;
                for(var attachmentName in theseAttachments ){
                    var digest = theseAttachments[attachmentName].digest;
                    var imgName = digest + "__";
                    isNote ? imgName += attachmentName.slice(2) : imgName += attachmentName;
                    if(typeof attachmentInfo[digest] === 'undefined'){
                        attachmentInfo[digest] = imgName;
                        imgFolder.file(encodeURIComponent(imgName), theseAttachments[attachmentName].data, {base64: true});
                    }
                    if(isNote){
                        contentData = contentData.replace("{{"+attachmentName+"}}", "{{"+digest+"}}");
                    }else{
                        if(contentData.image.indexOf("ATT_" == 0))  contentData.image = digest;
                    }
                }
                isNote ? outputData.notes[id] = contentData : outputData.cal[id] = contentData;
            }
            zip.file( "data.json", JSON.stringify(outputData), {base64: false});          
            downloadZip(zip, "Calendar_" + new Date().toUTCString());
        })      
    }

    /**************************************************************************************/
    function downloadZip(zip, filename){
        zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 }
        }).then(function(blob){   
            var dlA = document.createElement('a');
            dlA.setAttribute("href", URL.createObjectURL(blob) );
            dlA.setAttribute("download", filename + ".zip");
            dlA.click();
            URL.revokeObjectURL(dlA.href);
        }).catch(function(e){
            console.log("downloadZip: ", e);
        }).finally(hideSpinner)
    }

    /**************************************************************************************/
    function deleteData(){
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete all of your calendars!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it',
        }).then(function(result){
            if(result.value){
                dbDelete(db).then(function(){
                    db = getDB(dbName);
                    config = JSON.parse(JSON.stringify(defaultConfig));
                    config.sidebarOpened ? sidebar.classList.add("opened") : sidebar.classList.remove("opened");
                    config.flipped ? inner.className = "flipped" : inner.className = "";
                    addNewCalendar();
                    Swal.fire('Deleted!', 'All Calendars have been deleted.', 'success');
                })
            }
        });
    }

    /**************************************************************************************/
    function showAboutInforamtion(){
        Swal.fire({
            title: '<h1>The Every Day Calendar</h1>',
            width: 660,
            padding: '50px',
            html: 
                '<div class="about-info">\
                    <p>\
                        <iframe width="560" height="315" src="https://www.youtube.com/embed/-lpvy-xkSNA"\
                        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe> </p>\
                    <p>\
                        Simone Giertz, a <a href="https://www.youtube.com/channel/UC3KEoMzNz8eYnwBC34RaKCQ">YouTube celebrity</a>\
                        famous for her hilarious robotics inventions, has announced her first hardware product for sale &mdash;\
                        the "Every Day Calendar" that motivates you to keep the momentum of any good habit.\
                    </p>\
                    <p>\
                        She\'s running a <a href="https://www.kickstarter.com/projects/simonegiertz/the-every-day-calendar">Kickstarter campaign</a>\
                        This web app of Every Day Calendar stores all your achievements in your browser.\
                    </p>\
                    <p>\
                        This is a fork of an open-sourced project created by Zhen Wang located at <a href="https://github.com/zmxv/everydaycalendar">https://github.com/zmxv/everydaycalendar</a>.\
                        This fork was created by Cody Ford and aims to allow it\'s users to use multiple calendars, so they can work on forging multiple habits at the same time.\
                    </p>\
                    <p>\
                        Disclaimer: Zhen Wang is not affiliated with Simone Giertz\'s Every Day Calendar project.\
                        He built this site out of admiration for her engineering ideas.\
                        I am not affiliated with Zhen Wang or Simone Gietz.\
                    </p>\
                    <p>\
                        Information about Zhen Wang</br>\
                        Medium blog: <a href="https://medium.com/@zmxv/every-day-calendar-html5-edition-b5ea71cf59c2">https://medium.com/@zmxv</a><br/>\
                        Contact: Zhen Wang &lt;<a href="mailto:z@zmxv.com">z@zmxv.com</a>&gt;\
                    </p>\
                </div>',
            showCloseButton: true,
            showConfirmButton: false,
        })
    }

//#endregion

//***************************************************************************************
//* Header Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function changeHeaderTitle(newTitle){
        headerTitleDiv.innerHTML = newTitle;
    }

    /**************************************************************************************/
    function saveNewCalendarTitle(e){ // Could limit the length. around 21 chars are what fits before the sidebar starts shrinking the ionicon
        var title = headerTitleDiv.innerText;  
        if(e.data != " "){ // Don't Check user input if the input is a space. 
            var caretPos = getCaretCharacterOffsetWithin(headerTitleDiv);
            var oldLength = title.length;    
            title = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Remove chars I don't want to allow. 
            title = title.replace(/[^0-9a-zA-Z\s]/g, "");  
            if(title.length > 0){
                headerTitleDiv.innerHTML = title;
                if(caretPos >= 0 && caretPos <= title.length){
                    oldLength > title.length ? setCaret(caretPos-1) : setCaret(caretPos); // If the newly added char was removed by the regex then set cursor positon back one.
                }else{
                    setCaret(title.length)
                }
            }else{
                headerTitleDiv.innerHTML = " "; // If you set it to an empty string you loose the caret. So, insert a spcae to prevent that. 
            }
        }
        currentCalendar.title = title;
        document.querySelector("div[data-calendar-id='" + currentCalendarId + "'] .cal-title").innerHTML = title;
        saveCurrentCalendarAfterDelay();
    }

    /**************************************************************************************/
    function setCaret(newPos){ // http://jsfiddle.net/zer00ne/pLqnsxv2/
        var el = document.querySelector(".editable-title");
        var range = document.createRange();
        var sel = window.getSelection();
        if(typeof el.childNodes[0] !== "undefined") range.setStart(el.childNodes[0], newPos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        el.focus();
    }

    /**************************************************************************************/
    function getCaretCharacterOffsetWithin(element){ // https://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
        var caretOffset = 0;
        var doc = element.ownerDocument || element.document;
        var win = doc.defaultView || doc.parentWindow;
        var sel;
        if(typeof win.getSelection !== "undefined"){
            sel = win.getSelection();
            if(sel.rangeCount > 0){
                var range = win.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }
        }else if( (sel = doc.selection) && sel.type != "Control"){
            var textRange = sel.createRange();
            var preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        return caretOffset;
    }

    /**************************************************************************************/
    function setupSpinner(){
        spinner = new Spin.Spinner({
            lines: 14, // The number of lines to draw
            length: 38, // The length of each line
            width: 17, // The line thickness
            radius: 45, // The radius of the inner circle
            scale: 0.1, // Scales overall size of the spinner
            corners: 1, // Corner roundness (0..1)
            color: '#ffffff', // CSS color or array of colors
            fadeColor: 'transparent', // CSS color or array of colors
            speed: 1, // Rounds per second
            rotate: 0, // The rotation offset
            animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
            direction: 1, // 1: clockwise, -1: counterclockwise
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            className: 'spinner', // The CSS class to assign to the spinner
            top: '50%', // Top position relative to parent
            left: '50%', // Left position relative to parent
            shadow: '0 0 1px transparent', // Box-shadow for the lines
            position: 'absolute' // Element positioning
        }).spin(spinElement);
        hideSpinner();
    }

    /**************************************************************************************/
    function showSpinner(){
       spinner.spin(spinElement);
    }

    /**************************************************************************************/
    function hideSpinner(){
       spinner.stop();
    }

//#endregion

//***************************************************************************************
//* Display Calendar Board Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function renderBoard(){
        document.querySelector(".year-text").innerHTML = currentCalendar.lastYearViewed;
        board.innerHTML = "";  
        // Render the bolts along the sides of the board. 
        for(var i = 0; i < 5; i++){ // 5 bolts down the sides of the board.
            for(var j = 0; j < 4; j++){ // 4 bolts across the top of the board. 
                // i == 0 do the bolts across the top.
                // i == 4 do the bolts across the bottom.
                // c == 0 do the bolts along the left side.
                // c == 3 do the bolts along the right side. 
                if(i == 0 || i == 4 || j == 0 || j == 3){   
                    // class, x, y, parent
                    // start at 23 px for both x, y so the bolts are not on the side of the board. 
                    // add 186 px horizontally between each of the bolts on the top. 4 * 186 across between to the bolts on the sides.  
                    // add 235 px vertically between each of the bolts on the top.  4 * 235 pxs vertically between to the bolts on the top and bottom.  
                    addBoardElement("bolt", 23 + j * 186, 23 + i * 235);
                }
            }
        }

        // Render month labels
        var creationMonth = creationDate.getMonth();
        for(var i = 0; i < 12; i++){
            // class mon for the month.
            // start at least 49 px from the side. have a constatnt 57 px from the top of the board.
            var div = addBoardElement("mon", 49 + i * 44, 57); 
            // in sprite.png each month is 24px in height. 
            // so - 80 is to move the image past the first few images to the jan image. then it moves down 24 px for each month.
            div.style.backgroundPositionY = -80 - i * 24 + "px"; 
            div.setAttribute("data-month", i); 
            if(i < creationMonth) div.classList.add("before-creation");
        }

        for(var index in weekdays){
            var weekdayDiv = addBoardElement("weekday-label", 54 + (80 * index), 88); 
            weekdayDiv.innerHTML = weekdays[index];
        }

        renderCells();
        addMonthTooltips();
    }

    /**************************************************************************************/
    function renderCells(){
        var date = new Date(currentCalendar.lastYearViewed, 0, 1); // Get the 0th month and first day of the last viewed calendar. 
        var creationTime = creationDate.getTime();
        var dayBeforeCreation = creationTime - 86400000; // 24 * 60 * 60 * 1000
        var now = new Date();
        var i = 0;
        while(date.getFullYear() == currentCalendar.lastYearViewed){ // loop though all the days of that year. 
            var mon = date.getMonth();
            var day = date.getDate()-1; // -1 so the math works out.
            var weekday = date.getDay();
            var time = date.getTime();

            // cells start 82 px down from the top of the board. (giving room for the months titles. which start at 57 and take up 24 px so 81 px. )
            // and move 28 more px down for each day. (so day 1 is at 82 + 0 *28 px down.) since the day is decremented when this function is called. 
            var y = 82 + day * 28;
            var x = 49 + mon * 44;

            // the dots are the third item in sprits.png they are in between the day hexicons. 
            if(day){ // stops it from adding dots for the first row 
                var dots = addBoardElement("dots", x, y - 5); // -5 to move the dots to below the last day hexicon.    // not sure how it does not do it for the last day in the month yet.
                dots.setAttribute("data-index", i); 
                dots.setAttribute("data-year-pos", x+":"+(y-5));
                if(time < creationTime) dots.classList.add("before-creation");
            }

            var dim = addBoardElement("dim", x, y);
            dim.innerHTML = day + 1; // set the contents of the created div to be day + 1 since the day had a -1 when it was called. 
            dim.setAttribute("data-index", i);
            dim.setAttribute("data-year-pos", x+":"+y);
            dim.setAttribute("data-weekday", weekday);
            dim.setAttribute("data-month", mon); 
          
            if(time < dayBeforeCreation) dim.classList.add("before-creation");
            if(time >= dayBeforeCreation && time <= creationTime) creationCellIndex = i;
            if(date.toDateString() == now.toDateString()) todaysCellIndex = i; // Used to calulate the current streak.
            date.setDate(date.getDate() + 1); // Advance the date by one day. 
            i++;
        }
        totalCellsInYear = i-1;
    }

    /**************************************************************************************/
    function addBoardElement(cls, x, y, parent){
        var div = document.createElement("div");
        div.className = cls;  
        div.style.left = x + "px";
        div.style.top = y + "px";
        (parent || board).appendChild(div);
        return div;
    }

    /**************************************************************************************/
    function showHideDaysBeforeDate(){
        frame.classList.remove("hide-days-before-creation");
        if(currentCalendar.hideDaysBeforeCreation){           
            var creationYear = creationDate.getFullYear();
            var creationMonth = creationDate.getMonth();
            if(currentCalendar.lastYearViewed == creationYear && config.lastMonthViewed < creationMonth){
                config.lastMonthViewed = creationMonth;
                if(config.monthview) dislpayMonthView();
            }
            if(currentCalendar.lastYearViewed < creationYear) setRenderedYear(creationYear); 
            if(creationYear == currentCalendar.lastYearViewed) frame.classList.add("hide-days-before-creation");
        }
    }

//#endregion

//***************************************************************************************
//* State and Save Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function loadBoardState(thisState){
        document.querySelectorAll(".dim").forEach(function(item){
            if(getLitStateBit(thisState, parseInt(item.getAttribute("data-index")))){
                item.classList.add("lit");
            }else{
                item.classList.remove("lit");
            }
        });
    }

    /**************************************************************************************/
    function clearBoardState(){
        document.querySelectorAll(".dim").forEach(function(item){
            item.classList.remove("lit");        
        });
    }

    /**************************************************************************************/
    // state is an array of 61 six-bit integers that represents
    // up to 366 days of progress. Each year's state is serialized as
    // 61 printable characters ranging from "*" to "i".
    function encodeState(currentState){
        currentCalendar.states[currentCalendar.lastYearViewed] = currentState.reduce(function(s, v){
            return s + String.fromCharCode(42 + v);
        }, "");
        saveCurrentCalendarAfterDelay();
    }

    /**************************************************************************************/
    function decodeState(encoded){
        var state = []; // 61 chars 
        for(var i = 0; i < 61; i++){ // * is 42   i is 105.
            var char = (encoded && encoded.charCodeAt(i)) || 0; // if storage exists get the char at the position else use 0;
            state.push(char >= 42 && char < 106 ? char - 42: 0);
        }
        return state;
    }

    /**************************************************************************************/
    function getLitStateBit(state, index){ // index identifies a specific day from 0 to (number of days on board -1).
        return state[index / 6 | 0] & (1 << (index % 6));
    }

    /**************************************************************************************/
    function toggleLitStateBit(state, index) {
        return (state[index / 6 | 0] ^= 1 << (index % 6)) & (1 << (index % 6));
    }

    /**************************************************************************************/
    function showSave(){
        saveIcon.classList.add("saving");
    }

    /**************************************************************************************/
    function hideSave(){
        saveIcon.classList.remove("saving");
    }

    /**************************************************************************************/
    function saveConfig(){
        clearTimeout(saveConfigTimmer);
        saveIcon.classList.remove("waiting-to-save");
        return dbPutDoc(db, "Config", config);
    }

    /**************************************************************************************/
    function saveCurrentCalendar(callback){
        clearTimeout(saveCalendarTimmer);
        saveIcon.classList.remove("waiting-to-save");
        return Promise.resolve(
            dbPutDoc(db, currentCalendar.id, currentCalendar).then(function(){
                if(callback) callback();
            })
        );
    }

    /**************************************************************************************/
    function saveCurrentCalendarAfterDelay(callback){        
        saveIcon.classList.add("waiting-to-save");
        clearTimeout(saveCalendarTimmer);
        saveCalendarTimmer = setTimeout(function(){saveCurrentCalendar(callback)}, 550);
    }

    /**************************************************************************************/
    function saveConfigAfterDelay(){
        saveIcon.classList.add("waiting-to-save");
        clearTimeout(saveConfigTimmer);
        saveConfigTimmer = setTimeout( saveConfig, 1000);
    }

//#endregion

//***************************************************************************************
//* Board Event Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function addListener(event, match, action, check){ // Add one event that can apply all elements witha class.
        document.addEventListener(event, function(event){ 
            if(event.target.matches(match)){  // TypeError: event.target.matches is not a function 
                if(check){
                    if(check(event)) action(event);
                }else{
                    action(event);
                }
            }
        }, {passive: false});
    }

    /**************************************************************************************/
    function toggleCell(e){
        e.preventDefault();
        var cell = e.target;
        var index = parseInt(cell.getAttribute("data-index"));
        toggleLitStateBit(currentState, index) ? cell.classList.add("lit") : cell.classList.remove("lit") 
        encodeState(currentState);
    }

    /**************************************************************************************/
    function renderPreviousYear(){
        setRenderedYear(currentCalendar.lastYearViewed - 1);
    }

    /**************************************************************************************/
    function renderNextYear(){
        setRenderedYear(currentCalendar.lastYearViewed + 1);
    }

    /**************************************************************************************/
    function setRenderedYear(year){
        currentCalendar.lastYearViewed = year;
        renderBoard();  
        currentState = decodeState(currentCalendar.states[currentCalendar.lastYearViewed]); 
        loadBoardState(currentState);  
        if(config.monthview) dislpayMonthView();
        showHideDaysBeforeDate();
        saveConfigAfterDelay();
    }

    /**************************************************************************************/
    function toggleCurrentMonthView(){
        config.monthview = !config.monthview;
        saveConfigAfterDelay();
        config.monthview ? dislpayMonthView() : displayYearView();
    }

    /**************************************************************************************/
    function toggleSpecificMonthView(e){
        e.preventDefault();  
        displaySpecificMonthView( parseInt(e.srcElement.getAttribute("data-month")) );    
    }

    /**************************************************************************************/
    function displaySpecificMonthView(thisMonth, restoreView){
        if(thisMonth != config.lastMonthViewed || !config.monthview || (restoreView && config.monthview) ){
            config.monthview = true;
            config.lastMonthViewed = thisMonth;
            dislpayMonthView();
        }else{
            config.monthview = false;
            displayYearView();
        }
        if(restoreView != true) saveConfigAfterDelay();
    }

    /**************************************************************************************/
    function dislpayMonthView(){
        frame.classList.add("month-view"); // This class shows the day divs. 
        document.querySelector(".month-view-toggle").name = "today-sharp";
        // Change the borders of the months to show what month is being viewed. 
        document.querySelectorAll(".mon").forEach(function(item){
            if(config.lastMonthViewed == (parseInt(item.getAttribute("data-month"))) ){
                item.classList.add("month-view-active-month");
                item.classList.remove("month-view-inactive-month");
            }else{
                item.classList.add("month-view-inactive-month");
                item.classList.remove("month-view-active-month");
            }      
        });

        var dots = document.querySelectorAll(".dots");
        var dotIndex = 0;
        dots.forEach(function(item){
            item.classList.add("hidden");
        }); 
        var thisWeekday = -1;
        var currentCellRow = 0; // index for which weekday top value to use when positioning the cell.
        
        // Position the dots and cells for the month that is being viewed. 
        document.querySelectorAll(".dim").forEach(function(item){
            item.classList.add("hidden");
            if(config.lastMonthViewed == parseInt(item.getAttribute("data-month")) ){
                item.classList.remove("hidden");
                thisWeekday = item.getAttribute("data-weekday");
                var top = 175 + (135 * currentCellRow);
                var left = 58 + (thisWeekday * 78);
                item.style.top = top + "px";
                item.style.left = left + "px";
                item.style.transform = "scale(2)";                        
                if(thisWeekday != 6){ 
                    dots[dotIndex].classList.remove("hidden");
                    dots[dotIndex].style.transform = "rotate(90deg) scale(2)";
                    dots[dotIndex].style.top = top + 10 + "px";
                    dots[dotIndex].style.left = left + 40 + "px";
                    dotIndex++;
                }else{
                    currentCellRow++; // Move down the board for the next cell after adding a cell to saturday.
                }       
            }
        });
        if(thisWeekday != 6) dots[dotIndex-1].classList.add("hidden"); // Remove the dots that appears next to the last cell, if the last cell was not on saturday.
    }

    /**************************************************************************************/
    function displayYearView(){
        document.querySelector(".month-view-toggle").name = "calendar-sharp";
        document.querySelectorAll(".mon").forEach(function(item){
            item.classList.remove("month-view-inactive-month");
            item.classList.remove("month-view-active-month");
        });

        // Reset the styles of the dim cells.
        // need to do this for all of them and not just the lastMonthViewed, because they may have switched from one month to another.
        // So it is this, or doing this in toggleSpecificMonthView before changing lastMonthViewed. 
        document.querySelectorAll(".dim, .dots").forEach(function(item){ 
            item.classList.remove("hidden");
            var positionArray = String(item.getAttribute("data-year-pos")).split(":");
            item.style.left = positionArray[0] + "px";
            item.style.top = positionArray[1] + "px";
            item.style.transform = "";
        });
        frame.classList.remove("month-view"); // Hides the day divs.
    }

    /**************************************************************************************/
    function flipBoard(){
        var inner = document.getElementById("inner");
        config.flipped = !config.flipped;
        config.flipped ? inner.className = "flipped" : inner.className = "";
        saveConfigAfterDelay();
        if(config.flipped) updateCalendarStats();
   }
//#endregion

//***************************************************************************************
//* Back of Board Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function updateCalendarStats(){
        if(new Date().getFullYear() == currentCalendar.lastYearViewed){
            currentStreakDiv.innerHTML = "Current Streak: <span>" + getCurrentStreak() + "</span>";
        }else{
            currentStreakDiv.innerHTML = "";
        }
        longestStreakSpan.innerHTML = getLongestStreak();
        totalLitSpan.innerHTML = getNumberCellsLit();
        percentLitSpan.innerHTML = getPercentCellsLit();
    }

    /**************************************************************************************/
    function getCurrentStreak(){ 
        var streak = 0;
        if(getLitStateBit(currentState, todaysCellIndex)) streak++;
        var i = todaysCellIndex - 1;
        while(i >= 0){
            getLitStateBit(currentState, i) ? streak++ : i = -1;
            i--;
            if(currentCalendar.hideDaysBeforeCreation && i < creationCellIndex && isYearCalendarWasCreated()) break;
        }    
        return streak;
    }
    
    /**************************************************************************************/
    function getLongestStreak(){
        var longestStreak = 0;
        var currentStreak = 0;
        var i = 0;
        if(currentCalendar.hideDaysBeforeCreation && isYearCalendarWasCreated()) i = creationCellIndex;
        for(; i < totalCellsInYear; i++){
            if(getLitStateBit(currentState, i)){
                currentStreak++;
                if(currentStreak > longestStreak) longestStreak = currentStreak;
            }else{
                currentStreak = 0;
            }
        }
        return longestStreak;
    }

    /**************************************************************************************/
    function getNumberCellsLit(){
        var numCellsLit = 0;
        var i = 0;
        if(currentCalendar.hideDaysBeforeCreation && isYearCalendarWasCreated()) i = creationCellIndex;
        for(; i < totalCellsInYear; i++){
            if(getLitStateBit(currentState, i)) numCellsLit++;
        }
        return numCellsLit;
    }

    /**************************************************************************************/
    function getPercentCellsLit(){
        var numCellsLit = 0;
        var totalCells = totalCellsInYear;
        var i = 0;
        if(currentCalendar.hideDaysBeforeCreation && isYearCalendarWasCreated()){
            totalCells-= todaysCellIndex;
            i = todaysCellIndex;
        }
        for(; i < totalCellsInYear; i++){
            if(getLitStateBit(currentState, i)) numCellsLit++;
        }
        return "" + ~~((numCellsLit / totalCells) * 100) + "%";
    }

    /**************************************************************************************/
    function isYearCalendarWasCreated(){
        return new Date().getFullYear() == creationDate.getFullYear();
    }

    /**************************************************************************************/
    function toggleDaysBeforeDate(e){
        currentCalendar.hideDaysBeforeCreation = e.srcElement.checked;
        showHideDaysBeforeDate();
        saveConfigAfterDelay();
        updateCalendarStats();
    }

    /**************************************************************************************/
    function deleteCalendar(){
        Swal.fire({
            title: 'Are you sure?',
            text: 'You want to delete: ' + currentCalendar.title,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if(result.value){
                // Could update the number of calendars in config. It would be possible for it to give multiple calendars the same inital name.
                var previousCalendar = document.querySelector("div[data-calendar-id='" + currentCalendarId + "']").previousElementSibling;
                var previousCalendarId;
                if(previousCalendar) previousCalendarId = previousCalendar.getAttribute("data-calendar-id");
                dbRemoveDoc(db, currentCalendarId).then(function(){
                   return loadCalendarsIntoSidebar();
                }).then(function(){
                    var sidebarDivs = document.querySelectorAll(".cal-div");
                    if(sidebarDivs.length == 0){
                        addNewCalendar();
                    }else if(previousCalendarId){
                        openCalendar(previousCalendarId);
                    }else{
                        openCalendar(sidebarDivs[0].getAttribute("data-calendar-id"));
                    }
                    Swal.fire('Deleted!', currentCalendar.title + " has been deleted!", 'success' );
                })
            }
        })  
    }

    /**************************************************************************************/
    function removeBackgoundImage(){
        var oldImgae = false;
        if(currentCalendar.image.indexOf("ATT_") != -1) oldImgae = currentCalendar.image.replace("ATT_", "");
        setRandomDefaultBackground();
        loadBackgroundImage(currentCalendar.image);
        saveCurrentCalendar().then(function(){
            if(oldImgae != false) dbDeleteAttachment(db, currentCalendarId, oldImgae);
        })    
    }

//#endregion

//***************************************************************************************
//* Drop And Import Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function addMultipleEvents(el, eventArray, callback){
        eventArray.forEach(function(evt){
            el.addEventListener(evt, callback, false);
        });
    }

    /**************************************************************************************/
    function addDragAndDrop(){
        var elem = document.body //  document.querySelector(".dropbox");
        addMultipleEvents(elem,  ["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"], function(e){
            if(!(typeof e.target !== "undefined" && typeof e.target.classList !== "undefined" && e.target.classList.contains("cal-div"))){
                e.preventDefault();
                e.stopPropagation();
            }
        });

        var lastEnter;
        addMultipleEvents(elem, ["dragover", "dragenter"], function(e){
            // Don't show the dropbox, so that the user can drop into sunEditor.
            if(sunEditorClosed() && sortingSidebar != true ){
                fullPageDropBox.classList.add('is-dragover');
                lastEnter = e.target;
            }
        });

        addMultipleEvents(elem,  ["dragleave", "dragend"], function(e){ // "drop"
          if(e.target == lastEnter){
            fullPageDropBox.classList.remove('is-dragover');
          }
        });

        elem.addEventListener("drop", function(e){
            if( !sunEditorClosed() ) return; // They might actidently drop an image on the background instead of sunEditor. 
            var files = e.dataTransfer.files;
            if(files.length > 0){
                var file = files[0];
                var ext = file.name.split(".").pop().toLowerCase();
                if(ext == "png" || ext == "jpg" || ext == "gif"){
                    fullPageDropBox.classList.add("is-uploading");
                    importImg(file);
                }else if(ext == "zip"){
                    fullPageDropBox.classList.add("is-uploading");
                    importCalendarData(file);
                } 
            }
        });

        document.querySelector(".full-page-drop").addEventListener("wheel", function(e){
            e.preventDefault(); // Prevent the user from scrolling on this overlay, and seeing the page behiend it. 
            e.stopPropagation();
        })
    }

    /**************************************************************************************/
    function importAsset(e){
        var input = e.srcElement;
        var ext = input.value.split(".").pop().toLowerCase();
        if(input.files.length > 0){
            if(ext == "png" || ext == "jpg" || ext == "gif"){
                importImg(input.files[0]);
            }else if(ext == "zip"){
                importCalendarData(input.files[0]);
            } 
        }
    }

    /**************************************************************************************/
    function importImg(file){
        document.body.style.backgroundImage = "url("+URL.createObjectURL(file)+")";
        fullPageDropBox.classList.remove("is-uploading", "is-dragover");
        closeModalIfNotSunEditor(); 

        var oldImgae = false;
        if(currentCalendar.image.indexOf("ATT_") != -1 ){ // Could save the current calendar and add the attachments to it at the same time. 
            var currentImage = currentCalendar.image.replace("ATT_", "");
            if(currentImage != file.name) oldImgae = currentImage; // the new image is overwriting the old one, don't want to then delete it.
        }

        currentCalendar.image = "ATT_" + file.name;
        saveCurrentCalendar().then(function(){
            return dbPutAttachment(db, currentCalendarId, file.name, file, file.type)
        }).then(function(){
            if(oldImgae != false) dbDeleteAttachment(db, currentCalendarId, oldImgae);
            var reader = new FileReader(); // Update theimage Gallery to also contain this new background.
            reader.onload = function(){
                var base64Data = reader.result.split(",")[1]    
                addImgToImgGallery(file.name, headerTitleDiv.innerText, file.type, base64Data, -1);
            };
            reader.readAsDataURL(file);
        })
    }

    /**************************************************************************************/
    function importCalendarData(file){ // file.type
        var zip = new JSZip();
        zip.loadAsync(file).then(function(zipContents){
            var entries = Object.keys(zip.files).map(function(name){ // https://github.com/Stuk/jszip/issues/375
                return zip.files[name];
            });
            var files = [];
            for(i in entries){
                if(entries[i].dir == false) files.push(entries[i]);
            }
            var listOfPromises = files.map(function(file){
                var isAttachment = (file.name != "data.json");
                var fileName =  isAttachment ? decodeURIComponent(file.name.split("/")[1]) : "data.json";    
                var asyncMethod = "string";
                if(isAttachment) asyncMethod = "base64";
                return file.async(asyncMethod).then(function(content){
                    return [asyncMethod, fileName, content];
                });
            });

            Promise.all(listOfPromises).then(function(list){
                var docs = [];
                var importDocs; 
                var attachments = {};
                for(var i = 0; i < list.length; i++){
                    var type = list[i][0];
                    var fileName = list[i][1];
                    var data = list[i][2];
                    if(type == "string") importDocs = JSON.parse(data);
                    if(type == "base64"){
                        var delimiterIndex = fileName.indexOf("__");
                        var digest = fileName.slice(0, delimiterIndex);
                        fileName = fileName.slice(delimiterIndex+2);
                        attachments[digest] = {
                            'name': fileName,
                            'type': guessImageMime(data),
                            'data': data
                        } 
                    }    
                }

                for(var id in importDocs.cal){
                    var thisContent = importDocs.cal[id];
                    var thisAttachment = false;
                    if(typeof thisContent.image !== 'undefined' && thisContent.image.indexOf("picsum") == -1){
                        thisAttachment = attachments[thisContent.image];
                        thisContent.image = "ATT_" + thisAttachment.name;
                    }
                    var thisDoc = { _id: id, docContent: thisContent };
                    if(thisAttachment != false){
                        thisDoc._attachments = {
                            [thisAttachment.name]: {
                                "content_type": thisAttachment.type,
                                "data": thisAttachment.data
                            }
                        }
                    }
                   docs.push(thisDoc);
                }

                for(var id in importDocs.notes){
                    var thisContent = importDocs.notes[id];
                    var thisDoc = { _id: id };
                    var docAttachments = false;
                    for(var digest in attachments){
                        var hasAttachment = thisContent.indexOf("{{"+digest+"}}") != -1;
                        if(hasAttachment){
                            var thisAttachment = attachments[digest];
                            if(docAttachments == false) docAttachments = {};
                            var thisTitle = Object.keys(docAttachments).length + "_" + thisAttachment.name;
                            thisContent = thisContent.replace("{{"+digest+"}}", "{{"+thisTitle+"}}");
                            docAttachments[thisTitle] = {
                                "content_type": thisAttachment.type,
                                "data": thisAttachment.data
                            }
                        }
                    }
                    thisDoc["docContent"] = thisContent;
                    if(docAttachments != false) thisDoc._attachments = docAttachments;
                    docs.push(thisDoc);
                }

                dbDelete(db).then(function(){
                    db = getDB(dbName);
                    return dbBulkCreateDoc(db, docs);
                }).then(function(e){
                    return dbGetDoc(db, "Config", defaultConfig)
                }).then(function(response){
                    config = typeof response._rev === "undefined" ? response : response.docContent;
                    config.sidebarOpened ? sidebar.classList.add("opened") : sidebar.classList.remove("opened");
                    config.flipped ? inner.className = "flipped" : inner.className = "";
                    openCalendar(config.lastCalendarOpened);
                    return loadCalendarsIntoSidebar(); 
                }).then(function(){
                    buildImageGaleryContent();
                    closeModalIfNotSunEditor();
                    fullPageDropBox.classList.remove("is-uploading", "is-dragover");
                })
            });                
        });
    }

    /**************************************************************************************/
    function closeModalIfNotSunEditor(){
        if(Swal.isVisible()){
            if(sunEditorClosed()) Swal.close();
        }
    }

    /**************************************************************************************/
    function sunEditorClosed(){
        return typeof editor === "undefined" || typeof editor.core === "undefined";
    }

    /**************************************************************************************/
    function guessImageMime(data){ // https://gist.github.com/nazoking/2822127
        switch(data.charAt(0)){    // https://stackoverflow.com/questions/57976898/how-to-get-mime-type-from-base-64-string
            case '/':
                return "image/jpeg";
            case 'R':
                return "image/gif";
            case 'i':
                return "image/png";
        }
    }

//#endregion

//***************************************************************************************
//*  Note Editor maybe put on back of board functions. Functions
//#region ******************************************************************************/

    /**************************************************************************************/
    function openNotesEditor(){
        Swal.fire({
            width: "80%",
            customClass: 'editor-swal-height',
            padding: '33px',
            html: 
                '<div class="editor-container">\
                    <textarea id="sunEditor"></textarea>\
                </div>',
            showCloseButton: true,
            showConfirmButton: false,
        }).then(function(result){
            if(typeof editor !== "undefined") editor.destroy();
            URL.revokeObjectURL(imgGalleryURL);
        });

        createHTMLTemplates();
        dbGetDoc(db, "Note_" + currentCalendar.id, {"not_found": true}, true).then(function(doc){ 
            var content = "";
            if(!doc.not_found){
                content = doc.docContent;
                var attachments = doc._attachments;
                Object.keys(attachments).forEach(function(attName){
                    var base64 = attachments[attName].data;
                    var base64Image = "data:" + attachments[attName].content_type + ";base64," + base64;
                    content = content.replace("{{"+attName+"}}", base64Image);
                })
            }      
            createEditor(content);
        })
    }

    /**************************************************************************************/  
    function buildImageGaleryContent(){
        return Promise.resolve(
            dbGetAllDocs(db, {include_docs: true, attachments: true}).then(function(res){
                var rows = res.rows;
                for(var i = 0; i < rows.length; i++){
                    var theseAttachments = rows[i].doc._attachments;
                    var id = rows[i].id;
                     for(var imgName in theseAttachments ){
                        var thisAttachment = theseAttachments[imgName];
                        var tempId = id;
                        var thisName = imgName;
                        var isNote = id.indexOf("Note_") == 0;
                        if(isNote){
                            thisName = imgName.slice(2); // slice off the prefix added to the note attachment names.
                            tempId = id.slice(5);
                        }
                        var thisTag = document.querySelector(".cal-div[data-calendar-id='" + tempId + "'] .cal-title").innerHTML; 
                        addImgToImgGallery(thisName, thisTag, thisAttachment.content_type, thisAttachment.data, thisAttachment.digest);
                    }
                }   
                return {ok: true};  
            })
        );
    }

    /**************************************************************************************/
    function imgGalleryHasDigest(thisDigest){
        var hasDigest = false;
        for(var i = 0; i < imgGalleryContent.length; i++){
            if(thisDigest == imgGalleryContent[i].digest){
                hasDigest = true;
                break;
            }
        }
        return hasDigest;
    }

    /**************************************************************************************/
    function imgGalleryHasImage(mime, data){
        var hasImgData = false;
        var img = "data:" + mime + ";base64," + data;
        for(var i = 0; i < imgGalleryContent.length; i++){
            if(img == imgGalleryContent[i].url){
                hasImgData = true;
                break;
            }
        }
        return hasImgData;
    }

    /**************************************************************************************/
    function addImgToImgGallery(name, tag, mime, data, digest){
        if( (!imgGalleryHasDigest(digest) || digest == -1) && !imgGalleryHasImage(mime, data) ){
            imgGalleryContent.push({
                name: name,
                url: "data:" + mime + ";base64," + data,
                digest: digest,
                tag: tag
            });
        }
    }

    /**************************************************************************************/
    function createImageGalleryURL(){
        URL.revokeObjectURL(imgGalleryURL);
        imgGallery = JSON.parse(JSON.stringify(initialImgGallery));
        for(var i = 0; i < imgGalleryContent.length; i++){
            imgGallery.result.push({
                src: imgGalleryContent[i].url,
                name: imgGalleryContent[i].name, 
                tag: imgGalleryContent[i].tag
            });
        }
        var galleryBlob = new Blob([JSON.stringify(imgGallery)], {type: "application/json"});
        imgGalleryURL =  URL.createObjectURL(galleryBlob);
    }

    /**************************************************************************************/
    function createEditor(notesContent){
        createImageGalleryURL();
        editor = SUNEDITOR.create('sunEditor', {
            value: notesContent,      
            placeholder: "Notes for this calendar...",
            imageGalleryUrl: imgGalleryURL,
            buttonList: [
                ['undo', 'redo'],
                ['font', 'fontSize', 'formatBlock'],
                ['paragraphStyle', 'blockquote'],
                ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                ['fontColor', 'hiliteColor', 'textStyle'],
                ['removeFormat'],
                ['outdent', 'indent'],
                ['align', 'horizontalRule', 'list', 'lineHeight'],
                ['table', 'link', 'image', 'video', 'audio'], 
                ['imageGallery'], 
                ['-right',  'fullScreen', 'template', 'save'],
                ['-right', ':i-More Misc-default.more_vertical', 'showBlocks', 'codeView', 'preview', 'print'],

                ['%1855', [
                        ['undo', 'redo'],
                        [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                        ['bold', 'underline', 'italic', 'strike'],
                        [':t-More Text-default.more_text', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle'],
                        ['removeFormat'],
                        ['outdent', 'indent'],
                        ['align', 'horizontalRule', 'list', 'lineHeight'],
                        ['-right', 'save'],
                        ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'template'],
                        ['-right', ':r-More Rich-default.more_plus', 'table', 'link', 'image', 'video', 'audio', 'imageGallery']
                    ]
                ],

                ['%975', [
                    ['undo', 'redo'],
                    [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                    [':t-More Text-default.more_text', 'bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle'],
                    ['removeFormat'],    
                    ['outdent', 'indent'],
                    [':e-More Line-default.more_horizontal', 'align', 'horizontalRule', 'list', 'lineHeight'],

                    ['-right', 'save'],
                    ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'template'],
                    [':r-More Rich-default.more_plus', 'table', 'link', 'image', 'video', 'audio', 'imageGallery']
                ]],

                ['%655', [
                    ['undo', 'redo'],
                    [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                    [':t-More Text-default.more_text', 'bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle', 'removeFormat'],
                    [':e-More Line-default.more_horizontal', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'lineHeight'],
                    ['-right', 'save'],
                    ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'template']
                    [':r-More Rich-default.more_plus', 'table', 'link', 'image', 'video', 'audio', 'math', 'imageGallery'],
                ]]
            ],

            height: '100%',
            width: '100%',
            maxHeight: '60vh',
            minHeight: '60vh',
            charCounter: true,  
            charCounterLabel: "Characters:",
            templates: [
                { name: 'Calendar Year Tables', html: yearTemplate },
                { name: 'Rest of Year Tables', html: restOfYearTemplate },
                { name: 'Current Month Table', html: currentMonthTemplate },
                { name: 'Days after Calendar Created', html: sinceCreationTemplate }
            ],      
            callBackSave: saveEditorContents
        });    
    }

    /**************************************************************************************/
    function saveEditorContents(){
        var attachmentsArray = {};
        var contents = editor.getContents(true);
        var images = editor.getImagesInfo();
        images.forEach(function(img, i){
            var isBase64 = img.src.match(/^data:.*;base64,/) != null;
            if(isBase64){
                // could use regex to check if valid. /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/ https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
                var type = img.src.split(";")[0].split(":")[1];
                var base64 = img.src.split(",")[1];  
                // Prefix the attachment name with i_ to allow for multiple attachments with the same name.
                // If the same image is in the note twice it will save the image with two diffrent names, but under the hood pouchDB will only store the image data once.
                var attachmentName = i + "_" + img.name;
                attachmentsArray[attachmentName] = {
                    "content_type": type,
                    "data": base64
                }    
                contents = contents.replace(img.src, "{{" + attachmentName + "}}");  
                addImgToImgGallery(img.name, headerTitleDiv.innerText, type, base64, -1);
            }
        })
        var noteId = "Note_" + currentCalendar.id;
        dbPutDoc(db, noteId, contents).then(function(){
          return dbBulkPutAttachments(db, noteId, attachmentsArray, true)
        }).then(function(){ // Rebuild the editor so the image gallery has any new images. 
            if(images.length > 0){ // Not sure if it is worth destroying the editor like this.
                createImageGalleryURL();
                var currentContent = editor.getContents(true);
                editor.destroy();
                createEditor(currentContent);
            }
        })
    }

    /**************************************************************************************/
    function createHTMLTemplates(){
        yearTemplate = "";
        currentMonthTemplate = "";
        var monthTables = [];
        var now = new Date();
        var currentMonth = now.getMonth();

        var date = new Date(currentCalendar.lastYearViewed, 0, 1);
        while(date.getFullYear() == currentCalendar.lastYearViewed){ // Get a table for each month 
            monthTables.push(getMonthTableHTML(date));
        }

        // Create a template for the days of the year. 
        for(var i in monthTables){
            yearTemplate += monthTables[i];
            yearTemplate += "<p><br></p>";
        }
        
        // create a template for the days left in the year. 
        var restOfMonthHTML = getMonthTableHTML(now);
        restOfYearTemplate = restOfMonthHTML;
        restOfYearTemplate += "<p><br></p>";
        for(var i = currentMonth+1; i < 12; i++){
            restOfYearTemplate += monthTables[i];
            restOfYearTemplate += "<p><br></p>";
        }

        currentMonthTemplate = monthTables[currentMonth]; // Template for just this month. 

        // Temlpate for the days since creation. assuming that it is the creation year. 
        var tempDate = new Date(creationDate.getTime());
        var creationMonthHTML = getMonthTableHTML(tempDate);
        sinceCreationTemplate = creationMonthHTML;
        sinceCreationTemplate += "<p><br></p>";
        for(var i = creationDate.getMonth()+1; i < 12; i++){
            sinceCreationTemplate += monthTables[i];
            sinceCreationTemplate += "<p><br></p>";
        }
    }

    /**************************************************************************************/
    function getMonthTableHTML(date){
        var mon = date.getMonth();
        var tableHTML =
        '<table class="se-table-size-auto">\
            <thead>\
                <tr>\
                <td colspan="7" rowspan="1">\
                    <div><div style="text-align: center;">';
        tableHTML += monthNames[mon];
        tableHTML +=
                    '</div></div>\
                </td>\
            </tr>\
        </thead>';
        tableHTML+= 
        "<tbody>\
            <tr>\
                <td><div>Sunday</div></td>\
                <td><div>Monday</div></td>\
                <td><div>Tuesday</div></td>\
                <td><div>Wednesday</div></td>\
                <td><div>Thursday</div></td>\
                <td><div>Friday</div></td>\
                <td><div>Saturday</div></td>\
            </tr>";

        var cellCount = 0; 
        while(mon == date.getMonth()){
            cellCount %= 7;
            if(cellCount == 0) tableHTML+= "<tr>";

            if(cellCount != date.getDay()){
                tableHTML += "<td><div><br></div></td>";
            }else{
                tableHTML += "<td><div>" + date.getDate() + "</div> <div><br></div>";
                date.setDate(date.getDate() + 1);
            }
            if(cellCount % 7 == 6) tableHTML+= "</tr>";
            cellCount++;
        }

        while(cellCount % 7 !=  0){
            tableHTML += "<td><div><br></div></td>";
            if(cellCount % 7 == 6) tableHTML+= "</tr>";
            cellCount++;
        }

        tableHTML += "</tbody></table>";
        return tableHTML;
    }

//#endregion

NodeList.prototype.forEach = Array.prototype.forEach;
