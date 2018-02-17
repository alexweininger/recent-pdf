var maxResults = 1000; // number of pages to search

chrome.history.search({ text: '.pdf', maxResults: maxResults }, function (data) {
    data.forEach(function (page) {

        var maxUrlLength = 30;
        var element = document.getElementById("link-list");

        if (page.url.endsWith(".pdf")) { // check if page is a .pdf

            var trimmedUrl = trimUrl(page.url, maxUrlLength); // trim the url to make user-readable 

            var listItem = document.createElement("li");
            var wrapper = document.createElement("div");

            wrapper.className = "li-wrapper";

            listItem.innerHTML = " <img src='chrome://favicon/" + page.url + "' class='link-thumb'><a href='" + page.url +
                "' class='link-url' target='_blank'><p class='link-title'>" + trimmedUrl +
                "</p><p class='link-url'>" + page.url + "</p></a>";
                
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

