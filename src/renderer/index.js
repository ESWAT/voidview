import fileType from 'file-type'
import shuffle from 'shuffle-array'
import readChunk from 'read-chunk'
import * as fs from 'fs'
import Clusterize from 'clusterize.js'
import { ipcRenderer, remote, shell } from 'electron'
import { titlebar, layout, list, peek, splash } from './templates'
import readDir from './utils'
import SUPPORTED_EXTENSIONS from './constants'

require('./index.css')

let files = []
let path = []
let currentItem = -1
let clusterize

bootstrap()

ipcRenderer.on('open', () => {
  const newPath = remote.dialog.showOpenDialog({ properties: ['openDirectory'] })

  if (newPath) {
    document.getElementById('app').innerHTML = layout
    readPath(path = newPath)
  }
})

ipcRenderer.on('shuffle', () => {
  shuffleFiles()
})

ipcRenderer.on('reveal', () => {
  openFile()
})

ipcRenderer.on('blur', () => {
  document.querySelector('.js-titlebar').classList.add('is-blurred')
})

ipcRenderer.on('focus', () => {
  document.querySelector('.js-titlebar').classList.remove('is-blurred')
})

function bootstrap () {
  document.body.appendChild(document.createRange().createContextualFragment(titlebar))
  document.getElementById('app').innerHTML = splash

  document.addEventListener('dragover', (event) => {
    event.preventDefault()
  })

  document.addEventListener('drop', (event) => {
    event.preventDefault()
    path = [event.dataTransfer.files[0].path]
    document.getElementById('app').innerHTML = layout
    document.querySelector('#app').classList.add('clusterize-scroll')
    files = []
    currentItem = -1

    document.querySelector('.js-list').innerHTML = ''
    readPath()
  })

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

  document.querySelector('.js-splash-open').addEventListener('click', () => {
    const newPath = remote.dialog.showOpenDialog({ properties: ['openDirectory'] })

    if (newPath) {
      document.getElementById('app').innerHTML = layout
      path = newPath
      readPath()
    }
  })
}

function addListeners () {
  document.querySelector('.list').addEventListener('click', listListeners)
  document.addEventListener('keyup', imageListeners)
}

function listListeners (event) {
  if (event.target.classList.contains('item')) {
    openPeek(event.target)
  }
}

function imageListeners (event) {
  const peekEl = document.querySelector('.js-peek')

  if (peekEl) {
    switch (event.key) {
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10)
        changePeek(currentItem)
        break
      default:
        break
    }
  } else {
    switch (event.key) {
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10)
        break
      case 'Enter':
      case ' ':
        if (currentItem >= 0) {
          openPeek(document.activeElement)
        }
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
}

function renderFiles () {
  list(files, path).then((nodes) => {
    currentItem = -1
    document.querySelector('.js-list').innerHTML = ''
    document.scrollTop = 0

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
  currentItem = newIndex
  document.querySelector(`.js-item[data-index="${currentItem}"]`).focus()
}

function shuffleFiles () {
  shuffle(files)
  currentItem = -1
  if (clusterize) {
    clusterize.destroy()
  }
  document.querySelector('.js-list').innerHTML = ''
  renderFiles()
  document.querySelector('#app').scrollTop = 0
}

function navigateUp () {
  let nextEl = document.elementFromPoint(document.activeElement.getBoundingClientRect().left, document.activeElement.getBoundingClientRect().top - 30)
  if (nextEl === null) {
    document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop - 52

    nextEl = document.elementFromPoint(document.activeElement.getBoundingClientRect().left, 30)
  }
  if (nextEl !== null) {
    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function navigateDown () {
  let nextEl = document.elementFromPoint(document.activeElement.getBoundingClientRect().left, document.activeElement.getBoundingClientRect().top + document.activeElement.clientHeight + 8)

  if (nextEl === null) {
    document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop + 50

    nextEl = document.elementFromPoint(document.activeElement.getBoundingClientRect().left, document.activeElement.getBoundingClientRect().top + document.activeElement.clientHeight + 8)
  }
  if (nextEl !== null) {
    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function openFile () {
  const { image } = document.querySelector(`.js-item[data-index="${currentItem}"]`).dataset

  shell.showItemInFolder(`${path}/${image}`)
}

function readPath () {
  files = []

  readDir(path[0]).then((dir) => {
    files = dir.filter((file) => {
      if (file !== undefined) {
        const fullPath = `${path}/${file}`

        if (fs.statSync(fullPath).isFile()) {
          const buf = readChunk.sync(`${path}/${file}`, 0, 4100)
          const type = fileType(buf)

          if (type && SUPPORTED_EXTENSIONS.includes(type.ext)) {
            return true
          }
        }
      } else {
        return false
      }
    })

    ipcRenderer.send('path-loaded', true)
    if (clusterize) {
      clusterize.destroy(true)
    }
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

    document.addEventListener('keyup', handleKeyUpOnPeek)

    peekImageEl.classList.add('is-appearing')

    peekImageEl.addEventListener('animationend', () => {
      peekImageEl.classList.remove('sweep-left', 'sweep-right', 'is-appearing')
    })
  }
}

function changePeek (newIndex) {
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

function checkNewPeek (index) {
  return document.querySelector(`.js-item[data-index="${index}"]`)
}

function closePeek () {
  const peekEl = document.querySelector('.js-peek')

  if (peekEl) {
    document.querySelector(`.js-item[data-index="${currentItem}"]`).focus()

    peekEl.classList.add('is-animating')
    peekEl.addEventListener('animationend', () => {
      peekEl.remove()
      document.body.classList.remove('is-frozen')
    })
  }

  document.removeEventListener('keyup', handleKeyUpOnPeek)
}

function handleKeyUpOnPeek (event) {
  switch (event.key) {
    case 'Escape':
    case ' ':
    case 'Enter':
      closePeek()
      break
    case 'ArrowLeft':
    case 'h':
      if (checkNewPeek(currentItem - 1)) {
        changePeek(currentItem - 1)
      }
      break
    case 'ArrowRight':
    case 'l':
      if (checkNewPeek(currentItem + 1)) {
        changePeek(currentItem + 1)
      }
      break
    default:
      break
  }
}
