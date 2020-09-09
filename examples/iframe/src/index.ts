import { IFrameTransport, Receiver, Respond, respond } from 'data-transport';
import { Main, IFrame } from './interface';

class MainTransport
  extends IFrameTransport.Main<Main>
  implements Receiver<IFrame> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @respond
  hello({ request, callback }: Respond<IFrame['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    callback({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const useMainTransport = (iframe: HTMLIFrameElement) =>
  new MainTransport({
    iframe,
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
