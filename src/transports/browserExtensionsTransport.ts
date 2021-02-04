import { callbackKey } from '../constant';
import {
  IRequest,
  ListenerOptions,
  SendOptions,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

interface SendResponse {
  _sendResponse?: (response?: SendOptions<SendResponse>) => void;
}

export interface BrowserExtensionsTransportOptions
  extends Partial<TransportOptions<SendResponse>> {
  browser?: typeof window.browser | typeof window.chrome;
}

export interface BrowserExtensionsPortTransportOptions
  extends Partial<TransportOptions> {
  port: browser.runtime.Port | chrome.runtime.Port;
}

abstract class BrowserExtensionsTransport<T = {}> extends Transport<T> {
  private [callbackKey]!: (options: ListenerOptions<SendResponse>) => void;

  constructor({
    browser = window.browser ?? window.chrome,
    listener = (callback) => {
      this[callbackKey] = callback;
      browser.runtime.onMessage.addListener(
        (
          data: ListenerOptions<SendResponse>,
          sender: browser.runtime.MessageSender | chrome.runtime.MessageSender,
          sendResponse: (response?: SendOptions<SendResponse>) => void
        ) => {
          data._sendResponse = sendResponse;
          callback(data);
        }
      );
    },
    sender = (message) => {
      if (message._sendResponse) {
        const sendResponse = message._sendResponse;
        delete message._sendResponse;
        sendResponse(message);
      } else {
        browser.runtime.sendMessage(
          message,
          {},
          (response: IRequest<SendResponse>) => {
            this[callbackKey](response);
          }
        );
      }
    },
  }: BrowserExtensionsTransportOptions = {}) {
    super({
      listener,
      sender,
    });
  }
}

abstract class BrowserExtensionsPortTransport<T = {}> extends Transport<T> {
  constructor({
    port,
    listener = (callback) => {
      port.onMessage.addListener((data: object) => {
        callback(data as ListenerOptions);
      });
    },
    sender = (message) => {
      port.postMessage(message);
    },
  }: BrowserExtensionsPortTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

export { BrowserExtensionsTransport, BrowserExtensionsPortTransport };
