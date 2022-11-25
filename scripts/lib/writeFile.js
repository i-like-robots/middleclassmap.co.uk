const fs = require('fs')
const path = require('path')

module.exports = function writeFile(data, fileName) {
  const outputPath = path.resolve(fileName)
  return fs.promises.writeFile(outputPath, JSON.stringify(data))
}
