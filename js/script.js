/** Script.js
 *
 * Contains the main program logic for recent-pdf
 *  - loads pdf files from downloads api
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
  chrome.history.search({
    text: '.pdf', // search for .pdf
    maxResults: 10000
  }, function (data) {
    data.forEach(function (page) { // for each result
      if (page.url.endsWith('.pdf') | page.url.endsWith('.PDF')) { // check if page is a .pdf
        let listItem = document.createElement('li')
        listItem.classList.add('list-item')

        if (!page.url.startsWith('file:')) {
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
    footer(onlinePdfCount)
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
  chrome.downloads.search({
    limit: 1000,
    orderBy: ['-startTime']
  }, function (
    data) {
    data.forEach(function (file, i) { // for each result
      if (file.filename.endsWith('.pdf') | file.filename.endsWith('.PDF')) { // if file  ends with .pdf or .PDF
        if (!localFiles.includes(file.filename) && localPdfCount < 30) {
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
            file.id, { size: 16 }, (iconUrl) => { icon.src = iconUrl })

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

function footer (count) {
  let plural = (count > 1 ? 's' : '')

  let footerDivs = document.getElementsByClassName('footer')
  let footerLeft = document.getElementById('footer-left')

  let countDisplay = document.getElementById('count-display')

  countDisplay.innerHTML = `Showing ${count} online PDF${plural}.`
}

function localFooter (count) {
  let plural = (count > 1 ? 's' : '')

  let footerDivs = document.getElementsByClassName('footer')
  let footerLeft = document.getElementById('footer-left')

  let countDisplay = document.getElementById('count-display')

  countDisplay.innerHTML = `Showing ${count} local PDF${plural}.`
}

// tab buttons
let onlineTabLink = document.getElementById('online-tab-link')
let localTabLink = document.getElementById('local-tab-link')
let settingsTabLink = document.getElementById('settings-link')

// event handlers for tab buttons
onlineTabLink.addEventListener('click',
  function (event) {
    footer(onlinePdfCount)
    openTab(event, 'online')
  })

localTabLink.addEventListener('click', function (event) {
  localFooter(localPdfCount)
  openTab(event, 'local')
})

settingsTabLink.addEventListener(
  'click',
  function () {
    open('../options/options.html')
  })

onlineTabLink.click()

// function that handles switching between tabs
function openTab (evt, tabName) {
  var i, tabcontent, tablinks
  tabcontent = document.getElementsByClassName('tabcontent')
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }
  tablinks = document.getElementsByClassName('tablinks')
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '')
  }
  document.getElementById(tabName).style.display = 'inline-block'
  evt.currentTarget.className += ' active'
}

// function that loads the settings from the options.js script
function loadSettings () {
  chrome.storage.sync.get(['savedTab', 'filesPerPage'], function (result) {
    console.log(result)
    if (result.savedTab) {
      document.getElementById('online-footer').style = 'color: red'
    }

    if (result.filesPerPage) {
      // TODO
    }
  })
}
