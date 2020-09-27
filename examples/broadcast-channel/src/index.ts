import { Transport, Receiver, listen, Listen } from 'data-transport';
import { BroadcastChannel } from 'broadcast-channel';
import { Other, Main } from './interface';

class MainTransport
  extends Transport<Main>
  implements Receiver<Other> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  hello({ request, respond }: Listen<Other['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    respond({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const broadcastChannel = new BroadcastChannel('broadcastChannel_test');

const useMainTransport = () =>
  new MainTransport({
    listener: (callback) => {
      broadcastChannel.onmessage = (data) => {
        callback(data);
      };
    },
    sender: (message) => broadcastChannel.postMessage(message),
  });

const init = () => {
  window.addEventListener('load', () => {
    const mainTransport = useMainTransport();
    const button = document.createElement('button');
    button.textContent = 'help';
    button.onclick = async () => {
      const data = await mainTransport.help();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
