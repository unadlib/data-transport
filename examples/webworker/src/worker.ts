import { WorkerTransport, Receiver, Listen, listen } from 'data-transport';
import { Main, Worker } from './interface';

class WebWorkerTransport
  extends WorkerTransport.Worker<Worker>
  implements Receiver<Main> {
  @listen
  help({ request, respond }: Listen<Main['help']>) {
    respond({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(self as any).webWorkerTransport = new WebWorkerTransport();
