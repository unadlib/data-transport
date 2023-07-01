import { SharedWorkerTransport, listen } from 'data-transport';
import { Client, Worker } from './interface';

class SharedWorkerTransportService
  extends SharedWorkerTransport.Worker<{ emit: Worker }>
  implements Client {

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

(self as any).transport = new SharedWorkerTransportService({
  verbose: true,
});

(self as any).transport.onConnect((id: string) => {
  console.log('onConnect', id);
});

(self as any).transport.onDisconnect((id: string) => {
  console.log('onDisconnect', id);
});
