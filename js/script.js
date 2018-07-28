// Alex Weininger 2018
let localCount = 0;
let onlineCount = 0;

let element = document.getElementById("link-list");
let fileElement = document.getElementById('file-list');

searchHistory();

function searchHistory() {
    chrome.history.search({
        text: '.pdf',
        maxResults: 10000
    }, function (data) {
        localCount = 0;
        onlineCount = 0;

        data.forEach(function (page) {

            var maxUrlLength = 30;

            if (page.url.endsWith(".pdf")) { // check if page is a .pdf

                var trimmedUrl = trimUrl(page.url, maxUrlLength); // trim the url to make user-readable 

                let localTrimmedUrl = trimLocalUrl(page.url);

                var listitem = document.createElement("li");

                listitem.classList.add('list-item');

                if (page.url.startsWith("file:")) {
                    localCount++;

                    let stringId = 'url-text-' + localCount;
                    listitem.innerHTML = "<p class='file-title'> " + localTrimmedUrl + " - click to select url </p><p id='" + stringId + "' class='file-url'>" + page.url + "</p>";

                    listitem.addEventListener("click", function () {
                        selectText(stringId);
                    });

                    //  fileElement.appendChild(listitem);
                } else {

                    let linkTitle = lastStr(page.url);
                    let linkDetailed = decodeURI(page.url).substring(0, 50).replace(' ', '');

                    onlineCount++;

                    let link = document.createElement('a');

                    link.href = page.url;
                    link.classList.add('a');
                    link.target = '_blank';

                    let title = document.createElement('p');
                    title.classList.add('link-title');
                    title.innerText = lastStr(page.url);

                    let linkUrl = document.createElement('p');
                    linkUrl.classList.add('link-url');
                    linkUrl.innerHTML = decodeURI(page.url).substring(0, 50).replace(' ', '');

                    let icon = document.createElement('img');
                    icon.classList.add('link-thumb');
                    icon.src = 'chrome://favicon/' + page.url;

                    link.appendChild(icon);
                    link.appendChild(title);
                    link.appendChild(linkUrl);

                    // listitem.innerHTML = strA;
                    listitem.appendChild(icon);
                    listitem.appendChild(title);
                    listitem.appendChild(document.createElement('br'));
                    listitem.appendChild(linkUrl);

                    // wrapper.appendChild(listitem);

                    listitem.addEventListener('click', function () {
                        window.open(page.url);
                    })

                    element.appendChild(listitem);
                }
            }
        });

        let plural = (onlineCount > 1 ? 's' : '');

        let onlineFooter = document.createElement('p');
        onlineFooter.innerHTML = 'Showing ' + onlineCount + ' online PDF' + plural + '.';
        onlineFooter.classList.add('footer');
        onlineFooter.id = 'online-footer';
        element.appendChild(onlineFooter);

        plural = (localCount > 1 ? 's' : '');

        let localFooter = document.createElement('p');
        localFooter.innerHTML = 'Showing ' + localCount + ' local PDF' + plural + '.';
        localFooter.classList.add('footer');
        localFooter.id = 'local-footer';
        fileElement.appendChild(localFooter);
    });
}

searchDownloads();
let downloadCount = 0;

function searchDownloads() {
    chrome.downloads.search({
        limit: 100,
        orderBy: ['-startTime']
    }, function (data) {
        data.forEach(function (file, i) {

            if (file.filename.endsWith('.pdf')) {
                downloadCount++;
                console.log(file.filename);

                var fileItem = document.createElement("li");
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

function selectText(node) {
    console.log(node);
    node = document.getElementById(node);

    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
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