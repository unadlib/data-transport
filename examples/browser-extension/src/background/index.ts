import browser from 'webextension-polyfill';
import { BrowserExtensionsMainTransport, listen } from 'data-transport';
import {
  BackgroundToClient,
  ClientToBackground,
  PopupToBackground,
} from '../interface';

class BackgroundTransport
  extends BrowserExtensionsMainTransport<{ listen: BackgroundToClient }>
  implements ClientToBackground, PopupToBackground {
  showText() {
    return this.emit('changeTextDisplay', { status: true });
  }

  @listen
  async toggleText(options: { status: boolean }) {
    return {
      status: !options.status,
    };
  }

  @listen
  async openClient(options: { path: string; features: string }) {
    browser.tabs.create({ url: 'http://example.com/' });
    console.log(options.path, '', options.features);
  }
}

const backgroundTransport = new BackgroundTransport({
  browser: browser as any,
});

(global as any).backgroundTransport = backgroundTransport;

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   //
// });

// chrome.tabs.onRemoved.addListener((tabId) => {
//   //
// });

// chrome.tabs.onActiveChanged.addListener((tabId) => {
//   //
// });

// chrome.windows.onFocusChanged.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     //
//   });
// });
