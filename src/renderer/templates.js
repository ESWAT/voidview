export const layout = `
  <div id="list" class="js-list list" class="clusterize-content"></div>
`

export const titlebar = `
  <div class="js-titlebar titlebar">VoidView</div>
`

export const splash = `
  <div class="js-splash splash">
    <button class="js-splash-open splash-open">Open or drop folder here</button>
  </div>
`

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
      <span class="help-command"><span class="help-stroke">⏎/Space</span> Zoom Image</span>
      <span class="help-command grid-command"><span class="help-stroke">⬆︎/K</span> Above Image</span>
      <span class="help-command grid-command"><span class="help-stroke">⬇︎/J</span> Below Image</span>
      <span class="help-command grid-command"><span class="help-stroke">gg</span> Go to Top</span>
      <span class="help-command grid-command"><span class="help-stroke">⇧G</span> Go to Bottom</span>
    </div>
    <div class="help-list">
      <span class="help-command"><span class="help-stroke">⌘O</span> Open…</span>
      <span class="help-command"><span class="help-stroke">⌘⇧H</span> Toggle Help</span>
      <span class="help-command finder-command"><span class="help-stroke">⌘⇧O</span> Show in Finder</span>
      <span class="help-command shuffle-command"><span class="help-stroke">⌘R</span> Shuffle Images</span>
    </div>
  </div>
`

export function peek (backgroundUrl) {
  return `
  <div class="js-peek peek">
    <div
      class="js-peek-image peek-image"
      style='background-image: url("${backgroundUrl}")'
    >
    </div>
  </div>
  `
}

function getItem (backgroundUrl, datasetUrl, index) {
  return `
    <div
      class="js-item item"
      style='background-image: url("${backgroundUrl}")'
      data-image="${datasetUrl}"
      data-index="${index}"
      tabindex="0"
    >
    </div>
  `
}

export function list (files, path) {
  return new Promise((resolve) => {
    const itemsToRender = []
    let row = '<li class="row">'

    files.forEach((file, index) => {
      if ((index % 6 === 0 && index !== 0)) {
        row = row.concat('</li>')
        itemsToRender.push(row)

        row = '<li class="row">'
      }

      row = row.concat(getItem(`file://${path}/${file}`, file, index))

      if (index === files.length - 1) {
        row = row.concat('</li>')
        itemsToRender.push(row)
      }
    })

    resolve(itemsToRender)
  })
}
