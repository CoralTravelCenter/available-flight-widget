window.ASAP ||= (->
    fns = []
    callall = () ->
        f() while f = fns.shift()
    if document.addEventListener
        document.addEventListener 'DOMContentLoaded', callall, false
        window.addEventListener 'load', callall, false
    else if document.attachEvent
        document.attachEvent 'onreadystatechange', callall
        window.attachEvent 'onload', callall
    (fn) ->
        fns.push fn
        callall() if document.readyState is 'complete'
)()

window.log ||= () ->
    if window.console and window.DEBUG
        console.group? window.DEBUG
        if arguments.length == 1 and Array.isArray(arguments[0]) and console.table
            console.table.apply window, arguments
        else
            console.log.apply window, arguments
        console.groupEnd?()
window.trouble ||= () ->
    if window.console
        console.group? window.DEBUG if window.DEBUG
        console.warn?.apply window, arguments
        console.groupEnd?() if window.DEBUG

window.preload ||= (what, fn) ->
    what = [what] unless  Array.isArray(what)
    $.when.apply($, ($.ajax(lib, dataType: 'script', cache: true) for lib in what)).done -> fn?()

window.queryParam ||= (p, nocase) ->
    params_kv = location.search.substr(1).split('&')
    params = {}
    params_kv.forEach (kv) -> k_v = kv.split('='); params[k_v[0]] = k_v[1] or ''
    if p
        if nocase
            return decodeURIComponent(params[k]) for k of params when k.toUpperCase() == p.toUpperCase()
            return undefined
        else
            return decodeURIComponent params[p]
    params

window.DEBUG = 'APP NAME'

responsiveHandler = (query, match_handler, unmatch_handler) ->
    layout = matchMedia query
    layout.addEventListener 'change', (e) ->
        if e.matches then match_handler() else unmatch_handler()
    if layout.matches then match_handler() else unmatch_handler()
    layout

observeElementProp = (el, prop, callback) ->
    proto = Object.getPrototypeOf(el)
    if proto.hasOwnProperty(prop)
        descr = Object.getOwnPropertyDescriptor proto, prop
        Object.defineProperty el, prop,
            get: () -> descr.get.apply this, arguments
            set: (v) ->
                oldv = this[prop]
                descr.set.apply this, arguments
                newv = v
                setTimeout(callback.bind(this, newv, oldv), 0) if newv != oldv

isPreferredDestinationAvailable = (list, prefer) ->
    prefer ||= $('.data-column.destination-to').closest('[data-preferred-destination]').attr('data-preferred-destination')
    list.find (item) -> item.Name == prefer

updateSelectionWithOrigin = (origin_name) ->
    $origin_item = $ $('.data-column.depart-from .item').toArray().find (item) -> $(item).text() == origin_name
    selectOriginItem $origin_item

selectOriginItem = ($item, dont_fallback_to_moscow) ->
    $item = $($item)
    $item.siblings().removeClass 'selected'
    ajaxGet('https://www.coral.ru/v1/geography/tocountryfilter', areaid: $item.attr('data-departureid'))
    .then (response) ->
        if isPreferredDestinationAvailable response
            if dont_fallback_to_moscow
                $item.addClass('selected')
            else
                $item.addClass('selected')
                $item.closest('.scrollable').scrollTo $item, 500, offset: -30, complete: -> $item.addClass('selected')
            rebuildDestinationsListWithData response
        else
            if dont_fallback_to_moscow
                $item.addClass('selected')
                rebuildDestinationsListWithData response
            else
                setTimeout ->
                    selectOriginItem $('.data-column.depart-from .item[data-departureid="2671"]')
                ,0
    updateSelectionInfo()

selectDestinationItem = ($item, dont_scroll) ->
    rebuildAirportsListWithData []
    $item = $($item)
    $item.siblings().removeClass 'selected'
    if dont_scroll
        $item.addClass('selected')
    else
        $item.closest('.scrollable').scrollTo $item, 500, offset: -30, complete: -> $item.addClass('selected')
    req_params =
        fromAreaId: $('.data-column.depart-from .item.selected').attr('data-departureid')
        toCountryId: $item.attr('data-id')
    ajaxGet 'https://www.coral.ru/v1/flight/availabledate', req_params
    .then (response) ->
        rebuildAirportsListWithData response.Result
    updateSelectionInfo()

selectAirportListItem = ($item, dont_scroll) ->
    $item = $($item)
    $item.siblings().removeClass 'selected'
    if dont_scroll
        $item.addClass('selected')
    else
        $item.closest('.scrollable').scrollTo $item, 500, offset: -30, complete: -> $item.addClass('selected')
    updateSelectionInfo()

rebuildDestinationsListWithData = (list) ->
    $('.data-column.destination-airport-closest-date .scrollable').empty()
    $block = $('.data-column.destination-to')
    $container = $block.find('.scrollable')
    $container.empty()
    $container.append list.map (item_data) -> "<div class='item' data-id='#{ item_data.Id }'>#{ item_data.Name }</div>"
    $container.get(0).perfectscrollbar?.update()
    prefer = $block.closest('[data-preferred-destination]').attr('data-preferred-destination')
    preferred_item = $container.find('.item').toArray().find (item) -> $(item).text() == prefer
    selectDestinationItem preferred_item if preferred_item

rebuildAirportsListWithData = (list) ->
    $container = $('.data-column.destination-airport-closest-date .scrollable')
    $container.empty()
    items = list.map (item_data) -> "<div class='item dbl' data-toareaid='#{ item_data.ToAreaId }' data-flight-timestamp='#{ item_data.FlightDate.replace(/\D/g, '') }'><span>#{ item_data.ToAreaName }</span><span>#{ moment(Number(item_data.FlightDate.replace(/\D/g, ''))).format('DD.MM.YYYY') }</span></div>"
    $container.append items
    $container.get(0).perfectscrollbar?.update()
    if items.length == 1
        selectAirportListItem $container.find('.item'), 'dont-scroll'

updateSelectionInfo = () ->
    setTimeout ->
        $button = $('.foot [data-action="select-tour"]')
        $container = $ctx.find('.foot .selection-info').empty()
        items = $ctx.find('.data-column .item.selected').toArray().map (item) ->
            $item = $(item)
            if $item.children().length
                return "<span>#{ $item.children().map((idx, el) -> $(el).text()).toArray().join(', ') }</span>"
            else
                return "<span>#{ $item.text() }</span>"
        items_html = items.join('')
        $container.append items_html
        if items.length == 3
            $button.removeAttr 'disabled'
        else
            $button.attr disabled: 'disabled'
    , 1000

LOCAL_GET_CACHE = {}
#    'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2671': '[{"Id":1,"Name":"Турция"},{"Id":3,"Name":"Россия"},{"Id":12,"Name":"Египет"},{"Id":31,"Name":"ОАЭ"},{"Id":33,"Name":"Таиланд"},{"Id":282,"Name":"Бахрейн"},{"Id":52,"Name":"Индия"},{"Id":35,"Name":"Мальдивы"},{"Id":40,"Name":"Шри-Ланка"},{"Id":60,"Name":"Танзания"},{"Id":41,"Name":"Вьетнам"},{"Id":39,"Name":"Сейшелы"},{"Id":63,"Name":"Маврикий"},{"Id":278,"Name":"Абхазия"},{"Id":7,"Name":"Азербайджан"},{"Id":5,"Name":"Армения"},{"Id":8,"Name":"Беларусь"},{"Id":49,"Name":"Узбекистан"},{"Id":36,"Name":"Доминиканская Республика"},{"Id":98,"Name":"Мексика"},{"Id":38,"Name":"Индонезия"},{"Id":72,"Name":"Андорра"},{"Id":42,"Name":"Испания"},{"Id":18,"Name":"Италия"},{"Id":216,"Name":"Кипр"},{"Id":108,"Name":"Хорватия"},{"Id":10,"Name":"Болгария"},{"Id":80,"Name":"Черногория"},{"Id":48,"Name":"Куба"}]'
#    'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2328': '[{"Id":3,"Name":"Россия"},{"Id":278,"Name":"Абхазия"}]'
#    'https://www.coral.ru/v1/geography/tocountryfilter?areaid=2449': '[{"Id":1,"Name":"Турция"},{"Id":3,"Name":"Россия"},{"Id":12,"Name":"Египет"},{"Id":31,"Name":"ОАЭ"},{"Id":33,"Name":"Таиланд"},{"Id":282,"Name":"Бахрейн"},{"Id":52,"Name":"Индия"},{"Id":35,"Name":"Мальдивы"},{"Id":40,"Name":"Шри-Ланка"},{"Id":39,"Name":"Сейшелы"},{"Id":63,"Name":"Маврикий"},{"Id":278,"Name":"Абхазия"},{"Id":7,"Name":"Азербайджан"},{"Id":5,"Name":"Армения"},{"Id":8,"Name":"Беларусь"},{"Id":49,"Name":"Узбекистан"},{"Id":38,"Name":"Индонезия"}]'
#    'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2671&toCountryId=1': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area63","ToAreaName":"Стамбул (Istanbul)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area5","ToAreaName":"Анталья (Antalya)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area26","ToAreaName":"Измир (Izmir)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area3264","ToAreaName":"Даламан (Dalaman)"},{"FlightDate":"\\/Date(1672185600000)\\/","ToAreaId":"Area44","ToAreaName":"Кайсери (Kayseri)"},{"FlightDate":"\\/Date(1672272000000)\\/","ToAreaId":"Area14","ToAreaName":"Эрзурум (Erzurum)"},{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area1","ToAreaName":"Бодрум (Bodrum)"}],"ErrorMessage":null}'
#    'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2671&toCountryId=35': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area271","ToAreaName":"Мале (Male)"}],"ErrorMessage":null}'
#    'https://www.coral.ru/v1/flight/availabledate?fromAreaId=2449&toCountryId=35': '{"IsSuccess":true,"Result":[{"FlightDate":"\\/Date(1670025600000)\\/","ToAreaId":"Area271","ToAreaName":"Мале (Male)"}],"ErrorMessage":null}'

ajaxGet = (endpoint, req_params) ->
    $promise = $.Deferred()
    request_uri = endpoint + '?' + $.param(req_params)
    if LOCAL_GET_CACHE[request_uri]
        $promise.resolve(if typeof LOCAL_GET_CACHE[request_uri] == 'string' then JSON.parse(LOCAL_GET_CACHE[request_uri]) else LOCAL_GET_CACHE[request_uri])
    else
        $.ajax(request_uri).then (response) -> $promise.resolve(response)
    $promise

fetchDestinationWithFallback = (primary_id, fallback_id) ->
    $promise = $.Deferred()
    $.get '/v1/destination/destinationbyid', destinationId: primary_id
        .done (destination_response) ->
            destination = destination_response.Item
            if destination
                $promise.resolve(destination)
            else
                $.get '/v1/destination/destinationbyid', destinationId: fallback_id
                    .done (destination_response) ->
                        destination = destination_response.Item
                        $promise.resolve(destination)
    $promise

$ctx = null

ASAP ->
    $ctx = $('.available-flight-widget')
    responsiveHandler '(max-width: 768px)',
        ->
            $headitems = $('.head-item', $ctx)
            $('.data-column', $ctx).each (idx, el) ->
                $(el).prepend $headitems.eq(idx)
            $('.data-column .scrollable').each (idx, el) ->
                el.perfectscrollbar?.update()
        ->
            $('.head', $ctx).append($('.head-item', $ctx))
            $('.data-column .scrollable').each (idx, el) ->
                el.perfectscrollbar?.update()

    nodes_array = $('.geolocation-list li').map (idx, li) ->
        $li = $(li)
        $('<div class="item"></div>').text($li.text()).attr('data-departureid': $li.attr('data-departureid')).get(0)
    $('.data-column.depart-from .scrollable').empty().append nodes_array

    libs = [
        'https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.5.5/perfect-scrollbar.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/2.1.3/jquery.scrollTo.min.js'
    ]
    $libsReady = $.Deferred()
    preload libs, -> $libsReady.resolve()

    observeElementProp $('input.packageSearch__departureInput').get(0), 'value', (new_origin) ->
        updateSelectionWithOrigin new_origin if new_origin

    $.when($libsReady).done ->
        $('.scrollable', $ctx).each (idx, el) ->
            el.perfectscrollbar = new PerfectScrollbar(el, { minScrollbarLength: 20 })
        updateSelectionWithOrigin window.global.getActiveDeparture()?.name

        $(document).on 'click', '.data-column.depart-from .item', (e) ->
            selectOriginItem this, 'dont_fallback'

        $(document).on 'click', '.data-column.destination-to .item', (e) ->
            $this = $(this)
            $this.closest('.data-column').attr 'data-preferred-destination', $this.text()
            selectDestinationItem $this, 'dont-scroll'

        $(document).on 'click', '.data-column.destination-airport-closest-date .item', (e) ->
            $this = $(this)
            selectAirportListItem $this, 'dont-scroll'

        $('[data-action="select-tour"]').on 'click', (e) ->
            window.global.travelloader.show()
            $departure_item = $('.data-column.depart-from .item.selected')
            fromAreaId = $departure_item.attr 'data-departureid'
            fromAreaLabel = $departure_item.text()
            destinationCountryId = $('.data-column.destination-to .item.selected').attr 'data-id'
            $airport_item = $('.data-column.destination-airport-closest-date .item.selected')
            to_area_id = $airport_item.attr 'data-toareaid'
            flight_moment = moment(Number($airport_item.attr('data-flight-timestamp')))
            fetchDestinationWithFallback to_area_id, "Country#{ destinationCountryId }"
                .done (destination_response) ->
                    destination = destination_response
                    $.ajax '/v1/flight/availablenights',
                        data:
                            fromAreaId:      fromAreaId
                            destinationId:   destination.Id
                            toCountryId:     destinationCountryId
                            toAreaId:        ''
                            toPlaceId:       ''
                            nearestAirports: destination.NearestAirports.join(',')
                            beginDate:       flight_moment.format('YYYY-MM-DD')
                            endDate:         flight_moment.format('YYYY-MM-DD')
                            flightType:      ''
                    .then (available_nights_response) ->
                        if available_nights_response.Result.length
                            nights = available_nights_response.Result.slice().filter (n) -> n != 1
                            .sort (a, b) ->
                                va = Math.abs(7 - a)
                                vb = Math.abs(7 - b)
                                if va < vb then -1 else (if va > vb then 1 else 0)
                            .slice(0, 3).sort (a, b) -> a - b
                            $.ajax '/v1/package/search',
                                method: 'post'
                                data:
                                    isCharter:    true,
                                    isRegular:    true
                                    Guest:        Adults: 2
                                    SelectedDate: flight_moment.format('YYYY-MM-DD')
                                    DateRange:    0,
                                    BeginDate:    flight_moment.format('YYYY-MM-DD')
                                    EndDate:      flight_moment.format('YYYY-MM-DD')
                                    Acc:          nights,
                                    Departures:   [{ Id: fromAreaId, Label: fromAreaLabel }],
                                    Destination:  [destination]
                            .then (package_search_response) ->
                                location.href = package_search_response
                        else
                            alert 'No accomodation options avaiilable (nights)'
