import {
  Transport,
  Receiver,
  Request,
  CallBack,
  respond,
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

const worker = new Worker('worker.bundle.js');
const externalTransport = new ExternalTransport({
  listen: (callback) => {
    worker.onmessage = ({ data }: MessageEvent<any>) => {
      callback(data);
    };
  },
  send: (message: any) => worker.postMessage(message),
});
(window as any).externalTransport = externalTransport;
