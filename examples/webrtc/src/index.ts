import { WebRTCTransport, listen } from 'data-transport';
import SimplePeer from 'simple-peer';
import { Other, Main } from './interface';

const bigData = Array(10 ** 5 * 3)
  .fill(1)
  .map((_, i) => ({
    i: Math.random(),
  }));

class MainTransport extends WebRTCTransport<{ emit: Main }> implements Other {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!', bigData });
    return response;
  }

  @listen
  async hello(options: { num: number }) {
    console.log('receive hello', options);
    const input = document.getElementById('input') as HTMLInputElement;
    return {
      text: `hello ${input?.value || 'anonymous'}, ${options.num}`,
      bigData,
    };
  }
}

const init = () => {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
  });

  peer.on('signal', (data) => {
    document.querySelector('#outgoing')!.textContent = JSON.stringify(data);
  });

  document.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    peer.signal(
      JSON.parse((document.querySelector('#incoming')! as any).value)
    );
  });

  peer.on('connect', () => {
    const mainTransport = new MainTransport({
      // @ts-ignore
      peer,
    });
    (window as any).mainTransport = mainTransport;
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
