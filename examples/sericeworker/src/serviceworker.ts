import {
  ServiceWorkerTransport,
  Receiver,
  Respond,
  respond,
} from 'data-transport';
import { Service, Client } from './interface';

class ServiceTransport
  extends ServiceWorkerTransport.Service<Service>
  implements Receiver<Client> {
  @respond
  help({ request, callback }: Respond<Client['help']>) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(self as any).serviceTransport = new ServiceTransport();
