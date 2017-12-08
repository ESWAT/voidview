// Bootstrap starting state for Yuffie

require("./index.css");

import { shell, list, peek } from './templates';
import { readDir } from './utils';

const PUSH_LIMIT = 24;

const {dialog} = require('electron').remote

let files = [];
const lastPushedFile = null;

const path = dialog.showOpenDialog({properties: ['openDirectory']});

document.getElementById('app').innerHTML = shell;

readDir(path[0]).then(dir => {
  const items = [];

  for (let i = 0; i < dir.length; i++) {
    files.push(dir[i]);
  }

  for (let i = 0; i < PUSH_LIMIT; i++) {
    items.push({
      backgroundUrl: `file://${path + '/' + files[i]}`,
      datasetUrl: files[i]
    });
  }

  list(items).then(list => {
    document.querySelector('.list').insertAdjacentHTML('beforeend', list.join(''));

    document.querySelectorAll('.item').forEach(node => {
      node.addEventListener('click', function(event) {
        openPeek(event.target.dataset.image);
      }, false);
    })
  });
});

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