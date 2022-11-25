const inPolygon = require('point-in-polygon')
const ukOutline = require('../data/ukOutlinePolygon.json')

module.exports = function isInUK(point) {
  const isLng = typeof point[0] === 'number'
  const isLat = typeof point[1] === 'number'

  return isLng && isLat && inPolygon(point, ukOutline.features[0].geometry.coordinates[0])
}
