export const layout = `
  <div id="list" class="js-list list" class="clusterize-content"></div>
`

export const titlebar = `
  <div class="js-titlebar titlebar">Yuffie</div>
`

export const splash = `
  <div class="js-splash splash">
    <button class="js-splash-open splash-open">Open or drop folder here</button>
  </div>
`

export const drop = `
  <div class="js-drop drop">
    <p>Drop your folder to view</p>
  </div>
`

export const loader = `
  <div class="js-loader loader">
    <p>Loading</p>
  </div>
`

export const help = `
  <div class="js-help help">
    <span class="help-command">H/⬅︎ Select Left Image</span>
    <span class="help-command">J/⬇︎ Select Below Image</span>
    <span class="help-command">K/⬆︎ Select Above Image</span>
    <span class="help-command">L/➡ Select Right Image</span>
    <span class="help-command">Enter/Space View Image</span>
    <span class="help-command">⌘⇧O Open Image in Finder</span>
    <span class="help-command">⌘R Shuffle Images</span>
    <span class="help-command">⌘O Open…</span>
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
