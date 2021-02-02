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
- Browser Extension
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

> Another implementation based on inherited classes.

```ts
interface Internal {
  hello({ num: number }): Promise<{ text: string }>;
}

class InternalTransport extends IFrameTransport.IFrame<Internal> implement Internal {
  async hello(options: { num: number }) {
    const response = await this.emit('hello', options);
    return response;
  }
}

class ExternalTransport extends IFrameTransport.Main implements Internal {
  @listen
  async hello(options: { num: number }) {
    return {
      text: `hello ${options.num}`,
    };
  }
}

const internal = new InternalTransport();
const external = new ExternalTransport();

expect(await internal.hello({ num: 42 })).toEqual({ text: 'hello 42' });
```

## TODO

- [ ] refactor extension transport

## Examples

[Online about Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
