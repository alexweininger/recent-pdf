/** Script.js
 *
 * Contains the main program logic for recent-pdf
 *  - loads pdf files from downloads api
 *
 *  author: Alex Weininger
 *  last modified: 9/24/2018
 */

 getDownloads();

let localPdfCount = 0;
let onlineCount = 0;

// online file list
let onlineList = document.getElementById('link-list');

// offline (local) file list
let fileElement = document.getElementById('file-list');

let maxLocalFilesPerPage = 11; // setting; set to 11 by default

// load the user settings
loadSettings();

searchHistory();

function searchHistory() {
    chrome.history.search({
        text: '.pdf',
        maxResults: 10000
    }, function (data) {

        data.forEach(function (page) {

            if (page.url.endsWith('.pdf')) { // check if page is a .pdf

                let listItem = document.createElement('li');
                listItem.classList.add('list-item');

                if (!page.url.startsWith('file:')) {
                    onlineCount++;

                    let leftDiv = document.createElement('div');
                    let rightDiv = document.createElement('div');
                    leftDiv.classList.add('list-div', 'left');
                    rightDiv.classList.add('list-div', 'right');

                    let title = document.createElement('p');
                    title.classList.add('link-title');
                    title.innerText = decodeURI(page.url).substring(
                        page.url.lastIndexOf('/') + 1, page.url.length - 4);

                    let linkUrl = document.createElement('p');
                    linkUrl.classList.add('link-url');
                    linkUrl.innerHTML =
                        decodeURI(page.url).substring(0, 50).replace(' ', '');

                    let icon = document.createElement('img');
                    icon.classList.add('link-thumb');
                    icon.src = `chrome://favicon/${page.url}`;

                    leftDiv.appendChild(icon);
                    leftDiv.appendChild(title);
                    leftDiv.appendChild(document.createElement('br'));
                    leftDiv.appendChild(linkUrl);

                    leftDiv.addEventListener('click',
                        function () {
                            window.open(page.url);
                        });

                    listItem.appendChild(leftDiv);
                    listItem.appendChild(rightDiv);
                    onlineList.appendChild(listItem);
                }
            }
        });

        searchDownloads();
        console.log(`${onlineCount} online PDFs found.`);
    });
}

let localFiles = [];

function searchDownloads() {
    chrome.downloads.search({
        limit: 1000,
        orderBy: ['-startTime']
    }, function (
        data) {
        data.forEach(function (file, i) {
            if (file.filename.endsWith('.pdf')) {
                if (!localFiles.includes(file.filename) &&
                    localPdfCount < maxLocalFilesPerPage) {
                    localFiles.push(file.filename);


                    localPdfCount++;

                    let leftDiv = document.createElement('div');
                    let rightDiv = document.createElement('div');
                    leftDiv.classList.add('list-div', 'left');
                    rightDiv.classList.add('list-div', 'right');

                    let fileItem = document.createElement('li');
                    fileItem.classList.add('list-item', 'file-item');

                    let icon = document.createElement('img');
                    icon.classList.add('link-thumb');
                    chrome.downloads.getFileIcon(
                        file.id, {
                            size: 16
                        },
                        function (iconUrl) {
                            icon.src = iconUrl;
                        });

                    let title = document.createElement('p');
                    title.classList.add('link-title');
                    title.innerText = file.filename.substring(
                        file.filename.lastIndexOf('\\') + 1, file.filename.length - 4);

                    let linkUrl = document.createElement('p');
                    linkUrl.classList.add('link-url');
                    linkUrl.innerHTML =
                        file.filename.substring(0, file.filename.lastIndexOf('\\') + 1);

                    leftDiv.appendChild(icon);
                    leftDiv.appendChild(title);
                    leftDiv.appendChild(document.createElement('br'));
                    leftDiv.appendChild(linkUrl);

                    leftDiv.addEventListener(
                        'click',
                        function () {
                            chrome.downloads.open(file.id);
                        });

                    let more = document.createElement('img');
                    more.id = 'more_icon';
                    more.src = '../../assets/More.png';
                    more.addEventListener('click',
                        function () {
                            chrome.downloads.show(file.id);
                        });

                    rightDiv.appendChild(more);

                    fileItem.appendChild(leftDiv);
                    fileItem.appendChild(rightDiv);
                    fileElement.appendChild(fileItem);
                } else {
                    //console.log(`[INFO] skipped duplicate file: ${file.filename}.`);
                }
            }
        });

        //console.log(`[INFO] ${localPdfCount} local PDFs found.`);

        loadSettings();
        footer(2);
    });
}

function footer(count) {
    let plural = (count > 1 ? 's' : '');

    let footerDivs = document.getElementsByClassName('footer');
    let footerLeft = document.getElementById('footer-left');

    let countDisplay = document.createElement('p');
    countDisplay.id = 'count-display';
    countDisplay.innerHTML = 'placeholder for count display';

    footerLeft.appendChild(countDisplay);

    let settingsIcon;
    for (e of footerDivs) {
        console.log(e);
    }
}

function localFooter() {
    let plural = (localPdfCount > 1 ? 's' : '');

    let localFooter = document.createElement('p');
    localFooter.innerHTML =
        `Showing ${localPdfCount} locally saved PDF${plural}.`;
    localFooter.classList.add('footer');
    localFooter.id = 'local-footer';
    fileElement.appendChild(localFooter);
}

// tab buttons
let onlineTabLink = document.getElementById('online-tab-link');
let localTabLink = document.getElementById('local-tab-link');
let settingsTabLink = document.getElementById('settings-link');

// event handlers for tab buttons
onlineTabLink.addEventListener('click',
    function () {
        openTab(event, 'online');
    });

localTabLink.addEventListener('click', function () {
    openTab(event, 'local');
});

settingsTabLink.addEventListener(
    'click',
    function () {
        open('../options/options.html');
    });

onlineTabLink.click();

// function that handles switching between tabs
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }
    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    document.getElementById(tabName).style.display = 'inline-block';
    evt.currentTarget.className += ' active';
}

// function that loads the settings from the options.js script
function loadSettings() {
    chrome.storage.sync.get(['savedTab', 'filesPerPage'], function (result) {
        console.log(result);
        if (result.savedTab) {
            document.getElementById('online-footer').style = 'color: red';
        }

        if (result.filesPerPage) {
            maxLocalFilesPerPage = result.filesPerPage;
        }
    });
}