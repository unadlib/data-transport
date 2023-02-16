import type { Instance } from 'simple-peer';
import type {
  BaseInteraction,
  ListenerOptions,
  SendOptions,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

const MAX_CHUNK_SIZE = 1024 * 60;

const BUFFER_FULL_THRESHOLD = 1024 * 64;

const EXPIRED_TIME = 1000 * 60;

export interface WebRTCTransportOptions extends Partial<TransportOptions> {
  peer: Instance;
}

interface WebRTCTransportSendOptions extends SendOptions<{}> {
  chunkId?: number;
  length?: number;
}

abstract class WebRTCTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  private receiveBuffer = new Map<string, { data: any[]; timestamp: number }>();

  constructor({
    peer,
    listener = (callback) => {
      const handler = (data: string) => {
        const message: WebRTCTransportSendOptions = JSON.parse(data);
        const key = Object.prototype.hasOwnProperty.call(message, 'request')
          ? 'request'
          : 'response';
        const buffer = this.receiveBuffer.get(
          message.__DATA_TRANSPORT_UUID__
        ) ?? {
          data: [],
          timestamp: Date.now(),
        };
        this.receiveBuffer.set(message.__DATA_TRANSPORT_UUID__, buffer);
        buffer.data[message.chunkId!] = message[key];
        buffer.data.length = message.length!;
        buffer.timestamp = Date.now();
        const isComplete =
          buffer.data.filter((item) => item).length === message.length;
        if (isComplete) {
          const data = JSON.parse(buffer.data.join(''));
          message[key] = key === 'request' ? data : data[0];
          delete message.length;
          callback(message as ListenerOptions);
          this.receiveBuffer.delete(message.__DATA_TRANSPORT_UUID__);
          for (const [id, item] of this.receiveBuffer) {
            if (Date.now() - item.timestamp > EXPIRED_TIME) {
              this.receiveBuffer.delete(id);
            }
          }
        }
      };
      peer.on('data', handler);
      return () => {
        peer.off('data', handler);
      };
    },
    sender = (message: WebRTCTransportSendOptions) => {
      const key = Object.prototype.hasOwnProperty.call(message, 'request')
        ? 'request'
        : 'response';
      message[key] = JSON.stringify(
        key === 'request'
          ? message.request
          : typeof message.response !== 'undefined'
          ? [message.response]
          : []
      );
      let chunkId = 0;
      const allChunksSize = Math.ceil(
        (message[key] as string).length / MAX_CHUNK_SIZE
      );
      while ((message[key] as string).length > 0) {
        const data = {
          ...message,
          [key]: (message[key] as string).slice(0, MAX_CHUNK_SIZE),
          chunkId,
          length: allChunksSize,
        };
        peer.send(JSON.stringify(data));
        message[key] = (message[key] as string).slice(MAX_CHUNK_SIZE);
        chunkId += 1;
      }
    },
    ...options
  }: WebRTCTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
    if (peer) {
      let webRTCPaused = false;
      const webRTCMessageQueue: any[] = [];
      const peerSend = peer.send.bind(peer);
      const sendMessageQueued = () => {
        webRTCPaused = false;
        let message = webRTCMessageQueue.shift();
        while (message) {
          if (
            (peer as any)._channel.bufferedAmount &&
            (peer as any)._channel.bufferedAmount > BUFFER_FULL_THRESHOLD
          ) {
            webRTCPaused = true;
            webRTCMessageQueue.unshift(message);
            const listener = () => {
              (peer as any)._channel.removeEventListener(
                'bufferedamountlow',
                listener
              );
              sendMessageQueued();
            };
            (peer as any)._channel.addEventListener(
              'bufferedamountlow',
              listener
            );
            return;
          }
          try {
            peerSend(message);
            message = webRTCMessageQueue.shift();
          } catch (error: any) {
            throw new Error(`Error send message to peer: ${error.message}`);
          }
        }
      };
      peer.send = function (chunk: any) {
        webRTCMessageQueue.push(chunk);
        if (webRTCPaused) {
          return;
        }
        sendMessageQueued();
      };
    }
  }
}

export { WebRTCTransport };
