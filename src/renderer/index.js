// Bootstrap starting state for Yuffie

require("./index.css");

import inView from 'in-view';
import { remote } from 'electron';
import { shell, list, peek } from './templates';
import { readDir } from './utils';
import { PUSH_LIMIT } from './constants';

let files = [];
let lastPushedFile = 0;
let currentPeekIndex = 0;

document.getElementById('app').innerHTML = shell;

const path = remote.dialog.showOpenDialog({properties: ['openDirectory']});

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
        openPeek(event.target);
      }, false);
    })
  });

  console.log("Rendering more items…");
}

function openPeek(item) {
  const peekEl = document.querySelector('.js-peek');

  if (!peekEl) {
    const peekEl = peek(`file://${path + '/' + item.dataset.image}`);

    document.querySelector('.list').insertAdjacentHTML('afterend', peekEl);
    document.body.classList.add('is-frozen');

    document.querySelector('.js-close-peek').addEventListener('click', function(event) {
      closePeek();
    }, false);

    currentPeekIndex = item.dataset.index;

    document.addEventListener('keyup', handleKeysOnPeek);
  }
}

function changePeek() {
  const image = document.querySelector(`.js-item[data-index="${currentPeekIndex}"]`).dataset.image;
  const peekImageEl = document.querySelector('.js-peek-image');

  console.log(`Changing peek to ${currentPeekIndex}…`);

  peekImageEl.setAttribute('style', `background-image: url(file://${path + '/' + image})`);

  if (lastPushedFile - currentPeekIndex < PUSH_LIMIT) {
    renderFiles();
  }
}

function closePeek() {
  const peekEl = document.querySelector('.js-peek');

  if (peekEl) {
    peekEl.remove();
    document.body.classList.remove('is-frozen');
  }

  document.removeEventListener('keyup', handleKeysOnPeek);
}

function handleKeysOnPeek(event) {
  let currentIndex = parseInt(document.querySelector('.js-peek-image').dataset.index);
  let newImage = null;

  switch (event.key) {
    case 'Escape':
      closePeek();
      break;
    case 'ArrowLeft':
      currentPeekIndex--;
      changePeek();
      break;
    case 'ArrowRight':
      currentPeekIndex++;
      changePeek();
      break;
  }
}