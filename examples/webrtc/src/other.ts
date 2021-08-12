import { WebRTCTransport, listen } from 'data-transport';
import SimplePeer from 'simple-peer';
import { Other, Main } from './interface';

class OtherTransport extends WebRTCTransport<Other> implements Main {
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

const init = () => {
  const peer = new SimplePeer({
    initiator: false,
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
    const otherTransport = new OtherTransport({
      // @ts-ignore
      peer,
    });
    (window as any).otherTransport = otherTransport;
    const button = document.createElement('button');
    button.textContent = 'sayHello';
    button.onclick = async () => {
      const data = await otherTransport.sayHello();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
