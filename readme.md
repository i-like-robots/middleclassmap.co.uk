# middleclassmap.co.uk

The source code for the website [middleclassmap.co.uk](https://www.middleclassmap.co.uk).

After reading about middle class city dwellers dreams of moving away from the pandemic ridden streets in search of the good life in [The Guardian][1] and [Financial Times][2] I thought it would be interesting to map out their potential destinations.

This website combines and presents the location data for a number of popular middle class haunts, from trendy independent boutiques to salt of the earth farm shops. Data is presented as a heatmap (with each point adjusted for population density) at low zoom levels and as a pin board at high zoom levels.

[1]: https://www.theguardian.com/uk-news/2020/jun/24/covid-19-sparks-exodus-of-middle-class-londoners-in-search-of-the-good-life
[2]: https://www.ft.com/content/7bc61b8c-9c2e-11ea-adb1-529f96d8a00b

## The data

All data displayed on this website is in the public domain and was extracted from the following sources:

- [Michelin Guide](https://guide.michelin.com/gb/en/restaurants/bib-gourmand)
- [Côte Brasserie](https://www.cote.co.uk/directory/)
- [Fabulous Farm Shops](http://www.fabulousfarmshops.co.uk/)
- [Independent Cinema Office](https://www.independentcinemaoffice.org.uk/)
- [John Lewis](https://www.johnlewis.com/our-shops)
- [JoJo Maman Bébé](https://www.jojomamanbebe.co.uk/stores)
- [Royal Horticultural Society](https://www.rhs.org.uk/gardens/partner-gardens)
- [Space NK](https://www.spacenk.com/uk/en_GB/stores.html)
- [Sweaty Betty](https://www.sweatybetty.com/shop-finder)
- [The National Trust](https://www.nationaltrust.org.uk/search)
- [The White Company](https://www.thewhitecompany.com/uk/our-stores/)
- [Trouva](https://www.trouva.com/boutiques/locations/GB)

Different techniques were used to scrape data from each source, primarily using a combination of [Node Fetch](https://www.npmjs.com/package/node-fetch), [Cheerio](https://www.npmjs.com/package/cheerio), and [Puppeteer](https://www.npmjs.com/package/puppeteer). Data scraped from websites without coordinates was geocoded using open postcode data from [Get The Data](https://www.getthedata.com/open-postcode-geo). The scripts used to fetch and format the raw data are stored in a private repo because retrieving some of it required a little more sleuthing than I feel comfortable sharing.

_No websites were harmed in the making of this one._

UK population data was provided by the [UK Centre for Ecology & Hydrology](https://www.ceh.ac.uk/) and this dataset is freely available [here](https://data.gov.uk/dataset/ca2daae8-8f36-4279-b15d-78b0463c61db/uk-gridded-population-2011-based-on-census-2011-and-land-cover-map-2015). The dataset was integrated using the [Geodesy library](https://github.com/chrisveness/geodesy) published by Chris Veness.

The map itself is powered by [Mapbox](https://www.mapbox.com/).
