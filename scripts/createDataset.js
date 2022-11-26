const path = require('path')
const isInUK = require('./lib/isInUK')
const writeFile = require('./lib/writeFile')
const getPopulation = require('./lib/getPopulation')
const loadPopulationData = require('./lib/loadPopulationData')

// The scripts used to fetch and format the raw data are stored in a private repo.
// Although the data is all public - and scraping it is fair use - retrieving
// some of it required a little more sleuthing than I feel comfortable sharing.
const dataset = {
  BIB_GOURMAND: require('../../raw/bibGourmand.json'),
  COTE_BRASSERIE: require('../../raw/coteBrasserie.json'),
  FARM_SHOP: require('../../raw/farmShops.json'),
  INDEPENDENT_CINEMA: require('../../raw/independentCinemas.json'),
  JOHN_LEWIS: require('../../raw/johnLewis.json'),
  JOJO_MAMAN_BEBE: require('../../raw/jojoMamanBebe.json'),
  NATIONAL_TRUST: require('../../raw/theNationalTrust.json'),
  RHS_PARTNER_GARDEN: require('../../raw/rhsPartnerGardens.json'),
  SPACE_NK: require('../../raw/spaceNK.json'),
  THE_WHITE_COMPANY: require('../../raw/theWhiteCompany.json'),
  TROUVA_BOUTIQUE: require('../../raw/trouvaBoutiques.json'),
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
        const pop = getPopulation(point, population)

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
