import { BrowserExtensionsTransport } from 'data-transport';
import { PopupToBackground } from '../../interface';

class PopupTransport extends BrowserExtensionsTransport<PopupToBackground> {
  openClient() {
    this.emit(
      {
        name: 'openClient',
        respond: false,
      },
      {
        path: 'client.html',
        features: 'width=300,height=600',
      }
    );
  }
}

const popupTransport = new PopupTransport();

const button = document.getElementById('button');
button!.addEventListener('click', () => {
  popupTransport.openClient();
});
