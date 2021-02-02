import { SharedWorkerTransport, listen } from 'data-transport';
import { Main } from './interface';

class SharedWorkerTransportService
  extends SharedWorkerTransport.Worker
  implements Main {
  @listen
  async help(options: { text: string }) {
    console.log('receive help', options);
    return {
      text: 'COPY!!!',
    };
  }
}

(self as any).sharedWorkerTransportService = new SharedWorkerTransportService();
