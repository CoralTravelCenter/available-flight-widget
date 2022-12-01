var observeElementProp, responsiveHandler;

window.ASAP || (window.ASAP = (function() {
  var callall, fns;
  fns = [];
  callall = function() {
    var f, results;
    results = [];
    while (f = fns.shift()) {
      results.push(f());
    }
    return results;
  };
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callall, false);
    window.addEventListener('load', callall, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', callall);
    window.attachEvent('onload', callall);
  }
  return function(fn) {
    fns.push(fn);
    if (document.readyState === 'complete') {
      return callall();
    }
  };
})());

window.log || (window.log = function() {
  if (window.console && window.DEBUG) {
    if (typeof console.group === "function") {
      console.group(window.DEBUG);
    }
    if (arguments.length === 1 && Array.isArray(arguments[0]) && console.table) {
      console.table.apply(window, arguments);
    } else {
      console.log.apply(window, arguments);
    }
    return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
  }
});

window.trouble || (window.trouble = function() {
  var ref;
  if (window.console) {
    if (window.DEBUG) {
      if (typeof console.group === "function") {
        console.group(window.DEBUG);
      }
    }
    if ((ref = console.warn) != null) {
      ref.apply(window, arguments);
    }
    if (window.DEBUG) {
      return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
    }
  }
});

window.preload || (window.preload = function(what, fn) {
  var lib;
  if (!Array.isArray(what)) {
    what = [what];
  }
  return $.when.apply($, (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = what.length; i < len; i++) {
      lib = what[i];
      results.push($.ajax(lib, {
        dataType: 'script',
        cache: true
      }));
    }
    return results;
  })()).done(function() {
    return typeof fn === "function" ? fn() : void 0;
  });
});

window.queryParam || (window.queryParam = function(p, nocase) {
  var k, params, params_kv;
  params_kv = location.search.substr(1).split('&');
  params = {};
  params_kv.forEach(function(kv) {
    var k_v;
    k_v = kv.split('=');
    return params[k_v[0]] = k_v[1] || '';
  });
  if (p) {
    if (nocase) {
      for (k in params) {
        if (k.toUpperCase() === p.toUpperCase()) {
          return decodeURIComponent(params[k]);
        }
      }
      return void 0;
    } else {
      return decodeURIComponent(params[p]);
    }
  }
  return params;
});

window.DEBUG = 'APP NAME';

responsiveHandler = function(query, match_handler, unmatch_handler) {
  var layout;
  layout = matchMedia(query);
  layout.addEventListener('change', function(e) {
    if (e.matches) {
      return match_handler();
    } else {
      return unmatch_handler();
    }
  });
  if (layout.matches) {
    match_handler();
  } else {
    unmatch_handler();
  }
  return layout;
};

observeElementProp = function(el, prop, callback) {
  var descr, proto;
  proto = Object.getPrototypeOf(el);
  if (proto.hasOwnProperty(prop)) {
    descr = Object.getOwnPropertyDescriptor(proto, prop);
    return Object.defineProperty(el, prop, {
      get: function() {
        return descr.get.apply(this, arguments);
      },
      set: function(v) {
        var newv, oldv;
        oldv = this[prop];
        descr.set.apply(this, arguments);
        newv = v;
        if (newv !== oldv) {
          return setTimeout(callback.bind(this, newv, oldv), 0);
        }
      }
    });
  }
};

ASAP(function() {
  var $ctx, libs, nodes_array;
  $ctx = $('.available-flight-widget');
  responsiveHandler('(max-width: 768px)', function() {
    var $headitems;
    $headitems = $('.head-item', $ctx);
    return $('.data-column', $ctx).each(function(idx, el) {
      return $(el).prepend($headitems.eq(idx));
    });
  }, function() {
    return $('.head', $ctx).append($('.head-item', $ctx));
  });
  nodes_array = $('.geolocation-list li').map(function(idx, li) {
    var $li;
    $li = $(li);
    return $('<div class="item"></div>').text($li.text()).attr({
      'data-departureid': $li.attr('data-departureid')
    }).get(0);
  });
  $('.data-column.depart-from .scrollable').empty().append(nodes_array);
  libs = ['https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.5.5/perfect-scrollbar.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/2.1.3/jquery.scrollTo.min.js'];
  preload(libs, function() {
    return $('.scrollable', $ctx).each(function(idx, el) {
      return new PerfectScrollbar(el, {
        minScrollbarLength: 20
      });
    });
  });
  return observeElementProp($('input.packageSearch__departureInput').get(0), 'value', function(new_destination) {
    if (new_destination) {
      return 1;
    }
  });
});
