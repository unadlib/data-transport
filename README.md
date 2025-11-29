# data-transport

![Node CI](https://github.com/unadlib/data-transport/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/data-transport.svg)](http://badge.fury.io/js/data-transport)
![license](https://img.shields.io/npm/l/data-transport)

**data-transport** orchestrates request-response messaging across iframes, workers, browser extensions, Node.js processes, Electron, BroadcastChannel, and WebRTC peers with one consistent API. Each transport handles connection setup, timeouts, and logging so you can focus on your payloads.

## Table of Contents
- [data-transport unlocks cross-context messaging](#data-transport-unlocks-cross-context-messaging)
- [Why data-transport reduces boilerplate](#why-data-transport-reduces-boilerplate)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Understand how transports are organized](#understand-how-transports-are-organized)
- [Combine advanced capabilities when you need them](#combine-advanced-capabilities-when-you-need-them)
- [Run the examples locally](#run-the-examples-locally)
- [Develop and contribute with confidence](#develop-and-contribute-with-confidence)

## data-transport unlocks cross-context messaging
The library exposes a small set of composable primitives: a base `Transport` class, the `createTransport` factory, decorators for registering listeners, and helpers for merging or mocking transports. All transports enforce the same request-response contract, share timeout handling, and use unique identifiers under the hood to avoid collisions.

## Why data-transport reduces boilerplate
- **One API everywhere.** Swap the transport key to reuse the same emit and listen code across iframes, workers, extensions, WebRTC, BroadcastChannel, or Node.js child processes.
- **Bi-directional by default.** Every emit returns a promise, and listeners can opt out of responding for fire-and-forget events.
- **Connection-aware transports.** Iframe, worker, and browser-extension transports delay sends until the peer reports that it is ready, exposing `onConnect` and `onDisconnect` hooks when the runtime supports them.
- **Structured logging and serialization.** Pass `serializer`, `timeout`, `prefix`, and `logger` options once to standardize payload formatting and diagnostics.
- **Testing-friendly helpers.** `mockPorts()` provides in-memory listeners for unit tests, while `merge()` fans out messages to multiple transports without re-registering listeners.

## Installation
Install from npm or yarn and let TypeScript discover the included type definitions.

```sh
npm install data-transport
# or
yarn add data-transport
# or
pnpm add data-transport
```

## Quick Start

Define interaction types:

```ts
type Internal = {
  hello(options: { num: number }, word: string): Promise<{ text: string }>;
};
```

Create transport in main page:

```ts
import { createTransport } from 'data-transport';

const external = createTransport<'IFrameMain', { listen: Internal }>('IFrameMain');
external.listen('hello', async (num) => ({ text: `hello ${num}` }));
```

Create transport in the iframe:

```ts
import { createTransport } from 'data-transport'

const internal = createTransport<'IFrameInternal', { emit: Internal }>('IFrameInternal');
expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({ text: 'hello 42 Universe' });
```


## Understand how transports are organized
`createTransport(name, options)` instantiates the matching transport class. The table lists the available keys and highlights when to use them.

| Transport key | Runtime | Highlights |
| --- | --- | --- |
| `MessageTransport` | Any window | Uses `window.postMessage` for simple page-to-page messaging. |
| `IFrameMain` | Host window | Targets a specific iframe, includes handshake and reload handling. |
| `IFrameInternal` | Iframe window | Connects back to the parent and syncs on reload. |
| `Broadcast` | Modern browsers | Wraps `BroadcastChannel`, configurable channel name or instance. |
| `WebWorkerClient` | Main thread | Sends transferable objects to a `Worker`, exposes `onConnect`. |
| `WebWorkerInternal` | Worker thread | Mirrors the client transport and queues emits until connected. |
| `SharedWorkerClient` | Page connected to a `SharedWorker` | Auto-sends connect and disconnect signals, exposes `onConnect`. |
| `SharedWorkerInternal` | Shared worker | Tracks ports, broadcasts to all clients, and surfaces `onConnect`/`onDisconnect`. |
| `ServiceWorkerClient` | Page controlled by a service worker | Handles Safari serialization quirks via the `useOnSafari` flag. |
| `ServiceWorkerService` | Service worker | Routes responses back to the correct client, supporting `_clientId`. |
| `BrowserExtensions` | Generic extension context | Bridges `browser.runtime.sendMessage` to transports. |
| `BrowserExtensionsMain` | Background/service worker script | Manages ports and emits connect/disconnect callbacks. |
| `BrowserExtensionsClient` | Content script or popup | Connects over `runtime.connect`, supports `onConnect`. |
| `ElectronMain` | Electron main process | Uses IPC to communicate with renderer windows. |
| `ElectronRenderer` | Electron renderer process | Talks back to the main process over the same channel. |
| `WebRTC` | WebRTC data channel | Chunks large payloads, queues writes when buffers fill. |
| `MainProcess` | Node.js parent process | Wraps `child.send`/`child.on`. |
| `ChildProcess` | Node.js child process | Wraps `process.send`/`process.on`. |

Each transport accepts the generic `TransportOptions` so you can override `listener`, `sender`, `timeout`, `serializer`, or `logger` to match your environment.

### Know What `TransportOptions` Controls
| Option | Required | Default | Purpose |
| --- | --- | --- | --- |
| `listener: (callback) => (() => void) \| void` | Yes | — | Attach a low-level event handler to the underlying channel. Return a disposer to avoid warnings from the constructor’s safety checks. |
| `sender: (message) => void` | Yes | — | Deliver outbound messages. Remove the `transfer` array before forwarding if the runtime demands it. |
| `timeout: number` | No | `60000` (ms) | Max wait before an emit rejects with a timeout warning when a response is expected. |
| `verbose: boolean` | No | `false` | Switch on structured logging for every send/receive. Use `logger` to pipe it elsewhere; otherwise `console.info` is used. |
| `prefix: string` | No | `DataTransport` | Namespace for action names. Helpful when multiple transports share the same channel. |
| `listenKeys: string[]` | No | `[]` | Class method names that should be auto-registered as listeners. In dev builds, calling them directly throws to prevent misuse. |
| `checkListen: boolean` | No | `true` | Keep dev-time guards that surface duplicate responses or missing listener decorators. Toggle off to silence those warnings in production. |
| `serializer: { stringify?: (data) => string; parse?: (text) => any }` | No | — | Supply custom codecs for runtimes with serialization constraints (e.g., structured cloning gaps). Both functions are optional, so you can enable only one direction. |
| `logger: (options) => void` | No | — | Replace the default verbose logger. Receives the raw request/response payload for auditing. |

Every custom transport you construct via `createTransport` simply forwards these options to the base `Transport` class, so you can rely on them in any environment (browser, worker, Node.js, or extensions).

## Combine advanced capabilities when you need them
### Decorate listeners to register once
Use the provided `@listen` decorator to attach class methods as listeners without exposing them for manual calls.

```ts
import { Transport, listen, mockPorts } from 'data-transport';

const ports = mockPorts();

class ExternalTransport extends Transport {
  constructor() {
    super(ports.create());
  }

  @listen
  async ping() {
    return 'pong';
  }
}
```

### Emit with fine-grained control
`emit` accepts either the event name or an options object. Set `respond: false` for fire-and-forget events, change `timeout`, pass `silent` to suppress timeout warnings, and use `_extra` to forward metadata without polluting your payload.

```ts
await transport.emit(
  { name: 'notify', respond: false, _extra: { source: 'dashboard' } },
  { status: 'ready' }
);
```

### Merge transports to broadcast widely
`merge(first, second, ...others)` combines transports so all listeners receive the same events while respecting the shared timeout, serializer, and logger.

```ts
import { createTransport, merge } from 'data-transport';

const broadcast = createTransport('Broadcast', {});
const serviceWorker = createTransport('ServiceWorkerClient', { worker });
const merged = merge(broadcast, serviceWorker);

await merged.emit('announce', { version: '5.0.3' });
```

### Mock ports to test without a runtime
`mockPorts()` provides in-memory `listener`/`sender` pairs so you can assert end-to-end flows in Jest or any node-based test runner.

```ts
const ports = mockPorts();
const internal = createTransport('Base', ports.main);
const external = createTransport('Base', ports.create());
```

### Rely on built-in connection lifecycles
Iframes, workers, browser extensions, and shared workers expose `.onConnect()` (and `.onDisconnect()` where supported) so you can delay expensive initialization until a peer is actually present. WebRTC transports buffer messages when the data channel is saturated and replay them once the browser signals that the buffer dropped below `bufferedAmountLow`.

## Run the examples locally
Real-world samples live in the `examples` directory, covering BroadcastChannel, browser extensions, Electron, iframes, Node.js, service workers, shared workers, WebRTC, and web workers.

- Clone the repository.
- Install dependencies with `yarn`.
- Run the example you care about by opening the matching folder (for example, `examples/webworker`) and following the instructions documented inside.
- Try the hosted BroadcastChannel demo on CodeSandbox: [data-transport Broadcast example](https://codesandbox.io/s/data-transport-example-lkg8k).

## Develop and contribute with confidence
- `yarn build` compiles TypeScript and bundles the distributable with Rollup.
- `yarn test` executes the Jest suite, including transport handshakes and serializer scenarios.
- `yarn clean` removes build artifacts, while `yarn prettier` enforces formatting in `src`.
- The project ships type definitions (`dist/index.d.ts`) so downstream TypeScript projects get autocomplete out of the box.

## License
[MIT](./LICENSE)
