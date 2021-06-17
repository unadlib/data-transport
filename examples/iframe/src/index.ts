import { IFrameTransport, listen, messageTransport } from 'data-transport';
import { Main, IFrame } from './interface';

class MainTransport extends IFrameTransport.Main<Main> implements IFrame {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  async hello(options: { num: number }) {
    console.log('receive hello:', options);
    const input = document.getElementById('input') as HTMLInputElement;
    return {
      text: `hello ${input?.value || 'anonymous'}, ${options.num}`,
    };
  }
}

// @ts-ignore
window.messageTransport = messageTransport;

const useMainTransport = (iframe: HTMLIFrameElement) =>
  new MainTransport({
    iframe,
    prefix: 'test',
  });

const init = () => {
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.src = 'http://127.0.0.1:8080/iframe.html';
  iframe.onload = () => {
    const mainTransport = useMainTransport(iframe);
    const button = document.createElement('button');
    button.textContent = 'help';
    button.onclick = async () => {
      const response = await mainTransport.help();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${response.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  };
  document.body.appendChild(iframe);
  return iframe;
};

init();
