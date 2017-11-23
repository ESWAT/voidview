// Bootstrap starting state for Yuffie

const FILE_LIMIT = 100;

const fs = require('fs');
const {dialog} = require('electron').remote

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

      const item = document.querySelector('.js-list').appendChild(node);

      item.addEventListener('click', function(event) {
        console.log(event);
      }, false);
    }
  }
});

