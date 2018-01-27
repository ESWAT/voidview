// Bootstrap starting state for Yuffie

import inView from 'in-view';
import fileType from 'file-type';
import shuffle from 'shuffle-array';
import readChunk from 'read-chunk';
import * as fs from 'fs';
import { ipcRenderer, remote, shell } from 'electron';
import { titlebar, layout, list, peek, splash } from './templates';
import readDir from './utils';
import { PUSH_LIMIT, SUPPORTED_EXTENSIONS } from './constants';

require('./index.css');

let files = [];
let lastPushedFile = 0;
let currentItem = -1;

document.body.appendChild(document.createRange().createContextualFragment(titlebar));
document.getElementById('app').innerHTML = splash;

let path = [];

function bootstrap() {
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  document.addEventListener('drop', (event) => {
    event.preventDefault();
    path = [event.dataTransfer.files[0].path];
    document.getElementById('app').innerHTML = layout;
    files = [];
    lastPushedFile = 0;
    currentItem = -1;

    document.querySelector('.js-list').innerHTML = '';
    readPath();
  });

  document.querySelector('.js-splash-open').addEventListener('click', () => {
    const newPath = remote.dialog.showOpenDialog({ properties: ['openDirectory'] });

    if (newPath) {
      path = newPath;
      document.getElementById('app').innerHTML = layout;
      readPath();
    }
  });
}

bootstrap();

ipcRenderer.on('open', () => {
  const newPath = remote.dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (newPath) {
    path = newPath;
    lastPushedFile = 0;
    currentItem = -1;

    document.querySelector('.js-list').innerHTML = '';
    document.scrollTop = 0;
    readPath();
  }
});

ipcRenderer.on('shuffle', () => {
  shuffleFiles();
});

ipcRenderer.on('reveal', () => {
  openFile();
});

function renderFiles() {
  const pushToThis = lastPushedFile !== 0 ? lastPushedFile + PUSH_LIMIT : PUSH_LIMIT;

  const items = [];

  for (lastPushedFile; lastPushedFile < pushToThis; lastPushedFile += 1) {
    if (files[lastPushedFile] !== undefined) {
      items.push({
        backgroundUrl: `file://${path}/${files[lastPushedFile]}`,
        datasetUrl: files[lastPushedFile],
      });
    }
  }

  list(items, lastPushedFile - PUSH_LIMIT).then((list) => {
    document.querySelector('.list').insertAdjacentHTML('beforeend', list.join(''));

    document.querySelectorAll('.item').forEach((node) => {
      node.addEventListener('click', (event) => {
        openPeek(event.target);
      }, false);
    });
  });
}

function selectItem(newIndex) {
  currentItem = newIndex;
  document.querySelector(`.js-item[data-index="${currentItem}"]`).focus();
}

function shuffleFiles() {
  shuffle(files);
  lastPushedFile = 0;
  currentItem = -1;

  document.querySelector('.js-list').innerHTML = '';
  renderFiles();
  document.scrollTop = 0;
}

document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case ' ':
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();
      break;
    default:
      break;
  }
});

document.addEventListener('keyup', (event) => {
  const peekEl = document.querySelector('.js-peek');

  if (!peekEl) {
    switch (event.key) {
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10);
        break;
      case 'Enter':
      case ' ':
        if (currentItem >= 0) {
          openPeek(document.activeElement);
        }
        break;
      case 'ArrowUp':
        selectItem(currentItem - 6 >= 0 ? currentItem - 6 : currentItem);
        break;
      case 'ArrowRight':
        selectItem(currentItem < files.length ? currentItem + 1 : currentItem);
        break;
      case 'ArrowDown':
        if (currentItem < 0) {
          selectItem(currentItem + 1);
        } else {
          selectItem(currentItem + 6 <= lastPushedFile ? currentItem + 6 : currentItem);
        }
        break;
      case 'ArrowLeft':
        selectItem(currentItem > 0 ? currentItem - 1 : currentItem);
        break;
      default:
        break;
    }
  } else {
    switch (event.key) {
      case 'Tab':
        currentItem = parseInt(document.activeElement.dataset.index, 10);
        changePeek(currentItem);
        break;
      default:
        break;
    }
  }
});

function readPath() {
  files = [];
  readDir(path[0]).then((dir) => {
    for (let i = 0; i < dir.length; i += 1) {
      if (dir[i] !== undefined) {
        const fullPath = `${path}/${dir[i]}`;

        if (fs.statSync(fullPath).isFile()) {
          const buf = readChunk.sync(`${path}/${dir[i]}`, 0, 4100);
          const type = fileType(buf);

          if (type && SUPPORTED_EXTENSIONS.includes(type.ext)) {
            files.push(dir[i]);
          }
        }
      }
    }

    ipcRenderer.send('path-loaded', true);

    renderFiles();
    renderFiles();

    document.querySelector('.js-titlebar').textContent = path.toString().split('/').slice(-1);

    inView('.js-edge').on('enter', () => {
      renderFiles();
    });
  });
}

function openPeek(item) {
  const peekEl = document.querySelector('.js-peek');

  if (!peekEl) {
    const newPeekEl = peek(`file://${path}/${item.dataset.image}`);

    document.querySelector('.list').insertAdjacentHTML('afterend', newPeekEl);
    document.body.classList.add('is-frozen');

    document.querySelector('.js-peek-image').addEventListener('click', () => {
      closePeek();
    }, false);

    currentItem = parseInt(item.dataset.index, 10);

    document.addEventListener('keyup', handleKeyUpOnPeek);
  }
}

function changePeek(newIndex) {
  currentItem = newIndex;
  const newItem = document.querySelector(`.js-item[data-index="${currentItem}"]`);
  const { image } = newItem.dataset;
  const peekImageEl = document.querySelector('.js-peek-image');

  newItem.focus();

  peekImageEl.setAttribute('style', `background-image: url("file://${path}/${image}")`);

  if (lastPushedFile - currentItem < PUSH_LIMIT) {
    renderFiles();
  }
}

function openFile() {
  const { image } = document.querySelector(`.js-item[data-index="${currentItem}"]`).dataset;

  shell.showItemInFolder(`${path}/${image}`);
}

function checkNewPeek(index) {
  return document.querySelector(`.js-item[data-index="${index}"]`);
}

function closePeek() {
  const peekEl = document.querySelector('.js-peek');

  if (peekEl) {
    peekEl.remove();
    document.body.classList.remove('is-frozen');
  }

  document.removeEventListener('keyup', handleKeyUpOnPeek);
}

function handleKeyUpOnPeek(event) {
  switch (event.key) {
    case 'Escape':
    case ' ':
    case 'Enter':
      closePeek();
      break;
    case 'ArrowLeft':
      if (checkNewPeek(currentItem - 1)) {
        changePeek(currentItem - 1);
      }
      break;
    case 'ArrowRight':
      if (checkNewPeek(currentItem + 1)) {
        changePeek(currentItem + 1);
      }
      break;
    default:
      break;
  }
}
