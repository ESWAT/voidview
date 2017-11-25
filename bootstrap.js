// Bootstrap starting state for Yuffie

const FILE_LIMIT = 100;

const fs = require('fs');
const {dialog} = require('electron').remote

const path = dialog.showOpenDialog({properties: ['openDirectory']});

fs.readdir(path[0], function(err, dir) {
  if (dir) {
    const files = [];

    for (let i = 0; i < FILE_LIMIT; i++) {
      if (dir[i] !== undefined) {
        files.push(dir[i]);
      }
    }

    for (let file of files) {
      let node = document.createElement('div');
      node.classList.add('js-item', 'item');
      node.setAttribute('style', `background-image: url('${path + '/' + file}')`)
      node.dataset.image = file;

      const item = document.querySelector('.js-list').appendChild(node);

      item.addEventListener('click', function(event) {
        openPeek(event.target.dataset.image);
      }, false);
    }
  }
});

function openPeek(image) {
  const peekEl = document.querySelector('.js-peek');

  if (peekEl.classList.contains('is-none')) {
    const node = peekEl.querySelector('.js-peek-image');
    node.setAttribute('style', `background-image: url('${path + '/' + image}')`)
    peekEl.classList.remove('is-none');
    document.body.classList.add('is-frozen');

    node.querySelector('.js-close-peek').addEventListener('click', function(event) {
      closePeek();
    }, false);

    document.addEventListener('keyup', handleEscOnPeek);
  }
}

function closePeek() {
  const peekEl = document.querySelector('.js-peek');

  if (peekEl.classList.contains('is-none') === false) {
    peekEl.querySelector('.js-peek-image').removeAttribute('style');
    peekEl.classList.add('is-none');
    document.body.classList.remove('is-frozen');
  }

  document.removeEventListener('keyup', handleEscOnPeek);
}

function handleEscOnPeek(event) {
  if (event.key == 'Escape') {
    closePeek();
  }
}