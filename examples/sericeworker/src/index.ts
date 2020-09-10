import {
  ServiceWorkerTransport,
  Receiver,
  Listen,
  listen,
} from 'data-transport';
import { Service, Client } from './interface';

class ClientTransport
  extends ServiceWorkerTransport.Client<Client>
  implements Receiver<Service> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  hello({ request, respond }: Listen<Service['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    respond({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('serviceworker.bundle.js');
  navigator.serviceWorker.ready.then((registration) => {
    (window as any).clientTransport = new ClientTransport({
      serviceWorker: registration.active!,
    });
  });
}
