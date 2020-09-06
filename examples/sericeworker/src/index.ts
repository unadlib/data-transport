import {
  ServiceWorkerTransport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends ServiceWorkerTransport.External<External>
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
    const input = document.getElementById('input') as HTMLInputElement;
    callback({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('serviceworker.bundle.js');
  navigator.serviceWorker.ready.then((registration) => {
    (window as any).externalTransport = new ExternalTransport({
      serviceWorker: registration.active!,
    });
  });
}