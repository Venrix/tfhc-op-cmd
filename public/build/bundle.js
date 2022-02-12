
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.46.4 */

    function create_fragment$j(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $location;
    	let $routes;
    	let $base;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, 'routes');
    	component_subscribe($$self, routes, value => $$invalidate(6, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, 'location');
    	component_subscribe($$self, location, value => $$invalidate(5, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, 'base');
    	component_subscribe($$self, base, value => $$invalidate(7, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ['basepath', 'url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('basepath' in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate(4, url = $$props.url);
    		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$location,
    		$routes,
    		$base
    	});

    	$$self.$inject_state = $$props => {
    		if ('basepath' in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate(4, url = $$props.url);
    		if ('hasActiveRoute' in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 128) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			{
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 96) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			{
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		$location,
    		$routes,
    		$base,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.46.4 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 4,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[2],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, routeParams, $location*/ 532)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[2],
    		/*routeProps*/ ctx[3]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 28)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Route', slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, 'activeRoute');
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, 'location');
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('path' in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ('component' in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ('$$scope' in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ('path' in $$props) $$invalidate(8, path = $$new_props.path);
    		if ('component' in $$props) $$invalidate(0, component = $$new_props.component);
    		if ('routeParams' in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
    		if ('routeProps' in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 2) {
    			if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(2, routeParams = $activeRoute.params);
    			}
    		}

    		{
    			const { path, component, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.46.4 */
    const file$g = "node_modules\\svelte-routing\\src\\Link.svelte";

    function create_fragment$h(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1],
    		/*$$restProps*/ ctx[6]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$g, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*ariaCurrent*/ 4) && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1],
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let ariaCurrent;
    	const omit_props_names = ["to","replace","state","getProps"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $location;
    	let $base;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Link', slots, ['default']);
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, 'base');
    	component_subscribe($$self, base, value => $$invalidate(14, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, 'location');
    	component_subscribe($$self, location, value => $$invalidate(13, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('to' in $$new_props) $$invalidate(7, to = $$new_props.to);
    		if ('replace' in $$new_props) $$invalidate(8, replace = $$new_props.replace);
    		if ('state' in $$new_props) $$invalidate(9, state = $$new_props.state);
    		if ('getProps' in $$new_props) $$invalidate(10, getProps = $$new_props.getProps);
    		if ('$$scope' in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		ariaCurrent,
    		$location,
    		$base
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('to' in $$props) $$invalidate(7, to = $$new_props.to);
    		if ('replace' in $$props) $$invalidate(8, replace = $$new_props.replace);
    		if ('state' in $$props) $$invalidate(9, state = $$new_props.state);
    		if ('getProps' in $$props) $$invalidate(10, getProps = $$new_props.getProps);
    		if ('href' in $$props) $$invalidate(0, href = $$new_props.href);
    		if ('isPartiallyCurrent' in $$props) $$invalidate(11, isPartiallyCurrent = $$new_props.isPartiallyCurrent);
    		if ('isCurrent' in $$props) $$invalidate(12, isCurrent = $$new_props.isCurrent);
    		if ('props' in $$props) $$invalidate(1, props = $$new_props.props);
    		if ('ariaCurrent' in $$props) $$invalidate(2, ariaCurrent = $$new_props.ariaCurrent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 16512) {
    			$$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 8193) {
    			$$invalidate(11, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 8193) {
    			$$invalidate(12, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 4096) {
    			$$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 15361) {
    			$$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		$$restProps,
    		to,
    		replace,
    		state,
    		getProps,
    		isPartiallyCurrent,
    		isCurrent,
    		$location,
    		$base,
    		$$scope,
    		slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			to: 7,
    			replace: 8,
    			state: 9,
    			getProps: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Wiki.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$f = "src\\Wiki.svelte";
    const get_content_slot_changes = dirty => ({});
    const get_content_slot_context = ctx => ({});

    // (175:4) <Link to="/" id="nav-logo">
    function create_default_slot_1$2(ctx) {
    	let t0;
    	let span;

    	const block = {
    		c: function create() {
    			t0 = text("TFHC ");
    			span = element("span");
    			span.textContent = "Wiki";
    			add_location(span, file$f, 174, 36, 4234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(175:4) <Link to=\\\"/\\\" id=\\\"nav-logo\\\">",
    		ctx
    	});

    	return block;
    }

    // (189:4) <Link to="/" id="return-button">
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Return");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(189:4) <Link to=\\\"/\\\" id=\\\"return-button\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div7;
    	let nav;
    	let link0;
    	let t0;
    	let div0;
    	let span;
    	let t2;
    	let input;
    	let t3;
    	let div1;
    	let t5;
    	let div5;
    	let div3;
    	let div2;
    	let t6;
    	let div4;
    	let t7;
    	let div6;
    	let t9;
    	let link1;
    	let t10;
    	let main;
    	let t11;
    	let footer;
    	let current;

    	link0 = new Link({
    			props: {
    				to: "/",
    				id: "nav-logo",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				to: "/",
    				id: "return-button",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const content_slot_template = /*#slots*/ ctx[0].content;
    	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[1], get_content_slot_context);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			nav = element("nav");
    			create_component(link0.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "search";
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "navigation";
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			t6 = space();
    			div4 = element("div");
    			t7 = space();
    			div6 = element("div");
    			div6.textContent = "wiki";
    			t9 = space();
    			create_component(link1.$$.fragment);
    			t10 = space();
    			main = element("main");
    			if (content_slot) content_slot.c();
    			t11 = space();
    			footer = element("footer");
    			attr_dev(span, "class", "material-icons svelte-rz3gbl");
    			add_location(span, file$f, 176, 6, 4293);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "search");
    			attr_dev(input, "placeholder", "Wiki durchsuchen...");
    			attr_dev(input, "class", "svelte-rz3gbl");
    			add_location(input, file$f, 177, 6, 4343);
    			attr_dev(div0, "id", "nav-search");
    			attr_dev(div0, "class", "svelte-rz3gbl");
    			add_location(div0, file$f, 175, 4, 4264);
    			attr_dev(div1, "class", "nav-list-title svelte-rz3gbl");
    			add_location(div1, file$f, 180, 4, 4432);
    			attr_dev(div2, "id", "nav-list-bar-thumb");
    			attr_dev(div2, "class", "svelte-rz3gbl");
    			add_location(div2, file$f, 183, 8, 4550);
    			attr_dev(div3, "id", "nav-list-bar");
    			attr_dev(div3, "class", "svelte-rz3gbl");
    			add_location(div3, file$f, 182, 6, 4517);
    			attr_dev(div4, "id", "nav-list");
    			attr_dev(div4, "class", "svelte-rz3gbl");
    			add_location(div4, file$f, 185, 6, 4603);
    			attr_dev(div5, "id", "nav-list-wrapper");
    			attr_dev(div5, "class", "svelte-rz3gbl");
    			add_location(div5, file$f, 181, 4, 4482);
    			attr_dev(div6, "class", "nav-list-title svelte-rz3gbl");
    			add_location(div6, file$f, 187, 4, 4642);
    			attr_dev(nav, "class", "svelte-rz3gbl");
    			add_location(nav, file$f, 173, 2, 4191);
    			add_location(main, file$f, 191, 2, 4747);
    			add_location(footer, file$f, 194, 2, 4797);
    			attr_dev(div7, "id", "wiki-wrapper");
    			attr_dev(div7, "class", "svelte-rz3gbl");
    			add_location(div7, file$f, 172, 0, 4164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, nav);
    			mount_component(link0, nav, null);
    			append_dev(nav, t0);
    			append_dev(nav, div0);
    			append_dev(div0, span);
    			append_dev(div0, t2);
    			append_dev(div0, input);
    			append_dev(nav, t3);
    			append_dev(nav, div1);
    			append_dev(nav, t5);
    			append_dev(nav, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(nav, t7);
    			append_dev(nav, div6);
    			append_dev(nav, t9);
    			mount_component(link1, nav, null);
    			append_dev(div7, t10);
    			append_dev(div7, main);

    			if (content_slot) {
    				content_slot.m(main, null);
    			}

    			append_dev(div7, t11);
    			append_dev(div7, footer);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (content_slot) {
    				if (content_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						content_slot,
    						content_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(content_slot_template, /*$$scope*/ ctx[1], dirty, get_content_slot_changes),
    						get_content_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(content_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(content_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(link0);
    			destroy_component(link1);
    			if (content_slot) content_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Wiki', slots, ['content']);

    	onMount(async () => {
    		const thumb = document.getElementById("nav-list-bar-thumb");
    		const sections = document.querySelectorAll("section:not(section>section)");
    		const navList = document.getElementById("nav-list");
    		const bar = document.getElementById("nav-list-bar");
    		var sectionsArr = Array.from(sections);

    		/* Konvertiert "Sections" NodeList zu Array (falls man's mal brauch x) */
    		// for(var i = sections.length; i--; sectionsArr.unshift(sections[i]));
    		/* Fügt h2 zu allen elementen der NodeList */
    		sectionsArr.forEach(element => {
    			element.insertAdjacentHTML("afterbegin", "<h2>" + element.id + "</h2>");
    			navList.innerHTML += '<a href="#' + element.id + '">' + element.id + "</a>";
    		});

    		/* setzt nav-list-bar-thumb auf genaue höhe von einem navi punkt */
    		var thumbPercent = 1 / sections.length * 100;

    		if (parseInt(bar.style.paddingTop) - parseInt(thumb.style.height) <= parseInt(window.getComputedStyle(bar).getPropertyValue("height"))) {
    			thumb.style.height = parseInt(parseInt(window.getComputedStyle(bar).getPropertyValue("height"))) * (thumbPercent / 100) + "px";
    		}

    		//	thumb.style.height = 1 / sections.length * 100 + "%";
    		//  window.addEventListener("scroll", (event) => {
    		//    bar.style.paddingTop = window.scrollY / (sections.length * 10) + "rem";
    		//  });
    		var sectionHeight = 0;

    		sections.forEach(element => {
    			sectionHeight += parseInt(window.getComputedStyle(element).height);
    		});

    		console.log(sectionHeight);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Wiki> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Link, onMount });
    	return [slots, $$scope];
    }

    class Wiki extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wiki",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\Wiki\Grundlagen.svelte generated by Svelte v3.46.4 */
    const file$e = "src\\Wiki\\Grundlagen.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$d(ctx) {
    	let h1;
    	let t1;
    	let section0;
    	let p0;
    	let t3;
    	let section1;
    	let p1;
    	let t5;
    	let section2;
    	let p2;
    	let t7;
    	let section3;
    	let p3;
    	let t9;
    	let section4;
    	let p4;
    	let t11;
    	let section5;
    	let p5;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Grundlagen";
    			t1 = space();
    			section0 = element("section");
    			p0 = element("p");
    			p0.textContent = "Sanitäter (von lat. sanitas „Gesundheit“) ist im Allgemeinen eine Bezeichnung für nichtärztliches Personal im Sanitäts-/Rettungsdienst oder des militärischen Sanitätswesens sowie im Speziellen für eine Person, die eine Sanitätsausbildung absolviert hat. libero ipsum ipsam quos natus error corrupti officia, animi exercitationem provident, voluptas vitae autem quis cum impedit expedita atque amet dignissimos! Sequi, labore corrupti nulla exercitationem amet nostrum? Possimus Similique ut sequi labore suscipit!";
    			t3 = space();
    			section1 = element("section");
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores necessitatibus repellendus sit perspiciatis! Pariatur impedit voluptate, nam inventore consequuntur corporis voluptates qui blanditiis repudiandae provident dolorum eveniet ipsam recusandae beatae sunt assumenda itaque, natus harum? Impedit quibusdam eaque, omnis consectetur enim rerum porro perferendis eius beatae eum tempore maxime est ea vero? Aperiam, amet nobis? Delectus voluptas alias, nostrum sint nulla exercitationem accusantium assumenda? Molestias quaerat eius fuga aut est!";
    			t5 = space();
    			section2 = element("section");
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores necessitatibus repellendus sit perspiciatis! Pariatur impedit voluptate, nam inventore consequuntur corporis voluptates qui blanditiis repudiandae provident dolorum eveniet ipsam recusandae beatae sunt assumenda itaque, natus harum? Impedit quibusdam eaque, omnis consectetur enim rerum porro perferendis eius beatae eum tempore maxime est ea vero? Aperiam, amet nobis? Delectus voluptas alias, nostrum sint nulla exercitationem accusantium assumenda? Molestias quaerat eius fuga aut est!";
    			t7 = space();
    			section3 = element("section");
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores necessitatibus repellendus sit perspiciatis! Pariatur impedit voluptate, nam inventore consequuntur corporis voluptates qui blanditiis repudiandae provident dolorum eveniet ipsam recusandae beatae sunt assumenda itaque, natus harum? Impedit quibusdam eaque, omnis consectetur enim rerum porro perferendis eius beatae eum tempore maxime est ea vero? Aperiam, amet nobis? Delectus voluptas alias, nostrum sint nulla exercitationem accusantium assumenda? Molestias quaerat eius fuga aut est!";
    			t9 = space();
    			section4 = element("section");
    			p4 = element("p");
    			p4.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores necessitatibus repellendus sit perspiciatis! Pariatur impedit voluptate, nam inventore consequuntur corporis voluptates qui blanditiis repudiandae provident dolorum eveniet ipsam recusandae beatae sunt assumenda itaque, natus harum? Impedit quibusdam eaque, omnis consectetur enim rerum porro perferendis eius beatae eum tempore maxime est ea vero? Aperiam, amet nobis? Delectus voluptas alias, nostrum sint nulla exercitationem accusantium assumenda? Molestias quaerat eius fuga aut est!";
    			t11 = space();
    			section5 = element("section");
    			p5 = element("p");
    			p5.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores necessitatibus repellendus sit perspiciatis! Pariatur impedit voluptate, nam inventore consequuntur corporis voluptates qui blanditiis repudiandae provident dolorum eveniet ipsam recusandae beatae sunt assumenda itaque, natus harum? Impedit quibusdam eaque, omnis consectetur enim rerum porro perferendis eius beatae eum tempore maxime est ea vero? Aperiam, amet nobis? Delectus voluptas alias, nostrum sint nulla exercitationem accusantium assumenda? Molestias quaerat eius fuga aut est!";
    			add_location(h1, file$e, 5, 4, 115);
    			add_location(p0, file$e, 8, 6, 176);
    			attr_dev(section0, "id", "Allgemeines");
    			add_location(section0, file$e, 7, 4, 142);
    			add_location(p1, file$e, 12, 6, 755);
    			attr_dev(section1, "id", "Rollenprofil");
    			add_location(section1, file$e, 11, 4, 720);
    			add_location(p2, file$e, 16, 6, 1372);
    			attr_dev(section2, "id", "Ausrüstung");
    			add_location(section2, file$e, 15, 4, 1339);
    			add_location(p3, file$e, 20, 6, 1995);
    			attr_dev(section3, "id", "Aufgabenbereiche");
    			add_location(section3, file$e, 19, 4, 1956);
    			add_location(p4, file$e, 24, 6, 2616);
    			attr_dev(section4, "id", "Einsatzgebiete");
    			add_location(section4, file$e, 23, 4, 2579);
    			add_location(p5, file$e, 28, 6, 3234);
    			attr_dev(section5, "id", "Kompetenzen");
    			add_location(section5, file$e, 27, 4, 3200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, p0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, p1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, p2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, p3);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, p4);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, section5, anchor);
    			append_dev(section5, p5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(section3);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(section4);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(section5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$d.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$d] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Grundlagen', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Grundlagen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Grundlagen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grundlagen",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\Wiki\Panzertruppen.svelte generated by Svelte v3.46.4 */
    const file$d = "src\\Wiki\\Panzertruppen.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$c(ctx) {
    	let h1;
    	let t1;
    	let section0;
    	let p0;
    	let t3;
    	let section1;
    	let p1;
    	let t5;
    	let section2;
    	let p2;
    	let t7;
    	let section3;
    	let p3;
    	let t9;
    	let section4;
    	let p4;
    	let t10;
    	let i0;
    	let t12;
    	let i1;
    	let t14;
    	let i2;
    	let t16;
    	let t17;
    	let p5;
    	let t19;
    	let section5;
    	let p6;
    	let t20;
    	let i3;
    	let t22;
    	let t23;
    	let p7;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Panzertruppen";
    			t1 = space();
    			section0 = element("section");
    			p0 = element("p");
    			p0.textContent = "Die Abteilung der Panzertruppen ist eine Zusammensetzung aus Panzerbesatzungen bestehend aus Kommandanten, Richtschützen und Fahrern sowie vielfältigen Fahrzeugklassen und Waffensystemen. Ihre Anforderungsbereiche reichen vom modernen Panzerkampf über den Orts- und Häuserkampf mit den Streitkräften bis hin zur Feuerunterstützung der Streitkräfte durch Artilleriefeuer. Alle Spieler der Panzertruppen durchlaufen Ausbildungen, die jeweils auf bestimmte Fahrzeugklassen ausgerichtet sind. Nach Beendigung der Ausbildung können die Spieler an Events mit ihrer Fahrzeugklasse teilnehmen. Neben den Ausbildungen und den Events finden Übungen statt, die speziell für die Panzerbesatzungen der Panzertruppen vorgesehen sind.";
    			t3 = space();
    			section1 = element("section");
    			p1 = element("p");
    			p1.textContent = "Die Panzertruppen verfügen über unterschiedlichste Fahrzeugklassen mit vielfältigen Spezialisierungen, wie den Kampfpanzer (KPz/MBT), den Schützenpanzer (SPz/IFV), den Flugabwehrpanzer (FlakPz/SPAAG), die Panzerartillerie (PzAr/SPG) und die Raketenartillerie (RkAr/MS). Jede Fahrzeugklasse ist für die unterschiedlichsten Anwendungsbereiche vorgesehen, wodurch sich das Spielerlebnis massiv unterscheidet. Je nach Auftrag eines Einsatzes können die Fahrzeugklassen auch gemeinsam agieren, um die höchstmögliche Kampfeffizienz zu erzielen.";
    			t5 = space();
    			section2 = element("section");
    			p2 = element("p");
    			p2.textContent = "Die Panzerbesatzungen der Panzertruppen setzen sich im Normalfall aus jeweils drei Spielern zusammen. Der Kommandant hat die Befehlsgewalt und trägt die Verantwortung für sein Fahrzeug und seine Besatzung. Die Erfüllung des Einsatzauftrages ist durch den Informationsfluss mit verbündeten Kräften, der Befehlserteilung und der Einhaltung von Befehlen des Panzerzugführers durch ihn zu erreichen. Die Kraftfahrer der Panzertruppen nehmen unmittelbaren Einfluss auf die Bewegung ihres Fahrzeuges. Ihre Aufgabe ist das Manövrieren des Fahrzeuges entsprechend der Anweisungen ihrer Kommandanten. Die Richtschützen der Panzertruppen bedienen die Waffenanlage ihrer Fahrzeuge entsprechend der Anweisungen ihres Kommandanten. Sie sind unmittelbar an der Aufklärung und Bekämpfung von Feindkräften sowie der Deckung eigener Truppen beteiligt.";
    			t7 = space();
    			section3 = element("section");
    			p3 = element("p");
    			p3.textContent = "Zur Wahrung von Struktur und Ordnung während eines Einsatzes gibt es bei den Panzertruppen eine klare Hierarchie. Alle Fahrer und Richtschützen der Panzertruppen sind das unterste Glied der Führungskette. Ihr Vorgesetzter ist ihr Kommandant, der ihnen Befehle erteilt. Alle Kommandanten eines Panzerzuges unterstehen dem jeweiligen Panzerzugführer. Seine Verantwortung liegt in der Koordination und Führung des ganzen Panzerzuges, während er eine Funkverbindung zu den Führungselementen und anderen unterstützenden Elementen hält. Die Kommunikation der Führungskette ist intuitiv: Die Befehle werden von der Führungsebene bis zum unterstem Glied der Führungskette weitergegeben. Aus der entgegengesetzten Richtung stammen Meldungen, Fragen, Statusberichte, etc. der Panzerbesatzungen.";
    			t9 = space();
    			section4 = element("section");
    			p4 = element("p");
    			t10 = text("Feindliche Kräfte werden innerhalb der Panzertruppen gemäß der REZ-Regel gemeldet. Eine Feindmeldung erfolgt durch die ");
    			i0 = element("i");
    			i0.textContent = "Richtungsangabe";
    			t12 = text(", ");
    			i1 = element("i");
    			i1.textContent = "Entfernungsangabe";
    			t14 = text(" und der ");
    			i2 = element("i");
    			i2.textContent = "Zieldefinition des Feindes";
    			t16 = text(". Die Richtungsangabe erfolgt im Normalfall entsprechend einer Uhrzeit relativ zur Fahrzeugwanne oder in Gradzahlen. Die Entfernungsangabe wird in Hundert übergeben, also wird „1.200 Meter“ zu „zwölfhundert Meter“. Ausnahmen sind hierbei Tausenderzahlen wie 1.000, 2.000, usw. Die Zieldefinition erfolgt als Typdefinition des Feindes. Eine feindliche Infanteriegruppe wird als solche gemeldet und ein Fahrzeug wird entsprechend der vorgesehenen Akronyme durchgegeben.");
    			t17 = space();
    			p5 = element("p");
    			p5.textContent = "Die im Normalfall aus vier Fahrzeugen derselben Fahrzeugklasse bestehenden Panzerzüge der Panzertruppen können in den unterschiedlichsten Formen vorkommen. Neben der Formierung von verminderten oder verstärkten Panzerzügen kann die Bildung eines Sonderzuges erfolgen. Ein Sonderzug ist ein Kampfverband, der aus unterschiedlichen Fahrzeugklassen zusammengesetzt ist. Die Zusammenschließung oder Neubildung von Panzerzügen kann während des Einsatzes durch die Führungskraft der Panzertruppen erfolgen.";
    			t19 = space();
    			section5 = element("section");
    			p6 = element("p");
    			t20 = text("Die Kommunikation der Panzertruppen hat einen immensen Einfluss auf ihre Effizienz und Wirkung. Der Funk muss nach dem Leitsatz ");
    			i3 = element("i");
    			i3.textContent = "„so viel wie nötig, so wenig wie möglich“";
    			t22 = text(" erfolgen. Das konkrete Ziel eines Kampfverbandes ist die Bündelung der Feuerkraft und das gegenseitige Schützen.");
    			t23 = space();
    			p7 = element("p");
    			p7.textContent = "Die Kommunikation der Panzertruppen erfolgt über drei Funkkanäle. Der Bordfunk ist ein interner Funkkanal innerhalb eines Fahrzeuges, in dem alle Besatzungsmitglieder miteinander kommunizieren können. Der taktische Funkkanal wird von jedem Besatzungsmitglied eines Zuges genutzt. Der taktische Funkkanal wird vom Zugführer genutzt um möglichst schnell Befehle an Fahrer oder Schützen aller Fahrzeuge seines Zuges zu erteilen. In ihm können Formationswechsel, Geschwindigkeitsjustierungen, Feindmeldungen, Primärziele und Feuerkoordinationen übergeben werden. Der Kommandantenfunkkanal wird von den Kommandanten eines Panzerzuges genutzt, um die Panzerbesatzungen zu entlasten und ein Funkchaos zu vermeiden. Über ihn werden Informationen vermittelt, die keinen unmittelbaren Einfluss auf den aktiven Kampf haben. Dazu zählen Informationen zur Missionsentwicklung, zum Munitionsstand, Schadensberichte an Fahrzeugen, Treibstoffvorräte, Abschüsse, Einzelbefehle, Statusmeldungen, Melden der Einsatzbereitschaft oder Vorschläge.";
    			add_location(h1, file$d, 5, 4, 115);
    			add_location(p0, file$d, 8, 6, 179);
    			attr_dev(section0, "id", "Allgemeines");
    			add_location(section0, file$d, 7, 4, 145);
    			add_location(p1, file$d, 12, 6, 967);
    			attr_dev(section1, "id", "Fahrzeugklassen");
    			add_location(section1, file$d, 11, 4, 929);
    			add_location(p2, file$d, 16, 6, 1579);
    			attr_dev(section2, "id", "Besatzungsmitglieder");
    			add_location(section2, file$d, 15, 4, 1536);
    			add_location(p3, file$d, 20, 6, 2480);
    			attr_dev(section3, "id", "Führungskette");
    			add_location(section3, file$d, 19, 4, 2444);
    			add_location(i0, file$d, 24, 128, 3452);
    			add_location(i1, file$d, 24, 152, 3476);
    			add_location(i2, file$d, 24, 185, 3509);
    			add_location(p4, file$d, 24, 6, 3330);
    			add_location(p5, file$d, 25, 6, 4021);
    			attr_dev(section4, "id", "Formalitäten");
    			add_location(section4, file$d, 23, 4, 3295);
    			add_location(i3, file$d, 29, 137, 4710);
    			add_location(p6, file$d, 29, 6, 4579);
    			add_location(p7, file$d, 30, 6, 4883);
    			attr_dev(section5, "id", "Funk");
    			add_location(section5, file$d, 28, 4, 4552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, p0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, p1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, p2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, p3);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, p4);
    			append_dev(p4, t10);
    			append_dev(p4, i0);
    			append_dev(p4, t12);
    			append_dev(p4, i1);
    			append_dev(p4, t14);
    			append_dev(p4, i2);
    			append_dev(p4, t16);
    			append_dev(section4, t17);
    			append_dev(section4, p5);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, section5, anchor);
    			append_dev(section5, p6);
    			append_dev(p6, t20);
    			append_dev(p6, i3);
    			append_dev(p6, t22);
    			append_dev(section5, t23);
    			append_dev(section5, p7);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(section3);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(section4);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$c.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Panzertruppen', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Panzertruppen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Panzertruppen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panzertruppen",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\Wiki\Sanitaeter.svelte generated by Svelte v3.46.4 */
    const file$c = "src\\Wiki\\Sanitaeter.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$b(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sanitäter";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$c, 5, 4, 115);
    			add_location(p, file$c, 8, 6, 175);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$c, 7, 4, 141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$b.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sanitaeter', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sanitaeter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Sanitaeter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sanitaeter",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Wiki\Aufklaerer.svelte generated by Svelte v3.46.4 */
    const file$b = "src\\Wiki\\Aufklaerer.svelte";

    // (10:702) <Link to="kampfpionier#allgemeines">
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Kampfpionier");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(10:702) <Link to=\\\"kampfpionier#allgemeines\\\">",
    		ctx
    	});

    	return block;
    }

    // (6:2) <svelte:fragment slot="content">
    function create_content_slot$a(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;
    	let t2;
    	let link;
    	let t3;
    	let current;

    	link = new Link({
    			props: {
    				to: "kampfpionier#allgemeines",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Aufklärer";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			t2 = text("Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quam earum modi culpa beatae! Autem ratione necessitatibus iusto quo perspiciatis consequuntur ab quos incidunt animi sit iure, voluptatum consectetur, debitis laudantium dolore quis, ipsam doloribus repudiandae unde odio blanditiis reprehenderit est. Ut ipsam nulla reprehenderit. Quidem facere quia repudiandae sed aut impedit iusto, saepe fugit nulla nostrum totam nesciunt cumque? Sapiente, placeat fugit fugiat pariatur nobis enim nisi impedit consequatur dolore iure distinctio. Minima veritatis maxime minus recusandae at perspiciatis ipsum culpa voluptates quisquam eligendi tenetur dolorem, eum placeat labore odio sint sequi ");
    			create_component(link.$$.fragment);
    			t3 = text(" veniam quam fugiat quaerat repellat assumenda vero temporibus! Quod, ipsum consequatur placeat minima mollitia dolore commodi facere corrupti unde voluptate? Illo magnam pariatur mollitia necessitatibus beatae ut, esse aut aperiam cumque quod fuga inventore asperiores sunt aspernatur odit sequi nulla, tempore earum totam tempora. Soluta sunt deleniti laborum eligendi, hic minima rerum nesciunt quos sed? Quod iure doloremque beatae commodi voluptatum sint, impedit sapiente nihil reiciendis accusamus. Tempora deleniti repellendus numquam. Consequuntur tempore itaque sint id provident, maxime sequi quam dolorum dolores laudantium, earum similique tempora adipisci! Nostrum, illum facere, vel dolores neque obcaecati molestias rem magni autem ut quos asperiores a? Id repellendus porro quis. Assumenda.");
    			add_location(h1, file$b, 6, 4, 155);
    			add_location(p, file$b, 9, 6, 215);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$b, 8, 4, 181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    			append_dev(p, t2);
    			mount_component(link, p, null);
    			append_dev(p, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_component(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$a.name,
    		type: "slot",
    		source: "(6:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Aufklaerer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Aufklaerer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki, Link });
    	return [];
    }

    class Aufklaerer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Aufklaerer",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\Wiki\Funken.svelte generated by Svelte v3.46.4 */
    const file$a = "src\\Wiki\\Funken.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$9(ctx) {
    	let h1;
    	let t1;
    	let section0;
    	let p0;
    	let t3;
    	let section1;
    	let p1;
    	let t4;
    	let i;
    	let t6;
    	let section2;
    	let p2;
    	let t8;
    	let p3;
    	let t10;
    	let p4;
    	let t12;
    	let p5;
    	let t14;
    	let section4;
    	let p6;
    	let t16;
    	let section3;
    	let h30;
    	let t18;
    	let p7;
    	let t20;
    	let h31;
    	let t22;
    	let p8;
    	let t24;
    	let p9;
    	let t26;
    	let section5;
    	let p10;
    	let t28;
    	let section6;
    	let p11;
    	let t30;
    	let p12;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Grundlagen des Funkens";
    			t1 = space();
    			section0 = element("section");
    			p0 = element("p");
    			p0.textContent = "Grundvoraussetzung für eine gelungene Missionsdurchführung ist eine gute Kommunikation zwischen allen Kräften. Über längere Strecken und Einheiten hinweg nutzt man den Funk. Die Grundzüge von gutem Funken sollte allen Soldaten bekannt sein.";
    			t3 = space();
    			section1 = element("section");
    			p1 = element("p");
    			t4 = text("Noch bevor man beginnt, Funkkontakt aufzubauen, überlegt man sich genau, was man mitteilen möchte. Ein Sender blockiert für die Dauer seines Funkspruches den Funkkanal und damit möglicherweise andere eilige Meldungen. Darum sollte ein Funkspruch gut formuliert, knapp, aber unmissverständlich gehalten werden. Guter Funk folgt also der Devise: ");
    			i = element("i");
    			i.textContent = "So viel wie nötig, so kurz wie möglich.";
    			t6 = space();
    			section2 = element("section");
    			p2 = element("p");
    			p2.textContent = "Das Herstellen des Funkkontakts nennt man auch Verbindung. Sie folgt einem einfachen Schema: Der Sender identifiziert sich und den Empfänger des Funkspruches. Danach wird in einem Wort erklärt, welchen Zweck die Mitteilung verfolgt. Zum Beispiel:";
    			t8 = space();
    			p3 = element("p");
    			p3.textContent = "„Aufklärung für Truppführung - Information - Infanterie in Gruppenstärke zu Fuß gesichtet nord-west ihrer Aktuellen - Kommen.“";
    			t10 = space();
    			p4 = element("p");
    			p4.textContent = "„Truppführung für Aufklärung - Frage - Panzerabwehrschützen erkannt? Kommen.“";
    			t12 = space();
    			p5 = element("p");
    			p5.textContent = "Dies stellt eine Richtlinie für die Erstverbindung dar. Im weiteren Gesprächsverlauf ist es eventuell nicht mehr nötig, so explizit zu sein, da dann bereits klar ist, worum es geht. Gerade zu Beginn des Funkkontakts kann des dem Gegenüber jedoch das Verständnis erleichtern, wenn man seine Absicht ausspricht.";
    			t14 = space();
    			section4 = element("section");
    			p6 = element("p");
    			p6.textContent = "Der eigentliche Inhalt des Funkspruches folgt den oben beschriebenen Grundsätzen: er sollte knapp, aber eindeutig sein. Besonders Füllwörter und häufiges Versprechen können leicht vermieden werden, indem man sich den Inhalt seines Funkes vor dem Funken kurz überlegt. Abgesehen davon gibt es noch ein paar Konventionen, die das Verständnis erleichtern sollen.";
    			t16 = space();
    			section3 = element("section");
    			h30 = element("h3");
    			h30.textContent = "Zahlen";
    			t18 = space();
    			p7 = element("p");
    			p7.textContent = "Zahlen werden im Funk grundsätzlich Ziffer für Ziffer diktiert, „1278“ also als „eins - zwo - sieben - acht“ gesprochen. „Zwo“ ist dabei dringend zu benutzen, da „zwei“ leicht mit „drei“ verwechselt wird. Ebenso verwendet man „fünnüf“ für „fünf“.";
    			t20 = space();
    			h31 = element("h3");
    			h31.textContent = "Buchstabieren";
    			t22 = space();
    			p8 = element("p");
    			p8.textContent = "Buchstabieren wird oft nötig werden. Einzelne Buchstaben sind dabei selbst bei guter Verbindung kaum zu verstehen. Wir verwendet daher zum Buchstabieren das NATO-Alphabet.";
    			t24 = space();
    			p9 = element("p");
    			p9.textContent = "Da es auch außerhalb des Funkes viel benutzt wird, sollte man sich das NATO-Alphabet dringend aneignen.";
    			t26 = space();
    			section5 = element("section");
    			p10 = element("p");
    			p10.textContent = "Hat man alles gesagt, muss man auch das dem Gegenüber signalisieren. Dazu gibt es eine Reihe von Signalwörtern:";
    			t28 = space();
    			section6 = element("section");
    			p11 = element("p");
    			p11.textContent = "Grundsätzlich herrscht während eines laufenden Austausches Funkstille für alle anderen. Kommt es jedoch zu Notfällen, kann es sein, dass ein Dritter sich mit Signalwörtern wie „eil“, „sofort“ oder „Blitz“ einschaltet. Dies bedeutet offensichtlich eine Notlage und das laufende Gespräch ist zu unterbrechen.";
    			t30 = space();
    			p12 = element("p");
    			p12.textContent = "Diese Anleitung vermittelt bloß die absoluten Grundlagen des Funkens. Je nach Spezialisierung sind noch weitere Dinge relevant, wie etwa das Funken im Konvoi und zwischen der Logistik, der Funk unter Truppführern oder Sanitätern oder der Funk zwischen Aufklärern. Dazu finden sich Einträge auf den jeweiligen Unterseiten.";
    			add_location(h1, file$a, 5, 4, 115);
    			add_location(p0, file$a, 8, 6, 187);
    			attr_dev(section0, "id", "Einleitung");
    			add_location(section0, file$a, 7, 4, 154);
    			add_location(i, file$a, 12, 353, 854);
    			add_location(p1, file$a, 12, 6, 507);
    			attr_dev(section1, "id", "Bevor man die Taste drückt");
    			add_location(section1, file$a, 11, 4, 458);
    			add_location(p2, file$a, 16, 6, 961);
    			add_location(p3, file$a, 17, 6, 1222);
    			add_location(p4, file$a, 18, 6, 1363);
    			add_location(p5, file$a, 19, 6, 1455);
    			attr_dev(section2, "id", "Verbindung");
    			add_location(section2, file$a, 15, 4, 928);
    			add_location(p6, file$a, 23, 6, 1828);
    			add_location(h30, file$a, 25, 8, 2221);
    			add_location(p7, file$a, 26, 8, 2246);
    			add_location(h31, file$a, 28, 8, 2511);
    			add_location(p8, file$a, 29, 8, 2543);
    			add_location(p9, file$a, 31, 8, 2812);
    			add_location(section3, file$a, 24, 6, 2202);
    			attr_dev(section4, "id", "Funkspruch");
    			add_location(section4, file$a, 22, 4, 1795);
    			add_location(p10, file$a, 36, 6, 2997);
    			attr_dev(section5, "id", "Beendigung");
    			add_location(section5, file$a, 35, 4, 2964);
    			add_location(p11, file$a, 41, 6, 3275);
    			add_location(p12, file$a, 43, 6, 3598);
    			attr_dev(section6, "id", "Außnahmen und Notfälle");
    			add_location(section6, file$a, 40, 4, 3230);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, p0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, p1);
    			append_dev(p1, t4);
    			append_dev(p1, i);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, p2);
    			append_dev(section2, t8);
    			append_dev(section2, p3);
    			append_dev(section2, t10);
    			append_dev(section2, p4);
    			append_dev(section2, t12);
    			append_dev(section2, p5);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, p6);
    			append_dev(section4, t16);
    			append_dev(section4, section3);
    			append_dev(section3, h30);
    			append_dev(section3, t18);
    			append_dev(section3, p7);
    			append_dev(section3, t20);
    			append_dev(section3, h31);
    			append_dev(section3, t22);
    			append_dev(section3, p8);
    			append_dev(section3, t24);
    			append_dev(section3, p9);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, section5, anchor);
    			append_dev(section5, p10);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, section6, anchor);
    			append_dev(section6, p11);
    			append_dev(section6, t30);
    			append_dev(section6, p12);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(section4);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(section5);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(section6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$9.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Funken', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Funken> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Funken extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Funken",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Wiki\Basislogistiker.svelte generated by Svelte v3.46.4 */
    const file$9 = "src\\Wiki\\Basislogistiker.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$8(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Basis-Logistiker";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$9, 5, 4, 115);
    			add_location(p, file$9, 8, 6, 182);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$9, 7, 4, 148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$8.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Basislogistiker', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Basislogistiker> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Basislogistiker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Basislogistiker",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Wiki\Fahrzeuge.svelte generated by Svelte v3.46.4 */
    const file$8 = "src\\Wiki\\Fahrzeuge.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$7(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Fahrzeuge";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$8, 5, 4, 115);
    			add_location(p, file$8, 8, 6, 175);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$8, 7, 4, 141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$7.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fahrzeuge', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fahrzeuge> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Fahrzeuge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fahrzeuge",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Wiki\Fusstruppen.svelte generated by Svelte v3.46.4 */
    const file$7 = "src\\Wiki\\Fusstruppen.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$6(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Fußtruppen";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$7, 5, 4, 115);
    			add_location(p, file$7, 8, 6, 176);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$7, 7, 4, 142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$6.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fusstruppen', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fusstruppen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Fusstruppen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fusstruppen",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Wiki\Helikopter.svelte generated by Svelte v3.46.4 */
    const file$6 = "src\\Wiki\\Helikopter.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$5(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Helikopter";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$6, 5, 4, 115);
    			add_location(p, file$6, 8, 6, 176);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$6, 7, 4, 142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$5.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Helikopter', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Helikopter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Helikopter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Helikopter",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Wiki\Hubschrauberpiloten.svelte generated by Svelte v3.46.4 */
    const file$5 = "src\\Wiki\\Hubschrauberpiloten.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$4(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hubschrauberpiloten";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$5, 5, 4, 115);
    			add_location(p, file$5, 8, 6, 185);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$5, 7, 4, 151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$4.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hubschrauberpiloten', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hubschrauberpiloten> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Hubschrauberpiloten extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hubschrauberpiloten",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Wiki\Kampfpioniere.svelte generated by Svelte v3.46.4 */
    const file$4 = "src\\Wiki\\Kampfpioniere.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$3(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Kampfpioniere";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$4, 5, 4, 115);
    			add_location(p, file$4, 8, 6, 179);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$4, 7, 4, 145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$3.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Kampfpioniere', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Kampfpioniere> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Kampfpioniere extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kampfpioniere",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Wiki\Truppfuehrer.svelte generated by Svelte v3.46.4 */
    const file$3 = "src\\Wiki\\Truppfuehrer.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$2(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Truppführer";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$3, 5, 4, 115);
    			add_location(p, file$3, 8, 6, 177);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$3, 7, 4, 143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$2.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Truppfuehrer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Truppfuehrer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Truppfuehrer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Truppfuehrer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Wiki\Truppfunker.svelte generated by Svelte v3.46.4 */
    const file$2 = "src\\Wiki\\Truppfunker.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot$1(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Truppfunker";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$2, 5, 4, 115);
    			add_location(p, file$2, 8, 6, 177);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$2, 7, 4, 143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot$1.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Truppfunker', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Truppfunker> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Truppfunker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Truppfunker",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Wiki\Uavs.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\Wiki\\Uavs.svelte";

    // (5:2) <svelte:fragment slot="content">
    function create_content_slot(ctx) {
    	let h1;
    	let t1;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "UAVs";
    			t1 = space();
    			section = element("section");
    			p = element("p");
    			add_location(h1, file$1, 5, 4, 115);
    			add_location(p, file$1, 8, 6, 170);
    			attr_dev(section, "id", "Allgemeines");
    			add_location(section, file$1, 7, 4, 136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot.name,
    		type: "slot",
    		source: "(5:2) <svelte:fragment slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let wiki;
    	let current;

    	wiki = new Wiki({
    			props: {
    				$$slots: { content: [create_content_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiki.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiki, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const wiki_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				wiki_changes.$$scope = { dirty, ctx };
    			}

    			wiki.$set(wiki_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiki.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiki.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiki, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Uavs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Uavs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Wiki });
    	return [];
    }

    class Uavs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Uavs",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Home.svelte generated by Svelte v3.46.4 */
    const file = "src\\Home.svelte";

    // (46:8) <Link to="funken">
    function create_default_slot_13$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FUNKEN");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13$1.name,
    		type: "slot",
    		source: "(46:8) <Link to=\\\"funken\\\">",
    		ctx
    	});

    	return block;
    }

    // (50:8) <Link to="truppfuehrer">
    function create_default_slot_12$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TRUPPFÜHRER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12$1.name,
    		type: "slot",
    		source: "(50:8) <Link to=\\\"truppfuehrer\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:8) <Link to="truppfunker">
    function create_default_slot_11$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TRUPPFUNKER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11$1.name,
    		type: "slot",
    		source: "(51:8) <Link to=\\\"truppfunker\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:8) <Link to="fusstruppen">
    function create_default_slot_10$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FUẞTRUPPEN");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10$1.name,
    		type: "slot",
    		source: "(55:8) <Link to=\\\"fusstruppen\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:8) <Link to="panzertruppen">
    function create_default_slot_9$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("PANZERTRUPPEN");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9$1.name,
    		type: "slot",
    		source: "(56:8) <Link to=\\\"panzertruppen\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:8) <Link to="kampfpioniere">
    function create_default_slot_8$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("KAMPFPIONIERE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(60:8) <Link to=\\\"kampfpioniere\\\">",
    		ctx
    	});

    	return block;
    }

    // (61:8) <Link to="hubschrauberpiloten">
    function create_default_slot_7$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("HUBSCHRAUBERPILOTEN");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(61:8) <Link to=\\\"hubschrauberpiloten\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:8) <Link to="basis-logistiker">
    function create_default_slot_6$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BASIS-LOGISTIKER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(62:8) <Link to=\\\"basis-logistiker\\\">",
    		ctx
    	});

    	return block;
    }

    // (65:6) <Link to="sanitaeter">
    function create_default_slot_5$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SANITÄTER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(65:6) <Link to=\\\"sanitaeter\\\">",
    		ctx
    	});

    	return block;
    }

    // (66:6) <Link to="aufklaerer">
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("AUFKLÄRER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(66:6) <Link to=\\\"aufklaerer\\\">",
    		ctx
    	});

    	return block;
    }

    // (69:8) <Link to="fahrzeuge">
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FAHRZEUGE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(69:8) <Link to=\\\"fahrzeuge\\\">",
    		ctx
    	});

    	return block;
    }

    // (70:8) <Link to="helikopter">
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("HELIKOPTER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(70:8) <Link to=\\\"helikopter\\\">",
    		ctx
    	});

    	return block;
    }

    // (71:8) <Link to="uavs">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("UAVs");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(71:8) <Link to=\\\"uavs\\\">",
    		ctx
    	});

    	return block;
    }

    // (43:4) <Router {url}>
    function create_default_slot$1(ctx) {
    	let a0;
    	let span0;
    	let t1;
    	let link0;
    	let t2;
    	let a1;
    	let span1;
    	let t4;
    	let link1;
    	let t5;
    	let link2;
    	let t6;
    	let a2;
    	let span2;
    	let t8;
    	let link3;
    	let t9;
    	let link4;
    	let t10;
    	let a3;
    	let span3;
    	let t12;
    	let link5;
    	let t13;
    	let link6;
    	let t14;
    	let link7;
    	let t15;
    	let link8;
    	let t16;
    	let link9;
    	let t17;
    	let a4;
    	let span4;
    	let t19;
    	let link10;
    	let t20;
    	let link11;
    	let t21;
    	let link12;
    	let current;

    	link0 = new Link({
    			props: {
    				to: "funken",
    				$$slots: { default: [create_default_slot_13$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				to: "truppfuehrer",
    				$$slots: { default: [create_default_slot_12$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link2 = new Link({
    			props: {
    				to: "truppfunker",
    				$$slots: { default: [create_default_slot_11$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link3 = new Link({
    			props: {
    				to: "fusstruppen",
    				$$slots: { default: [create_default_slot_10$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link4 = new Link({
    			props: {
    				to: "panzertruppen",
    				$$slots: { default: [create_default_slot_9$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link5 = new Link({
    			props: {
    				to: "kampfpioniere",
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link6 = new Link({
    			props: {
    				to: "hubschrauberpiloten",
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link7 = new Link({
    			props: {
    				to: "basis-logistiker",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link8 = new Link({
    			props: {
    				to: "sanitaeter",
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link9 = new Link({
    			props: {
    				to: "aufklaerer",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link10 = new Link({
    			props: {
    				to: "fahrzeuge",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link11 = new Link({
    			props: {
    				to: "helikopter",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link12 = new Link({
    			props: {
    				to: "uavs",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "GRUNDLAGEN";
    			t1 = space();
    			create_component(link0.$$.fragment);
    			t2 = space();
    			a1 = element("a");
    			span1 = element("span");
    			span1.textContent = "FÜHRUNGSKRÄFTE";
    			t4 = space();
    			create_component(link1.$$.fragment);
    			t5 = space();
    			create_component(link2.$$.fragment);
    			t6 = space();
    			a2 = element("a");
    			span2 = element("span");
    			span2.textContent = "STREITKRÄFTE";
    			t8 = space();
    			create_component(link3.$$.fragment);
    			t9 = space();
    			create_component(link4.$$.fragment);
    			t10 = space();
    			a3 = element("a");
    			span3 = element("span");
    			span3.textContent = "LOGISTIKER";
    			t12 = space();
    			create_component(link5.$$.fragment);
    			t13 = space();
    			create_component(link6.$$.fragment);
    			t14 = space();
    			create_component(link7.$$.fragment);
    			t15 = space();
    			create_component(link8.$$.fragment);
    			t16 = space();
    			create_component(link9.$$.fragment);
    			t17 = space();
    			a4 = element("a");
    			span4 = element("span");
    			span4.textContent = "FUHRPARK";
    			t19 = space();
    			create_component(link10.$$.fragment);
    			t20 = space();
    			create_component(link11.$$.fragment);
    			t21 = space();
    			create_component(link12.$$.fragment);
    			add_location(span0, file, 44, 9, 1665);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "expandable");
    			add_location(a0, file, 43, 6, 1624);
    			add_location(span1, file, 48, 9, 1790);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "expandable");
    			add_location(a1, file, 47, 6, 1749);
    			add_location(span2, file, 53, 9, 1981);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "expandable");
    			add_location(a2, file, 52, 6, 1940);
    			add_location(span3, file, 58, 9, 2172);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "expandable");
    			add_location(a3, file, 57, 6, 2131);
    			add_location(span4, file, 67, 9, 2533);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "class", "expandable");
    			add_location(a4, file, 66, 6, 2492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, span0);
    			append_dev(a0, t1);
    			mount_component(link0, a0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, span1);
    			append_dev(a1, t4);
    			mount_component(link1, a1, null);
    			append_dev(a1, t5);
    			mount_component(link2, a1, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, a2, anchor);
    			append_dev(a2, span2);
    			append_dev(a2, t8);
    			mount_component(link3, a2, null);
    			append_dev(a2, t9);
    			mount_component(link4, a2, null);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, a3, anchor);
    			append_dev(a3, span3);
    			append_dev(a3, t12);
    			mount_component(link5, a3, null);
    			append_dev(a3, t13);
    			mount_component(link6, a3, null);
    			append_dev(a3, t14);
    			mount_component(link7, a3, null);
    			insert_dev(target, t15, anchor);
    			mount_component(link8, target, anchor);
    			insert_dev(target, t16, anchor);
    			mount_component(link9, target, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, a4, anchor);
    			append_dev(a4, span4);
    			append_dev(a4, t19);
    			mount_component(link10, a4, null);
    			append_dev(a4, t20);
    			mount_component(link11, a4, null);
    			append_dev(a4, t21);
    			mount_component(link12, a4, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    			const link3_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link3_changes.$$scope = { dirty, ctx };
    			}

    			link3.$set(link3_changes);
    			const link4_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link4_changes.$$scope = { dirty, ctx };
    			}

    			link4.$set(link4_changes);
    			const link5_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link5_changes.$$scope = { dirty, ctx };
    			}

    			link5.$set(link5_changes);
    			const link6_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link6_changes.$$scope = { dirty, ctx };
    			}

    			link6.$set(link6_changes);
    			const link7_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link7_changes.$$scope = { dirty, ctx };
    			}

    			link7.$set(link7_changes);
    			const link8_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link8_changes.$$scope = { dirty, ctx };
    			}

    			link8.$set(link8_changes);
    			const link9_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link9_changes.$$scope = { dirty, ctx };
    			}

    			link9.$set(link9_changes);
    			const link10_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link10_changes.$$scope = { dirty, ctx };
    			}

    			link10.$set(link10_changes);
    			const link11_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link11_changes.$$scope = { dirty, ctx };
    			}

    			link11.$set(link11_changes);
    			const link12_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link12_changes.$$scope = { dirty, ctx };
    			}

    			link12.$set(link12_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(link3.$$.fragment, local);
    			transition_in(link4.$$.fragment, local);
    			transition_in(link5.$$.fragment, local);
    			transition_in(link6.$$.fragment, local);
    			transition_in(link7.$$.fragment, local);
    			transition_in(link8.$$.fragment, local);
    			transition_in(link9.$$.fragment, local);
    			transition_in(link10.$$.fragment, local);
    			transition_in(link11.$$.fragment, local);
    			transition_in(link12.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			transition_out(link4.$$.fragment, local);
    			transition_out(link5.$$.fragment, local);
    			transition_out(link6.$$.fragment, local);
    			transition_out(link7.$$.fragment, local);
    			transition_out(link8.$$.fragment, local);
    			transition_out(link9.$$.fragment, local);
    			transition_out(link10.$$.fragment, local);
    			transition_out(link11.$$.fragment, local);
    			transition_out(link12.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			destroy_component(link0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a1);
    			destroy_component(link1);
    			destroy_component(link2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(a2);
    			destroy_component(link3);
    			destroy_component(link4);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(a3);
    			destroy_component(link5);
    			destroy_component(link6);
    			destroy_component(link7);
    			if (detaching) detach_dev(t15);
    			destroy_component(link8, detaching);
    			if (detaching) detach_dev(t16);
    			destroy_component(link9, detaching);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(a4);
    			destroy_component(link10);
    			destroy_component(link11);
    			destroy_component(link12);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(43:4) <Router {url}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let br;
    	let span0;
    	let t2;
    	let div1;
    	let span1;
    	let t4;
    	let input;
    	let t5;
    	let div2;
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				url: /*url*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text("Task Force Hellcat ");
    			br = element("br");
    			span0 = element("span");
    			span0.textContent = "Wiki";
    			t2 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "search";
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			div2 = element("div");
    			create_component(router.$$.fragment);
    			add_location(br, file, 33, 45, 1272);
    			add_location(span0, file, 33, 51, 1278);
    			attr_dev(div0, "id", "home-nav-logo");
    			add_location(div0, file, 33, 2, 1229);
    			attr_dev(span1, "class", "material-icons");
    			add_location(span1, file, 35, 4, 1337);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "search");
    			attr_dev(input, "placeholder", "Wiki durchsuchen...");
    			add_location(input, file, 36, 4, 1385);
    			attr_dev(div1, "id", "home-nav-search");
    			add_location(div1, file, 34, 2, 1305);
    			attr_dev(div2, "id", "home-nav-list");
    			add_location(div2, file, 41, 2, 1572);
    			attr_dev(div3, "id", "home-overlay");
    			add_location(div3, file, 32, 0, 1202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div0, br);
    			append_dev(div0, span0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, input);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			mount_component(router, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};
    			if (dirty & /*url*/ 1) router_changes.url = /*url*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let { url = "" } = $$props;

    	onMount(async () => {
    		const expandable = document.getElementsByClassName("expandable");
    		var expandableArr = Array.from(expandable);

    		expandableArr.forEach(element => {
    			var open = false;
    			element.querySelector("span").insertAdjacentHTML("beforeend", '<span class="material-icons-round">expand_more</span>');

    			element.onclick = function (event) {
    				event.preventDefault();
    				open = !open;

    				if (open == true) {
    					element.querySelector(".material-icons-round").style.transform = "rotate(90deg)";

    					element.querySelectorAll("a").forEach(element => {
    						element.style.display = "flex";
    					});
    				} else {
    					element.querySelector(".material-icons-round").style.transform = "rotate(0deg)";

    					element.querySelectorAll("a").forEach(element => {
    						element.style.display = "none";
    					});
    				}
    			};
    		});
    	});

    	const writable_props = ['url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    	};

    	$$self.$capture_state = () => ({ Router, Link, onMount, url });

    	$$self.$inject_state = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { url: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get url() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */

    // (21:2) <Route path="/">
    function create_default_slot_15(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(21:2) <Route path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (22:2) <Route path="grundlagen">
    function create_default_slot_14(ctx) {
    	let grundlagen;
    	let current;
    	grundlagen = new Grundlagen({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(grundlagen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grundlagen, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grundlagen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grundlagen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grundlagen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(22:2) <Route path=\\\"grundlagen\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:2) <Route path="panzertruppen">
    function create_default_slot_13(ctx) {
    	let panzertruppen;
    	let current;
    	panzertruppen = new Panzertruppen({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(panzertruppen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(panzertruppen, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panzertruppen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panzertruppen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panzertruppen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(23:2) <Route path=\\\"panzertruppen\\\">",
    		ctx
    	});

    	return block;
    }

    // (24:2) <Route path="sanitaeter">
    function create_default_slot_12(ctx) {
    	let sanitaeter;
    	let current;
    	sanitaeter = new Sanitaeter({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sanitaeter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sanitaeter, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sanitaeter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sanitaeter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sanitaeter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(24:2) <Route path=\\\"sanitaeter\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:2) <Route path="aufklaerer">
    function create_default_slot_11(ctx) {
    	let aufklaerer;
    	let current;
    	aufklaerer = new Aufklaerer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(aufklaerer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(aufklaerer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aufklaerer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aufklaerer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aufklaerer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(25:2) <Route path=\\\"aufklaerer\\\">",
    		ctx
    	});

    	return block;
    }

    // (26:2) <Route path="funken">
    function create_default_slot_10(ctx) {
    	let funken;
    	let current;
    	funken = new Funken({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(funken.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(funken, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(funken.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(funken.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(funken, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(26:2) <Route path=\\\"funken\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:2) <Route path="basis-logistiker">
    function create_default_slot_9(ctx) {
    	let basislogistiker;
    	let current;
    	basislogistiker = new Basislogistiker({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(basislogistiker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(basislogistiker, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basislogistiker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basislogistiker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basislogistiker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(28:2) <Route path=\\\"basis-logistiker\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) <Route path="fahrzeuge">
    function create_default_slot_8(ctx) {
    	let fahrzeuge;
    	let current;
    	fahrzeuge = new Fahrzeuge({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fahrzeuge.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fahrzeuge, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fahrzeuge.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fahrzeuge.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fahrzeuge, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(29:2) <Route path=\\\"fahrzeuge\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:2) <Route path="fusstruppen">
    function create_default_slot_7(ctx) {
    	let fusstruppen;
    	let current;
    	fusstruppen = new Fusstruppen({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fusstruppen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fusstruppen, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fusstruppen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fusstruppen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fusstruppen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(30:2) <Route path=\\\"fusstruppen\\\">",
    		ctx
    	});

    	return block;
    }

    // (31:2) <Route path="helikopter">
    function create_default_slot_6(ctx) {
    	let helikopter;
    	let current;
    	helikopter = new Helikopter({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(helikopter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(helikopter, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(helikopter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(helikopter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(helikopter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(31:2) <Route path=\\\"helikopter\\\">",
    		ctx
    	});

    	return block;
    }

    // (32:2) <Route path="hubschrauberpiloten">
    function create_default_slot_5(ctx) {
    	let hubschrauberpiloten;
    	let current;
    	hubschrauberpiloten = new Hubschrauberpiloten({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(hubschrauberpiloten.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(hubschrauberpiloten, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hubschrauberpiloten.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hubschrauberpiloten.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hubschrauberpiloten, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(32:2) <Route path=\\\"hubschrauberpiloten\\\">",
    		ctx
    	});

    	return block;
    }

    // (33:2) <Route path="kampfpioniere">
    function create_default_slot_4(ctx) {
    	let kampfpioniere;
    	let current;
    	kampfpioniere = new Kampfpioniere({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(kampfpioniere.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(kampfpioniere, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(kampfpioniere.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(kampfpioniere.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(kampfpioniere, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(33:2) <Route path=\\\"kampfpioniere\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:2) <Route path="truppfuehrer">
    function create_default_slot_3(ctx) {
    	let truppfuehrer;
    	let current;
    	truppfuehrer = new Truppfuehrer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(truppfuehrer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(truppfuehrer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(truppfuehrer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(truppfuehrer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(truppfuehrer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(34:2) <Route path=\\\"truppfuehrer\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:2) <Route path="truppfunker">
    function create_default_slot_2(ctx) {
    	let truppfunker;
    	let current;
    	truppfunker = new Truppfunker({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(truppfunker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(truppfunker, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(truppfunker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(truppfunker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(truppfunker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(35:2) <Route path=\\\"truppfunker\\\">",
    		ctx
    	});

    	return block;
    }

    // (36:2) <Route path="uavs">
    function create_default_slot_1(ctx) {
    	let uavs;
    	let current;
    	uavs = new Uavs({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(uavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(uavs, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(uavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(uavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(uavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(36:2) <Route path=\\\"uavs\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:0) <Router {url}>
    function create_default_slot(ctx) {
    	let route0;
    	let t0;
    	let route1;
    	let t1;
    	let route2;
    	let t2;
    	let route3;
    	let t3;
    	let route4;
    	let t4;
    	let route5;
    	let t5;
    	let route6;
    	let t6;
    	let route7;
    	let t7;
    	let route8;
    	let t8;
    	let route9;
    	let t9;
    	let route10;
    	let t10;
    	let route11;
    	let t11;
    	let route12;
    	let t12;
    	let route13;
    	let t13;
    	let route14;
    	let current;

    	route0 = new Route({
    			props: {
    				path: "/",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "grundlagen",
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				path: "panzertruppen",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "sanitaeter",
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route4 = new Route({
    			props: {
    				path: "aufklaerer",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route5 = new Route({
    			props: {
    				path: "funken",
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route6 = new Route({
    			props: {
    				path: "basis-logistiker",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route7 = new Route({
    			props: {
    				path: "fahrzeuge",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route8 = new Route({
    			props: {
    				path: "fusstruppen",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route9 = new Route({
    			props: {
    				path: "helikopter",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route10 = new Route({
    			props: {
    				path: "hubschrauberpiloten",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route11 = new Route({
    			props: {
    				path: "kampfpioniere",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route12 = new Route({
    			props: {
    				path: "truppfuehrer",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route13 = new Route({
    			props: {
    				path: "truppfunker",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route14 = new Route({
    			props: {
    				path: "uavs",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route0.$$.fragment);
    			t0 = space();
    			create_component(route1.$$.fragment);
    			t1 = space();
    			create_component(route2.$$.fragment);
    			t2 = space();
    			create_component(route3.$$.fragment);
    			t3 = space();
    			create_component(route4.$$.fragment);
    			t4 = space();
    			create_component(route5.$$.fragment);
    			t5 = space();
    			create_component(route6.$$.fragment);
    			t6 = space();
    			create_component(route7.$$.fragment);
    			t7 = space();
    			create_component(route8.$$.fragment);
    			t8 = space();
    			create_component(route9.$$.fragment);
    			t9 = space();
    			create_component(route10.$$.fragment);
    			t10 = space();
    			create_component(route11.$$.fragment);
    			t11 = space();
    			create_component(route12.$$.fragment);
    			t12 = space();
    			create_component(route13.$$.fragment);
    			t13 = space();
    			create_component(route14.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(route4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(route5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(route6, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(route7, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(route8, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(route9, target, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(route10, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(route11, target, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(route12, target, anchor);
    			insert_dev(target, t12, anchor);
    			mount_component(route13, target, anchor);
    			insert_dev(target, t13, anchor);
    			mount_component(route14, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    			const route2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route2_changes.$$scope = { dirty, ctx };
    			}

    			route2.$set(route2_changes);
    			const route3_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    			const route4_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route4_changes.$$scope = { dirty, ctx };
    			}

    			route4.$set(route4_changes);
    			const route5_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route5_changes.$$scope = { dirty, ctx };
    			}

    			route5.$set(route5_changes);
    			const route6_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route6_changes.$$scope = { dirty, ctx };
    			}

    			route6.$set(route6_changes);
    			const route7_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route7_changes.$$scope = { dirty, ctx };
    			}

    			route7.$set(route7_changes);
    			const route8_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route8_changes.$$scope = { dirty, ctx };
    			}

    			route8.$set(route8_changes);
    			const route9_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route9_changes.$$scope = { dirty, ctx };
    			}

    			route9.$set(route9_changes);
    			const route10_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route10_changes.$$scope = { dirty, ctx };
    			}

    			route10.$set(route10_changes);
    			const route11_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route11_changes.$$scope = { dirty, ctx };
    			}

    			route11.$set(route11_changes);
    			const route12_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route12_changes.$$scope = { dirty, ctx };
    			}

    			route12.$set(route12_changes);
    			const route13_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route13_changes.$$scope = { dirty, ctx };
    			}

    			route13.$set(route13_changes);
    			const route14_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route14_changes.$$scope = { dirty, ctx };
    			}

    			route14.$set(route14_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			transition_in(route5.$$.fragment, local);
    			transition_in(route6.$$.fragment, local);
    			transition_in(route7.$$.fragment, local);
    			transition_in(route8.$$.fragment, local);
    			transition_in(route9.$$.fragment, local);
    			transition_in(route10.$$.fragment, local);
    			transition_in(route11.$$.fragment, local);
    			transition_in(route12.$$.fragment, local);
    			transition_in(route13.$$.fragment, local);
    			transition_in(route14.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			transition_out(route5.$$.fragment, local);
    			transition_out(route6.$$.fragment, local);
    			transition_out(route7.$$.fragment, local);
    			transition_out(route8.$$.fragment, local);
    			transition_out(route9.$$.fragment, local);
    			transition_out(route10.$$.fragment, local);
    			transition_out(route11.$$.fragment, local);
    			transition_out(route12.$$.fragment, local);
    			transition_out(route13.$$.fragment, local);
    			transition_out(route14.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(route4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(route5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(route6, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(route7, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(route8, detaching);
    			if (detaching) detach_dev(t8);
    			destroy_component(route9, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(route10, detaching);
    			if (detaching) detach_dev(t10);
    			destroy_component(route11, detaching);
    			if (detaching) detach_dev(t11);
    			destroy_component(route12, detaching);
    			if (detaching) detach_dev(t12);
    			destroy_component(route13, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(route14, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(20:0) <Router {url}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				url: /*url*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};
    			if (dirty & /*url*/ 1) router_changes.url = /*url*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { url = "" } = $$props;
    	const writable_props = ['url'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    	};

    	$$self.$capture_state = () => ({
    		Grundlagen,
    		Panzertruppen,
    		Sanitaeter,
    		Aufklaerer,
    		Funken,
    		Basislogistiker,
    		Fahrzeuge,
    		Fusstruppen,
    		Helikopter,
    		Hubschrauberpiloten,
    		Kampfpioniere,
    		Truppfuehrer,
    		Truppfunker,
    		Uavs,
    		Home,
    		Router,
    		Route,
    		url
    	});

    	$$self.$inject_state = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { url: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get url() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
