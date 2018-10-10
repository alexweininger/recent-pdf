/**
 * load.js
 * loads all pdfs from chrome apis
 *
 * author: Alex Weininger
 * modified: 9/26/2018
 */

function getDownloads () {
  let pdfList = []
  chrome.downloads.search({
    finalUrlRegex: '.+\.pdf$', // regex for .pdf files
    limit: 500,
    orderBy: ['-startTime']
  },
  (data) => {
    data.forEach((page) => {
      if (!pdfList.includes(page)) { // check if page already in list
        pdfList.push(page) // add it to the array list

        if (!(page.url).search('.pdf')) {
          console.error('Pushed file to list which does not end in \'.pdf\'')
          console.groupCollapsed('url')
          console.error(`url: ${page.url}`)
          console.groupEnd()
        }
      } else {
        console.info(`Duplicate file not pushed to file list.`)
        console.groupCollapsed('url')
        console.info(page.url)
        console.groupEnd()
      }
    })
    console.info(`${pdfList.length} PDF files found.`)

    pdfList.forEach((page) => {
      if (page.finalUrl != page.url) {
        console.groupCollapsed(`page.url does not match page.finaUrl.`)
        console.info(`url: ${page.url}\nfinalUrl: ${page.finalUrl}`)
        console.groupEnd()
      }
    })
  })
}
