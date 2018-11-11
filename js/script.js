/** Script.js
 * Contains the main program logic for recent-pdf
 */

let onlineList = document.getElementById('link-list') // online file list
let fileElement = document.getElementById('file-list') // offline (local) file list

loadSettings() // load the user settings
searchHistory()

let onlinePdfCount = 0 // number of online pdf files
/**
 * searchHistory() - searches history using the chrome.history api for online pdf files
 */

function searchHistory () {
  'use strict'
  chrome.history.search({
    text: '.pdf', // search for .pdf
    maxResults: 10000
  }, function (data) {
    data.forEach(function (page) { // for each result
      if (page.url.endsWith('.pdf') || page.url.endsWith('.PDF')) { // check if page is a .pdf
        let listItem = document.createElement('li')
        listItem.classList.add('list-item')

        if (!page.url.startsWith('file:')) { // if not local pdf
          onlinePdfCount++

          let leftDiv = document.createElement('div')
          let rightDiv = document.createElement('div')
          leftDiv.classList.add('list-div', 'left')
          rightDiv.classList.add('list-div', 'right')

          // make title element
          let title = document.createElement('p')
          title.classList.add('link-title')
          title.innerText = decodeURI(page.url).substring(
            page.url.lastIndexOf('/') + 1, page.url.length - 4)

          // make url element
          let linkUrl = document.createElement('p')
          linkUrl.classList.add('link-url')
          linkUrl.innerHTML =
            decodeURI(page.url).substring(0, 50).replace(' ', '')

          // make icon element
          let icon = document.createElement('img')
          icon.classList.add('link-thumb')
          icon.src = `chrome://favicon/${page.url}`

          // append elements to left div
          leftDiv.appendChild(icon)
          leftDiv.appendChild(title)
          leftDiv.appendChild(linkUrl)

          // on click listener
          leftDiv.addEventListener('click',
            function () {
              window.open(page.url)
            })

          // append to list item
          listItem.appendChild(leftDiv)
          listItem.appendChild(rightDiv)
          // append list item to online list
          onlineList.appendChild(listItem)
        }
      }
    })
    onlineFooter(onlinePdfCount)
    searchDownloads()
    console.log(`${onlinePdfCount} online PDFs found.`)
  })
}

let localFiles = []
let localPdfCount = 0 // number of local pdf files
/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads () {
  'use strict'
  chrome.downloads.search({
    limit: 1000,
    orderBy: ['-startTime']
  }, function (
    data) {
    data.forEach(function (file, i) { // for each result
      if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) { // check if file ends with .pdf or .PDF
        if (!localFiles.includes(file.filename) && localPdfCount < 30 && file.exists) { // check for duplicates and max of 30 files
          localFiles.push(file.filename)
          localPdfCount++

          let leftDiv = document.createElement('div')
          let rightDiv = document.createElement('div')
          leftDiv.classList.add('list-div', 'left')
          rightDiv.classList.add('list-div', 'right')

          // create local file list item
          let fileItem = document.createElement('li')
          fileItem.classList.add('list-item', 'file-item')

          // create icon element
          let icon = document.createElement('img')
          icon.classList.add('link-thumb')
          chrome.downloads.getFileIcon(
            file.id, {
              size: 16
            }, (iconUrl) => {
              icon.src = iconUrl
            })

          // create title element
          let title = document.createElement('p')
          title.classList.add('link-title')
          title.classList.add('local-title')
          title.innerText = file.filename.substring(
            file.filename.lastIndexOf('\\') + 1, file.filename.length - 4)

          // create file url element
          let linkUrl = document.createElement('p')
          linkUrl.classList.add('link-url')
          linkUrl.innerHTML = file.filename.substring(0, 50)

          // append elements to div
          leftDiv.appendChild(icon)
          leftDiv.appendChild(title)
          leftDiv.appendChild(linkUrl)

          // on click listener
          leftDiv.addEventListener(
            'click',
            function () {
              chrome.downloads.open(file.id)
            })

          // open in file explorer button
          let more = document.createElement('img')
          more.id = 'more_icon'
          more.src = '../../assets/More.png'
          more.addEventListener('click',
            function () {
              chrome.downloads.show(file.id)
            })

          rightDiv.appendChild(more)
          fileItem.appendChild(leftDiv)
          fileItem.appendChild(rightDiv)
          fileElement.appendChild(fileItem)
        } else {
          console.log(`[INFO] skipped duplicate file: ${file.filename}.`)
        }
      }
    })

    console.log(`[INFO] ${localPdfCount} local PDFs found.`)
    loadSettings() // load settings
  })
}

// load and create the online pdf footer
function onlineFooter (count) {
  'use strict'
  let plural = (count > 1 ? 's' : '')
  let countDisplay = document.getElementById('count-display')
  countDisplay.innerHTML = `Showing ${count} online PDF${plural}.`
}

// load and create the local file footer
function localFooter (count) {
  'use strict'
  let plural = (count > 1 ? 's' : '')
  let countDisplay = document.getElementById('count-display')
  countDisplay.innerHTML = `Showing ${count} local PDF${plural}.`
}

// tab buttons

let settingsTabLink = document.getElementById('settings-link')

// settings click listener
settingsTabLink.addEventListener('click', (settingsTabLink) => {
  'use strict'
	openModal('#settingsModal')
})

// event handlers for tab buttons
let onlineTabLink = document.getElementById('online-tab-link')
onlineTabLink.addEventListener('click', (event) => {
  'use strict'
  onlineFooter(onlinePdfCount)
  openTab(event, 'online')
})

// click listener for local pdf tab
let localTabLink = document.getElementById('local-tab-link')
localTabLink.addEventListener('click', (event) => {
  'use strict'
  localFooter(localPdfCount)
  openTab(event, 'local')
})

// tab switching function, called when a tab link is clicked
function openTab (evt, tabName) {
  'use strict'
  // Find active elements and remove active class from elements
  const activeElements = document.querySelectorAll('.active')
  activeElements.forEach(function (elem) {
    elem.classList.remove('active')
  })

  // Add active class to tab and pressed button
  const tab = document.querySelector(`.tabcontent#${tabName}`)
  if (tab) {
    tab.classList.add('active')
  }
  evt.currentTarget.classList.add('active')
}

// on start, open the online tab by default
onlineTabLink.click()

/**
 * settings loading and management
 */

// function that loads the settings from the options.js script
function loadSettings () {
  'use strict'
  chrome.storage.sync.get(['savedTab', 'filesPerPage'], function (result) {
    console.log(result)
    if (result.savedTab) {
      document.getElementById('online-footer').style = 'color: red'
    }
  })
}
