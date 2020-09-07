import { WorkerTransport, Receiver, Respond, respond } from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends WorkerTransport.External<External>
  implements Receiver<Internal> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello({ request, callback }: Respond<Internal['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    callback({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const worker = new Worker('worker.bundle.js');
const externalTransport = new ExternalTransport({
  worker,
});
(window as any).externalTransport = externalTransport;
