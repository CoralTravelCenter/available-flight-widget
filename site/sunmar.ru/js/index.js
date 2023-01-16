var $ctx, LOCAL_GET_CACHE, ajaxGet, fetchDestinationWithFallback, isPreferredDestinationAvailable, observeElementProp, rebuildAirportsListWithData, rebuildDestinationsListWithData, responsiveHandler, selectAirportListItem, selectDestinationItem, selectOriginItem, updateSelectionInfo, updateSelectionWithOrigin;

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
  ajaxGet('/v1/geography/tocountryfilter', {
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
  rebuildAirportsListWithData([]);
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
  ajaxGet('/v1/flight/availabledate', req_params).then(function(response) {
    return rebuildAirportsListWithData(response.Result);
  });
  return updateSelectionInfo();
};

selectAirportListItem = function($item, dont_scroll) {
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
  return updateSelectionInfo();
};

rebuildDestinationsListWithData = function(list) {
  var $block, $container, prefer, preferred_item, ref;
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
  preferred_item = $container.find('.item').toArray().find(function(item) {
    return $(item).text() === prefer;
  });
  if (preferred_item) {
    return selectDestinationItem(preferred_item);
  }
};

rebuildAirportsListWithData = function(list) {
  var $container, items, ref;
  $container = $('.data-column.destination-airport-closest-date .scrollable');
  $container.empty();
  items = list.map(function(item_data) {
    return "<div class='item dbl' data-toareaid='" + item_data.ToAreaId + "' data-flight-timestamp='" + (item_data.FlightDate.replace(/\D/g, '')) + "'><span>" + item_data.ToAreaName + "</span><span>" + (moment(Number(item_data.FlightDate.replace(/\D/g, ''))).format('DD.MM.YYYY')) + "</span></div>";
  });
  $container.append(items);
  if ((ref = $container.get(0).perfectscrollbar) != null) {
    ref.update();
  }
  if (items.length === 1) {
    return selectAirportListItem($container.find('.item'), 'dont-scroll');
  }
};

updateSelectionInfo = function() {
  return setTimeout(function() {
    var $button, $container, items, items_html;
    $button = $('.foot [data-action="select-tour"]');
    $container = $ctx.find('.foot .selection-info').empty();
    items = $ctx.find('.data-column .item.selected').toArray().map(function(item) {
      var $item;
      $item = $(item);
      if ($item.children().length) {
        return "<span>" + ($item.children().map(function(idx, el) {
          return $(el).text();
        }).toArray().join(', ')) + "</span>";
      } else {
        return "<span>" + ($item.text()) + "</span>";
      }
    });
    items_html = items.join('');
    $container.append(items_html);
    if (items.length === 3) {
      return $button.removeAttr('disabled');
    } else {
      return $button.attr({
        disabled: 'disabled'
      });
    }
  }, 1000);
};

LOCAL_GET_CACHE = {};

ajaxGet = function(endpoint, req_params) {
  var $promise, request_uri;
  $promise = $.Deferred();
  request_uri = endpoint + '?' + $.param(req_params);
  if (LOCAL_GET_CACHE[request_uri]) {
    $promise.resolve(typeof LOCAL_GET_CACHE[request_uri] === 'string' ? JSON.parse(LOCAL_GET_CACHE[request_uri]) : LOCAL_GET_CACHE[request_uri]);
  } else {
    $.ajax(request_uri).then(function(response) {
      LOCAL_GET_CACHE[request_uri] = response;
      return $promise.resolve(response);
    });
  }
  return $promise;
};

fetchDestinationWithFallback = function(primary_id, fallback_id) {
  var $promise;
  $promise = $.Deferred();
  $.get('/v1/destination/destinationbyid', {
    destinationId: primary_id
  }).done(function(destination_response) {
    var destination;
    destination = destination_response.Item;
    if (destination) {
      return $promise.resolve(destination);
    } else {
      return $.get('/v1/destination/destinationbyid', {
        destinationId: fallback_id
      }).done(function(destination_response) {
        destination = destination_response.Item;
        return $promise.resolve(destination);
      });
    }
  });
  return $promise;
};

$ctx = null;

ASAP(function() {
  var $libsReady, libs, nodes_array;
  $ctx = $('.available-flight-widget');
  responsiveHandler('(max-width: 768px)', function() {
    var $headitems;
    $headitems = $('.head-item', $ctx);
    $('.data-column', $ctx).each(function(idx, el) {
      return $(el).prepend($headitems.eq(idx));
    });
    return $('.data-column .scrollable').each(function(idx, el) {
      var ref;
      return (ref = el.perfectscrollbar) != null ? ref.update() : void 0;
    });
  }, function() {
    $('.head', $ctx).append($('.head-item', $ctx));
    return $('.data-column .scrollable').each(function(idx, el) {
      var ref;
      return (ref = el.perfectscrollbar) != null ? ref.update() : void 0;
    });
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
        minScrollbarLength: 20,
        wheelPropagation: false
      });
    });
    updateSelectionWithOrigin((ref = window.global.getActiveDeparture()) != null ? ref.name : void 0);
    $(document).on('click', '.data-column.depart-from .item', function(e) {
      return selectOriginItem(this, 'dont_fallback');
    });
    $(document).on('click', '.data-column.destination-to .item', function(e) {
      var $this;
      $this = $(this);
      $this.closest('.data-column').attr('data-preferred-destination', $this.text());
      return selectDestinationItem($this, 'dont-scroll');
    });
    $(document).on('click', '.data-column.destination-airport-closest-date .item', function(e) {
      var $this;
      $this = $(this);
      return selectAirportListItem($this, 'dont-scroll');
    });
    return $('[data-action="select-tour"]').on('click', function(e) {
      var $airport_item, $departure_item, destinationCountryId, flight_moment, fromAreaId, fromAreaLabel, to_area_id;
      window.global.travelloader.show();
      $departure_item = $('.data-column.depart-from .item.selected');
      fromAreaId = $departure_item.attr('data-departureid');
      fromAreaLabel = $departure_item.text();
      destinationCountryId = $('.data-column.destination-to .item.selected').attr('data-id');
      $airport_item = $('.data-column.destination-airport-closest-date .item.selected');
      to_area_id = $airport_item.attr('data-toareaid');
      flight_moment = moment(Number($airport_item.attr('data-flight-timestamp')));
      return fetchDestinationWithFallback(to_area_id, "Country" + destinationCountryId).done(function(destination_response) {
        var destination;
        destination = destination_response;
        return $.ajax('/v1/flight/availablenights', {
          data: {
            fromAreaId: fromAreaId,
            destinationId: destination.Id,
            toCountryId: destinationCountryId,
            toAreaId: '',
            toPlaceId: '',
            nearestAirports: destination.NearestAirports.join(','),
            beginDate: flight_moment.format('YYYY-MM-DD'),
            endDate: flight_moment.format('YYYY-MM-DD'),
            flightType: ''
          }
        }).then(function(available_nights_response) {
          var nights;
          if (available_nights_response.Result.length) {
            nights = available_nights_response.Result.slice().filter(function(n) {
              return n !== 1;
            }).sort(function(a, b) {
              var va, vb;
              va = Math.abs(7 - a);
              vb = Math.abs(7 - b);
              if (va < vb) {
                return -1;
              } else {
                if (va > vb) {
                  return 1;
                } else {
                  return 0;
                }
              }
            }).slice(0, 3).sort(function(a, b) {
              return a - b;
            });
            return $.ajax('/v1/package/search', {
              method: 'post',
              data: {
                isCharter: true,
                isRegular: true,
                Guest: {
                  Adults: 2
                },
                SelectedDate: flight_moment.format('YYYY-MM-DD'),
                DateRange: 0,
                BeginDate: flight_moment.format('YYYY-MM-DD'),
                EndDate: flight_moment.format('YYYY-MM-DD'),
                Acc: nights,
                Departures: [
                  {
                    Id: fromAreaId,
                    Label: fromAreaLabel
                  }
                ],
                Destination: [destination]
              }
            }).then(function(package_search_response) {
              return location.href = package_search_response;
            });
          } else {
            alert('Нет вариантов размещения');
            return window.global.travelloader.hide();
          }
        });
      });
    });
  });
});
