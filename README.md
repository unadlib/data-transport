# data-transport

![Node CI](https://github.com/unadlib/data-transport/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/data-transport.svg)](http://badge.fury.io/js/data-transport)

A common transporter

## Support Transport

- iframe
- Network Request
- Broadcast
- Web Worker
- Service Worker
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
type Internal = {
  hello: TransportData<{ num: number }, { text: string }>;
};
```

- Implement class

```ts
class InternalTransport extends IFrameTransport.Internal<Internal> {
  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

class ExternalTransport extends IFrameTransport.External implements Receiver<Internal> {
  @respond
  hello({ request, callback }: Respond<Internal['hello']>) {
    callback({
      text: `hello ${request.num}`,
    });
  }
}

const internal = new InternalTransport();
const external = new ExternalTransport({
  iframe: document.getElementsByTagName('iframe')[0],
});

expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
```

## TODO

- [ ] support without decorator
- [ ] retry
