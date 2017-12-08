// Bootstrap starting state for Yuffie

require("./index.css");

import { shell, list, peek } from './templates';

const FILE_LIMIT = 100;

const fs = require('fs');
const {dialog} = require('electron').remote

const items = [];

const path = dialog.showOpenDialog({properties: ['openDirectory']});

document.getElementById('app').innerHTML = shell;

fs.readdir(path[0], function(err, dir) {
  if (dir) {
    const files = [];

    for (let i = 0; i < FILE_LIMIT; i++) {
      if (dir[i] !== undefined) {
        files.push(dir[i]);
      }
    }

    for (let file of files) {
      items.push({
        backgroundUrl: `file://${path + '/' + file}`,
        datasetUrl: file
      });
    }

    list(items)
      .then(list => {
        document.querySelector('.list').insertAdjacentHTML('beforeend', list.join(''));

        document.querySelectorAll('.item').forEach(node => {
          node.addEventListener('click', function(event) {
            openPeek(event.target.dataset.image);
          }, false);
        })
      });
  }
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