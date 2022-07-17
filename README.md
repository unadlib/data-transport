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
- Browser Extension
- Node.js
- WebRTC
- Electron

## Usage

- Installation

```sh
yarn add data-transport
```

- Create transports

```js
// index.js in main page
const external = createTransport('IFrameMain');
external.listen('hello', async (num) => ({ text: `hello ${num}` }));

// index.js in the iframe
const internal = createTransport('IFrameInternal');
expect(await internal.emit('hello', 42).toEqual({ text: 'hello 42' });
```

### APIs

- `createTransport()`
Create a transport instance by transport options.

- `mockPorts()`
Mock ports for testing.

- `merge()`
Merge multiple transports into one transport.

- `Transport`
  - `MessageTransport`
  - `IFrameMainTransport`
  - `IFrameInternalTransport`
  - `SharedWorkerMainTransport`
  - `SharedWorkerInternalTransport`
  - `ServiceWorkerClientTransport`
  - `ServiceWorkerServiceTransport`
  - `WorkerMainTransport`
  - `WorkerInternalTransport`
  - `BrowserExtensionsGenericTransport`
  - `BrowserExtensionsMainTransport`
  - `BrowserExtensionsClientTransport`
  - `ElectronMainTransport`
  - `ElectronRendererTransport`
  - `WebRTCTransport`
  - `BroadcastTransport`
  - `MainProcessTransport`
  - `ChildProcessTransport`

## Examples

[Online with Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
