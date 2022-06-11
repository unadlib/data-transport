# data-transport

![Node CI](https://github.com/unadlib/data-transport/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/data-transport.svg)](http://badge.fury.io/js/data-transport)

A simple and responsible transport

## Support Transport

`data-transport` is a generic and responsible communication transporter

- iframe
- Broadcast
- Web Worker
- Service Worker
- Shared Worker
- WebRTC
- Electron

## Usage

- Installation

```sh
yarn add data-transport
```

- Create transports

```js
// index.js
const external = createTransport('IFrameMain');
external.listen('hello', async (options) => ({ text: `hello ${options.num}` }));

// index.js in the iframe
const internal = createTransport('IFrameInternal');
expect(await internal.emit('hello', { num: 42 }).toEqual({ text: 'hello 42' });
```

## Todo
- [ ] support transport merging

## Examples

[Online with Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
