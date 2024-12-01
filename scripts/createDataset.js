const path = require('path')
const isInUK = require('./lib/isInUK')
const writeFile = require('./lib/writeFile')
const getPopulation = require('./lib/getPopulation')
const loadPopulationData = require('./lib/loadPopulationData')

// The scripts used to fetch and format the raw data are stored in a private repo.
// Although the data is all public - and scraping it is fair use - retrieving
// some of it required a little more sleuthing than I feel comfortable sharing.
const dataset = {
  COTE_BRASSERIE: require('../../middleclassmap.co.uk-private/data/coteBrasserie.json'),
  FARM_SHOP: require('../../middleclassmap.co.uk-private/data/farmShops.json'),
  INDEPENDENT_CINEMA: require('../../middleclassmap.co.uk-private/data/independentCinemas.json'),
  JOHN_LEWIS: require('../../middleclassmap.co.uk-private/data/johnLewis.json'),
  JOJO_MAMAN_BEBE: require('../../middleclassmap.co.uk-private/data/jojoMamanBebe.json'),
  MICHELIN_AWARD: require('../../middleclassmap.co.uk-private/data/bibGourmand.json'),
  NATIONAL_TRUST: require('../../middleclassmap.co.uk-private/data/theNationalTrust.json'),
  RHS_PARTNER_GARDEN: require('../../middleclassmap.co.uk-private/data/rhsPartnerGardens.json'),
  SPACE_NK: require('../../middleclassmap.co.uk-private/data/spaceNK.json'),
  SWEATY_BETTY: require('../../middleclassmap.co.uk-private/data/sweatyBetty.json'),
  THE_WHITE_COMPANY: require('../../middleclassmap.co.uk-private/data/theWhiteCompany.json'),
  TROUVA_BOUTIQUE: require('../../middleclassmap.co.uk-private/data/trouvaBoutiques.json'),
}

function getPointWeight(population) {
  if (population < 500) return 1.25
  if (population < 2000) return 1
  if (population < 7500) return 0.75
  if (population < 20000) return 0.5
  if (population < 50000) return 0.25

  return 0.1
}

async function run() {
  const population = await loadPopulationData()

  const data = {
    type: 'FeatureCollection',
    features: [],
  }

  for (const [group, items] of Object.entries(dataset)) {
    for (const item of items) {
      const point = [item.longitude, item.latitude]

      if (isInUK(point)) {
        const pop = await getPopulation(point, population)

        data.features.push({
          type: 'Feature',
          properties: {
            group,
            name: item.name.trim(),
            url: item.url,
            weight: getPointWeight(pop),
          },
          geometry: {
            type: 'Point',
            coordinates: [item.longitude, item.latitude],
          },
        })
      }
    }
  }

  return data
}

run()
  .then((data) => {
    const outputPath = path.join(__dirname, '../website/dataset.json')
    return writeFile(data, outputPath)
  })
  .then(() => {
    console.log('Successfully wrote dataset.json')
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
