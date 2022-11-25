const fs = require('fs')
const path = require('path')
const readline = require('readline')

module.exports = async function loadPopulationData() {
  const rows = []
  const filePath = path.join(__dirname, '../data/UK_residential_population_2011_1_km.asc')
  const fileStream = fs.createReadStream(filePath)

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (/^[0-9-]/.test(line)) {
      const items = line.trim().split(/\s+/)
      rows.push(items)
    }
  }

  rows.reverse()

  console.log(`Loaded ${rows.length} rows in ${rows[0].length} columns`)

  return rows
}
