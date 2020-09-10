import { WorkerTransport, Receiver, Listen, listen } from 'data-transport';
import { Worker, Main } from './interface';

class MainTransport
  extends WorkerTransport.Main<Main>
  implements Receiver<Worker> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  hello({ request, respond }: Listen<Worker['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    respond({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const worker = new Worker('worker.bundle.js');

(window as any).mainTransport = new MainTransport({
  worker,
});
