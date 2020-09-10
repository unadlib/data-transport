import { WorkerTransport, Receiver, Respond, listen } from 'data-transport';
import { Main, Worker } from './interface';

class WebWorkerTransport
  extends WorkerTransport.Worker<Worker>
  implements Receiver<Main> {
  @listen
  help({ request, respond }: Respond<Main['help']>) {
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
