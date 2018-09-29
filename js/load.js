/**
 * load.js
 * loads all pdfs from chrome apis
 *
 * author: Alex Weininger
 * modified: 9/26/2018
 */

function getDownloads() {
	let pdfList = []
	chrome.downloads.search({
			urlRegex: '.+\.([pP][dD][fF])', // regex for .pdf files
			limit: 500,
			orderBy: ['-startTime']
		},
		(data) => {
			data.forEach(function (page) {
				if (!pdfList.includes(page)) { // check if page already in list
					
					pdfList.push(page) // add it to the array list

					if (page.finalUrl != page.url) {
						console.log(`[INFO] url and final url do not match`)
						console.log(` > url: ${page.url}, finalUrl: ${page.finalUrl}`)
					}
				} else {
					console.info(`Duplicate file not pushed to file list.`);
				}
			})
		})
}