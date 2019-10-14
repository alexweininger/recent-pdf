import { isOnlinePDF } from "./utils";

export function createFileList(pages: Array<chrome.history.HistoryItem>): HTMLUListElement {
  const list = document.createElement('ul');
  list.classList.add('grouped-file-list');
  populateFileList(pages, list);
  return list;
}

export function populateFileList(pages: Array<chrome.history.HistoryItem>, parentList: HTMLUListElement): number {
  let onlinePdfCount = 0;
  pages.forEach(page => {
    if (!isOnlinePDF(page.url)) {
      return;
    }
    onlinePdfCount++;
    // for each result
    // check if page is a .pdf
    let listItem: HTMLLIElement = document.createElement('li');
    listItem.classList.add('list-item');
    // onlinePdfCount++;

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
    parentList.appendChild(listItem);
  });
  return onlinePdfCount;
}