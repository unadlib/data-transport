const { createTransport } = require('../..');

const childTransport = createTransport('ChildProcess');

childTransport.listen('ready', () => {
  childTransport.emit('done', 42);
});
