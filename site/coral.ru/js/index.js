var $ctx, LOCAL_GET_CACHE, ajaxGet, isPreferredDestinationAvailable, observeElementProp, rebuildAirportsListWithData, rebuildDestinationsListWithData, responsiveHandler, selectDestinationItem, selectOriginItem, updateSelectionInfo, updateSelectionWithOrigin;

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

isPreferredDestinationAvailable = function(list, prefer) {
  prefer || (prefer = $('.data-column.destination-to').closest('[data-preferred-destination]').attr('data-preferred-destination'));
  return list.find(function(item) {
    return item.Name === prefer;
  });
};

updateSelectionWithOrigin = function(origin_name) {
  var $origin_item;
  $origin_item = $($('.data-column.depart-from .item').toArray().find(function(item) {
    return $(item).text() === origin_name;
  }));
  return selectOriginItem($origin_item);
};

selectOriginItem = function($item, dont_fallback_to_moscow) {
  $item = $($item);
  $item.siblings().removeClass('selected');
  ajaxGet('https://www.coral.ru/v1/geography/tocountryfilter', {
    areaid: $item.attr('data-departureid')
  }).then(function(response) {
    if (isPreferredDestinationAvailable(response)) {
      if (dont_fallback_to_moscow) {
        $item.addClass('selected');
      } else {
        $item.addClass('selected');
        $item.closest('.scrollable').scrollTo($item, 500, {
          offset: -30,
          complete: function() {
            return $item.addClass('selected');
          }
        });
      }
      return rebuildDestinationsListWithData(response);
    } else {
      if (dont_fallback_to_moscow) {
        $item.addClass('selected');
        return rebuildDestinationsListWithData(response);
      } else {
        return setTimeout(function() {
          return selectOriginItem($('.data-column.depart-from .item[data-departureid="2671"]'));
        }, 0);
      }
    }
  });
  return updateSelectionInfo();
};

selectDestinationItem = function($item, dont_scroll) {
  var req_params;
  $item = $($item);
  $item.siblings().removeClass('selected');
  if (dont_scroll) {
    $item.addClass('selected');
  } else {
    $item.closest('.scrollable').scrollTo($item, 500, {
      offset: -30,
      complete: function() {
        return $item.addClass('selected');
      }
    });
  }
  req_params = {
    fromAreaId: $('.data-column.depart-from .item.selected').attr('data-departureid'),
    toCountryId: $item.attr('data-id')
  };
  ajaxGet('https://www.coral.ru/v1/flight/availabledate', req_params).then(function(response) {
    return rebuildAirportsListWithData(response.Result);
  });
  return updateSelectionInfo();
};

rebuildDestinationsListWithData = function(list) {
  var $block, $container, prefer, ref;
  $('.data-column.destination-airport-closest-date .scrollable').empty();
  $block = $('.data-column.destination-to');
  $container = $block.find('.scrollable');
  $container.empty();
  $container.append(list.map(function(item_data) {
    return "<div class='item' data-id='" + item_data.Id + "'>" + item_data.Name + "</div>";
  }));
  if ((ref = $container.get(0).perfectscrollbar) != null) {
    ref.update();
  }
  prefer = $block.closest('[data-preferred-destination]').attr('data-preferred-destination');
  return selectDestinationItem($container.find('.item').toArray().find(function(item) {
    return $(item).text() === prefer;
  }));
};

rebuildAirportsListWithData = function(list) {
  var $container, ref;
  $container = $('.data-column.destination-airport-closest-date .scrollable');
  $container.empty();
  $container.append(list.map(function(item_data) {
    return "<div class='item dbl'><span>" + item_data.ToAreaName + "</span><span>" + (moment(Number(item_data.FlightDate.replace(/\D/g, ''))).format('DD.MM.YYYY')) + "</span></div>";
  }));
  return (ref = $container.get(0).perfectscrollbar) != null ? ref.update() : void 0;
};

updateSelectionInfo = function() {
  return setTimeout(function() {
    var $container, items_html;
    $container = $ctx.find('.foot .selection-info').empty();
    items_html = $ctx.find('.data-column .item.selected').toArray().map(function(item) {
      var $item;
      $item = $(item);
      if ($item.children().length) {
        return "<span>" + ($item.children().map(function(idx, el) {
          return $(el).text();
        }).toArray().join(', ')) + "</span>";
      } else {
        return "<span>" + ($item.text()) + "</span>";
      }
    }).join('');
    return $container.append(items_html);
  }, 1000);
};

LOCAL_GET_CACHE = {
  'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2671': '[{"Id":1,"Name":"Турция"},{"Id":3,"Name":"Россия"},{"Id":12,"Name":"Египет"},{"Id":31,"Name":"ОАЭ"},{"Id":33,"Name":"Таиланд"},{"Id":282,"Name":"Бахрейн"},{"Id":52,"Name":"Индия"},{"Id":35,"Name":"Мальдивы"},{"Id":40,"Name":"Шри-Ланка"},{"Id":60,"Name":"Танзания"},{"Id":41,"Name":"Вьетнам"},{"Id":39,"Name":"Сейшелы"},{"Id":63,"Name":"Маврикий"},{"Id":278,"Name":"Абхазия"},{"Id":7,"Name":"Азербайджан"},{"Id":5,"Name":"Армения"},{"Id":8,"Name":"Беларусь"},{"Id":49,"Name":"Узбекистан"},{"Id":36,"Name":"Доминиканская Республика"},{"Id":98,"Name":"Мексика"},{"Id":38,"Name":"Индонезия"},{"Id":72,"Name":"Андорра"},{"Id":42,"Name":"Испания"},{"Id":18,"Name":"Италия"},{"Id":216,"Name":"Кипр"},{"Id":108,"Name":"Хорватия"},{"Id":10,"Name":"Болгария"},{"Id":80,"Name":"Черногория"},{"Id":48,"Name":"Куба"}]',
  'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2328': '[{"Id":3,"Name":"Россия"},{"Id":278,"Name":"Абхазия"}]',
  'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2449': '[{"Id":1,"Name":"Турция"},{"Id":3,"Name":"Россия"},{"Id":12,"Name":"Египет"},{"Id":31,"Name":"ОАЭ"},{"Id":33,"Name":"Таиланд"},{"Id":282,"Name":"Бахрейн"},{"Id":52,"Name":"Индия"},{"Id":35,"Name":"Мальдивы"},{"Id":40,"Name":"Шри-Ланка"},{"Id":39,"Name":"Сейшелы"},{"Id":63,"Name":"Маврикий"},{"Id":278,"Name":"Абхазия"},{"Id":7,"Name":"Азербайджан"},{"Id":5,"Name":"Армения"},{"Id":8,"Name":"Беларусь"},{"Id":49,"Name":"Узбекистан"},{"Id":38,"Name":"Индонезия"}]',
  'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2671&toCountryId=1': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area63","ToAreaName":"Стамбул (Istanbul)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area5","ToAreaName":"Анталья (Antalya)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area26","ToAreaName":"Измир (Izmir)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area3264","ToAreaName":"Даламан (Dalaman)"},{"FlightDate":"\\/Date(1672185600000)\\/","ToAreaId":"Area44","ToAreaName":"Кайсери (Kayseri)"},{"FlightDate":"\\/Date(1672272000000)\\/","ToAreaId":"Area14","ToAreaName":"Эрзурум (Erzurum)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area1","ToAreaName":"Бодрум (Bodrum)"}],"ErrorMessage":null}',
  'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2671&toCountryId=35': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area271","ToAreaName":"Мале (Male)"}],"ErrorMessage":null}',
  'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2449&toCountryId=35': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area271","ToAreaName":"Мале (Male)"}],"ErrorMessage":null}'
};

ajaxGet = function(endpoint, req_params) {
  var $promise, request_uri;
  $promise = $.Deferred();
  request_uri = endpoint + '?' + $.param(req_params);
  if (LOCAL_GET_CACHE[request_uri]) {
    $promise.resolve(typeof LOCAL_GET_CACHE[request_uri] === 'string' ? JSON.parse(LOCAL_GET_CACHE[request_uri]) : LOCAL_GET_CACHE[request_uri]);
  } else {
    $.ajax(request_uri).then(function(response) {
      return $promise.resolve(response);
    });
  }
  return $promise;
};

$ctx = null;

ASAP(function() {
  var $libsReady, libs, nodes_array;
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
  $libsReady = $.Deferred();
  preload(libs, function() {
    return $libsReady.resolve();
  });
  observeElementProp($('input.packageSearch__departureInput').get(0), 'value', function(new_origin) {
    if (new_origin) {
      return updateSelectionWithOrigin(new_origin);
    }
  });
  return $.when($libsReady).done(function() {
    var ref;
    $('.scrollable', $ctx).each(function(idx, el) {
      return el.perfectscrollbar = new PerfectScrollbar(el, {
        minScrollbarLength: 20
      });
    });
    updateSelectionWithOrigin((ref = window.global.getActiveDeparture()) != null ? ref.name : void 0);
    $(document).on('click', '.data-column.depart-from .item', function(e) {
      return selectOriginItem(this, 'dont_fallback');
    });
    return $(document).on('click', '.data-column.destination-to .item', function(e) {
      var $this;
      $this = $(this);
      $this.closest('.data-column').attr('data-preferred-destination', $this.text());
      return selectDestinationItem($this, 'dont-scroll');
    });
  });
});
