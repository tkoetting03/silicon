<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSS Feed Integration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .rss-feed {
            margin-top: 20px;
        }
        .rss-feed h2 {
            color: #333;
        }
        .rss-item {
            margin-bottom: 10px;
        }
        .rss-item a {
            color: #0066cc;
            text-decoration: none;
        }
    </style>
</head>
<body>

    <h1>RSS Feed Integration Example</h1>
    <p>Below is an example of an integrated RSS feed:</p>

    <div id="rssFeed" class="rss-feed">
        <h2>Latest News</h2>
        <ul id="rssList"></ul>
    </div>

    <script>
        function parseRSS(xml) {
            let rssItems = [];
            let items = xml.querySelectorAll("item");

            items.forEach(item => {
                let title = item.querySelector("title").textContent;
                let link = item.querySelector("link").textContent;
                let description = item.querySelector("description").textContent;

                rssItems.push({
                    title: title,
                    link: link,
                    description: description
                });
            });

            return rssItems;
        }

        function displayRSS(items) {
            let rssList = document.getElementById("rssList");

            items.forEach(item => {
                let listItem = document.createElement("li");
                listItem.classList.add("rss-item");

                let link = document.createElement("a");
                link.href = item.link;
                link.target = "_blank";
                link.textContent = item.title;

                let description = document.createElement("p");
                description.textContent = item.description;

                listItem.appendChild(link);
                listItem.appendChild(description);

                rssList.appendChild(listItem);
            });
        }

        function fetchRSS(feedUrl) {
            fetch(feedUrl)
                .then(response => response.text())
                .then(str => {
                    let parser = new DOMParser();
                    let xmlDoc = parser.parseFromString(str, "application/xml");
                    let rssItems = parseRSS(xmlDoc);
                    displayRSS(rssItems);
                })
                .catch(err => console.error("Error fetching RSS feed: ", err));
        }

        // Replace with the desired RSS feed URL
        const rssFeedUrl = 'https://letterboxd.com/tckoetting/';
        fetchRSS(https://letterboxd.com/tckoetting/);
    </script>

</body>
</html>



### News and Current Events

[Naked Capitalism](https://www.nakedcapitalism.com/)

[WSJ](https://www.wsj.com/)

[Quanta Magazine](https://www.quantamagazine.org/)

[Phys.org](https://phys.org/)

### Blogs and Newsletters

[Scope of Work](https://www.scopeofwork.net/)

[Chips and Cheese](https://chipsandcheese.com/)

[Paul Graham](https://paulgraham.com/index.html)

[Ken Shirriff's Blog](https://www.righto.com/)

### Youtube Channels

[Asianometry](https://www.youtube.com/@Asianometry)

[3Blue1Brown](https://www.youtube.com/@3blue1brown)

[Jon Bois](https://www.youtube.com/@SecretBaseSBN)

[MVG](https://www.youtube.com/@ModernVintageGamer)

[Summoning Salt](https://www.youtube.com/@SummoningSalt)

[Modern MBA](https://www.youtube.com/@ModernMBA)

[Numberphile](https://www.youtube.com/@numberphile)

[Ben Eater](https://www.youtube.com/@BenEater)

[High Yield](https://www.youtube.com/@HighYield)

[Moritz Klein](https://www.youtube.com/@MoritzKlein0)

[Lemino](https://www.youtube.com/@LEMMiNO)
