import {
  WorkerTransport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends WorkerTransport.External<External>
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

const worker = new Worker('worker.bundle.js');
const externalTransport = new ExternalTransport({
  worker,
});
(window as any).externalTransport = externalTransport;
