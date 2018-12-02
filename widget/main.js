const {app, BrowserWindow} = require('electron');
var Positioner = require('electron-positioner');
var path = require('path')

let mainWindow;

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 450,
    transparent: true,
    frame: false,
    hasShadow: false,
    icon: path('app_icon.png')
  });
  var positioner = new Positioner(mainWindow)
  positioner.move('bottomRight');
  mainWindow.webContents.on('new-window', function(event, urlToOpen) {
    event.preventDefault();
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html');
});
