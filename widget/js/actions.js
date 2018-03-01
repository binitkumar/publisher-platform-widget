$(document).ready(function(){
  var remote = null;
  try{
    remote = require('electron').remote;
  }catch(err){
    console.log("Failed to load electron.");
  }
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
