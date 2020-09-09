import {
  ServiceWorkerTransport,
  Receiver,
  Respond,
  respond,
} from 'data-transport';
import { Service, Client } from './interface';

class InternalTransport
  extends ServiceWorkerTransport<Service>
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

const internalTransport = new InternalTransport();

(self as any).internalTransport = internalTransport;
