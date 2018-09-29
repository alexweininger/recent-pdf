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

// regex for matching pdfs only, can be used with search function of
// chrome.downloads
// .+\.([pP][dD][fF])

var pdfList = [] // list of all pdf objects

function getDownloads() {
	chrome.downloads.search({
			urlRegex: '.+\.([pP][dD][fF])',
			limit: 1000,
			orderBy: ['-startTime']
		},
		(data) => {
			data.forEach(function (page) {

				if (!pdfList.includes(page)) { // check if page already in list
					pdfList.push(page) // add it to the array list
					if (page.finalUrl != page.url) {
						console.log(`[INFO] url and final url do not match`)
						console.log(`url: ${page.url}, finalUrl: ${page.finalUrl}`)
					}
				}
			})
		})
}