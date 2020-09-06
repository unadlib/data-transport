import {
  Transport,
  Receiver,
  Request,
  CallBack,
  respond,
  ListenOptions
} from 'data-transport';
import { Internal, External } from './interface';

declare var self: ServiceWorkerGlobalScope;

class InternalTransport
  extends Transport<Internal>
  implements Receiver<External> {
  @respond
  help(
    request: Request<External['help']>,
    callback: CallBack<External['help']>
  ) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

const internalTransport = new InternalTransport({
  listen: (callback: (options: ListenOptions) => void) => {
    self.addEventListener('message', ({ data }) => {
      callback(data);
    });
  },
  send: (message: any) => {
    self.clients
      .matchAll()
      .then((all) => all.map((client) => client.postMessage(message)));
  },
});

(self as any).internalTransport = internalTransport;
