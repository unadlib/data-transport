import { WorkerTransport, Receiver, Respond, respond } from 'data-transport';
import { Worker, Main } from './interface';

class MainTransport
  extends WorkerTransport.Main<Main>
  implements Receiver<Worker> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello({ request, callback }: Respond<Worker['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    callback({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const worker = new Worker('worker.bundle.js');

(window as any).mainTransport = new MainTransport({
  worker,
});
