/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>
import { createFileList, populateFileList } from './file';
import { createFolder } from './grouping';
import { GroupingOption } from './types';
import { isOnlinePDF } from './utils';

let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('online-tab-link');
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('local-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
var head = document.getElementsByTagName('HEAD')[0];
let currentTab: Tab;

enum Tab {
    Local = 'local',
    Online = 'online'
}

window.browser = (function () {
    return window.browser || window.chrome;
})();

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
    window.browser.runtime.openOptionsPage();
});

searchHistory();
searchDownloads();

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
        async function(data: chrome.history.HistoryItem[]) {
            const groupingOption = await getGroupingOption();
            if (groupingOption === GroupingOption.Domain) {
                // Map for storing arrays of grouped history items
                const domainMap: Map<string, Array<chrome.history.HistoryItem>> = new Map();
                data.forEach(page => {
                    // Early return if not an online PDF
                    if (!isOnlinePDF(page.url)) {
                        return;
                    }
                    onlinePdfCount++;

                    // Get hostname from page URL
                    const [, , domain] = page.url.split('/');
                    let listItem: HTMLLIElement = document.createElement('li');
                    listItem.classList.add('domain-list-item');

                    // Add new page if domain exists in domainMap
                    if (domainMap.has(domain)) {
                        domainMap.get(domain).push(page);
                    } else {
                        // Create new array and store in domainMap
                        const pageArray = [page];
                        domainMap.set(domain, pageArray);
                        let listElement: HTMLUListElement;
                        // Render new folder to DOM tree
                        const folder = createFolder(domain, () => {
                            // Click listener on folder header
                            if (listElement) {
                                folder.removeChild(listElement);
                                listElement = null;
                            } else {
                                listElement = createFileList(pageArray);
                                folder.appendChild(listElement);
                            }
                        });
                        listItem.appendChild(folder);
                        onlineList.appendChild(listItem);
                    }
                });
            } else {
                // Populate onlineList with all available PDFs
                onlinePdfCount = populateFileList(data, onlineList);
            }
            
            console.log(`${onlinePdfCount} online PDFs found.`);
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
        async function(data: chrome.downloads.DownloadItem[]) {
            if (data.length == 0) {
                searchDownloads();
                return;
            }
            const maxFilesToShow = await getMaxFilesValue()
            console.log('found ' + data.length + ' local pdfs');
            let winos = navigator.appVersion.indexOf('Win');
            let slashType = winos !== -1 ? '\\' : '/';
            data.forEach(function(file: chrome.downloads.DownloadItem, i: number) {
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

                        // append elements to div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener('click', function() {
                            window.browser.downloads.open(file.id);
                        });

                        // open in file explorer button
                        let more: HTMLImageElement = document.createElement('img');
                        more.id = 'more_icon';
                        more.src = '../../assets/More.png';
                        more.addEventListener('click', function() {
                            window.browser.downloads.show(file.id);
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

async function getGroupingOption(): Promise<GroupingOption> {
    try {
        const result = await getOption('general.fileGrouping');
        // 'No Grouping' is the default option
        const groupingOption = result['general.fileGrouping'] || GroupingOption.None;
        return groupingOption;
    } catch(err) {
        // Fallback to 'No Grouping' if could not get selected option
        return GroupingOption.None;
    }
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
    if(colorTheme)
    {
        if(colorTheme == 'Light')
        {
            link.href = 'style.css'; 
        }else if(colorTheme == 'Dark')
        {
            link.href = 'style_dark_mode.css';
        }else{
            link.href = 'style.css'; 
        }
        }else{
            link.href = 'style.css'; 
        }
        head.appendChild(link);
}

loadOptions();