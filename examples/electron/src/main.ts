import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { ElectronTransport, Receiver, Listen, listen } from 'data-transport';
import { Renderer, Main } from './interface';

class MainTransport
  extends ElectronTransport.Main<Main>
  implements Receiver<Renderer> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  hello({ request, respond }: Listen<Renderer['hello']>) {
    respond({
      text: `hello, ${request.num}`,
    });
  }
}

function createWindow() {
  // Create the browser window.
  const browserWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    width: 800,
  });

  // and load the index.html of the app.
  browserWindow.loadFile(path.join(__dirname, '../index.html'));

  // Open the DevTools.
  browserWindow.webContents.openDevTools();
  browserWindow.webContents.on('dom-ready', () => {
    (global as any).mainTransport = new MainTransport({
      ipcMain,
      browserWindow,
    });
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
