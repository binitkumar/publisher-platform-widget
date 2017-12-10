$(document).ready(function(){
  const remote = require('electron').remote;
  $("#close").click(function () {
    Tracking.track('closed');
    remote.BrowserWindow.getFocusedWindow().minimize();
  });

    $('a[href^=http]').live("click", function (event) {
      event.preventDefault();
      shell = require('electron').shell
      shell.openExternal(this.href);
    });

})
