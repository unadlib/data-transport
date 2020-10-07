import {
  SharedWorkerTransport,
  Receiver,
  Listen,
  listen,
} from 'data-transport';
import { Main } from './interface';

class SharedWorkerTransportService
  extends SharedWorkerTransport.Worker
  implements Receiver<Main> {
  @listen
  help({ request, respond }: Listen<Main['help']>) {
    respond({
      text: 'COPY!!!',
    });
  }
}

(self as any).sharedWorkerTransportService = new SharedWorkerTransportService();
