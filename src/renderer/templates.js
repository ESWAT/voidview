export const layout = `
  <div id="list" class="js-list list" class="clusterize-content"></div>
`

export const titlebar = `
  <div class="js-titlebar titlebar"></div>
`

export function splash (logoUrl) {
  return `
    <div class="js-splash splash">
      <button class="js-splash-open splash-open">
        <img src="${`file://${logoUrl}`}" width="96">
        <span class="splash-open-text">Drop your images here</span>
      </button>
    </div>
  `
}

export const drop = `
  <div class="js-drop drop">
    <p>Drop folder to view</p>
  </div>
`

export const shuffler = `
  <div class="js-shuffler shuffler">
    ⤱
  </div>
`

export const loader = `
  <div class="js-loader loader">
  </div>
`

export const help = `
  <div class="js-help help">
    <div class="help-list">
      <span class="help-command"><span class="help-stroke">⬅︎/H</span> Previous Image</span>
      <span class="help-command"><span class="help-stroke">➡/L</span> Next Image</span>
      <span class="help-command"><span class="help-stroke">⏎/Space</span> Show Image</span>
      <span class="help-command"><span class="help-stroke">F</span> Toggle Zoom</span>
      <span class="help-command"><span class="help-stroke">⌘O</span> Open…</span>
      <span class="help-command"><span class="help-stroke">⌘⇧H</span> Toggle Help</span>
      <span class="help-command finder-command"><span class="help-stroke">⌘⇧O</span> Show in Finder</span>
    </div>
    <div class="help-list">
      <span class="help-command grid-command"><span class="help-stroke">⬆︎/K</span> Above Image</span>
      <span class="help-command grid-command"><span class="help-stroke">⬇︎/J</span> Below Image</span>
      <span class="help-command grid-command"><span class="help-stroke">GG</span> Go to Top</span>
      <span class="help-command grid-command"><span class="help-stroke">⇧G</span> Go to Bottom</span>
      <span class="help-command shuffle-command"><span class="help-stroke">⌘R</span> Shuffle Images</span>
    </div>
  </div>
`

export function peek (backgroundUrl) {
  return `
  <div class="js-peek peek">
    <img
      class="js-peek-image peek-image"
      src="${`file://${backgroundUrl}`}"
      data-image="${backgroundUrl}"
    />
  </div>
  `
}

function getItem (backgroundUrl, index) {
  return `
    <div
      class="js-item item"
      style='background-image: url("${`file://${backgroundUrl}`}")'
      data-image="${backgroundUrl}"
      data-index="${index}"
      tabindex="0"
    >
    </div>
  `
}

export function list (files) {
  return new Promise((resolve) => {
    const itemsToRender = []
    let row = '<li class="row">'

    files.forEach((file, index) => {
      if ((index % 6 === 0 && index !== 0)) {
        row = row.concat('</li>')
        itemsToRender.push(row)

        row = '<li class="row">'
      }

      row = row.concat(getItem(file, index))

      if (index === files.length - 1) {
        row = row.concat('</li>')
        itemsToRender.push(row)
      }
    })

    resolve(itemsToRender)
  })
}
