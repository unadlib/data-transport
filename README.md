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
type IFrame = {
  hello: TransportData<{ num: number }, { text: string }>;
};
```

- Create transports

```ts
const internal: Transport<IFrame> = createTransport('IFrameInternal');
const external: Transport<any, IFrame> = createTransport('IFrameMain');

external.listen('hello', ({ request, respond }) => {
  respond({
    text: `hello ${request.num}`,
  });
});

expect(await internal.emit('hello', { num: 42 }).toEqual({ text: 'hello 42' });
```

> Another implementation based on inherited classes.

```ts
class InternalTransport extends IFrameTransport.IFrame<IFrame> {
  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

class ExternalTransport extends IFrameTransport.Main implements Receiver<IFrame> {
  @listen
  hello({ request, respond }: Listen<IFrame['hello']>) {
    respond({
      text: `hello ${request.num}`,
    });
  }
}

const internal = new InternalTransport();
const external = new ExternalTransport();

expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
```

## TODO

- [ ] refactor extension transport
- [ ] support retry
- [ ] support Network Request

## Examples

[Online about Broadcast](https://codesandbox.io/s/data-transport-example-lkg8k)
