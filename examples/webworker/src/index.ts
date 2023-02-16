import { WorkerTransport, listen } from 'data-transport';
import { Worker, Main } from './interface';

class MainTransport
  extends WorkerTransport.Main<{ listen: Main }>
  implements Worker {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  async hello(options: { num: number }) {
    console.log('receive hello', options);
    const input = document.getElementById('input') as HTMLInputElement;
    return {
      text: `hello ${input?.value || 'anonymous'}, ${options.num}`,
    };
  }
}

const worker = new Worker('worker.bundle.js');

(window as any).mainTransport = new MainTransport({
  worker,
});

document.getElementById('btn')?.addEventListener('click', async () => {
  const response = await (window as any).mainTransport.help();
  const div = document.createElement('div');
  div.innerText = `${new Date()}: ${JSON.stringify(response)}`;
  document.body.appendChild(div);
});
