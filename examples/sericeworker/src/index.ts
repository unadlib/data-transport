import { ServiceWorkerTransport, listen } from 'data-transport';
import { Service, Client } from './interface';

class ClientTransport
  extends ServiceWorkerTransport.Client<Client>
  implements Service {
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

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('serviceworker.bundle.js');
  navigator.serviceWorker.ready.then((registration) => {
    (window as any).clientTransport = new ClientTransport({
      worker: registration.active!,
    });
  });
}

document.getElementById('btn')?.addEventListener('click', async () => {
  const response = await (window as any).clientTransport.help();
  const div = document.createElement('div');
  div.innerText = `${new Date()}: ${JSON.stringify(response)}`;
  document.body.appendChild(div);
})
