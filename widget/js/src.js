/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true, indent: 2 */
/*global jQuery, document, window, air, DesktopWidget: true, monitor: true, swfobject, nativeWindow, DataCache: true, Tracking: true, Request: true*/

"use strict";
const remote = require('electron').remote;
var audio_url = null;
var config = {
  site: 'http://demo.hnp.com',
  theme: 'brushed_steel',
  color: 'teal',
  web: '',
  // branding: {
  //   link: 'http://pixelgraphics.us',
  //   image: 'http://pixelgraphics.us/share_d2tx54/pixel.png',
  //   height: 40,
  //   css: "border-top: solid 1px #597b10;\nborder-bottom: solid 1px #597b10;"
  // },
  colors: {
    'default': {
      'FFFFFF': ['bg', 'lefticon', 'righticon', 'track'],
      'AA0000': ['leftbg', 'rightbg', 'righticonhover', 'slider'],
      '660000': ['rightbghover'],
      '333333': ['text'],
      '770000': ['border', 'loader']
    }
  },
  text: {
    main: 'Main Branding',
    sub: 'Secondary Heading',
    phone: '123-456-7899'
  },
  search: [
    ['Google', 'http://google.com/search?q=%S']
  ]
};

//config = {"branding":{"link":"http://allthenewpatientsyouwant.com","image":"http://demo.2ndcousinmedia.com/files/partners/2/clients/2/branding/cobranding-image.png?time=1491564242"},"text":{"long":"CCS","phone":"413-232-3219","short":"Dr. Alan","main":"CCS Demo","sub":"Dr. Alan Weinstein"},"web":"http://healthnewspodcast.com","version":"1.3.12","search":[["Doctor's Resource","http://demo.2ndcousinmedia.com/healthnews/healthsearch.php?key=6ef6316b8ac8def0ed0cf055fb0ef131&criteria=%S"]],"theme":"light_granite","color":"magenta","site":"http://demo.2ndcousinmedia.com","update_url":"http://demo.2ndcousinmedia.com/updates/8/update.xml"};

config = <<WIDGET_CONFIG>>;
(function ($) {
  var monitor = {}, test, announceStatus; 
  monitor.available = true;
  
  window.monitor = monitor;
  
  var Request = {
    queue: [],
    create: function (path, callback, should_queue) {
      if (should_queue !== false) {
        should_queue = true;
      }
      if (!monitor.available && should_queue) {
        this.queue.push([path, callback]);
      } else if (monitor.available) {
        callback.apply(this, [Request.url(path)]);
      }
    },
    url: function (path) {
      //return new air.URLRequest(config.site + path);
      return config.site + path;
    },
    process: function () { 
      while (monitor.available && Request.queue.length) {
        var next = this.queue.shift();
        next[1].apply(this, [Request.url(next[0])]);
      }
    }
  };
  
  $(document).bind('network_status_changed', function () {
    Request.process();
  });
  
  // Expose
  window.Request = Request;
  
  /* Api:
      DataCache({ default: value });
      DataCache('key'); // get
      DataCache('key', value); // set
  */
  var DataCache = function (key, value) {
    if ($.isPlainObject(key)) {
      DataCache.init(key);
    } else {
      if (typeof value === "undefined") {
        return DataCache.get(key);
      } else {
        return DataCache.set(key, value);
      }
    }
  };
  
  $.extend(DataCache, {
    loaded: false,
    storage: {},
    init: function (defaults) {
      DataCache.load(defaults);
    },
    load: function (defaults) {
      // Try to load file
      var loaded = {}, fs, temp;
      
      if (this.file && this.file.exists) {
        fs = new air.FileStream();
        fs.open(this.file, air.FileMode.READ);
        try {
          temp = fs.readUTF();
          loaded = JSON.parse(temp); 
          fs.close();
        } catch (e) {
          fs.close();
        }
      }
      
      this.storage = $.extend({}, defaults, loaded);
      this.loaded = true;
    },
    checkLoad: function () {
      if (!this.loaded) {
        this.load();
      }
    },
    get: function (key) {
      this.checkLoad();
      return this.storage[key];
    },
    set: function (key, value) {
      this.checkLoad();
      this.storage[key] = value;
      this.save();
    },
    save: function () {
      this.checkLoad();
      if (this.file) {
        var fs = new air.FileStream();
        fs.open(this.file, air.FileMode.WRITE);
        try {
          fs.writeUTF(JSON.stringify(this.storage));
          fs.close();
        } catch (e) {
          fs.close();
        }
      }
    }
  });
  
  // Add a throttled function
  DataCache.save_callback = DataCache.save;
  DataCache.save = $.debounce(1000, DataCache.save_callback);
  
  $.fn.loadValue = function () {
    return this.each(function () {
      var val = DataCache(this.id);
      $(this).val(val ? val : '');
    });
  };
  
  $.fn.saveValue = function () {
    return this.each(function () {
      DataCache(this.id, $.trim($(this).val()));
    });
  };
  
  // Expose
  window.DataCache = DataCache;

  var Tracking = {
    init: function () {
      this.tracking_id = DataCache('tracking_id');
      if (!this.tracking_id) {
        this.get_tracking_id();
      }
    },
    can_track: function () {
      return !!this.tracking_id;
    },
   track: function (action) {      
     Request.create('/t/c', function (req) {
       if (Tracking.can_track) {
         //var urlVar = new air.URLVariables();

         //urlVar.a   = Tracking.tracking_id;
         //urlVar.t   = action;

         //req.data   = urlVar;
         //req.method = air.URLRequestMethod.GET;

         //try {
         //  air.sendToURL(req);
         //} catch (e) {
         //  air.trace(e);
         //}

         var urlVar = {};
         urlVar.a   = Tracking.tracking_id;
         urlVar.t   = action;

         $.get(req, urlVar); 
       }
     });
   },
    get_tracking_id: function () {
      
      //if (typeof window.runtime === "undefined") {
      //  return;
      //}
      
      Request.create('/subscribers', function (req) {
        var urlVar = {};

        urlVar.air = true;

        var success_callback = function (data) {
          if (data.error) {
            // Nothing much, don't track
          } else {
            Tracking.tracking_id = data.id;
            DataCache('tracking_id', data.id);
          }
        };

        $.post(req, urlVar, success_callback);        
      });
    }
  };
  
  //Expose
  window.Tracking = Tracking;

  if (demo_mode) {
    Tracking.get_tracking_id = function () { };
  }

  var DesktopWidget = {
    // Keeps track of which extensions need a refresh hook
    refreshQueue: [],
    
    // Keeps a reference to each extension loaded
    extensions: [],
    
    // Runs when all the extensions are loaded, but before DOM ready
    // Must be *manually* called after all needed scripts are loaded
    init: function () {
      var dw = this, to_setup = [];
      
      if (!demo_mode) {
        Tracking.init(); 
      } 
      
      dw.loadConfig();
      
      // Used for triggering events
      dw.widget = $(document);
      
      $.each(dw.extensions, function () {
        
        // Call init right away
        if ($.isFunction(this.init)) {
          this.init();
        }
        
        // Setup is run on DOM ready
        if ($.isFunction(this.setup)) {
          to_setup.push(this);
        }
        
        // Run update on every master refresh() call
        if ($.isFunction(this.update)) {
          dw.refreshQueue.push(this);
        }
      });
      
      // Run some setup on DOM ready
      $(function () {
        $.each(to_setup, function () {
          this.setup.call(this);
        });
        
        dw.refresh();
        
        // Everything is good to go, if we are in demo mode
        // alert the parent window we are all set
        if (demo_mode && window.parent.demoinitialized) {
          window.parent.demoinitialized(window);
        }
        
        $("#actions strong").append("<span class='point'></span>");
      });
    },
    refresh: function () {
      var dw = this;
      // Update widget
      $("#widget h1").html(this.config.text.main);
      $("#widget #subhead").html(this.config.text.sub);
      
      if (this.config.web !== "") {
        $("#more-link").show().attr('href', this.config.web); 
      } else {
        $("#more-link").hide();
      }
      
      $("#footer_branding, #footer_branding_css").remove();
      if (dw.config.branding) {

        var imgSrc;
        if ( DataCache( "cached-branding" ) === dw.config.branding.image ) {
          imgSrc = DataCache( "branding-image" );
        } else {
          imgSrc = dw.config.branding.image;
        }

        $("<section />", {
          id: 'footer_branding',
          height: dw.config.branding.height || 40,
          html: dw.config.branding.link ? 
            $("<a />", { 
              href: dw.config.branding.link,
              html: $("<img />", { src: imgSrc })
            }) :
            $("<img />", { src: imgSrc })
        }).insertBefore('#widget > footer');
        if (dw.air) {
          window.nativeWindow.height = 425 + (dw.config.branding.height || 40 );
        }
      } else {
        if (dw.air) {
          window.nativeWindow.height = 425;
        }
      }
      
      this.widget.trigger('refresh');
      $.each(this.refreshQueue, function () {
        this.update.call(this);
      });
    },
    
    loadConfig: function (extra) {
      var cachedConfig = DataCache( 'config' ) || {};
      this.config = $.extend({}, config, cachedConfig, extra);
      this.config.theme = config.theme;
      this.config.color = config.color;
      DataCache( 'config', this.config );
      if ( this.config.branding && this.config.branding.image && this.config.branding.image !== DataCache( "cached-branding" ) ) {
        this.updateBrandingImage();
      }
    },
    updateBrandingImage: function () {
      var dw = this;

      $.ajax({
        url: dw.config.site + '/widget/brandingimage.json', 
        dataType: "text",
        data: {},
        timeout: 20000,
        cache: false,
        success: function (data) {
          // try {
            data = JSON.parse(data);
            if ( data && data.data ) {
              DataCache( "cached-branding", dw.config.branding.image );
              DataCache( "branding-image", data.data );
              dw.refresh();
            }
            //air.trace( "Success" );
          // } catch (e) {
          // }
        },
        complete: function () {
            //air.trace( "Complete" );
        }
      });
    },
    updateConfig: function ( _config ) {
      var currentConfig = this.config;
      var changed = false;
      var topLevel = [ "text", "search", "branding", "site", "web" ];
      _.each( topLevel, function ( item ) {
        if ( _config[ item ] ) {
          if ( !currentConfig[ item ] ) {
            changed = true;
            return;
          }
          if ( typeof _config[ item ] === "string" ) {
            if ( currentConfig[ item ] !== _config[ item ] ) {
              changed = true;
            }
          } else {
            _.each( _config[ item ], function ( val, key ) {
              if ( currentConfig[ item ][ key ] !== val ) {
                changed = true;
              }
            });
          }
        }
      });

      if ( changed ) {
        // Only refresh if it has changed
        this.loadConfig( _config );
        this.refresh();
      }
    }
  };

  // Make this public
  window.DesktopWidget = DesktopWidget;
}(jQuery));
(function ($) {
  var dw = DesktopWidget, MessageView, Pager;
  
  Pager = {
    current_index: -1,
    current_id: 0,
    
    cached_ids: [],
    
    // Will make sure the current id
    // is still selected, even at a new position
    // or reselects the first item
    update: function () {
      var ids = Pager.get_ids(), 
          new_index = $.inArray(Pager.current_id, ids),
          new_item = false;

      if (Pager.current_id === 0 || new_index === -1) {
        // Not set
        if (ids.length) {
          Pager.current_id = ids[0];
          Pager.current_index = 0;
        } else {
          Pager.current_id = 0;
          Pager.current_index = -1;
        }
      } else {
        Pager.current_index = new_index;
      }
      
      if ($.inArray(ids[0], Pager.cached_ids) === -1) {
        new_item = true; // First id is new to this list
      }
      
      Pager.cached_ids = ids;
      Pager.length = Pager.cached_ids.length;
      
      return new_item;
    },
    
    // Can be called to update selection to 
    // a specific index
    select: function (index) {
      var ids = Pager.get_ids();

      // Constraints
      if (index < 0) {
        index = 0;
      } else if (index > ids.length - 1) {
        index = ids.length - 1;
      }
      
      Pager.current_index = index;
      Pager.current_id = ids[index];
    },
    
    // Placeholder function. Can be overriden
    // by calling bind, or setting it directly
    get_ids: function () {
      return [];
    },
    
    // Used to attach a specific function used
    // for returning ids
    bind: function (id_function) {
      Pager.get_ids = id_function;
      Pager.update();
    },
    
    // Moves back position by one
    // Will wrap when it reaches the beginning
    prev: function () {
      if (Pager.current_index === 0) {
        Pager.current_index = Pager.cached_ids.length - 1;
      } else {
        Pager.current_index = Pager.current_index - 1;
      }
      
      Pager.current_id = Pager.cached_ids[Pager.current_index];
    },
    
    // Advances position by one
    // will wrap when it reaches the end
    next: function () {
      if (Pager.current_index === Pager.cached_ids.length - 1) {
        Pager.current_index = 0;
      } else {
        Pager.current_index = Pager.current_index + 1;
      }
      
      Pager.current_id = Pager.cached_ids[Pager.current_index];
    }
  };
  
  MessageView = {
    
    // Local message cache
    messages: {},
    
    // Simply returns the id's of each of the messages
    // currently in the cache
    keys: function () {
      var key_collect = [];
      $.each(MessageView.messages, function (key) {
        key_collect.push(key);
      });
      return key_collect;
    },
    
    // Returns the keys in order
    sorted_keys: function () {
      var tmp_sort = [], keys = [];
      
      $.each(MessageView.messages, function (i, message) {
        tmp_sort.push({
          id: message.id,
          timestamp: message.deliver_on
        });
      });

      // Sort reverse order by timestamp
      tmp_sort.sort(MessageView.custom_sort);
      
      $.each(tmp_sort, function (i, stub) {
        keys.push(stub.id);
      });
      
      return keys;
    },
    
    // Used to sort by timestamp
    custom_sort: function (a, b) {
      if (a.timestamp === b.timestamp) {
        return 0;
      }
      
      return a.timestamp < b.timestamp ? 1 : -1;
    },
    
    // Adds or Updates a message, trims off any old
    // messages over 5 messages, then saves the message cache
    add_or_update: function (message) {
      MessageView.messages[message.id] = message;
      MessageView.trim(5);
      MessageView.save();
      remote.getCurrentWindow().restore();
    },
    
    // Handles trimming of older messages over the limit count
    trim: function (limit) {
      if (MessageView.keys().length > limit) {
        var tmp_sort = MessageView.sorted_keys().slice(limit);
        
        $.each(tmp_sort, function (i, id) {
          MessageView.remove({ id: id});
        });
      }
    },
    
    // Explicitly removes a message
    remove: function (message) {
      if (MessageView.messages[message.id]) {
        delete MessageView.messages[message.id];
        MessageView.save(); 
      }
    },
    
    // Used to map the sync state to the method
    // on this object
    sync_map: {
      "new": "add_or_update",
      "same": null,
      "updated": "add_or_update",
      "archive": "remove"
    },
    
    // Inputs a message or message stub and acts on it
    sync: function (message) {
      var action = MessageView.sync_map[message.sync];
      if (action) {
        delete message.sync;
        MessageView[action](message);
      }
    },
    
    // Initializes messages from the cache
    load: function () {
      MessageView.messages = DataCache('message_cache') || {};
    },
    
    // Writes messages to the cache
    save: function () {
      DataCache('message_cache', MessageView.messages);
    },
    
    // Generates an update stub for use with the 
    // sync web services
    stubs: function () {
      var stub = [];
      $.each(MessageView.messages, function (key, message) {
        stub.push({
          id: message.id,
          updated_at: message.updated_at
        });
      });
      return stub;
    }
  };
  
  var refreshTimer;
  // Exposes interface, mainly for QUnit testing
  window.MessageView = MessageView;
  window.Pager = Pager;
  
  $.page = function (message, options) {
    options = $.extend({}, $.page.defaults, options);
    
    var id         = "message_" + message.id,
        $message   = $("#" + id),
        updated_at = $message.data('updated_at');
    
    if (!$message.length) {
      $message = $(message.message)
                    .attr('id', id)
                    .hide()
                    .appendTo(options.parent)
                    .data('refresh', true);
  
    }
    
    if (updated_at !== message.updated_at) {
      $message.html($(message.message).html());
      $message
        .data('updated_at', message.updated_at)
        .data('refresh', true);
    }
    
    return $message;
  };
  
  $.extend($.page, {
    defaults: {
      parent: "#viewport"
    },
    
    
    // Removes archived messages from the DOM
    cleanup: function (ids, options) {
      options = $.extend({}, $.page.defaults, options);
      $(options.parent).find('[id^=message_]').each(function (i, el) {
        var id = parseInt(el.id.substr(8), 10);
        if ($.inArray(id, ids) === -1) {
          $(el).remove();
        }
      });
    },
    
    // Handles showing a single message, while hiding others
    // It will create the message if it does not exist
    show: function (message) {
      if ( refreshTimer ) {
        window.clearInterval( refreshTimer );
        refreshTimer = null;
      }
      var $message = $.page(message),
      scroll_settings = {
        mouseWheelSpeed: 5,
        verticalDragMinHeight: 30,
        reinitialiseOnImageLoad: true,
        scrollbarMargin: 10,
        verticalGutter: 10

      };

      $message
        .siblings()
        .filter('[id^=message_]')
          .hide();
          
      var scrollPane = $message
        .show()    
        .find('.scroll-pane');

      scrollPane.jScrollPane(scroll_settings);

      var jsp = scrollPane.data('jsp');
      if ( jsp ) {
        jsp.scrollTo(0,0,false);
        refreshTimer = window.setInterval( function () {
          jsp.reinitialise();
        }, 1000 );
      }
    }
  });
  
  
  DesktopWidget.Content = {
    init: function () {
      MessageView.load();
      Pager.bind(MessageView.sorted_keys);
    },
    
    process_data: function (data) {
      if (data.error) {
        // air.trace(JSON.stringify(data));
        if (MessageView.sorted_keys().length === 0) {
          DesktopWidget.Content.connection_problem.show();
        }
      } else {
        DesktopWidget.Content.connection_problem.hide();
        $.each(data.messages, function (i, message) {
          MessageView.sync(message);
        });
        if ( data.config ) {
          DesktopWidget.updateConfig( data.config );
        }
        DesktopWidget.Content.update();
      }
    },
    
    get_messages: function () {
      if (window.demo_mode) {
        return;
      }
      var dc = DesktopWidget.Content;
      
      // air.trace(dw.config.site + '/widget/latest');
      
      $.ajax({
        url: dw.config.site + '/widget/latest', 
        dataType: "text",
        data: {
          version: dw.config.version,
          a: Tracking.tracking_id,
          sync: MessageView.stubs()
        },
        timeout: 20000,
        cache: false,
        error: function (xhr, error) {
          dc.process_data({
            error: true,
            message: error
          });
        },
        success: function (data) {
          try {
            data = JSON.parse(data);
            dc.process_data(data);
          } catch (e) {
            dc.process_data({ error: true, status: -1, details: e });
          }
        }
      });
    },
    
    update: function () {
      var dc          = DesktopWidget.Content,
          new_message = Pager.update(), 
          message;

      
      $.page.cleanup(Pager.cached_ids);
      
      if (new_message) {
        Pager.select(0);
      }
      
      if (Pager.current_index !== -1) {
        message = MessageView.messages[Pager.current_id];
        $.page.show(message);  
        
        dc.$pager.removeClass('disabled current');
        if (Pager.current_index === 0) {
          dc.$pager.eq(0).addClass('disabled');
        }
        
        if (Pager.current_index === Pager.cached_ids.length - 1) {
          dc.$pager.eq(1).addClass('disabled');
        }
        
        // TODO: Replace disabled code to disable next prev buttons
      } else {
        dc.$pager.removeClass('current')
                 .addClass('disabled');
      }
      
      if (dw.widget) {
        dw.widget.trigger('content_updated');
      }
      
      if (window.air) {
        if (!DataCache("viewed_message") || (new_message && DataCache("viewed_message") !== Pager.current_id)) {
          window.setTimeout(function () {
            DesktopWidget.air.handleDisplay();
          }, 1000);
          DataCache("viewed_message", Pager.current_id);
        } 
      }
      
      
    },
    
    setup: function () {
      var dc = DesktopWidget.Content;
      
      dc.$pager = $("#paging ul li").addClass('disabled');
      
      dc.$pageNext = dc.$pager.eq(1).click(function (e) {
        if (!$(this).hasClass('disabled')) {
          Pager.next();
          dc.update();
        }
        e.preventDefault();
      });
      
      dc.$pagePrev = dc.$pager.eq(0).click(function (e) {
        if (!$(this).hasClass('disabled')) {
          Pager.prev();
          dc.update();
        }
        e.preventDefault();
      });
      
      
      dc.connection_problem = $("#no_connection").hide();
      
      
      $("#try_again").live('click', function (e) {
        e.preventDefault();
        dc.get_messages();
      });
      
      dc.get_messages();
      
      DesktopWidget.Content.interval = window.setInterval(function () {
        DesktopWidget.Content.get_messages();
      }, 120000);
    }
  };
  
  DesktopWidget.extensions.push(DesktopWidget.Content);
  
}(jQuery));

(function ($) {
  var dw = DesktopWidget;
  
  DesktopWidget.Theme = {
    // Auto Called in the master init function
    init: function () {
      this.theme = null;
      this.color = null;
      this.update();
    },
    
    update: function () {
      if (this.theme !== dw.config.theme || this.color !== dw.config.color) {
        if (this.color) {
          $(document.documentElement).removeClass(this.color);
        }
        
        this.theme = dw.config.theme;  
        this.color = dw.config.color;  
        $(document.documentElement).addClass(this.color);
        
        var css  = '<link rel="stylesheet" href="themes/' + this.theme + '/theme.css" type="text/css" id="dw_theme" />',
            link = $("#dw_theme");
            
        if (link.length) {
          link.replaceWith(css);
        } else {
          $("head").append(css);
        }
        
        $.getJSON('themes/' + this.theme + '/config.json', function (data) {
            // Set first color as default
            $.each(data, function (key, value) {
              data['default'] = value;
              return false;
            });

            var cfg = { colors: data };
            $.extend(config, cfg);
            dw.loadConfig();
            dw.widget.trigger('colors_changed');
          });
        
      }
    },
    
    // Not needed, but left in case
    setup: function () {
      
    }
  };
  
  DesktopWidget.extensions.push(DesktopWidget.Theme);
  
}(jQuery));

(function ($) {
  var dw = DesktopWidget;
  
  DesktopWidget.Search = {
    // Auto Called in the master init function
    init: function () {

    },
    
    update: function () {
      var base      = this,
          opts      = "", 
          html_opts = "";
          
      $.each(dw.config.search, function (i, el) {
        var label = this[0], url = this[1];
        opts += "<option value='" + url + "' " + (i === 0 ? "selected='selected'" : '') + ">" + label + "</option>";
        html_opts += "<li " + (i === 0 ? "class='selected'" : '') + "><a href='#'>Search " + label + '</a></li>';
      });

      this.search.select
        .html(opts)
        .change(function () {
          base.search.label.html('Search ' + base.search.select.find(":selected").html());
        })
        .change();

      this.search.menu
        .html(html_opts);
      this.search.menu_button.toggleClass("disabled", dw.config.search.length < 2);
    },
    
    setup: function () {
      var
        search = {
          // Cache the search elements
          form:   $("#search"),
          term:   $("#search-field"),
          label:  $("#search label"),
          select: $("#search select"),
        
          // Cache/create menu parts
          menu:   $("<ul />", {id: 'search_options'}).hide().appendTo($("#search")),
          menu_button: $("span.mag-glass"),
        
          // Control hiding/showing the menu
          menu_showing: false,
          hide_menu: function () {
            search.menu.hide();
            search.menu.menu_showing = false;
          },
          show_menu: function () {
            if (DesktopWidget.config.search.length < 2) {
              return; // Don't show menu if there are less than two options
            }
            search.menu.show();
            search.menu.menu_showing = true;
          }
        };
          
      // Keep for later
      this.search = search; 
      
      // Initialize the fading of the label
      search.label.inFieldLabels();

      // Actual search functionality
      search.form.submit(function (e) {
        // Cancel default submit functionality
        e.preventDefault(); 

        var url  = search.select.val(), 
            term = $.trim(search.term.val());

        if (term === "") {
          return; // No search term, don't do anything else
        }
        
        Tracking.track('performed_search');

        // Interpolate the search term into the string
        url = url.replace('%S', encodeURIComponent(term));

        // Open the search in a new browser window
        var shell = require('electron').shell;
        if (DesktopWidget.air) {
          shell.openExternal(url);
          //DesktopWidget.air.openExternalURL(url);
        } else {
          shell.openExternal(url);
          //window.open(url, '_blank');
        }
      });

      // Clicks outside the search field should hide the menu
      $(document.body).click(function (e) {
        if (search.menu.menu_showing && !$(e.target).closest(search.menu).length) {
          search.hide_menu();
        }
      });

      // Handle search changes
      search.menu.delegate('a', 'click', function (e) {
        e.preventDefault();

        search.hide_menu();

        // Update visual select styles
        search.menu.children().removeClass('selected');
        $(this).parent('li').addClass('selected');

        // Update the select options with the same
        // selected index as the list
        search.select[0].selectedIndex = $(this).parent().index();
        search.select.change();

        // Set focus back to the search field
        search.term.focus();
      });

      search.menu_button.click(function (e) {
        if (!search.menu.menu_showing) {
          search.menu
            .find('li').removeClass('selected')
            .eq(search.select[0].selectedIndex).addClass('selected');
            
          search.show_menu();
          return false;
        }
      });
    }
  };
  
  // Enable the extension
  DesktopWidget.extensions.push(DesktopWidget.Search);
  
}(jQuery));

(function ($) {
  var dw = DesktopWidget;
  
  DesktopWidget.Media = {
    // Auto Called in the master init function
    init: function () {
      dw.widget.bind('colors_changed', function () {
        DesktopWidget.Media.update();
      });
      dw.widget.bind('content_updated', function () {
        DesktopWidget.Media.update();
      });
    },
    
    refresh_colors: function () {
      // Prepare Player options
      dw.player_config_flash = {};
      dw.player_config = {};
      
      if (!dw.config.colors) {
        return false;
      }

      var colors = dw.config.colors[dw.config.color];
      if (!colors) {
        colors = dw.config.colors['default'];
      }

      // Build up player_config
      $.each(colors, function (key, value) {
        $.each(value, function () {
          dw.player_config_flash[this] = '0x' + key;
          dw.player_config[this] = '#' + key;
        });
      });
      return true;
    },
    
    update: function () {
      
      var colors = this.refresh_colors();
      
      if (colors === false) {
        return;
      }
      
      $("div.video-player").each(function (i, el) {
        if ($(this).has("object").length === 0) {
          var href  = $(this).find('a').attr('href'),
              movie = null;

          if (/youtube/.test(href)) {
            href = href.split(/\?/)[1];
            $.each(href.split(/\&(amp;)?/), function () {
              var parts = this.split('=');
              if (parts.length && parts[0] === "v") {
                movie = parts[1];
                return false;
              }
            });
            if (movie) {
              movie = "http://www.youtube.com/v/" + movie + "?rel=0&fs=1";
              $(this).html([
                '<object type="application/x-shockwave-flash" data="', movie, '" width="248" height="187">',
                '<param name="movie" value="', movie, '"></param>',
                '<param name="allowFullScreen" value="true"></param>',
                '<param name="wmode" value="opaque"></param>',
                '<param name="allowScriptAccess" value="true"></param>',
                '</object>'
              ].join(''));
            } 
          }
        }
      });

      $("div.audio-player").each(function (i, el) {
        var a = $(this).find('a'), cl;
        if (a.length) {
          cl = $(this).closest('.page');
          if (!cl.data('refresh')) {
            return;
          }
          cl.data('refresh', false);
          $(this).data('href', a.attr('href'));
        } else {
          a = $("<a />", { href: $(this).data('href') }).appendTo(this); 
        }
        audio_url = a.attr("href");
        DesktopWidget.Media.addAudioPlayer(a, i + 1);
      });
    },
    
    addAudioPlayer: function (el, id) {
      this.refresh_colors();
      
      var 
        movie   = "media/player.swf",
        width   = 240,
        height  = 24,
        params  = {
          menu: false,
          quality: 'high',
          bgcolor: DesktopWidget.player_config.bg
        },
        flashVars = {
          playerID: id,
          soundFile: $(el).attr('id', 'audio' + id).attr('href')
        };
        
      $("#audio" + id).html([
         '<audio controls>',
           '<source src="' + audio_url + '" type="audio/mpeg">',
           'Your browser does not support the audio element.',
        '</audio>'
      ].join('')).removeAttr('href');
    }
  };
  
  window.ap_stopAll = $.noop;
  
  // Enable the extension
  DesktopWidget.extensions.push(DesktopWidget.Media);
  
}(jQuery));
(function ($) {
  
  /* A little plugin that causes an extra panel in the widget
   * to slide donw or up as required.
   * 
   * Usage:
   *   $("selctor").panel();                            // Close box
   *   $("selector").panel(true);                       // Open box
   *   $("selector").panel(function (e) { .. });        // Open box, with callback
   *   $("selector").panel(false, function (e) { .. }); // Close box, with callback
   */
  $.fn.panel = function (action, callback) {
    // Allow alternate syntax:
    // $().panel(callback)
    if ($.isFunction(action)) {
      callback = action;
      action = true; // Defaults to true in this situation
    }
    
    // Callback defaults to an empty function
    if (typeof callback === "undefined") {
      callback = $.noop;
    }

    // If not defined, action defaults to false
    if (action !== true) {
      // Close, return and don't break the chain
      return this.stop().animate({top: -210}, 200, callback);
    } else {
      // Open, return and don't break the chain
      return this.stop().animate({top: 0}, 200, callback);          
    }
  };

  jQuery(function ($) {
    var remote = require("electron").remote;
    var phone_model = new remote.BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true,
        height: 150,
        width: 575,
        show: false
      });
    var phoneIsSetup = false, 
        phoneSetup = function () {
          phoneIsSetup = true;
          if (typeof phone_model !== "undefined") {
            $("body", phone_model.document).click(function () {
              $("#act_phone").removeClass('selected');
              window.phoneNumber.hide();
            });
          }
        },
        submit = $("#send_message"), 
        fields = $("#name, #email, #phone, #message, #reason");

    $("form label").inFieldLabels();
    
    $("#name, #email, #phone").bind('blur', function () {
      $(this).saveValue();
    }).loadValue().blur();

    $("#act_phone").click(function (e) {
      e.preventDefault();
      //if (typeof window.phoneNumber !== "undefined") {
        // window.refreshPhonePlacement();
        e.stopPropagation();

        if (phone_model.isVisible()) {
          $(this).removeClass('selected');
          phone_model.hide();
        } else {
          if (!phoneIsSetup) {
            phoneSetup();
          }
          
          Tracking.track('show_phone');
          $(this).addClass('selected');
          window.setTimeout(function () {
            phone_model.loadURL('file://' + __dirname + '/phone.html');
            phone_model.show();
            //window.phoneNumber.nativeWindow.activate();
          }, 50);
        }
      //}
    });

    $("#act_email").click(function (e) {
      e.preventDefault();
      if (!monitor.available) {
        return;
      }
      var label = $(this);

      $("#reason").val('message');
      $("#message").val('');
      $("label[for=message]").text("Message");
      $("#send").html('Send Message &rarr;');

      if (label.hasClass('selected')) {
        Tracking.track('hide_email_form');
        $("#actions li").removeClass('selected');
        label.removeClass('selected');
        $("#contact_form").panel(false);
        $("#contact_form .invalid").removeClass('invalid'); 
      } else {
        Tracking.track('show_email_form');
        $("#actions li").removeClass('selected');
        label.addClass('selected');
        $("#contact_form").panel(true); 
      }
    });

    $("#act_question").click(function (e) {
      e.preventDefault();

      if (!monitor.available) {
        return;
      }

      var label = $(this);

      $("#reason").val('question');
      $("#message").val('');
      $("label[for=message]").html("Add Your Question<br>For Our Support Team");
      $("#send").html('Send Question &rarr;');

      if (label.hasClass('selected')) {
        Tracking.track('hide_question_form');
        $("#actions li").removeClass('selected');
        label.removeClass('selected');
        $("#contact_form").panel(false); 
        $("#contact_form .invalid").removeClass('invalid');
      } else {
        Tracking.track('show_question_form');
        $("#actions li").removeClass('selected');
        label.addClass('selected');
        $("#contact_form").panel(true); 
      }
    });

    $("#contact_form form").submit(function (e) {
      e.preventDefault();
      if (submit.hasClass('loading')) {
        return;
      }

      fields.each(function () {
        var t = $(this);

        // Remove leading/trailing whitespace
        t.val($.trim(t.val()));

        t.toggleClass('invalid', t.val() === "");
      });

      if (fields.filter('.invalid').length) {
        return;
      }

      submit.addClass('loading');
      
      //var loader = new air.URLLoader(),
      var  req = Request.url('/widget/send'),
          urlVar = {},
          success_callback;
      urlVar.a         = Tracking.tracking_id;
      urlVar.email     = $("#email").val();
      urlVar.from      = $("#name").val();
      urlVar.phone     = $("#phone").val();
      urlVar.message   = $("#message").val();
      urlVar.message_type  = $("#reason").val();

      //req.data   = urlVar;
      //req.method = air.URLRequestMethod.POST;

      //loader.addEventListener(air.HTTPStatusEvent.HTTP_RESPONSE_STATUS, function (e) {
      //});
      
      success_callback = function (data) {
        submit.removeClass('loading');

        if (data.error) {
          window.alert('There was a problem sending your ' + $("#reason").val() + '. Please make sure you are connected to the internet, then try to send the form again.');
        } else {
          submit.addClass('sent');
          window.setTimeout(function () {
            $("#actions li").removeClass('selected');
            $("#contact_form").panel(false, function () {
              submit.removeClass('sent');
            });
          }, 1500);
        }
      };
      
      //loader.addEventListener(air.IOErrorEvent.IO_ERROR, function (e) {
      //  success_callback();
      //});

      //loader.addEventListener(air.Event.COMPLETE, success_callback);

      //try {
      //  loader.load(req);
      //} catch (loader_e) {
        // Nothing much, dont' track
      //}
      $.post(req, urlVar, success_callback);
    })

    .delegate('input:text.invalid, textarea.invalid', 'focusin change', function (e) {
      if ($.trim($(this).val()) !== "") {
        $(this).removeClass('invalid');
      }
    });

    $("#send").click(function (e) {
      e.preventDefault();
      $("#contact_form form").submit();
    });

    $("#send_cancel").click(function (e) {
      e.preventDefault();
      $("#actions li").removeClass('selected');
      $("#contact_form").panel(false);
    });
  });
}(jQuery));
(function ($) {
  // Keep "air" stuff hidden unless air is present
  //if (typeof window.runtime !== "undefined") {
    document.documentElement.className += " air";
  
    //nativeWindow.visible = false;
    
    //window.nativeWindow.x = (air.Capabilities.screenResolutionX - 350);
    //window.nativeWindow.y = (air.Capabilities.screenResolutionY - (config.branding ? 550 : 490));
  
    window.refreshPhonePlacement = function () {
      alert("reset phone placement");
      //var screens = air.Screen.getScreensForRectangle(window.nativeWindow.bounds),
      //  current_screen = screens.length ? screens[0] : air.Screen.mainScreen,
    
      //  bounds = current_screen.visibleBounds,
      
      //  top     = ((bounds.top + (bounds.height / 2))) - 63,
      //  left    = bounds.left,
      //  width   = bounds.width,
      //  height  = 125,
      //  rect    = new air.Rectangle(left, top, width, height),
      
        //options = new air.NativeWindowInitOptions(),
        //newHTMLLoader;
      
      if (typeof window.phoneNumber === "undefined") {
        //options.systemChrome = "none"; 
        //options.type         = "lightweight";
        //options.transparent  = true;
      
        //newHTMLLoader = air.HTMLLoader.createRootWindow(false, options, false, rect);
        //newHTMLLoader.window.opener = window;
        //newHTMLLoader.load(new air.URLRequest("phone.html"));
      
        //window.phoneNumber = require('electron-modal');
      }
    };
     
    var iconLoadComplete = function (event) { 
          air.NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData]; 
        },
      iconLoad = new air.Loader(),
      iconMenu = new air.NativeMenu(),
      exitCommand = iconMenu.addItem(new air.NativeMenuItem("Exit"));

    air.NativeApplication.nativeApplication.autoExit = false; 
    
    exitCommand.addEventListener(air.Event.SELECT, function () { 
      Tracking.track('quit');
      air.NativeApplication.nativeApplication.icon.bitmaps = [];
      air.NativeApplication.nativeApplication.exit(); 
    }); 

    air.NativeApplication.nativeApplication.addEventListener(air.Event.EXITING, function () {
      Tracking.track('quit');
      air.NativeApplication.nativeApplication.icon.bitmaps = []; 
    });

    window.nativeWindow.addEventListener(air.Event.CLOSE, function () {
      Tracking.track('quit');
      air.NativeApplication.nativeApplication.icon.bitmaps = [];
      air.NativeApplication.nativeApplication.exit();
    });

    if (air.NativeApplication.supportsSystemTrayIcon) {
      iconLoad.contentLoaderInfo.addEventListener(air.Event.COMPLETE, iconLoadComplete); 
      iconLoad.load(new air.URLRequest("icons/icon-16.png")); 
      air.NativeApplication.nativeApplication.icon.tooltip = (function () {
        var xml       = air.NativeApplication.nativeApplication.applicationDescriptor,
            appXml    = new DOMParser(),
            xmlObject = appXml.parseFromString(xml, "text/xml");
        
        // get filename from app.xml
        return xmlObject.getElementsByTagName('filename')[0].firstChild.data;
      }());
      air.NativeApplication.nativeApplication.icon.menu = iconMenu; 
      air.NativeApplication.nativeApplication.icon.addEventListener("click", function () {
        //air.trace('iconclicked');
        window.nativeWindow.activate();
      });
    } 

    if (air.NativeApplication.supportsDockIcon) { 
      iconLoad.contentLoaderInfo.addEventListener(air.Event.COMPLETE, iconLoadComplete); 
      iconLoad.load(new air.URLRequest("icons/icon-128.png")); 
      air.NativeApplication.nativeApplication.icon.menu = iconMenu; 
    }
     

    // Namespace for AIR properties/functions
    DesktopWidget.air = {

      active: false,
      invoked: false,
      // Defaults to false since it won't work in Debug mode
      willStartAtLogin: false, 


      handleDisplay: function (activate) {
        if (window.nativeWindow.visible === false) {
          Tracking.track('opened');
        }
        
        if (activate !== false) {
          window.nativeWindow.activate();
          window.nativeWindow.alwaysInFront = true;
          window.setTimeout(function () {
            window.nativeWindow.alwaysInFront = false;
            air.NativeApplication.nativeApplication.activate();
          }, 500);
        }
        
        window.refreshPhonePlacement();
      },
      
      // Handles showing the app on activation, but not
      // when it is launched at user login
      onInvoke: function () {
        //air.trace('Invoke');
        
        if (DesktopWidget.air.active) {
          //air.trace('Already Active');
          DesktopWidget.air.handleDisplay();
        }

        DesktopWidget.air.active = true;
      },

      // Passes off to onInvoke
      onActivate: function () {
        //air.trace('Activate');
      },
      
      onDeactivate: function () {
      }

    }; 

    // Will fail if using in Debug mode
    try { 
      air.NativeApplication.nativeApplication.startAtLogin = true; 
      DesktopWidget.air.startAtLogin = true;
    } catch (e) { 
      DesktopWidget.air.startAtLogin = false;
    }

    // Handle showing the app on activation
    air.NativeApplication.nativeApplication.addEventListener("deactivate", DesktopWidget.air.onDeactivate);
    air.NativeApplication.nativeApplication.addEventListener("activate", DesktopWidget.air.onActivate);
    air.NativeApplication.nativeApplication.addEventListener("invoke",   DesktopWidget.air.onInvoke); 


    // Open link in user's default browser window.
    // Source for the next two functions: http://sevenwire.com/blog/2009/08/26/adobe-air-opening-external-links-in-another-browser.html
    DesktopWidget.air.openExternalURL = function (href) {
      var request = new air.URLRequest(href);
      try {
        air.navigateToURL(request);
      } catch (e) {
        // handle error here
        air.Introspector.Console.log(e);
      }
    };

    // Open External Links in Browser
    $('a[href^=http]').live("click", function (event) {
      event.preventDefault();
      DesktopWidget.air.openExternalURL(this.href);
    });

    // DOM Ready
    $(function () {

      // Enable moving the window around
      $("#move-handle").mousedown(function () {
        nativeWindow.startMove(); 
      });

      // Enable hiding the window when "close" is clicked
      $("#close").click(function () {
        Tracking.track('closed');
        const remote = require('electron').remote;
        window = remote.getCurrentWindow();
        window.close();
        nativeWindow.visible = false;
      });

    });
  //} else {
  //  DesktopWidget.air = false;
  //}
}(jQuery));
