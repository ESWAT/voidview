const { spawn } = require('child_process')

const cmd = process.argv[2]
const plat = process.argv[3]

switch (cmd) {
  case 'dist':
    spawn('electron-builder', ['--x64', 'zip', `--${plat}`], { stdio: 'inherit' })
    break
  default:
    console.log('No command given')
    break
}
