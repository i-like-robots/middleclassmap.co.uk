const groupNames = {
  COTE_BRASSERIE: 'Côte Brasserie',
  FARM_SHOP: 'Farm Shop',
  GAILS: 'Gailʼs Bakery',
  INDEPENDENT_CINEMA: 'Independent Cinema',
  JOHN_LEWIS: 'John Lewis',
  JOJO_MAMAN_BEBE: 'JoJo Maman Bébé',
  MICHELIN_AWARD: 'Restaurant with Michelin Award',
  NATIONAL_TRUST: 'National Trust Property',
  PETS_CORNER: 'Pets Corner',
  RHS_PARTNER_GARDEN: 'RHS Partner Garden',
  SPACE_NK: 'Space NK',
  SWEATY_BETTY: 'Sweaty Betty',
  THE_WHITE_COMPANY: 'The White Company',
  TROUVA_BOUTIQUE: 'Trouva Boutique',
}

const showGroupName = {
  COTE_BRASSERIE: false,
  FARM_SHOP: true,
  GAILS: true,
  INDEPENDENT_CINEMA: true,
  JOHN_LEWIS: false,
  JOJO_MAMAN_BEBE: false,
  MICHELIN_AWARD: true,
  NATIONAL_TRUST: true,
  PETS_CORNER: true,
  RHS_PARTNER_GARDEN: true,
  SPACE_NK: false,
  SWEATY_BETTY: false,
  THE_WHITE_COMPANY: false,
  TROUVA_BOUTIQUE: true,
}

// const groupWeights = {
//   COTE_BRASSERIE: 0.5,
//   FARM_SHOP: 0.4,
//   INDEPENDENT_CINEMA: 0.6,
//   JOHN_LEWIS: 1,
//   JOJO_MAMAN_BEBE: 0.6,
//   MICHELIN_AWARD: 0.8,
//   NATIONAL_TRUST: 0.5,
//   RHS_PARTNER_GARDEN: 0.5,
//   SPACE_NK: 0.6,
//   THE_WHITE_COMPANY: 0.6,
//   TROUVA_BOUTIQUE: 0.8,
// }

const groupSortOrder = {
  JOHN_LEWIS: 0,
  TROUVA_BOUTIQUE: 1,
  GAILS: 2,
  THE_WHITE_COMPANY: 3,
  SWEATY_BETTY: 4,
  SPACE_NK: 5,
  JOJO_MAMAN_BEBE: 6,
  INDEPENDENT_CINEMA: 7,
  MICHELIN_AWARD: 2,
  COTE_BRASSERIE: 8,
  PETS_CORNER: 9,
  RHS_PARTNER_GARDEN: 10,
  NATIONAL_TRUST: 11,
  FARM_SHOP: 12,
}

const groupImages = {
  COTE_BRASSERIE: 'cote.png',
  FARM_SHOP: 'farm.png',
  GAILS: 'gails.png',
  INDEPENDENT_CINEMA: 'ico.png',
  JOHN_LEWIS: 'johnlewis.png',
  JOJO_MAMAN_BEBE: 'jojo.png',
  MICHELIN_AWARD: 'bib.png',
  NATIONAL_TRUST: 'nationaltrust.png',
  PETS_CORNER: 'petscorner.png',
  RHS_PARTNER_GARDEN: 'rhs.png',
  SPACE_NK: 'spacenk.png',
  SWEATY_BETTY: 'sweatybetty.png',
  THE_WHITE_COMPANY: 'whitecompany.png',
  TROUVA_BOUTIQUE: 'trouva.png',
}

//
// Initialise map
//
window.mapboxgl.accessToken = 'pk.eyJ1IjoidGVhYm90IiwiYSI6IkszRzFnNGMifQ.oG8bSMmGKrM9DqRnWyVcYw'

const map = new window.mapboxgl.Map({
  container: 'map',
  minZoom: 5,
  maxZoom: 14,
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-2.547855, 54.5],
  zoom: 5,
})

const navigation = new window.mapboxgl.NavigationControl()
map.addControl(navigation, 'top-left')

const popup = new window.mapboxgl.Popup({
  closeOnClick: false,
})

map.on('load', function () {
  map.addSource('points', {
    type: 'geojson',
    data: './dataset.json',
  })

  //
  // Heatmap
  //
  map.addLayer({
    id: 'density',
    type: 'heatmap',
    source: 'points',
    maxzoom: 9,
    paint: {
      // Increase the heatmap weight based on frequency and point weight
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        // ['get', ['get', 'group'], ['literal', groupWeights]],
        // Weights are calculated based on local population
        ['get', 'weight'],
        0,
        0,
        6,
        1,
      ],
      // Increase the heatmap color weight weight by zoom level
      // heatmap-intensity is a multiplier on top of heatmap-weight
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      // Color ramp for heatmap, 0 (low) to 1 (high).
      // Begin color ramp at 0-stop with a 0-transparency color
      // to create a blur-like effect.
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(62, 139, 104, 0)',
        0.1,
        'rgba(62, 139, 104, 0.25)',
        0.2,
        '#509a4d',
        0.4,
        '#f7e6bc',
        0.6,
        '#e3a656',
        0.75,
        '#d9823d',
        1,
        '#b23847',
      ],
      // Adjust the heatmap radius by zoom level
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
      // Transition from heatmap to circle layer by zoom level
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 8, 1, 9, 0.25],
    },
  })

  //
  // Markers
  //
  for (const [group, image] of Object.entries(groupImages)) {
    map.loadImage(`./icons/${image}`, (error, resolvedImage) => {
      if (error) {
        console.error(error)
      } else {
        map.addImage(group, resolvedImage)
      }
    })
  }

  map.addLayer({
    id: 'markers',
    type: 'symbol',
    source: 'points',
    minzoom: 9,
    layout: {
      'icon-size': 0.1,
      'icon-image': ['get', 'group'],
      'icon-padding': 0,
      'icon-allow-overlap': true,
      'symbol-sort-key': ['get', ['get', 'group'], ['literal', groupSortOrder]],
    },
  })

  map.on('click', 'markers', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice()
    const { group, name, url } = e.features[0].properties

    const html = `
      <p>
        ${showGroupName[group] ? `<em>${groupNames[group]}</em><br>` : ''}
        <a href="${url}" target="_blank" rel="noopener">${
          showGroupName[group] ? name : groupNames[group]
        }</a>
      </p>
    `

    popup.setLngLat(coordinates).setHTML(html).addTo(map)
  })

  //
  // Filter UI
  //
  const menu = document.getElementById('menu')

  const activeGroups = new Set(Object.keys(groupNames))

  for (const group of activeGroups) {
    const name = groupNames[group]

    const control = document.createElement('div')
    control.textContent = name

    const toggle = document.createElement('button')
    toggle.setAttribute('title', `Hide ${name}`)
    toggle.setAttribute('aria-pressed', 'true')

    toggle.addEventListener('click', () => {
      const isActive = activeGroups.has(group)

      toggle.setAttribute('title', isActive ? `Show ${name}` : `Hide ${name}`)
      toggle.setAttribute('aria-pressed', isActive ? 'false' : 'true')

      isActive ? activeGroups.delete(group) : activeGroups.add(group)

      map.setFilter('density', ['in', ['get', 'group'], ['literal', [...activeGroups]]])
      map.setFilter('markers', ['in', ['get', 'group'], ['literal', [...activeGroups]]])
    })

    control.appendChild(toggle)
    menu.appendChild(control)
  }
})
