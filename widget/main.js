if(require('electron-squirrel-startup')){

  const app = require('app');

  // this should be placed at top of main.js to handle setup events quickly
  if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
  }

  function handleSquirrelEvent() {
    if (process.argv.length === 1) {
      return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');
    
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    
    const spawn = function(command, args) {
      let spawnedProcess, error;
    
      try {
        spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
      } catch (error) {}
    
      return spawnedProcess;
    };
    
    const spawnUpdate = function(args) {
      return spawn(updateDotExe, args);
    };
    
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus
    
        // Install desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);
    
        setTimeout(app.quit, 1000);
        return true;
    
      case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers
    
        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);
    
        setTimeout(app.quit, 1000);
        return true;
    
      case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated
    
        app.quit();
        return true;
    }
  };
}

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
    icon: path.join(__dirname, 'app_icon.png')
  });
  var positioner = new Positioner(mainWindow)
  positioner.move('bottomRight');
  mainWindow.webContents.on('new-window', function(event, urlToOpen) {
    event.preventDefault();
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html');
});
