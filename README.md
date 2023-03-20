# data-transport

![Node CI](https://github.com/unadlib/data-transport/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/data-transport.svg)](http://badge.fury.io/js/data-transport)

A simple and responsible transport

## Motivation

Many front-end communication APIs based on JavaScript are almost one-way communication, and their communication interface are often different. In terms of communication interaction protocols, we need a common and responsive communication library that will help us communicate in any scenario very simply and easily. 

And It is also very easy to mock to be used for testing, and it is also easy to design a common interface that is compatible with multiple communication APIs.

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
- More transport port

## Usage

- Installation

```sh
yarn add data-transport
```

- Create transport in main page

```js
import { createTransport } from 'data-transport';

const external = createTransport('IFrameMain');
external.listen('hello', async (num) => ({ text: `hello ${num}` }));
```

- Create transport in the iframe

```js
import { createTransport } from 'data-transport'

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

<details>
<summary>Transport class</summary>

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
</details>

## Example

[Online with Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
