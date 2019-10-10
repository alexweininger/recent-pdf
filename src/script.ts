/// <reference path='../node_modules/@types/chrome/index.d.ts'/>

let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('online-tab-link');
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('local-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
let currentTab: Tab;

const search: HTMLInputElement = document.createElement('input');
search.setAttribute('type', 'text');
search.setAttribute('placeholder', 'Search recent');
search.style.width = '100%';
search.style.padding = '7px';

search.onkeydown = (e: Event) => {
   //@ts-ignore
   searchDownloads(e.target.value);
   localFiles = localFiles.filter((filename: string) => {
      //@ts-ignore
      if (e.target.value !== '') {
      //@ts-ignore
         if (formatFilename(filename).includes(e.target.value)) {
            return filename;
         }
      } else {
         return filename
      }
   });
   console.log(localFiles);
};

search.addEventListener('change', (e: Event) => {
   //@ts-ignore
   searchDownloads(e.target.value);
});

onlineList.appendChild(search);
fileElement.appendChild(search);

enum Tab {
   Local = 'local',
   Online = 'online'
}
// tab buttons

if (onlineTabLink) {
   // event handlers for tab buttons
   onlineTabLink.addEventListener('click', (event: Event): void => {
      onlineFooter(onlinePdfCount);
      openTab(event, Tab.Online);
      currentTab = Tab.Online;
   });
} else {
   console.error('onlineTabLink is null');
}

// click listener for local pdf tab
if (localTabLink) {
   localTabLink.addEventListener('click', (event: Event): void => {
      localFooter(localPdfCount);
      openTab(event, Tab.Local);
      currentTab = Tab.Local;
   });
} else {
   console.error('localTabLink is null');
}

// settings click listener
settingsTabLink.addEventListener('click', (): void => {
   chrome.runtime.openOptionsPage();
});

let onlinePdfCount: number = 0; // number of online pdf files
/**
 * searchHistory() - searches history using the chrome.history api for online pdf files
 */
(function searchHistory(): void {
   chrome.history.search(
      {
         text: '.pdf', // search for .pdf
         maxResults: 10000
      },
      (data: chrome.history.HistoryItem[]): void => {
         data.forEach((page: chrome.history.HistoryItem) => {
            // for each result
            if (page.url.toLowerCase().endsWith('.pdf')) {
               // check if page is a .pdf
               const listItem: HTMLLIElement = document.createElement('li');
               listItem.classList.add('list-item');

               if (!page.url.startsWith('file:')) {
                  // if not local pdf
                  onlinePdfCount++;

                  const leftDiv: HTMLDivElement = document.createElement('div');
                  const rightDiv: HTMLDivElement = document.createElement('div');
                  leftDiv.classList.add('list-div', 'left');
                  rightDiv.classList.add('list-div', 'right');

                  // make title element
                  const title: HTMLParagraphElement = document.createElement('p');
                  title.classList.add('link-title');
                  title.innerText = decodeURI(page.url).substring(page.url.lastIndexOf('/') + 1, page.url.length - 4);
                  // make url element
                  const linkUrl: HTMLParagraphElement = document.createElement('p');
                  linkUrl.classList.add('link-url');
                  linkUrl.innerHTML = decodeURI(page.url).substring(0, 50).replace(' ', '');

                  // make icon element
                  const icon: HTMLImageElement = document.createElement('img');
                  icon.classList.add('link-thumb');
                  icon.src = `chrome://favicon/${page.url}`;

                  // append elements to left div
                  leftDiv.appendChild(icon);
                  leftDiv.appendChild(title);
                  leftDiv.appendChild(linkUrl);

                  // on click listener
                  leftDiv.addEventListener('click', () => {
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
})();

let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads(query?: string): void {
   chrome.downloads.search(
      {
         limit: 0,
         orderBy: ['-startTime'],
         filenameRegex: '^(.(.*.pdf$))*$'
      },
      (data: chrome.downloads.DownloadItem[]) => {
         data.length === 0 && searchDownloads();
         data.forEach((file: chrome.downloads.DownloadItem) => {
            // for each result
            const filename: string = formatFilename(file.filename);
            if (file.filename.toLocaleLowerCase().endsWith('.pdf')) {
               // check if file ends with .pdf or .PDF
               if (localFiles.indexOf(file.filename) === -1 && localPdfCount < 30) {
                  // check for duplicated and max of 30 files
                  localFiles.push(file.filename);
                  localPdfCount++;

                  const leftDiv: HTMLDivElement = document.createElement('div');
                  const rightDiv: HTMLDivElement = document.createElement('div');
                  leftDiv.classList.add('list-div', 'left');
                  rightDiv.classList.add('list-div', 'right');

                  // create local file list item
                  const fileItem: HTMLLIElement = document.createElement('li');
                  fileItem.classList.add('list-item', 'file-item');

                  // create icon element
                  const icon: HTMLImageElement = document.createElement('img');
                  icon.classList.add('link-thumb');
                  chrome.downloads.getFileIcon(file.id, { size: 16 }, iconUrl => {
                     icon.src = iconUrl;
                  });

                  // create title element
                  const title: HTMLParagraphElement = document.createElement('p');
                  title.classList.add('link-title');
                  title.classList.add('local-title');
                  title.innerText = filename;
                  // create file url element
                  const linkUrl: HTMLParagraphElement = document.createElement('p');
                  linkUrl.classList.add('link-url');
                  linkUrl.innerHTML = file.filename.substring(0, 50);

                  // append elements to div based on query
                  leftDiv.appendChild(icon);
                  leftDiv.appendChild(title);
                  leftDiv.appendChild(linkUrl);

                  // on click listener
                  leftDiv.addEventListener('click', function() {
                     chrome.downloads.open(file.id);
                  });

                  // open in file explorer button
                  const more: HTMLImageElement = document.createElement('img');
                  more.id = 'more_icon';
                  more.src = '../../assets/More.png';
                  more.addEventListener('click', function() {
                     chrome.downloads.show(file.id);
                  });

                  rightDiv.appendChild(more);
                  fileItem.appendChild(leftDiv);
                  fileItem.appendChild(rightDiv);
                  fileElement.appendChild(fileItem);
               }
            }
         });

         console.log(`[INFO] ${localPdfCount} local PDFs found.`);
         updateFooter();
      }
   );
}
searchDownloads();

function updateFooter(): void {
   if (currentTab == Tab.Local) {
      localFooter(localPdfCount);
   } else {
      onlineFooter(onlinePdfCount);
   }
}

// load and create the online pdf footer
function onlineFooter(count: number): void {
   const countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
   countDisplay.innerHTML = `Showing ${count} online PDF${count > 1 ? 's' : ''}.`;
}

// load and create the local file footer
function localFooter(count: number): void {
   const countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
   countDisplay.innerHTML = `Showing ${count} local PDF${count > 1 ? 's' : ''}.`;
}

// function that handles switching between tabs
function openTab(evt: any, tab: Tab): void {
   // Find active elements and remove active class from elements
   const activeElements: NodeListOf<Element> = <NodeListOf<Element>>document.querySelectorAll('.active');
   activeElements.forEach((elem: HTMLElement) => {
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

(function loadOptions(): void {
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
})();

function formatFilename(filename: string): string {
   if (filename) {
      return /(downloads|documents)\/(.+)\.pdf/gi.exec(filename)
         ? /(downloads|documents)\/(.+)\.pdf/gi.exec(filename)[2]
         : filename.substring(filename.lastIndexOf('\\') + 1, filename.length - 4);
   }
   return '';
}
