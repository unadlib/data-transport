import { WorkerTransport, Receiver, Respond, respond } from 'data-transport';
import { Main, Worker } from './interface';

class WebWorkerTransport
  extends WorkerTransport.Worker<Worker>
  implements Receiver<Main> {
  @respond
  help({ request, callback }: Respond<Main['help']>) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(self as any).webWorkerTransport = new WebWorkerTransport();
