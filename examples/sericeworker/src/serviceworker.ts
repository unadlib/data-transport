import {
  ServiceWorkerTransport,
  Receiver,
  Respond,
  listen,
} from 'data-transport';
import { Service, Client } from './interface';

class ServiceTransport
  extends ServiceWorkerTransport.Service<Service>
  implements Receiver<Client> {
  @listen
  help({ request, respond }: Respond<Client['help']>) {
    respond({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(self as any).serviceTransport = new ServiceTransport();
