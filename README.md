# data-transport

![Node CI](https://github.com/unadlib/data-transport/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/data-transport.svg)](http://badge.fury.io/js/data-transport)

A generic and responsible communication transporter

## Support Transport

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

- Define type

```ts
interface Internal {
  hello({ num: number }): Promise<{ text: string }>;
}
```

- Create transports

```ts
const internal: Transport<Internal> = createTransport('IFrameInternal');
const external: Transport<any, Internal> = createTransport('IFrameMain');

external.listen('hello', async (options) => ({ text: `hello ${options.num}` }));

expect(await internal.emit('hello', { num: 42 }).toEqual({ text: 'hello 42' });
```

## Todo
- [ ] support transport merging

## Examples

[Online with Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
