import { WorkerTransport, listen } from 'data-transport';
import { Main, Worker } from './interface';

class WebWorkerTransport
  extends WorkerTransport.Worker<Worker>
  implements Main {
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

(self as any).webWorkerTransport = new WebWorkerTransport();
