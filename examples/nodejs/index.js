const { createTransport } = require('../..');

const child = require('child_process').fork('./child.js')
const mainTransport = createTransport('MainProcess', {
  child,
});

mainTransport.emit('ready');

mainTransport.listen('done', (data) => {
  console.log('done', data);
  process.kill(child.pid)
})
