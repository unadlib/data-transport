import {
  Transport,
  Receiver,
  Request,
  CallBack,
  respond,
  ListenOptions,
} from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends Transport<External>
  implements Receiver<Internal> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello(
    request: Request<Internal['hello']>,
    callback: CallBack<Internal['hello']>
  ) {
    callback({
      text: `hello, ${request.num}`,
    });
  }
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('serviceworker.bundle.js');
  navigator.serviceWorker.ready.then((registration) => {
    (window as any).externalTransport = new ExternalTransport({
      listen: (callback: (options: ListenOptions) => void) => {
        navigator.serviceWorker.addEventListener('message', ({ data }) => {
          callback(data);
        });
      },
      send: (message: any) => registration.active!.postMessage(message),
    });
  });
}
