

chrome.history.search({ text: '.pdf', maxResults: 10000 }, function (data) {
    data.forEach(function (page) {

        var maxUrlLength = 30;
        var element = document.getElementById("link-list");
        var title = page.title;

        if (page.url.endsWith(".pdf")) {




            var url = page.url;
            var urlPrefix = "";

            var trimmedUrl = trimUrl(url, maxUrlLength);

            if (url.startsWith("file:")) {
                urlPrefix = "file:";
            }

            url = url.substring(5);

            if (url.length > maxUrlLength) {
                url = url.substring(url.lastIndexOf('/'), url.length); // c
            }

            if (url.length > maxUrlLength) {
                url = url.substring(url.length - maxUrlLength, url.length);
            }

            if (page.title.length > 30) {
                url = url.substring(url.length - 10, url.length);
                title = title.substring(15) + "...";
            }
            var listItem = document.createElement("li");
            var wrapper = document.createElement("div");
            wrapper.className = "li-wrapper";
            wrapper.appendChild(listItem);
                
                listItem.innerHTML = " <img src='chrome://favicon/" + page.url + "' class='link-thumb'><a href='" + page.url + "' class='link-url' target='_newtab'><p class='link-title'>" + trimmedUrl + 
                "</p><p class='link-url'>" + page.url + "</p></a>";
            
            //listItem.onclick = "(chrome.tabs.create({url:" + page.url + "}));";
            //listItem.setAttribute('target', '_blank');
            element.appendChild(wrapper);
        }
        // var link = document.createElement("a");

        // link.href = page.url;
        // link.innerHTML = page.url;
        // link.target = "_blank";

    });

    // iframes(data);
});

function myFunction() {
    /* Get the text field */
    var copyText = document.getElementById("copyLink");
  
    /* Select the text field */
    copyText.select();
  
    /* Copy the text inside the text field */
    document.execCommand("Copy");
  
    /* Alert the copied text */
    alert("Copied the text: " + copyText.value);
  }

function iframes(data) {
    var div = document.getElementById("iframe-div");
    data.forEach(function (page) {

        var frame = document.createElement("iframe");
        frame.src = page.url;

        div.appendChild(frame);
    });


}

function trimUrl(url, maxUrlLength) {
    var urlPrefix = "";

    if (url.startsWith("file:")) {
        urlPrefix = "file:";
    }

    var url = url.substring(5);

    if (url.length > maxUrlLength) {
        url = url.substring(url.lastIndexOf('/'), url.length); // c
    }

    if (url.length > maxUrlLength) {
        url = url.substring(url.length - maxUrlLength, url.length);
    }
    url = url.substring(0, url.length - 4);

    return urlPrefix + url;
}

