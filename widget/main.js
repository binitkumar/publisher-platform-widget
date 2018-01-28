const {app, BrowserWindow} = require('electron');
var Positioner = require('electron-positioner');
let mainWindow;

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 450,
    transparent: true,
    frame: false,
    hasShadow: false
  });
  var positioner = new Positioner(mainWindow)
  positioner.move('bottomRight');
  mainWindow.loadURL('file://' + __dirname + '/index.html');
});
