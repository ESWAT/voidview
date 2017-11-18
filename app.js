// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const fs = require('fs');
const {dialog} = require('electron').remote

const FILE_LIMIT = 10;

const path = dialog.showOpenDialog({properties: ['openDirectory']});

fs.readdir(path[0], function(err, dir) {
  if (dir) {
    const files = [];

    for (let i = 0; i < FILE_LIMIT; i++) {
      files.push(dir[i]);
    }

    for (let file of files) {
      let node = document.createElement('div');
      node.className = 'item';
      node.setAttribute('style', `background-image: url('${path + '/' + file}')`)

      document.querySelector('#list').appendChild(node);
    }
  }
});