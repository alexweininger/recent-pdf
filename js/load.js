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
	}, function (data) {
		data.forEach(function (page) {

			if (page.url.endsWith('.pdf')) { // check if page is a .pdf

				pdfList.push(page);
				console.log(`${page}`);
			}
		});
	});
}