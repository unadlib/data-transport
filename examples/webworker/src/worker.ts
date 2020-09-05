import {
  Transport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class InternalTransport
  extends Transport<Internal>
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

const internalTransport = new InternalTransport({
  listen: (callback) => {
    self.onmessage = ({ data }: MessageEvent<any>) => {
      callback(data);
    };
  },
  // TODO: fix - https://github.com/microsoft/TypeScript/issues/12657
  send: (message: any) => (self as DedicatedWorkerGlobalScope).postMessage(message),
});

(self as any).internalTransport = internalTransport;
