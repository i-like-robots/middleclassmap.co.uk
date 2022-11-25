const { LatLon } = require('../vendor/geodesy')

const ADJUST_X = 4
const ADJUST_Y = 6

const BOUND = 2

function sum(arr) {
  return arr.reduce((acc, item) => {
    item = item === '-9999' ? 0 : parseInt(item, 10)
    return acc + item
  }, 0)
}

function total(easting, northing, dataset) {
  return sum(
    dataset.slice(northing - BOUND, northing + BOUND).map((cols) => {
      const items = cols.slice(easting - BOUND, easting + BOUND)
      return sum(items)
    })
  )
}

module.exports = function getPopulation(point, dataset) {
  const wgs84 = new LatLon(point[1], point[0])
  const gridRef = wgs84.toOsGrid()

  const e_km = Math.round(gridRef.easting / 1000)
  const n_km = Math.round(gridRef.northing / 1000)

  // Data alignment in ASC file is slightly out and needs calibrating
  const x = e_km - ADJUST_X
  const y = n_km - ADJUST_Y

  return total(x, y, dataset)
}
