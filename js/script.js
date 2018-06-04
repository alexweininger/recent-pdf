var maxResults = 1000; // number of pages to search

chrome.history.search({
    text: '.pdf',
    maxResults: maxResults
}, function (data) {
    var count = 0;
    data.forEach(function (page) {

        var maxUrlLength = 30;
        var element = document.getElementById("link-list");

        if (page.url.endsWith(".pdf")) { // check if page is a .pdf

            var trimmedUrl = trimUrl(page.url, maxUrlLength); // trim the url to make user-readable 

            var listItem = document.createElement("li");
            var wrapper = document.createElement("div");

            wrapper.className = "li-wrapper";

            if (page.url.startsWith("file:")) {
                count++;
                let stringId = 'url-text-' + count;
                listItem.innerHTML = "<img src='chrome://favicon/" + page.url + "' class='link-thumb'><p id='" + stringId + "' class='file-url'>" + page.url + "</p>";

                listItem.addEventListener("click", function () {
                    var clickable = document.getElementById(stringId);
                    console.log(clickable);
                    clickable.addEventListener('click', () => selectText(stringId));
                });
            } else {
                listItem.innerHTML = " <img src='chrome://favicon/" + page.url + "' class='link-thumb'><a href='" + page.url +
                    "' class='link-url' target='_blank'><p class='link-title'>" + trimmedUrl +
                    "</p><p class='link-url'>" + page.url + "</p></a>";
            }

            wrapper.appendChild(listItem);
            element.appendChild(wrapper);
        }
    });
});


function trimUrl(url, maxUrlLength) {
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