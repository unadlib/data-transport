import browser from 'webextension-polyfill';
import { BrowserExtensionsClientTransport } from 'data-transport';
import { PopupToBackground } from '../interface';

class PopupTransport extends BrowserExtensionsClientTransport<PopupToBackground> {
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

const popupTransport = new PopupTransport({
  browser: browser as any,
});

const button = document.getElementById('button');
button!.addEventListener('click', () => {
  popupTransport.openClient();
});
