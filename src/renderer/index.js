import * as fs from 'fs'
import nodePath from 'path'
import imageType from 'image-type'
import shuffle from 'shuffle-array'
import readChunk from 'read-chunk'
import Clusterize from 'clusterize.js'
import { ipcRenderer, remote, shell } from 'electron'
import { createFrag, readDir } from './utils'
import { help, layout, list, loader, peek, shuffler, splash, titlebar } from './templates'
import { KEY_COMBO_COOLDOWN, OPEN_DIALOG_OPTIONS, SUPPORTED_EXTENSIONS } from './constants'

require('./index.css')

let files = []
let path = []
let currentItem = -1
let clusterize
let lastKey = new KeyboardEvent(0)

setupSplashScreen()
setupTitlebar()
setupDropScreen()
setupCommands()

function setupSplashScreen () {
  const logo = nodePath.join(__static, '/voidview-logo.svg')
  document.body.appendChild(createFrag(splash(logo)))

  document.querySelector('.js-splash').classList.add('is-showing')
  document.querySelector('.js-splash-open').addEventListener('click', () => {
    readDesiredFiles(remote.dialog.showOpenDialog({ properties: OPEN_DIALOG_OPTIONS }))
  }, { once: true })
}

function setupTitlebar () {
  document.body.appendChild(createFrag(titlebar))
}

function setupDropScreen () {
  document.addEventListener('dragover', (event) => {
    event.preventDefault()

    if (event.dataTransfer.types[0] === 'Files') {
      document.querySelector('.js-splash').classList.add('is-dragging')
    }
  })

  document.addEventListener('dragleave', (event) => {
    event.preventDefault()
    document.querySelector('.js-splash').classList.remove('is-dragging')
  })

  document.addEventListener('drop', (event) => {
    event.preventDefault()
    if (event.dataTransfer.files.length > 0) {
      readDesiredFiles(event.dataTransfer.files)
    }
  })
}

function setupCommands () {
  ipcRenderer.on('open', () => {
    readDesiredFiles(remote.dialog.showOpenDialog({ properties: OPEN_DIALOG_OPTIONS }))
  })
  ipcRenderer.on('shuffle', () => {
    shuffleFiles()
  })
  ipcRenderer.on('reveal', () => {
    openExternally()
  })
  ipcRenderer.on('help', () => {
    if (files.length > 0) {
      toggleHelp()
    }
  })
}

function addListeners () {
  document.querySelector('.list').addEventListener('click', handleListClick)
  document.addEventListener('keyup', handleKeyUp)

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
      case 'f':
        toggleZoom()
        break
      default:
        break
    }
  } else {
    switch (event.key) {
      case 'Escape':
        deselectItems()
        break
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10)
        enableFinderCommand(true)
        break
      case 'Enter':
      case ' ':
        if (currentItem > -1) {
          openPeek(document.activeElement)
        }
        break
      case 'g':
        if (lastKey.key === 'g' && performance.now() < (lastKey.timeStamp + KEY_COMBO_COOLDOWN)) {
          const padding = document.querySelector('.clusterize-extra-row')
          if (padding) {
            document.querySelector('#app').scrollTop = 0 - padding.style.height
          }
          setTimeout(() => {
            document.querySelector('#app').scrollTop = 0
          }, 0)
          deselectItems()
        }
        break
      case 'G':
        document.querySelector('#app').scrollTop = document.querySelector('.js-list').scrollHeight
        deselectItems()
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

function toggleHelp () {
  let helpEl = document.querySelector('.js-help')

  if (!helpEl) {
    document.body.appendChild(createFrag(help))
    helpEl = document.querySelector('.js-help')
    helpEl.addEventListener('click', () => {
      toggleHelp(false)
    })
  } else {
    helpEl.classList.add('is-removing')
    helpEl.addEventListener('animationend', () => {
      helpEl.remove()
      helpEl = null
    }, { once: true })
  }
}

function renderFiles () {
  list(files).then((nodes) => {
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
      keep_parity: false,
      callbacks: {
        clusterChanged: () => {
          if (currentItem >= 0) {
            selectItem(currentItem)
          }
        }
      }
    })

    let jsLoader = document.querySelector('.js-loader')
    if (jsLoader) {
      jsLoader.classList.add('has-loaded')
      jsLoader.addEventListener('animationend', () => {
        jsLoader.remove()
        jsLoader = null
      }, { once: true })
    }

    addListeners()
  })
}

function deselectItems () {
  enableFinderCommand(false)
  currentItem = -1
  document.activeElement.blur()
}

function selectItem (newIndex) {
  if (isNaN(newIndex) || newIndex < 0 || newIndex > files.length) {
    return
  }

  currentItem = newIndex
  const element = document.querySelector(`.js-item[data-index="${currentItem}"]`)

  if (element) {
    enableFinderCommand(true)
    element.focus()
  }
}

function shuffleFiles () {
  shuffle(files)
  renderFiles()

  document.querySelector('#app').scrollTop = 0

  let shufflerEl = document.querySelector('.js-shuffler')

  if (shufflerEl) {
    shufflerEl.remove()
  }

  shufflerEl = document.body.appendChild(createFrag(shuffler))
}

function navigateUp () {
  if (currentItem === -1) {
    document.querySelector('#app').scrollTop = document.querySelector('.js-list').scrollHeight
    selectItem(files.length - 1)
  } else if (document.querySelector(`.js-item[data-index="${currentItem}"]`)) {
    let activeRect = document.activeElement.getBoundingClientRect()

    let nextEl = document.elementFromPoint(activeRect.left, activeRect.top - 30)
    if (nextEl === null) {
      document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop - 52

      activeRect = document.activeElement.getBoundingClientRect()
      nextEl = document.elementFromPoint(activeRect.left, 30)
    }

    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function navigateDown () {
  if (currentItem === -1) {
    document.querySelector('#app').scrollTop = document.querySelector('.js-list').scrollHeight
    selectItem(files.length - 1)
  } else if (document.querySelector(`.js-item[data-index="${currentItem}"]`)) {
    let activeRect = document.activeElement.getBoundingClientRect()

    let nextEl = document.elementFromPoint(activeRect.left, activeRect.top + document.activeElement.clientHeight + 8)

    if (nextEl === null) {
      document.querySelector('#app').scrollTop = document.querySelector('#app').scrollTop + 100

      activeRect = document.activeElement.getBoundingClientRect()
      nextEl = document.elementFromPoint(activeRect.left, activeRect.top + document.activeElement.clientHeight + 8)
    }

    selectItem(nextEl ? parseInt(nextEl.dataset.index, 10) : currentItem)
  }
}

function openExternally () {
  const { image } = document.querySelector(`.js-item[data-index="${currentItem}"]`).dataset

  shell.showItemInFolder(image)
}

function readDesiredFiles (desiredFiles) {
  if (!desiredFiles) {
    return
  }
  files = []
  document.querySelector('.js-splash').classList.remove('is-showing', 'is-dragging')
  document.getElementById('app').insertAdjacentHTML('afterend', loader)

  document.querySelector('.js-loader').addEventListener('animationend', () => {
    document.getElementById('app').innerHTML = layout
    if (desiredFiles.length === 1) {
      const fullPath = typeof desiredFiles[0] === 'object' ? desiredFiles[0].path : desiredFiles[0]
      if (!isFilePathADirectory(fullPath)) {
        files.push(fullPath)
        initialRender()
      } else {
        getImages(fullPath).then((paths) => {
          paths.map((path) => {
            files.push(path)
          })

          initialRender()
        })
      }
    } else {
      for (let i = 0; i < desiredFiles.length; i++) {
        const fullPath = typeof desiredFiles[0] === 'object' ? desiredFiles[i].path : desiredFiles[i]

        if (!isFilePathADirectory(fullPath)) {
          files.push(fullPath)
        }
      }

      initialRender()
    }
  }, { once: true })
}

function initialRender () {
  enableFinderCommand(false)
  enableShuffleCommand(true)

  renderFiles()
}

function getImages (path) {
  return new Promise((resolve) => {
    const paths = []

    readDir(path).then((dir) => {
      dir.map((file) => {
        if (file !== undefined) {
          const fullPath = `${path}/${file}`

          if (!isFilePathADirectory(fullPath)) {
            paths.push(fullPath)
          }
        }
      })
    }).then(() => {
      resolve(paths)
    })
  })
}

function isFilePathADirectory (filePath) {
  if (fs.statSync(filePath).isFile()) {
    const buf = readChunk.sync(filePath, 0, 12)
    const type = imageType(buf)

    if (type && SUPPORTED_EXTENSIONS.includes(type.ext)) {
      return false
    }
  }

  return true
}

function openPeek (item) {
  const peekEl = document.querySelector('.js-peek')

  if (peekEl) {
    return
  }

  document.body.classList.add('is-peeking')
  const newPeekEl = peek(item.dataset.image)

  document.querySelector('.list').insertAdjacentHTML('afterend', newPeekEl)
  document.body.classList.add('is-frozen')

  const peekImageEl = document.querySelector('.js-peek-image')

  document.querySelector('.js-peek-image').addEventListener('click', () => {
    if (!document.querySelector('.js-peek').classList.contains('is-removing')) {
      closePeek()
    }
  }, { capture: false, once: true })

  enableFinderCommand(true)
  enableShuffleCommand(false)

  currentItem = parseInt(item.dataset.index, 10)

  peekImageEl.classList.add('is-appearing')
  positionPeekImage()

  peekImageEl.addEventListener('animationend', () => {
    if (document.body.classList.contains('is-frozen')) {
      document.querySelector('.js-list').classList.add('is-zero')
    }
    peekImageEl.classList.remove('sweep-left', 'sweep-right', 'is-appearing')
  })
}

function changePeek (newIndex) {
  if (!document.querySelector(`.js-item[data-index="${newIndex}"]`)) {
    return
  }

  const peekImageEl = document.querySelector('.js-peek-image')

  peekImageEl.classList.add(`sweep-${newIndex > currentItem ? 'right' : 'left'}`)

  currentItem = newIndex
  const newItem = document.querySelector(`.js-item[data-index="${currentItem}"]`)
  const { image } = newItem.dataset

  newItem.focus()

  peekImageEl.setAttribute('src', `file://${image}`)
  positionPeekImage()
}

function positionPeekImage () {
  if (document.body.classList.contains('no-contain')) {
    const peek = document.querySelector('.js-peek')
    const peekImageEl = document.querySelector('.js-peek-image')

    peek.scrollTop = (peekImageEl.clientHeight - document.querySelector('#app').clientHeight) / 2
    peek.scrollLeft = (peekImageEl.clientWidth - document.querySelector('#app').clientWidth) / 2
  }
}

function closePeek () {
  const peekEl = document.querySelector('.js-peek')

  if (!peekEl) {
    return
  }

  enableShuffleCommand(true)
  document.body.classList.remove('is-peeking')

  document.querySelector('.js-list').classList.remove('is-zero')
  document.querySelector(`.js-item[data-index="${currentItem}"]`).focus()

  peekEl.classList.add('is-animating')
  peekEl.addEventListener('animationend', () => {
    peekEl.remove()
    document.body.classList.remove('is-frozen')
  }, { once: true })
}

function toggleZoom () {
  document.body.classList.toggle('no-contain')
}

function enableFinderCommand (state) {
  ipcRenderer.send('enable-finder-command', state)

  if (state) {
    document.body.classList.add('can-finder')
  } else {
    document.body.classList.remove('can-finder')
  }
}

function enableShuffleCommand (state) {
  ipcRenderer.send('enable-shuffle-command', state)

  if (state) {
    document.body.classList.add('can-shuffle')
  } else {
    document.body.classList.remove('can-shuffle')
  }
}
