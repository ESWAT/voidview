import * as fs from 'fs';

export default function readDir(path) {
  return new Promise((res, rej) => {
    fs.readdir(path, (err, dir) => {
      if (err) {
        rej(err);
      } else {
        res(dir);
      }
    });
  });
}
