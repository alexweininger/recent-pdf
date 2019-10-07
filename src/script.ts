/// <reference path='../node_modules/@types/chrome/index.d.ts'/>

let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('online-tab-link');
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('local-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
let currentTab: Tab;

enum Tab {
    Local = 'local',
    Online = 'online'
}
// tab buttons

if (onlineTabLink) {
    // event handlers for tab buttons
    onlineTabLink.addEventListener('click', function(event: Event) {
        onlineFooter(onlinePdfCount);
        openTab(event, Tab.Online);
        currentTab = Tab.Online;
    });
} else {
    console.error('onlineTabLink is null');
}

// click listener for local pdf tab
if (localTabLink) {
    localTabLink.addEventListener('click', function(event: Event) {
        localFooter(localPdfCount);
        openTab(event, Tab.Local);
        currentTab = Tab.Local;
    });
} else {
    console.error('localTabLink is null');
}

// settings click listener
settingsTabLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});

searchHistory();
searchDownloads();

let onlinePdfCount: number = 0; // number of online pdf files
/**
 * searchHistory() - searches history using the chrome.history api for online pdf files
 */
function searchHistory() {
    chrome.history.search(
        {
            text: '.pdf', // search for .pdf
            maxResults: 10000
        },
        function(data: chrome.history.HistoryItem[]) {
            data.forEach(function(page: chrome.history.HistoryItem) {
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
                        title.innerText = decodeURI(page.url).substring(page.url.lastIndexOf('/') + 1, page.url.length - 4);

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

                        // append elements to left div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener('click', function() {
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

            console.log(`${onlinePdfCount} online PDFs found.`);
            updateFooter();
        }
    );
}

let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads() {

    chrome.downloads.search(
        {
            limit: 0,
            orderBy: ['-startTime'],
            filenameRegex: '^(.(.*\.pdf$))*$'
        },
        function(data: chrome.downloads.DownloadItem[]) {
            if (data.length == 0) {
                searchDownloads();
                return;
            }
            console.log(data.length + ' local PDFs found.');
            data.forEach(function(file: chrome.downloads.DownloadItem, i: number) {
                // for each result
                console.log('TCL: searchDownloads -> i', i);
                if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) {
                    // check if file ends with .pdf or .PDF
                    if (localFiles.indexOf(file.filename) === -1 && localPdfCount < 30) {
                        // check for duplicated and max of 30 files
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
                        chrome.downloads.getFileIcon(file.id, { size: 16 }, iconUrl => {
                            icon.src = iconUrl;
                        });

                        // create title element
                        let title: HTMLParagraphElement = document.createElement('p');
                        title.classList.add('link-title');
                        title.classList.add('local-title');
                        title.innerText = file.filename.substring(file.filename.lastIndexOf('\\') + 1, file.filename.length - 4);

                        // create file url element
                        let linkUrl: HTMLParagraphElement = document.createElement('p');
                        linkUrl.classList.add('link-url');
                        linkUrl.innerHTML = file.filename.substring(0, 50);

                        // append elements to div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener('click', function() {
                            chrome.downloads.open(file.id);
                        });

                        // open in file explorer button
                        let more: HTMLImageElement = document.createElement('img');
                        more.id = 'more_icon';
                        more.src = '../../assets/More.png';
                        more.addEventListener('click', function() {
                            chrome.downloads.show(file.id);
                        });

                        rightDiv.appendChild(more);
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

function updateFooter() {
    if (currentTab == Tab.Local) {
        localFooter(localPdfCount);
    } else {
        onlineFooter(onlinePdfCount);
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

// function that handles switching between tabs
function openTab(evt: any, tab: Tab) {
    // Find active elements and remove active class from elements
    const activeElements: NodeListOf<Element> = <NodeListOf<Element>>document.querySelectorAll('.active');
    activeElements.forEach(function(elem: HTMLElement) {
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

async function getOption(name: string, callback: Function): Promise<any> {
    return await chrome.storage.sync.get([name], (result: any) => {
        if (result) {
            console.log('getOption', result);
            callback(result);
        }
    });
}

function loadOptions() {
    getOption('general.defaultTab', (result: any) => {
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
    });
}

loadOptions();
