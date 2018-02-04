import * as fs from 'fs'
import imageType from 'image-type'
import shuffle from 'shuffle-array'
import readChunk from 'read-chunk'
import Clusterize from 'clusterize.js'
import {ipcRenderer, remote, shell} from 'electron'
import {createFrag, readDir} from './utils'
import {layout, list, peek, splash, titlebar} from './templates'
import {KEY_COMBO_COOLDOWN, SUPPORTED_EXTENSIONS} from './constants'

require('./index.css')

let files = []
let path = []
let currentItem = -1
let clusterize
let lastKey = new KeyboardEvent(0)

// Prevent default viewport scrolling with arrow keys
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case ' ':
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault()
      break
    default:
      break
  }
})

setupSplashScreen()
setupTitlebar()
setupDropScreen()
setupCommands()

function setupSplashScreen () {
  document.getElementById('app').innerHTML = splash
  document.querySelector('.js-splash-open').addEventListener('click', () => {
    readPath(remote.dialog.showOpenDialog({ properties: ['openDirectory'] }))
  })
}

function setupTitlebar () {
  document.body.appendChild(createFrag(titlebar))
  ipcRenderer.on('blur', () => {
    document.querySelector('.js-titlebar').classList.add('is-blurred')
  })
  ipcRenderer.on('focus', () => {
    document.querySelector('.js-titlebar').classList.remove('is-blurred')
  })
}

function setupDropScreen () {
  document.addEventListener('dragover', (event) => {
    event.preventDefault()
  })

  document.addEventListener('drop', (event) => {
    event.preventDefault()
    readPath([event.dataTransfer.files[0].path])
  })
}

function setupCommands () {
  ipcRenderer.on('open', () => {
    readPath(remote.dialog.showOpenDialog({ properties: ['openDirectory'] }))
  })
  ipcRenderer.on('shuffle', () => {
    shuffleFiles()
  })
  ipcRenderer.on('reveal', () => {
    openExternally()
  })
}

function addListeners () {
  document.querySelector('.list').addEventListener('click', handleListClick)
  document.addEventListener('keyup', handleKeyUp)
}

function handleListClick (event) {
  if (event.target.classList.contains('item')) {
    openPeek(event.target)
  }
}

function handleKeyUp (event) {
  const peekEl = document.querySelector('.js-peek')

  if (peekEl) {
    switch (event.key) {
      case 'Escape':
      case ' ':
      case 'Enter':
        closePeek()
        break
      case 'ArrowLeft':
      case 'h':
      case 'Shift+Tab':
        changePeek(currentItem - 1)
        break
      case 'ArrowRight':
      case 'l':
      case 'Tab':
        changePeek(currentItem + 1)
        break
      default:
        break
    }
  } else {
    switch (event.key) {
      case 'Escape':
        currentItem = -1
        document.activeElement.blur()
        break
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10)
        break
      case 'Enter':
      case ' ':
        if (currentItem > -1) {
          openPeek(document.activeElement)
        }
        break
      case 'g':
        if (lastKey.key === 'g' && performance.now() < (lastKey.timeStamp + KEY_COMBO_COOLDOWN)) {
          document.querySelector('#app').scrollTop = 0
        }
        break
      case 'G':
        document.querySelector('#app').scrollTop = document.querySelector('.js-list').scrollHeight
        break
      case 'ArrowUp':
      case 'k':
        navigateUp()
        break
      case 'ArrowRight':
      case 'l':
        selectItem(currentItem < files.length ? currentItem + 1 : currentItem)
        break
      case 'ArrowDown':
      case 'j':
        if (currentItem < 0) {
          selectItem(currentItem + 1)
        } else {
          navigateDown()
        }
        break
      case 'ArrowLeft':
      case 'h':
        selectItem(currentItem > 0 ? currentItem - 1 : currentItem)
        break
      default:
        break
    }
  }

  lastKey = event
}

function renderFiles () {
  list(files, path).then((nodes) => {
    currentItem = -1

    if (clusterize) {
      clusterize.destroy(true)
    }

    clusterize = new Clusterize({
      rows: nodes,
      scrollId: 'app',
      contentId: 'list',
      rows_in_block: 8,
      blocks_in_cluster: 4,
      show_no_data_row: false,
      keep_parity: false
    })

    addListeners()
  })
}

function selectItem (newIndex) {
  if (newIndex >= 0 && newIndex < files.length) {
    currentItem = newIndex
    document.querySelector(`.js-item[data-index="${currentItem}"]`).focus()
  }
}

function shuffleFiles () {
  shuffle(files)
  renderFiles()
  document.querySelector('#app').scrollTop = 0
}

function navigateUp () {
  let activeRect = document.activeElement.getBoundingClientRect()

  let nextEl = document.elementFromPoint(activeRect.left, activeRect.top - 30)
  if (nextEl === null) {
    document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop - 52

    activeRect = document.activeElement.getBoundingClientRect()
    nextEl = document.elementFromPoint(activeRect.left, 30)
  } else {
    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function navigateDown () {
  let activeRect = document.activeElement.getBoundingClientRect()

  let nextEl = document.elementFromPoint(activeRect.left, activeRect.top + document.activeElement.clientHeight + 8)

  if (nextEl === null) {
    document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop + 50

    activeRect = document.activeElement.getBoundingClientRect()
    nextEl = document.elementFromPoint(activeRect.left, activeRect.top + document.activeElement.clientHeight + 8)
  } else {
    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function openExternally () {
  const { image } = document.querySelector(`.js-item[data-index="${currentItem}"]`).dataset

  shell.showItemInFolder(`${path}/${image}`)
}

function readPath (newPath) {
  if (!newPath) {
    return
  }

  document.getElementById('app').innerHTML = layout

  path = newPath
  files = []

  readDir(path[0]).then((dir) => {
    files = dir.filter((file) => {
      if (file !== undefined) {
        const fullPath = `${path}/${file}`

        if (fs.statSync(fullPath).isFile()) {
          const buf = readChunk.sync(fullPath, 0, 12)
          const type = imageType(buf)

          return type && SUPPORTED_EXTENSIONS.includes(type.ext)
        }
      }
    })

    // Helpful for debugging
    window.files = files

    ipcRenderer.send('path-loaded', true)

    renderFiles()

    document.querySelector('.js-titlebar').textContent = path.toString().split('/').slice(-1)
  })
}

function openPeek (item) {
  const peekEl = document.querySelector('.js-peek')

  if (!peekEl) {
    const newPeekEl = peek(`file://${path}/${item.dataset.image}`)

    document.querySelector('.list').insertAdjacentHTML('afterend', newPeekEl)
    document.body.classList.add('is-frozen')

    const peekImageEl = document.querySelector('.js-peek-image')

    document.querySelector('.js-peek-image').addEventListener('click', () => {
      if (!document.querySelector('.js-peek').classList.contains('is-removing')) {
        closePeek()
      }
    }, false)

    currentItem = parseInt(item.dataset.index, 10)

    peekImageEl.classList.add('is-appearing')

    peekImageEl.addEventListener('animationend', () => {
      if (document.body.classList.contains('is-frozen')) {
        document.querySelector('.js-list').classList.add('is-hidden')
      }
      peekImageEl.classList.remove('sweep-left', 'sweep-right', 'is-appearing')
    })
  }
}

function changePeek (newIndex) {
  if (document.querySelector(`.js-item[data-index="${newIndex}"]`)) {
    const peekImageEl = document.querySelector('.js-peek-image')

    if (newIndex > currentItem) {
      peekImageEl.classList.add('sweep-right')
    } else {
      peekImageEl.classList.add('sweep-left')
    }

    currentItem = newIndex
    const newItem = document.querySelector(`.js-item[data-index="${currentItem}"]`)
    const { image } = newItem.dataset

    newItem.focus()

    peekImageEl.setAttribute('style', `background-image: url("file://${path}/${image}")`)
  }
}

function closePeek () {
  const peekEl = document.querySelector('.js-peek')

  if (peekEl) {
    document.querySelector('.js-list').classList.remove('is-hidden')
    document.querySelector(`.js-item[data-index="${currentItem}"]`).focus()

    peekEl.classList.add('is-animating')
    peekEl.addEventListener('animationend', () => {
      peekEl.remove()
      document.body.classList.remove('is-frozen')
    })
  }
}
