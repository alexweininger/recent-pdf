/**
 * load.js
 * loads all pdfs from chrome apis
 * 
 * author: Alex Weininger
 * modified: 9/26/2018
 */

/**
 * steps:
 * 1. create data structure to hold pdf objects
 * 2. go through downloads and push pdfs to the list
 * 3. go through history
 */


 

 var pdfList = [];

function getDownloads() {
	chrome.downloads.search({
		limit: 1000,
		orderBy: ['-startTime']
	}, downloadsParser(data));
}

function downloadsParser(data) {
	data.forEach(function (page) {

		if (page.url.endsWith('.pdf')) { // check if page is a .pdf

			pdfList.push(page);

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
}