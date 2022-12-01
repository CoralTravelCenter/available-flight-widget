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


ASAP ->
    $ctx = $('.available-flight-widget')
    responsiveHandler '(max-width: 768px)',
        ->
            $headitems = $('.head-item', $ctx)
            $('.data-column', $ctx).each (idx, el) ->
                $(el).prepend $headitems.eq(idx)
        ->
            $('.head', $ctx).append($('.head-item', $ctx))

    nodes_array = $('.geolocation-list li').map (idx, li) ->
        $li = $(li)
        $('<div class="item"></div>').text($li.text()).attr('data-departureid': $li.attr('data-departureid')).get(0)
    $('.data-column.depart-from .scrollable').empty().append nodes_array

    libs = [
        'https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.5.5/perfect-scrollbar.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/2.1.3/jquery.scrollTo.min.js'
    ]
    preload libs, ->
        $('.scrollable', $ctx).each (idx, el) ->
            new PerfectScrollbar(el, { minScrollbarLength: 20 })

    observeElementProp $('input.packageSearch__departureInput').get(0), 'value', (new_destination) ->
        if new_destination
            1
