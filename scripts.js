const { spawn } = require('child_process')

const cmd = process.argv[2]
const plat = process.argv[3]

if (cmd === 'dist') {
  spawn('electron-builder', ['--x64', 'zip', `--${plat}`], { stdio: 'inherit' })
} else {
  console.log('No command given')
}
