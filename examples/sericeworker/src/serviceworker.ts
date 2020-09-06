import {
  ServiceWorkerTransport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class InternalTransport
  extends ServiceWorkerTransport.Internal<Internal>
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

const internalTransport = new InternalTransport();

(self as any).internalTransport = internalTransport;
