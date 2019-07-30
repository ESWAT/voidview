import * as fs from 'fs'
import nodePath from 'path'
import shuffle from 'fast-shuffle'
import Clusterize from 'clusterize.js'
import Store from 'electron-store'
import elementReady from 'element-ready'
import { ipcRenderer, remote, shell } from 'electron'
import { createFrag, readDir } from './utils'
import { gridStyle, help, layout, list, loader, peek, splash, titlebar } from './templates'
import { DEFAULT_COLUMNS, KEY_COMBO_COOLDOWN, OPEN_DIALOG_OPTIONS, SUPPORTED_EXTENSIONS, STORE_SCHEMA } from './constants'

require('./index.css')

const store = new Store({ schema: STORE_SCHEMA })
let files = []
let currentItem = -1
let clusterize
let lastKey = new KeyboardEvent(0)

setupWindowButton()
setupSplashScreen()
setupTitlebar()
setupDropScreen()
setupCommands()
setupGridStyle()
setupContain()

function setupWindowButton () {
  document.addEventListener('mouseenter', () => {
    ipcRenderer.send('toggle-window-button', true)
  })

  document.addEventListener('mouseleave', () => {
    ipcRenderer.send('toggle-window-button', false)
  })
}

function setupGridStyle () {
  document.head.appendChild(createFrag(gridStyle(store.get('columns'))))
}

function setupContain () {
  if (store.get('contain') === false) {
    document.body.classList.add('no-contain')
  }
}

function setupSplashScreen () {
  const logo = nodePath.join(__static, '/voidview-logo.svg')
  document.body.appendChild(createFrag(splash(logo)))
  enableZoomCommand(false)
  enableFitCommand(false)

  document.querySelector('.js-splash').classList.add('is-showing')
  document.querySelector('.js-splash-open').addEventListener('click', () => {
    readDesiredFiles(remote.dialog.showOpenDialog({ properties: OPEN_DIALOG_OPTIONS }))
  })
}

function setupTitlebar () {
  document.body.appendChild(createFrag(titlebar))
  // document.querySelector('.js-titlebar').setAttribute('style', 'animation-delay: 0.3s')
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
  ipcRenderer.on('increaseColumns', () => {
    changeColumnSize(store.get('columns') + 1)
  })
  ipcRenderer.on('decreaseColumns', () => {
    changeColumnSize(store.get('columns') - 1)
  })
  ipcRenderer.on('resetColumns', () => {
    changeColumnSize(DEFAULT_COLUMNS)
  })
  ipcRenderer.on('zoomImage', () => {
    toggleZoom()
  })
  ipcRenderer.on('fitImage', () => {
    const peekImageEl = document.querySelector('.js-peek-image')

    if (peekImageEl) {
      ipcRenderer.send('fit-image', [peekImageEl.clientWidth, peekImageEl.clientHeight])
    }
  })
}

function addListeners () {
  document.querySelector('.js-list').addEventListener('click', handleListClick)
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
        currentItem < 0 ? selectItem(currentItem + 1) : navigateDown()
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

function changeColumnSize (size) {
  document.querySelector('style').remove()

  store.set('columns', size)
  document.head.appendChild(createFrag(gridStyle(store.get('columns'))))
  renderFiles()
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
  list(files, store.get('columns')).then((nodes) => {
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
  const list = document.querySelectorAll('.js-item')
  files = shuffle(files)

  list.forEach((item, index) => {
    const durations = [0.2, 0.35, 0.5]

    item.style['animation-duration'] = `${durations[Math.floor(Math.random() * 3)]}s`
    item.classList.add('shuffling')
  })

  setTimeout(() => {
    renderFiles()
    document.querySelector('#app').scrollTop = 0
  }, 500)
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

  shell.showItemInFolder(decodeURI(image))
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
        files.push(encodeURI(fullPath))
        initialRender()
      } else {
        getImages(fullPath).then((paths) => {
          paths.map((path) => {
            files.push(encodeURI(path))
          })

          initialRender()
        })
      }
    } else {
      const promises = []

      for (let i = 0; i < desiredFiles.length; i++) {
        const fullPath = typeof desiredFiles[0] === 'object' ? desiredFiles[i].path : desiredFiles[i]

        if (!isFilePathADirectory(fullPath)) {
          files.push(encodeURI(fullPath))
        } else {
          const promise = new Promise((resolve) => {
            getImages(fullPath).then((paths) => {
              paths.map((path) => {
                files.push(encodeURI(path))
              })

              resolve()
            })
          })

          promises.push(promise)
        }
      }

      Promise.all(promises).then(() => {
        initialRender()
      })
    }
  }, { once: true })
}

function initialRender () {
  enableFinderCommand(false)
  enableShuffleCommand(true)
  enableColumnChanging(true)

  transitionToGrid()
  renderFiles()
}

async function transitionToGrid () {
  const promise = await elementReady('.list')

  if (promise) {
    let jsLoader = document.querySelector('.js-loader')
    jsLoader.classList.add('has-loaded')
    jsLoader.addEventListener('animationend', () => {
      jsLoader.remove()
      jsLoader = null
    }, { once: true })
  }
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
    const ext = nodePath.extname(filePath)
    if (ext && SUPPORTED_EXTENSIONS.includes(ext.substring(1, ext.length))) {
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

  document.querySelector('.js-peek').addEventListener('click', () => {
    if (!document.querySelector('.js-peek').classList.contains('is-removing')) {
      closePeek()
    }
  }, { capture: false, once: true })

  enableFinderCommand(true)
  enableShuffleCommand(false)
  enableColumnChanging(false)
  enableZoomCommand(true)
  enableFitCommand(!store.get('contain'))

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
  enableColumnChanging(true)
  enableZoomCommand(false)
  enableFitCommand(false)
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
  store.set('contain', !store.get('contain'))
  document.body.classList.toggle('no-contain')

  enableFitCommand(document.querySelector('.js-peek') && !store.get('contain'))
}

function enableZoomCommand (state) {
  toggleCommand('zoom', state)
}

function enableFitCommand (state) {
  toggleCommand('fit', state)
}

function enableFinderCommand (state) {
  toggleCommand('finder', state)
}

function enableShuffleCommand (state) {
  toggleCommand('shuffle', state)
}

function enableColumnChanging (state) {
  toggleCommand('columns', state)
}

function toggleCommand (command, state) {
  ipcRenderer.send(`enable-${command}-command`, state)

  if (state) {
    document.body.classList.add(`can-${command}`)
  } else {
    document.body.classList.remove(`can-${command}`)
  }
}
