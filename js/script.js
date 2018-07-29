// Alex Weininger 2018

searchHistory();

function searchHistory() {
    let element = document.getElementById('link-list');
    let onlineCount = 0;
    chrome.history.search({
        text: '.pdf',
        maxResults: 10000
    }, function (data) {
        onlineCount = 0;

        data.forEach(function (page) {

            if (page.url.endsWith('.pdf')) { // check if page is a .pdf

                let listItem = document.createElement('li');
                listItem.classList.add('list-item');

                if (!page.url.startsWith('file:')) {

                    onlineCount++;

                    let title = document.createElement('p');
                    title.classList.add('link-title');
                    title.innerText = lastStr(page.url);

                    let linkUrl = document.createElement('p');
                    linkUrl.classList.add('link-url');
                    linkUrl.innerHTML = decodeURI(page.url).substring(0, 50).replace(' ', '');

                    let icon = document.createElement('img');
                    icon.classList.add('link-thumb');
                    icon.src = 'chrome://favicon/' + page.url;


                    // listItem.innerHTML = strA;
                    listItem.appendChild(icon);
                    listItem.appendChild(title);
                    listItem.appendChild(document.createElement('br'));
                    listItem.appendChild(linkUrl);

                    // wrapper.appendChild(listItem);

                    listItem.addEventListener('click', function () {
                        window.open(page.url);
                    });

                    element.appendChild(listItem);
                }
            }
        });

        let plural = (onlineCount > 1 ? 's' : '');

        let onlineFooter = document.createElement('p');
        onlineFooter.innerHTML = 'Showing ' + onlineCount + ' online PDF' + plural + '.';
        onlineFooter.classList.add('footer');
        onlineFooter.id = 'online-footer';
        element.appendChild(onlineFooter);


    });
}

let localPdfCount = 0;

searchDownloads();

function searchDownloads() {
    let fileElement = document.getElementById('file-list');

    chrome.downloads.search({
        limit: 100,
        orderBy: ['-startTime']
    }, function (data) {
        data.forEach(function (file, i) {

            if (file.filename.endsWith('.pdf')) {
                localPdfCount++;

                let fileItem = document.createElement("li");
                fileItem.classList.add('list-item', 'file-item');


                let icon = document.createElement('img');
                icon.classList.add('link-thumb');
                chrome.downloads.getFileIcon(file.id, {
                    size: 16
                }, function (iconUrl) {
                    icon.src = iconUrl;
                });

                let title = document.createElement('p');
                title.classList.add('link-title');
                title.innerText = file.filename.substring(file.filename.lastIndexOf('\\') + 1, file.filename.length - 4);

                let linkUrl = document.createElement('p');
                linkUrl.classList.add('link-url');
                linkUrl.innerHTML = file.filename.substring(0, file.filename.lastIndexOf('\\') + 1);

                fileItem.appendChild(icon);
                fileItem.appendChild(title);
                fileItem.appendChild(linkUrl);


                fileItem.addEventListener('click', function () {
                    chrome.downloads.open(file.id);
                })

                fileElement.appendChild(fileItem);
            }
        });

        let plural = (localPdfCount > 1 ? 's' : '');

        let localFooter = document.createElement('p');
        localFooter.innerHTML = 'Showing ' + localPdfCount + ' local PDF' + plural + '.';
        localFooter.classList.add('footer');
        localFooter.id = 'local-footer';
        fileElement.appendChild(localFooter);
    });
}

function lastStr(url) {
    url = decodeURI(url);
    url = url.substring(url.lastIndexOf('/') + 1, url.length - 4)
    return url;
}

function trimLocalUrl(url) {
    let i = url.lastIndexOf('/');
    return url.substring(i + 1, url.length - 4);
}

function trimUrl(url, maxUrlLength) {
    url = decodeURI(url);
    var urlPrefix = "";

    if (url.startsWith("file:")) {
        urlPrefix = "file:";
    }

    var url = url.substring(5);

    if (url.length > maxUrlLength) {
        url = url.substring(url.lastIndexOf('/'), url.length);
    }

    if (url.length > maxUrlLength) {
        url = url.substring(url.length - maxUrlLength, url.length);
    }
    url = url.substring(0, url.length - 4);

    return urlPrefix + url;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "inline-block";
    evt.currentTarget.className += " active";
}

let onlineTabLink = document.getElementById('online-tab-link');
let localTabLink = document.getElementById('local-tab-link');
let settingsTabLink = document.getElementById('settings-tab-link');

onlineTabLink.addEventListener('click', function () {
    openTab(event, 'online');
});

localTabLink.addEventListener('click', function () {
    openTab(event, 'local');
});

settingsTabLink.addEventListener('click', function () {
    openTab(event, 'settings');
});

onlineTabLink.click();