import {
  Receiver,
  Transport,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class ExternalTransport
  extends Transport<External>
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
    callback({
      text: `hello ${request.num}`,
    });
  }
}

const init = (load: (iframe: HTMLIFrameElement) => void) => {
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.src = 'http://127.0.0.1:8080/iframe.html';
  iframe.onload = () => {
    load(iframe);
  };
  document.body.appendChild(iframe);
  return iframe;
};

init((iframe: HTMLIFrameElement) => {
  const externalTransport = new ExternalTransport({
    listen: (callback) => {
      window.addEventListener('message', ({ data }: MessageEvent<any>) =>
        callback(data)
      );
    },
    send: (message: any) => iframe.contentWindow!.postMessage(message, '*'),
  });

  const button = document.createElement('button');
  button.textContent = 'help';
  button.onclick = async () => {
    const response = await externalTransport.help();
    const div = document.createElement('div');
    div.innerText = `${new Date()}: ${response.text}`;
    document.body.appendChild(div);
  };
  document.body.appendChild(button);
});
