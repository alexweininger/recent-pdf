/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>
let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let pinnedList: HTMLUListElement = <HTMLUListElement>document.getElementById('pinned-list'); // online file list
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('online-tab-link');
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('local-tab-link');
let pinnedTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('pinned-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
var head = document.getElementsByTagName('HEAD')[0];
let currentTab: Tab;

var _ = require('lodash');

enum Tab {
    Local = 'local',
    Online = 'online',
    Pinned = 'pinned'
}

window.browser = (function () {
    return window.browser || window.chrome;
})();

if (onlineTabLink) {
    // event handlers for tab buttons
    onlineTabLink.addEventListener('click', function (event: Event) {
        onlineFooter(onlinePdfCount);
        openTab(event, Tab.Online);
        currentTab = Tab.Online;
    });
} else {
    console.error('onlineTabLink is null');
}

// click listener for local pdf tab
if (localTabLink) {
    localTabLink.addEventListener('click', function (event: Event) {
        localFooter(localPdfCount);
        openTab(event, Tab.Local);
        currentTab = Tab.Local;
    });
} else {
    console.error('localTabLink is null');
}

// click listener for pinned pdf tab
if (pinnedTabLink) {
    pinnedTabLink.addEventListener('click', function (event: Event) {
        pinnedPdfCount = 0;
        searchPinned();
        pinnedFooter(pinnedPdfCount);
        openTab(event, Tab.Pinned);
        currentTab = Tab.Pinned;
    });
} else {
    console.error('localTabLink is null');
}

// settings click listener
settingsTabLink.addEventListener('click', function () {
    window.browser.runtime.openOptionsPage();
});

searchHistory();
searchDownloads();
searchPinned();

let onlinePdfCount: number = 0; // number of online pdf files
/**
 * searchHistory() - searches history using the chrome.history api for online pdf files
 */
function searchHistory() {
    window.browser.history.search(
        {
            text: '.pdf', // search for .pdf
            maxResults: 10000
        },
        function (data: chrome.history.HistoryItem[]) {
            data.forEach(function (page: chrome.history.HistoryItem) {
                // for each result
                if (page.url.endsWith('.pdf') || page.url.endsWith('.PDF')) {
                    // check if page is a .pdf
                    let listItem: HTMLLIElement = document.createElement('li');
                    listItem.classList.add('list-item');

                    if (!page.url.startsWith('file:')) {
                        // if not local pdf
                        onlinePdfCount++;

                        let leftDiv: HTMLDivElement = document.createElement('div');
                        let rightDiv: HTMLDivElement = document.createElement('div');
                        leftDiv.classList.add('list-div', 'left');
                        rightDiv.classList.add('list-div', 'right');

                        // make title element
                        let title: HTMLParagraphElement = document.createElement('p');
                        title.classList.add('link-title');
                        title.classList.add('local-title');
                        let URI = decodeURI(page.url);
                        title.innerText = URI.substring(URI.lastIndexOf('/') + 1, page.url.length - 4);

                        // make url element
                        let linkUrl: HTMLParagraphElement = document.createElement('p');
                        linkUrl.classList.add('link-url');
                        linkUrl.innerHTML = decodeURI(page.url)
                            .substring(0, 50)
                            .replace(' ', '');

                        // make icon element
                        let icon: HTMLImageElement = document.createElement('img');
                        icon.classList.add('link-thumb');
                        icon.src = `chrome://favicon/${page.url}`;

                        // add pin button
                        let pin: HTMLImageElement = document.createElement('img');
                        pin.id = 'pin_icon_online';
                        pin.src = '../../assets/thumbtack-solid.svg';
                        pin.addEventListener('click', function (n) {
                            chrome.storage.local.get(['recentpdfPinned'], function(result){
                                

                                // If storage has not been used before, create object. Otherwise push to existing object.
                                if(Object.keys(result).length === 0 && result.constructor === Object) {
                                    chrome.storage.local.set({'recentpdfPinned': [{'icon': icon.src, 'title': title.innerText, 'url': page.url, 'isLocal': false}]});
                                } else {
                                    result.recentpdfPinned.push({'icon': icon.src, 'title': title.innerText, 'url': page.url, 'isLocal': false})
                                    chrome.storage.local.set({recentpdfPinned: result.recentpdfPinned});
                                }
                                
                            });
                        });

                        // append elements to left div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        //append pin button
                        rightDiv.appendChild(pin);

                        // on click listener
                        leftDiv.addEventListener('click', function () {
                            window.open(page.url);
                        });
                        
                        // append to list item
                        listItem.appendChild(leftDiv);
                        listItem.appendChild(rightDiv);
                        // append list item to online list
                        onlineList.appendChild(listItem);
                    }
                }
            });

            console.log(`${pinnedPdfCount} pinned PDFs found.`);
            updateFooter();
        }
    );
}

let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
const maxFilesDefaultValue: number = 30; // default number of files to show in case of missing/invalid setting

/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads() {

    window.browser.downloads.search(
        {
            limit: 0,
            orderBy: ['-startTime'],
            filenameRegex: '^(.(.*\.pdf$))*$'
        },
        async function (data: chrome.downloads.DownloadItem[]) {
            if (data.length == 0) {
                searchDownloads();
                return;
            }
            const maxFilesToShow = await getMaxFilesValue()
            console.log('found ' + data.length + ' local pdfs');
            let winos = navigator.appVersion.indexOf('Win');
            let slashType = winos !== -1 ? '\\' : '/';
            data.forEach(function (file: chrome.downloads.DownloadItem, i: number) {
                // for each result
                console.log('TCL: searchDownloads -> i', i);
                if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) {
                    // check if file ends with .pdf or .PDF
                    if (localFiles.indexOf(file.filename) === -1 && localPdfCount < maxFilesToShow) {
                        // check for duplicated and maxFilesToShow value
                        localFiles.push(file.filename);
                        localPdfCount++;

                        let leftDiv: HTMLDivElement = document.createElement('div');
                        let rightDiv: HTMLDivElement = document.createElement('div');
                        leftDiv.classList.add('list-div', 'left');
                        rightDiv.classList.add('list-div', 'right');

                        // create local file list item
                        let fileItem: HTMLLIElement = document.createElement('li');
                        fileItem.classList.add('list-item', 'file-item');

                        // create icon element
                        let icon: HTMLImageElement = document.createElement('img');
                        icon.classList.add('link-thumb');
                        window.browser.downloads.getFileIcon(file.id, { size: 16 }, iconUrl => {
                            icon.src = iconUrl;
                        });

                        // create title element
                        let title: HTMLParagraphElement = document.createElement('p');
                        title.classList.add('link-title');
                        title.classList.add('local-title');
                        title.innerText = file.filename.substring(file.filename.lastIndexOf(slashType) + 1, file.filename.length - 4);

                        // create file url element
                        let linkUrl: HTMLParagraphElement = document.createElement('p');
                        linkUrl.classList.add('link-url');
                        linkUrl.innerHTML = file.filename.substring(0, 50);

                        // add pin button
                        let pin: HTMLImageElement = document.createElement('img');
                        pin.id = 'pin_icon_local';
                        pin.src = '../../assets/thumbtack-solid.svg';
                        pin.addEventListener('click', function (n) {
                            chrome.storage.local.get(['recentpdfPinned'], function(result){
                                // If storage has not been used before, create object. Otherwise push to existing object.
                                if(Object.keys(result).length === 0 && result.constructor === Object) {
                                    chrome.storage.local.set({'recentpdfPinned': [{'icon': icon.src, 'title': title.innerText, 'url': linkUrl.innerHTML, 'isLocal': true}]});

                                } else {
                                    result.recentpdfPinned.push({'icon': icon.src, 'title': title.innerText, 'url': linkUrl.innerHTML, 'downloadID': file.id, 'isLocal': true})
                                    chrome.storage.local.set({recentpdfPinned: result.recentpdfPinned});
                                }
                                
                            });
                        });
                        
                        // append elements to div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener('click', function () {
                            window.browser.downloads.open(file.id);
                        });

                        // open in file explorer button
                        let more: HTMLImageElement = document.createElement('img');
                        more.id = 'more_icon';
                        more.src = '../../assets/More.png';
                        more.addEventListener('click', function () {
                            window.browser.downloads.show(file.id);
                        });

                        rightDiv.appendChild(more);
                        rightDiv.appendChild(pin);
                        fileItem.appendChild(leftDiv);
                        fileItem.appendChild(rightDiv);
                        fileElement.appendChild(fileItem);
                    } else {
                        // console.log(`[INFO] skipped duplicate file: ${file.filename}.`);
                    }
                }
            });

            console.log(`[INFO] ${localPdfCount} local PDFs found.`);
            updateFooter();
        }
    );
}

// Search through the pinned items array stored in chrome.storage.local
let pinnedPdfCount: number = 0;
function searchPinned() {
    while (pinnedList.firstChild) {
        pinnedList.removeChild(pinnedList.firstChild);
    }
    chrome.storage.local.get(['recentpdfPinned'], function (result) {
        // iterate over the array inside the storage object
        result.recentpdfPinned.forEach(function (page: any) {
            let listItem: HTMLLIElement = document.createElement('li');
            listItem.classList.add('list-item');

            pinnedPdfCount++;

            let leftDiv: HTMLDivElement = document.createElement('div');
            let rightDiv: HTMLDivElement = document.createElement('div');
            leftDiv.classList.add('list-div', 'left');
            rightDiv.classList.add('list-div', 'right');

            // make title element
            let title: HTMLParagraphElement = document.createElement('p');
            title.classList.add('link-title');
            title.classList.add('local-title');
            title.innerText = page.title;

            // make url element
            let linkUrl: HTMLParagraphElement = document.createElement('p');
            linkUrl.classList.add('link-url');
            linkUrl.innerHTML = decodeURI(page.url)
                .substring(0, 50)
                .replace(' ', '');

            // make icon element
            let icon: HTMLImageElement = document.createElement('img');
            icon.classList.add('link-thumb');
            icon.src = page.icon;

            // add remove button
            let trash: HTMLImageElement = document.createElement('img');
            trash.id = 'remove_icon';
            trash.src = '../../assets/trash-solid.svg';
            trash.addEventListener('click', function (n) {
                chrome.storage.local.get(['recentpdfPinned'], function(result){
                    let arr: Array<any> = result.recentpdfPinned;
                    // iterate over items and check if objects match to get the id
                    for (var i = 0; i < arr.length; i++) {
                        if(_.isEqual(arr[i], page)) {
                            // remove the object from the array
                            arr.splice(i, 1);
                        }
                    }
                    // push the array back to the storage object
                    chrome.storage.local.set({recentpdfPinned: result.recentpdfPinned});
                    // reload the view
                    searchPinned();
                });
            });

            // append elements to left div
            leftDiv.appendChild(icon);
            leftDiv.appendChild(title);
            leftDiv.appendChild(linkUrl);

            // append remove button to right div
            rightDiv.appendChild(trash);

            // on click listener
            leftDiv.addEventListener('click', function () {
                if(page.isLocal==true) {
                    window.browser.downloads.open(page.downloadID);
                } else {
                    window.open(page.url);
                }
            });

            // append to list item
            listItem.appendChild(leftDiv);
            listItem.appendChild(rightDiv);
            // append list item to online list
            pinnedList.appendChild(listItem);
        });
        updateFooter();
    });

    
}

function updateFooter() {
    if (currentTab == Tab.Local) {
        localFooter(localPdfCount);
    } else if (currentTab == Tab.Online) {
        onlineFooter(onlinePdfCount);
    } else {
        pinnedFooter(pinnedPdfCount);
    }
}

// load and create the online pdf footer
function onlineFooter(count: number) {
    let plural: string = count != 1 ? 's' : '';
    let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
    countDisplay.innerHTML = `Showing ${count} online PDF${plural}.`;
}

// load and create the local file footer
function localFooter(count: number) {
    let plural: string = count != 1 ? 's' : '';
    let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
    countDisplay.innerHTML = `Showing ${count} local PDF${plural}.`;
}

// load and create the pinned file footer
function pinnedFooter(count: number) {
    let plural: string = count != 1 ? 's' : '';
    let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
    countDisplay.innerHTML = `Showing ${count} pinned PDF${plural}.`;
}

// function that handles switching between tabs
function openTab(evt: any, tab: Tab) {
    // Find active elements and remove active class from elements
    const activeElements: NodeListOf<Element> = <NodeListOf<Element>>document.querySelectorAll('.active');
    activeElements.forEach(function (elem: HTMLElement) {
        elem.classList.remove('active');
    });

    // Add active class to tab and pressed button
    const tabContent: HTMLElement = <HTMLElement>document.querySelector(`.tabcontent#${tab}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    evt.currentTarget.classList.add('active');
    currentTab = tab;
}


async function getOption(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
        window.browser.storage.sync.get(name, (result: any) => {
            if (result) {
                console.log('getOption', result);
                resolve(result);
            }
            reject(`Error in loading option ${name}`);
        })
    });
}

async function getMaxFilesValue() {
    const result = await getOption('general.maxFilesToShow');
    let maxFilesValue = result['general.maxFilesToShow'];
    if (maxFilesValue && Number.isInteger(parseInt(maxFilesValue))) {
        return parseInt(maxFilesValue);
    }
    return maxFilesDefaultValue;
}

async function loadOptions() {
    let result = await getOption('general.defaultTab')
    let result2 = await getOption('general.colorTheme')
    let defaultTab = result['general.defaultTab'];
    if (defaultTab) {
        if (defaultTab == 'Online files') {
            onlineTabLink.click();
            console.log('clicked online tab link');

        } else if (defaultTab == 'Local files') {
            localTabLink.click();
            console.log('clicked local tab link');
        } else {
            localTabLink.click();
            console.log('loaded defaults');
        }
    } else {
        localTabLink.click();
    }
    let colorTheme = result2['general.colorTheme'];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    if (colorTheme) {
        if (colorTheme == 'Light') {
            link.href = 'style.css';
        } else if (colorTheme == 'Dark') {
            link.href = 'style_dark_mode.css';
        } else {
            link.href = 'style.css';
        }
    } else {
        link.href = 'style.css';
    }
    head.appendChild(link);
}

loadOptions();