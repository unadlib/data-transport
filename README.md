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

* Installation

```sh
yarn add data-transport
```

* Define type

```ts
type Internal = {
  hello(): TransportData<{ num: number }, { text: string }>;
};
```

* Implement class

```ts
class InternalTransport extends Transport<Internal> {
  constructor() {
    super({
      listen: (callback) =>
        window.addEventListener('message', ({ data }: MessageEvent<any>) =>
          callback(data)
        ),
      send: (message: any) => window.parent.postMessage(message, '*'),
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

class ExternalTransport extends Transport implements Receiver<Internal> {
  constructor() {
    super({
      listen: (callback) =>
        window.addEventListener('message', ({ data }: MessageEvent<any>) =>
          callback(data)
        ),
      send: (message: any) => window.frames[0].postMessage(message, '*'),
    });
  }

  @respond
  hello(
    request: Request<Internal['hello']>,
    callback: CallBack<Internal['hello']>
  ) {
    callback({
      text: `hello ${request.num}`,
    });
  }
}

const internal = new InternalTransport();
const external = new ExternalTransport();
expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
```
