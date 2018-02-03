import * as fs from 'fs'

export default function readDir (path) {
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
