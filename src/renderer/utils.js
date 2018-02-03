import * as fs from 'fs'

export function readDir (path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, dir) => {
      if (err) {
        reject(err)
      } else {
        resolve(dir)
      }
    })
  })
}

export function createFrag (string) {
  return document.createRange().createContextualFragment(string)
}
