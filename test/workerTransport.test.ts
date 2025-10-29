import { WorkerTransport } from '../src/transports/workerTransport';

describe('WorkerTransport', () => {
  test('Worker classes can be instantiated with options', () => {
    const mockWorker = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
    };

    class MainTransport extends WorkerTransport.Main {}

    const main = new MainTransport({
      worker: mockWorker as any,
      prefix: 'CustomPrefix',
      timeout: 5000,
    });

    expect(main).toBeDefined();
    expect(mockWorker.addEventListener).toHaveBeenCalled();
  });

  test('Worker internal classes structure', () => {
    expect(WorkerTransport.Worker).toBeDefined();
    expect(WorkerTransport.Main).toBeDefined();
    expect(typeof WorkerTransport.Worker).toBe('function');
    expect(typeof WorkerTransport.Main).toBe('function');
  });
});
