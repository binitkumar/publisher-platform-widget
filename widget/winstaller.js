var electronInstaller = require('electron-winstaller');
resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: 'release-builds/<<APP_NAME_LOWERCASE>>-win32-x64',
    outputDirectory: 'windows_app',
    authors: '2ndCousinMedia LLC',
    description: '<<APP_NAME>> from 2ndCousinMedia',
    exe: '<<APP_NAME_LOWERCASE>>.exe'
  });
resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
