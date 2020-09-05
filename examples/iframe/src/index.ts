import {
  IFrameTransport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends IFrameTransport.External<External>
  implements Receiver<Internal> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello(
    request: Request<Internal['hello']>,
    callback: CallBack<Internal['hello']>
  ) {
    const input = document.getElementById('input') as HTMLInputElement;
    callback({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const useExternalTransport = (iframe: HTMLIFrameElement) =>
  new ExternalTransport({
    iframe,
  });

const init = () => {
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.src = 'http://127.0.0.1:8080/iframe.html';
  iframe.onload = () => {
    const externalTransport = useExternalTransport(iframe);
    const button = document.createElement('button');
    button.textContent = 'help';
    button.onclick = async () => {
      const response = await externalTransport.help();
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
