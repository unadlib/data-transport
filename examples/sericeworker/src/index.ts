import {
  ServiceWorkerTransport,
  Receiver,
  Respond,
  respond,
} from 'data-transport';
import { Service, Client } from './interface';

class ExternalTransport
  extends ServiceWorkerTransport.Client<Client>
  implements Receiver<Service> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello({ request, callback }: Respond<Service['hello']>) {
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
