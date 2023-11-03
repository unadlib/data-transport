import { IFrameTransport, listen } from 'data-transport';
import { Main, IFrame } from './interface';

class MainTransport
  extends IFrameTransport.Main<{ emit: Main }>
  implements IFrame
{
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

const useMainTransport = (iframe: HTMLIFrameElement) =>
  new MainTransport({
    iframe,
    checkListen: false,
    // prefix: 'test',
    sender: (message) => {
      if (iframe) {
        iframe.contentWindow!.postMessage(message, '*');
      } else if (window.frames[0]) {
        window.frames[0].postMessage(message, '*');
      } else {
        console.error('The current page does not have any iframe elements');
      }
      window.postMessage(message, '*');
    },
  });

const init = async () => {
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.src = 'http://localhost:8080/iframe.html';
  document.body.appendChild(iframe);
  let mainTransport: any;
  // @ts-ignore
  window.transport = mainTransport;
  const button = document.createElement('button');
  button.textContent = 'help';
  const handler = async () => {
    const response = await mainTransport.help();
    const div = document.createElement('div');
    div.innerText = `${new Date()}: ${response.text}`;
    document.body.appendChild(div);
  };
  button.onclick = handler;
  iframe.addEventListener('load', () => {
    console.log('iframe loaded');
  });
  document.body.appendChild(button);
  setTimeout(async () => {
    mainTransport = useMainTransport(iframe);
    // @ts-ignore
    window.transport = mainTransport;
    await handler();
  }, 1000);
  return iframe;
};

init();
