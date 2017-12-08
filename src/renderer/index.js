// Bootstrap starting state for Yuffie

require("./index.css");

import inView from 'in-view';
import { shell, list, peek } from './templates';
import { readDir } from './utils';

const PUSH_LIMIT = 24;

const {dialog} = require('electron').remote

let files = [];
let lastPushedFile = 0;

const path = dialog.showOpenDialog({properties: ['openDirectory']});

document.getElementById('app').innerHTML = shell;

readDir(path[0]).then(dir => {
  for (let i = 0; i < dir.length; i++) {
    if (dir[i] !== undefined) {
      files.push(dir[i]);
    }
  }

  renderFiles();
  renderFiles();

  inView('.js-edge')
    .on('enter', () => {
      console.log('Rendering more items');
      renderFiles();
    })
});

function renderFiles() {
  const pushToThis = lastPushedFile !== 0 ? lastPushedFile + PUSH_LIMIT : PUSH_LIMIT;

  const items = [];

  for (lastPushedFile; lastPushedFile < pushToThis; lastPushedFile++) {
    if (files[lastPushedFile] !== undefined) {
      items.push({
        backgroundUrl: `file://${path + '/' + files[lastPushedFile]}`,
        datasetUrl: files[lastPushedFile]
      });
    }
  }

  list(items, lastPushedFile - PUSH_LIMIT).then(list => {
    document.querySelector('.list').insertAdjacentHTML('beforeend', list.join(''));

    document.querySelectorAll('.item').forEach(node => {
      node.addEventListener('click', function(event) {
        openPeek(event.target.dataset.image);
      }, false);
    })
  });
}

function openPeek(image) {
  const peekEl = document.querySelector('.js-peek');

  if (!peekEl) {
    document.querySelector('.list').insertAdjacentHTML('afterend', peek(`file://${path + '/' + image}`));
    document.body.classList.add('is-frozen');

    document.querySelector('.js-close-peek').addEventListener('click', function(event) {
      closePeek();
    }, false);

    document.addEventListener('keyup', handleEscOnPeek);
  }
}

function closePeek() {
  const peekEl = document.querySelector('.js-peek');

  if (peekEl) {
    peekEl.remove();
    document.body.classList.remove('is-frozen');
  }

  document.removeEventListener('keyup', handleEscOnPeek);
}

function handleEscOnPeek(event) {
  if (event.key == 'Escape') {
    closePeek();
  }
}