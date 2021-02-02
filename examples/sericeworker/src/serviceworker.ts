import { ServiceWorkerTransport, listen } from 'data-transport';
import { Service, Client } from './interface';

class ServiceTransport
  extends ServiceWorkerTransport.Service<Service>
  implements Client {
  @listen
  async help(options: { text: string }) {
    console.log('receive help', options);
    return {
      text: 'COPY!!!',
    };
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(self as any).serviceTransport = new ServiceTransport();
