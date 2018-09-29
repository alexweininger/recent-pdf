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
      urlRegex: '/.+\.([pP][dD][fF])/g', // regex for .pdf files
      limit: 500,
      orderBy: ['-startTime']
    },
    (data) => {
      data.forEach(function (page) {

        if((page.url).endsWith('.pdf')) {
          console.error('Pushed file to list which does not end in \'.pdf\'')
          console.groupCollapsed('url')
          console.error(`url: ${page.url}`)
          console.groupEnd()
        }

        if (!pdfList.includes(page)) { // check if page already in list

          pdfList.push(page) // add it to the array list

          if (page.finalUrl != page.url) {
            console.info(`[INFO] url and final url do not match`)
            console.info(` > url: ${page.url}, finalUrl: ${page.finalUrl}`)
          }

        } else {
          console.info(`Duplicate file not pushed to file list.`)
          console.groupCollapsed('url')
          console.info(page.url)
          console.groupEnd()
        }
      })
    })
}