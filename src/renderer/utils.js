import * as fs from 'fs';

export function readDir(path) {
  return new Promise((res, rej) => {
    fs.readdir(path, (err, dir) => {
      err ? rej(err) : res(dir);
    });
  })
}