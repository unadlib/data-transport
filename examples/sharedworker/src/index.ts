import { listen, SharedWorkerTransport } from 'data-transport';
import { Client, Worker } from './interface';

class ClientTransport
  extends SharedWorkerTransport.Client<{ emit: Client }>
  implements Worker
{
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    const div = document.createElement('div');
    div.innerText = `${new Date()}: ${response.text}`;
    document.body.appendChild(div);
  }

  @listen
  async hello(options: { num: number }) {
    console.log('receive help', options);
    return {
      text: 'COPY!!!',
    };
  }
}

const worker = new SharedWorker('worker.bundle.js');

// just mock async load
setTimeout(() => {
  (window as any).transport = new ClientTransport({
    worker,
    verbose: true,
  });

  (window as any).transport.onConnect(() => {
    console.log('onConnect');
  });

  document.getElementById('btn')?.addEventListener('click', () => {
    (window as any).transport.help();
  });
}, 1000);
