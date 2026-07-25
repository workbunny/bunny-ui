(function() {
  "use strict";
  window.htmx = (function() {
    const htmx = {
      // Tsc madness here, assigning the functions directly results in an invalid TypeScript output, but reassigning is fine
      /* Event processing */
      /** @type {typeof onLoadHelper} */
      onLoad: null,
      /** @type {typeof processNode} */
      process: null,
      /** @type {typeof addEventListenerImpl} */
      on: null,
      /** @type {typeof removeEventListenerImpl} */
      off: null,
      /** @type {typeof triggerEvent} */
      trigger: null,
      /** @type {typeof ajaxHelper} */
      ajax: null,
      /* DOM querying helpers */
      /** @type {typeof find} */
      find: null,
      /** @type {typeof findAll} */
      findAll: null,
      /** @type {typeof closest} */
      closest: null,
      /**
       * Returns the input values that would resolve for a given element via the htmx value resolution mechanism
       *
       * @see https://htmx.org/api/#values
       *
       * @param {Element} elt the element to resolve values on
       * @param {HttpVerb} type the request type (e.g. **get** or **post**) non-GET's will include the enclosing form of the element. Defaults to **post**
       * @returns {Object}
       */
      values: function(elt, type) {
        const inputValues = getInputValues(elt, type || "post");
        return inputValues.values;
      },
      /* DOM manipulation helpers */
      /** @type {typeof removeElement} */
      remove: null,
      /** @type {typeof addClassToElement} */
      addClass: null,
      /** @type {typeof removeClassFromElement} */
      removeClass: null,
      /** @type {typeof toggleClassOnElement} */
      toggleClass: null,
      /** @type {typeof takeClassForElement} */
      takeClass: null,
      /** @type {typeof swap} */
      swap: null,
      /* Extension entrypoints */
      /** @type {typeof defineExtension} */
      defineExtension: null,
      /** @type {typeof removeExtension} */
      removeExtension: null,
      /* Debugging */
      /** @type {typeof logAll} */
      logAll: null,
      /** @type {typeof logNone} */
      logNone: null,
      /* Debugging */
      /**
       * The logger htmx uses to log with
       *
       * @see https://htmx.org/api/#logger
       */
      logger: null,
      /**
       * A property holding the configuration htmx uses at runtime.
       *
       * Note that using a [meta tag](https://htmx.org/docs/#config) is the preferred mechanism for setting these properties.
       *
       * @see https://htmx.org/api/#config
       */
      config: {
        /**
         * Whether to use history.
         * @type boolean
         * @default true
         */
        historyEnabled: true,
        /**
         * The number of pages to keep in **sessionStorage** for history support.
         * @type number
         * @default 10
         */
        historyCacheSize: 10,
        /**
         * @type boolean
         * @default false
         */
        refreshOnHistoryMiss: false,
        /**
         * The default swap style to use if **[hx-swap](https://htmx.org/attributes/hx-swap)** is omitted.
         * @type HtmxSwapStyle
         * @default 'innerHTML'
         */
        defaultSwapStyle: "innerHTML",
        /**
         * The default delay between receiving a response from the server and doing the swap.
         * @type number
         * @default 0
         */
        defaultSwapDelay: 0,
        /**
         * The default delay between completing the content swap and settling attributes.
         * @type number
         * @default 20
         */
        defaultSettleDelay: 20,
        /**
         * If true, htmx will inject a small amount of CSS into the page to make indicators invisible unless the **htmx-indicator** class is present.
         * @type boolean
         * @default true
         */
        includeIndicatorStyles: true,
        /**
         * The class to place on indicators when a request is in flight.
         * @type string
         * @default 'htmx-indicator'
         */
        indicatorClass: "htmx-indicator",
        /**
         * The class to place on triggering elements when a request is in flight.
         * @type string
         * @default 'htmx-request'
         */
        requestClass: "htmx-request",
        /**
         * The class to temporarily place on elements that htmx has added to the DOM.
         * @type string
         * @default 'htmx-added'
         */
        addedClass: "htmx-added",
        /**
         * The class to place on target elements when htmx is in the settling phase.
         * @type string
         * @default 'htmx-settling'
         */
        settlingClass: "htmx-settling",
        /**
         * The class to place on target elements when htmx is in the swapping phase.
         * @type string
         * @default 'htmx-swapping'
         */
        swappingClass: "htmx-swapping",
        /**
         * Allows the use of eval-like functionality in htmx, to enable **hx-vars**, trigger conditions & script tag evaluation. Can be set to **false** for CSP compatibility.
         * @type boolean
         * @default true
         */
        allowEval: true,
        /**
         * If set to false, disables the interpretation of script tags.
         * @type boolean
         * @default true
         */
        allowScriptTags: true,
        /**
         * If set, the nonce will be added to inline scripts.
         * @type string
         * @default ''
         */
        inlineScriptNonce: "",
        /**
         * If set, the nonce will be added to inline styles.
         * @type string
         * @default ''
         */
        inlineStyleNonce: "",
        /**
         * The attributes to settle during the settling phase.
         * @type string[]
         * @default ['class', 'style', 'width', 'height']
         */
        attributesToSettle: ["class", "style", "width", "height"],
        /**
         * Allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates.
         * @type boolean
         * @default false
         */
        withCredentials: false,
        /**
         * @type number
         * @default 0
         */
        timeout: 0,
        /**
         * The default implementation of **getWebSocketReconnectDelay** for reconnecting after unexpected connection loss by the event code **Abnormal Closure**, **Service Restart** or **Try Again Later**.
         * @type {'full-jitter' | ((retryCount:number) => number)}
         * @default "full-jitter"
         */
        wsReconnectDelay: "full-jitter",
        /**
         * The type of binary data being received over the WebSocket connection
         * @type BinaryType
         * @default 'blob'
         */
        wsBinaryType: "blob",
        /**
         * @type string
         * @default '[hx-disable], [data-hx-disable]'
         */
        disableSelector: "[hx-disable], [data-hx-disable]",
        /**
         * @type {'auto' | 'instant' | 'smooth'}
         * @default 'instant'
         */
        scrollBehavior: "instant",
        /**
         * If the focused element should be scrolled into view.
         * @type boolean
         * @default false
         */
        defaultFocusScroll: false,
        /**
         * If set to true htmx will include a cache-busting parameter in GET requests to avoid caching partial responses by the browser
         * @type boolean
         * @default false
         */
        getCacheBusterParam: false,
        /**
         * If set to true, htmx will use the View Transition API when swapping in new content.
         * @type boolean
         * @default false
         */
        globalViewTransitions: false,
        /**
         * htmx will format requests with these methods by encoding their parameters in the URL, not the request body
         * @type {(HttpVerb)[]}
         * @default ['get', 'delete']
         */
        methodsThatUseUrlParams: ["get", "delete"],
        /**
         * If set to true, disables htmx-based requests to non-origin hosts.
         * @type boolean
         * @default false
         */
        selfRequestsOnly: true,
        /**
         * If set to true htmx will not update the title of the document when a title tag is found in new content
         * @type boolean
         * @default false
         */
        ignoreTitle: false,
        /**
         * Whether the target of a boosted element is scrolled into the viewport.
         * @type boolean
         * @default true
         */
        scrollIntoViewOnBoost: true,
        /**
         * The cache to store evaluated trigger specifications into.
         * You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
         * @type {Object|null}
         * @default null
         */
        triggerSpecsCache: null,
        /** @type boolean */
        disableInheritance: false,
        /** @type HtmxResponseHandlingConfig[] */
        responseHandling: [
          { code: "204", swap: false },
          { code: "[23]..", swap: true },
          { code: "[45]..", swap: false, error: true }
        ],
        /**
         * Whether to process OOB swaps on elements that are nested within the main response element.
         * @type boolean
         * @default true
         */
        allowNestedOobSwaps: true,
        /**
         * Whether to treat history cache miss full page reload requests as a "HX-Request" by returning this response header
         * This should always be disabled when using HX-Request header to optionally return partial responses
         * @type boolean
         * @default true
         */
        historyRestoreAsHxRequest: true,
        /**
         * Whether to report input validation errors to the end user and update focus to the first input that fails validation.
         * This should always be enabled as this matches default browser form submit behaviour
         * @type boolean
         * @default false
         */
        reportValidityOfForms: false
      },
      /** @type {typeof parseInterval} */
      parseInterval: null,
      /**
       * proxy of window.location used for page reload functions
       * @type location
       */
      location,
      /** @type {typeof internalEval} */
      _: null,
      version: "2.0.8"
    };
    htmx.onLoad = onLoadHelper;
    htmx.process = processNode;
    htmx.on = addEventListenerImpl;
    htmx.off = removeEventListenerImpl;
    htmx.trigger = triggerEvent;
    htmx.ajax = ajaxHelper;
    htmx.find = find;
    htmx.findAll = findAll;
    htmx.closest = closest;
    htmx.remove = removeElement;
    htmx.addClass = addClassToElement;
    htmx.removeClass = removeClassFromElement;
    htmx.toggleClass = toggleClassOnElement;
    htmx.takeClass = takeClassForElement;
    htmx.swap = swap;
    htmx.defineExtension = defineExtension;
    htmx.removeExtension = removeExtension;
    htmx.logAll = logAll;
    htmx.logNone = logNone;
    htmx.parseInterval = parseInterval;
    htmx._ = internalEval;
    const internalAPI = {
      addTriggerHandler,
      bodyContains,
      canAccessLocalStorage,
      findThisElement,
      filterValues,
      swap,
      hasAttribute,
      getAttributeValue,
      getClosestAttributeValue,
      getClosestMatch,
      getExpressionVars,
      getHeaders,
      getInputValues,
      getInternalData,
      getSwapSpecification,
      getTriggerSpecs,
      getTarget,
      makeFragment,
      mergeObjects,
      makeSettleInfo,
      oobSwap,
      querySelectorExt,
      settleImmediately,
      shouldCancel,
      triggerEvent,
      triggerErrorEvent,
      withExtensions
    };
    const VERBS = ["get", "post", "put", "delete", "patch"];
    const VERB_SELECTOR = VERBS.map(function(verb) {
      return "[hx-" + verb + "], [data-hx-" + verb + "]";
    }).join(", ");
    function parseInterval(str2) {
      if (str2 == void 0) {
        return void 0;
      }
      let interval = NaN;
      if (str2.slice(-2) == "ms") {
        interval = parseFloat(str2.slice(0, -2));
      } else if (str2.slice(-1) == "s") {
        interval = parseFloat(str2.slice(0, -1)) * 1e3;
      } else if (str2.slice(-1) == "m") {
        interval = parseFloat(str2.slice(0, -1)) * 1e3 * 60;
      } else {
        interval = parseFloat(str2);
      }
      return isNaN(interval) ? void 0 : interval;
    }
    function getRawAttribute(elt, name) {
      return elt instanceof Element && elt.getAttribute(name);
    }
    function hasAttribute(elt, qualifiedName) {
      return !!elt.hasAttribute && (elt.hasAttribute(qualifiedName) || elt.hasAttribute("data-" + qualifiedName));
    }
    function getAttributeValue(elt, qualifiedName) {
      return getRawAttribute(elt, qualifiedName) || getRawAttribute(elt, "data-" + qualifiedName);
    }
    function parentElt(elt) {
      const parent = elt.parentElement;
      if (!parent && elt.parentNode instanceof ShadowRoot) return elt.parentNode;
      return parent;
    }
    function getDocument() {
      return document;
    }
    function getRootNode(elt, global) {
      return elt.getRootNode ? elt.getRootNode({ composed: global }) : getDocument();
    }
    function getClosestMatch(elt, condition) {
      while (elt && !condition(elt)) {
        elt = parentElt(elt);
      }
      return elt || null;
    }
    function getAttributeValueWithDisinheritance(initialElement, ancestor, attributeName) {
      const attributeValue = getAttributeValue(ancestor, attributeName);
      const disinherit = getAttributeValue(ancestor, "hx-disinherit");
      var inherit = getAttributeValue(ancestor, "hx-inherit");
      if (initialElement !== ancestor) {
        if (htmx.config.disableInheritance) {
          if (inherit && (inherit === "*" || inherit.split(" ").indexOf(attributeName) >= 0)) {
            return attributeValue;
          } else {
            return null;
          }
        }
        if (disinherit && (disinherit === "*" || disinherit.split(" ").indexOf(attributeName) >= 0)) {
          return "unset";
        }
      }
      return attributeValue;
    }
    function getClosestAttributeValue(elt, attributeName) {
      let closestAttr = null;
      getClosestMatch(elt, function(e) {
        return !!(closestAttr = getAttributeValueWithDisinheritance(elt, asElement(e), attributeName));
      });
      if (closestAttr !== "unset") {
        return closestAttr;
      }
    }
    function matches(elt, selector) {
      return elt instanceof Element && elt.matches(selector);
    }
    function getStartTag(str2) {
      const tagMatcher = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
      const match = tagMatcher.exec(str2);
      if (match) {
        return match[1].toLowerCase();
      } else {
        return "";
      }
    }
    function parseHTML(resp) {
      if ("parseHTMLUnsafe" in Document) {
        return Document.parseHTMLUnsafe(resp);
      }
      const parser = new DOMParser();
      return parser.parseFromString(resp, "text/html");
    }
    function takeChildrenFor(fragment, elt) {
      while (elt.childNodes.length > 0) {
        fragment.append(elt.childNodes[0]);
      }
    }
    function duplicateScript(script) {
      const newScript = getDocument().createElement("script");
      forEach(script.attributes, function(attr) {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = script.textContent;
      newScript.async = false;
      if (htmx.config.inlineScriptNonce) {
        newScript.nonce = htmx.config.inlineScriptNonce;
      }
      return newScript;
    }
    function isJavaScriptScriptNode(script) {
      return script.matches("script") && (script.type === "text/javascript" || script.type === "module" || script.type === "");
    }
    function normalizeScriptTags(fragment) {
      Array.from(fragment.querySelectorAll("script")).forEach(
        /** @param {HTMLScriptElement} script */
        (script) => {
          if (isJavaScriptScriptNode(script)) {
            const newScript = duplicateScript(script);
            const parent = script.parentNode;
            try {
              parent.insertBefore(newScript, script);
            } catch (e) {
              logError(e);
            } finally {
              script.remove();
            }
          }
        }
      );
    }
    function makeFragment(response) {
      const responseWithNoHead = response.replace(/<head(\s[^>]*)?>[\s\S]*?<\/head>/i, "");
      const startTag = getStartTag(responseWithNoHead);
      let fragment;
      if (startTag === "html") {
        fragment = /** @type DocumentFragmentWithTitle */
        new DocumentFragment();
        const doc = parseHTML(response);
        takeChildrenFor(fragment, doc.body);
        fragment.title = doc.title;
      } else if (startTag === "body") {
        fragment = /** @type DocumentFragmentWithTitle */
        new DocumentFragment();
        const doc = parseHTML(responseWithNoHead);
        takeChildrenFor(fragment, doc.body);
        fragment.title = doc.title;
      } else {
        const doc = parseHTML('<body><template class="internal-htmx-wrapper">' + responseWithNoHead + "</template></body>");
        fragment = /** @type DocumentFragmentWithTitle */
        doc.querySelector("template").content;
        fragment.title = doc.title;
        var titleElement = fragment.querySelector("title");
        if (titleElement && titleElement.parentNode === fragment) {
          titleElement.remove();
          fragment.title = titleElement.innerText;
        }
      }
      if (fragment) {
        if (htmx.config.allowScriptTags) {
          normalizeScriptTags(fragment);
        } else {
          fragment.querySelectorAll("script").forEach((script) => script.remove());
        }
      }
      return fragment;
    }
    function maybeCall(func) {
      if (func) {
        func();
      }
    }
    function isType(o, type) {
      return Object.prototype.toString.call(o) === "[object " + type + "]";
    }
    function isFunction(o) {
      return typeof o === "function";
    }
    function isRawObject(o) {
      return isType(o, "Object");
    }
    function getInternalData(elt) {
      const dataProp = "htmx-internal-data";
      let data = elt[dataProp];
      if (!data) {
        data = elt[dataProp] = {};
      }
      return data;
    }
    function toArray(arr) {
      const returnArr = [];
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          returnArr.push(arr[i]);
        }
      }
      return returnArr;
    }
    function forEach(arr, func) {
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          func(arr[i]);
        }
      }
    }
    function isScrolledIntoView(el) {
      const rect = el.getBoundingClientRect();
      const elemTop = rect.top;
      const elemBottom = rect.bottom;
      return elemTop < window.innerHeight && elemBottom >= 0;
    }
    function bodyContains(elt) {
      return elt.getRootNode({ composed: true }) === document;
    }
    function splitOnWhitespace(trigger) {
      return trigger.trim().split(/\s+/);
    }
    function mergeObjects(obj1, obj2) {
      for (const key in obj2) {
        if (obj2.hasOwnProperty(key)) {
          obj1[key] = obj2[key];
        }
      }
      return obj1;
    }
    function parseJSON(jString) {
      try {
        return JSON.parse(jString);
      } catch (error) {
        logError(error);
        return null;
      }
    }
    function canAccessLocalStorage() {
      const test = "htmx:sessionStorageTest";
      try {
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    }
    function normalizePath(path) {
      const url = new URL(path, "http://x");
      if (url) {
        path = url.pathname + url.search;
      }
      if (path != "/") {
        path = path.replace(/\/+$/, "");
      }
      return path;
    }
    function internalEval(str) {
      return maybeEval(getDocument().body, function() {
        return eval(str);
      });
    }
    function onLoadHelper(callback) {
      const value = htmx.on(
        "htmx:load",
        /** @param {CustomEvent} evt */
        function(evt) {
          callback(evt.detail.elt);
        }
      );
      return value;
    }
    function logAll() {
      htmx.logger = function(elt, event, data) {
        if (console) {
          console.log(event, elt, data);
        }
      };
    }
    function logNone() {
      htmx.logger = null;
    }
    function find(eltOrSelector, selector) {
      if (typeof eltOrSelector !== "string") {
        return eltOrSelector.querySelector(selector);
      } else {
        return find(getDocument(), eltOrSelector);
      }
    }
    function findAll(eltOrSelector, selector) {
      if (typeof eltOrSelector !== "string") {
        return eltOrSelector.querySelectorAll(selector);
      } else {
        return findAll(getDocument(), eltOrSelector);
      }
    }
    function getWindow() {
      return window;
    }
    function removeElement(elt, delay) {
      elt = resolveTarget(elt);
      if (delay) {
        getWindow().setTimeout(function() {
          removeElement(elt);
          elt = null;
        }, delay);
      } else {
        parentElt(elt).removeChild(elt);
      }
    }
    function asElement(elt) {
      return elt instanceof Element ? elt : null;
    }
    function asHtmlElement(elt) {
      return elt instanceof HTMLElement ? elt : null;
    }
    function asString(value) {
      return typeof value === "string" ? value : null;
    }
    function asParentNode(elt) {
      return elt instanceof Element || elt instanceof Document || elt instanceof DocumentFragment ? elt : null;
    }
    function addClassToElement(elt, clazz, delay) {
      elt = asElement(resolveTarget(elt));
      if (!elt) {
        return;
      }
      if (delay) {
        getWindow().setTimeout(function() {
          addClassToElement(elt, clazz);
          elt = null;
        }, delay);
      } else {
        elt.classList && elt.classList.add(clazz);
      }
    }
    function removeClassFromElement(node, clazz, delay) {
      let elt = asElement(resolveTarget(node));
      if (!elt) {
        return;
      }
      if (delay) {
        getWindow().setTimeout(function() {
          removeClassFromElement(elt, clazz);
          elt = null;
        }, delay);
      } else {
        if (elt.classList) {
          elt.classList.remove(clazz);
          if (elt.classList.length === 0) {
            elt.removeAttribute("class");
          }
        }
      }
    }
    function toggleClassOnElement(elt, clazz) {
      elt = resolveTarget(elt);
      elt.classList.toggle(clazz);
    }
    function takeClassForElement(elt, clazz) {
      elt = resolveTarget(elt);
      forEach(elt.parentElement.children, function(child) {
        removeClassFromElement(child, clazz);
      });
      addClassToElement(asElement(elt), clazz);
    }
    function closest(elt, selector) {
      elt = asElement(resolveTarget(elt));
      if (elt) {
        return elt.closest(selector);
      }
      return null;
    }
    function startsWith(str2, prefix) {
      return str2.substring(0, prefix.length) === prefix;
    }
    function endsWith(str2, suffix) {
      return str2.substring(str2.length - suffix.length) === suffix;
    }
    function normalizeSelector(selector) {
      const trimmedSelector = selector.trim();
      if (startsWith(trimmedSelector, "<") && endsWith(trimmedSelector, "/>")) {
        return trimmedSelector.substring(1, trimmedSelector.length - 2);
      } else {
        return trimmedSelector;
      }
    }
    function querySelectorAllExt(elt, selector, global) {
      if (selector.indexOf("global ") === 0) {
        return querySelectorAllExt(elt, selector.slice(7), true);
      }
      elt = resolveTarget(elt);
      const parts = [];
      {
        let chevronsCount = 0;
        let offset = 0;
        for (let i = 0; i < selector.length; i++) {
          const char = selector[i];
          if (char === "," && chevronsCount === 0) {
            parts.push(selector.substring(offset, i));
            offset = i + 1;
            continue;
          }
          if (char === "<") {
            chevronsCount++;
          } else if (char === "/" && i < selector.length - 1 && selector[i + 1] === ">") {
            chevronsCount--;
          }
        }
        if (offset < selector.length) {
          parts.push(selector.substring(offset));
        }
      }
      const result = [];
      const unprocessedParts = [];
      while (parts.length > 0) {
        const selector2 = normalizeSelector(parts.shift());
        let item;
        if (selector2.indexOf("closest ") === 0) {
          item = closest(asElement(elt), normalizeSelector(selector2.slice(8)));
        } else if (selector2.indexOf("find ") === 0) {
          item = find(asParentNode(elt), normalizeSelector(selector2.slice(5)));
        } else if (selector2 === "next" || selector2 === "nextElementSibling") {
          item = asElement(elt).nextElementSibling;
        } else if (selector2.indexOf("next ") === 0) {
          item = scanForwardQuery(elt, normalizeSelector(selector2.slice(5)), !!global);
        } else if (selector2 === "previous" || selector2 === "previousElementSibling") {
          item = asElement(elt).previousElementSibling;
        } else if (selector2.indexOf("previous ") === 0) {
          item = scanBackwardsQuery(elt, normalizeSelector(selector2.slice(9)), !!global);
        } else if (selector2 === "document") {
          item = document;
        } else if (selector2 === "window") {
          item = window;
        } else if (selector2 === "body") {
          item = document.body;
        } else if (selector2 === "root") {
          item = getRootNode(elt, !!global);
        } else if (selector2 === "host") {
          item = /** @type ShadowRoot */
          elt.getRootNode().host;
        } else {
          unprocessedParts.push(selector2);
        }
        if (item) {
          result.push(item);
        }
      }
      if (unprocessedParts.length > 0) {
        const standardSelector = unprocessedParts.join(",");
        const rootNode = asParentNode(getRootNode(elt, !!global));
        result.push(...toArray(rootNode.querySelectorAll(standardSelector)));
      }
      return result;
    }
    var scanForwardQuery = function(start, match, global) {
      const results = asParentNode(getRootNode(start, global)).querySelectorAll(match);
      for (let i = 0; i < results.length; i++) {
        const elt = results[i];
        if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
          return elt;
        }
      }
    };
    var scanBackwardsQuery = function(start, match, global) {
      const results = asParentNode(getRootNode(start, global)).querySelectorAll(match);
      for (let i = results.length - 1; i >= 0; i--) {
        const elt = results[i];
        if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
          return elt;
        }
      }
    };
    function querySelectorExt(eltOrSelector, selector) {
      if (typeof eltOrSelector !== "string") {
        return querySelectorAllExt(eltOrSelector, selector)[0];
      } else {
        return querySelectorAllExt(getDocument().body, eltOrSelector)[0];
      }
    }
    function resolveTarget(eltOrSelector, context) {
      if (typeof eltOrSelector === "string") {
        return find(asParentNode(context) || document, eltOrSelector);
      } else {
        return eltOrSelector;
      }
    }
    function processEventArgs(arg1, arg2, arg3, arg4) {
      if (isFunction(arg2)) {
        return {
          target: getDocument().body,
          event: asString(arg1),
          listener: arg2,
          options: arg3
        };
      } else {
        return {
          target: resolveTarget(arg1),
          event: asString(arg2),
          listener: arg3,
          options: arg4
        };
      }
    }
    function addEventListenerImpl(arg1, arg2, arg3, arg4) {
      ready(function() {
        const eventArgs = processEventArgs(arg1, arg2, arg3, arg4);
        eventArgs.target.addEventListener(eventArgs.event, eventArgs.listener, eventArgs.options);
      });
      const b = isFunction(arg2);
      return b ? arg2 : arg3;
    }
    function removeEventListenerImpl(arg1, arg2, arg3) {
      ready(function() {
        const eventArgs = processEventArgs(arg1, arg2, arg3);
        eventArgs.target.removeEventListener(eventArgs.event, eventArgs.listener);
      });
      return isFunction(arg2) ? arg2 : arg3;
    }
    const DUMMY_ELT = getDocument().createElement("output");
    function findAttributeTargets(elt, attrName) {
      const attrTarget = getClosestAttributeValue(elt, attrName);
      if (attrTarget) {
        if (attrTarget === "this") {
          return [findThisElement(elt, attrName)];
        } else {
          const result = querySelectorAllExt(elt, attrTarget);
          const shouldInherit = /(^|,)(\s*)inherit(\s*)($|,)/.test(attrTarget);
          if (shouldInherit) {
            const eltToInheritFrom = asElement(getClosestMatch(elt, function(parent) {
              return parent !== elt && hasAttribute(asElement(parent), attrName);
            }));
            if (eltToInheritFrom) {
              result.push(...findAttributeTargets(eltToInheritFrom, attrName));
            }
          }
          if (result.length === 0) {
            logError('The selector "' + attrTarget + '" on ' + attrName + " returned no matches!");
            return [DUMMY_ELT];
          } else {
            return result;
          }
        }
      }
    }
    function findThisElement(elt, attribute) {
      return asElement(getClosestMatch(elt, function(elt2) {
        return getAttributeValue(asElement(elt2), attribute) != null;
      }));
    }
    function getTarget(elt) {
      const targetStr = getClosestAttributeValue(elt, "hx-target");
      if (targetStr) {
        if (targetStr === "this") {
          return findThisElement(elt, "hx-target");
        } else {
          return querySelectorExt(elt, targetStr);
        }
      } else {
        const data = getInternalData(elt);
        if (data.boosted) {
          return getDocument().body;
        } else {
          return elt;
        }
      }
    }
    function shouldSettleAttribute(name) {
      return htmx.config.attributesToSettle.includes(name);
    }
    function cloneAttributes(mergeTo, mergeFrom) {
      forEach(Array.from(mergeTo.attributes), function(attr) {
        if (!mergeFrom.hasAttribute(attr.name) && shouldSettleAttribute(attr.name)) {
          mergeTo.removeAttribute(attr.name);
        }
      });
      forEach(mergeFrom.attributes, function(attr) {
        if (shouldSettleAttribute(attr.name)) {
          mergeTo.setAttribute(attr.name, attr.value);
        }
      });
    }
    function isInlineSwap(swapStyle, target) {
      const extensions2 = getExtensions(target);
      for (let i = 0; i < extensions2.length; i++) {
        const extension = extensions2[i];
        try {
          if (extension.isInlineSwap(swapStyle)) {
            return true;
          }
        } catch (e) {
          logError(e);
        }
      }
      return swapStyle === "outerHTML";
    }
    function oobSwap(oobValue, oobElement, settleInfo, rootNode) {
      rootNode = rootNode || getDocument();
      let selector = "#" + CSS.escape(getRawAttribute(oobElement, "id"));
      let swapStyle = "outerHTML";
      if (oobValue === "true") ;
      else if (oobValue.indexOf(":") > 0) {
        swapStyle = oobValue.substring(0, oobValue.indexOf(":"));
        selector = oobValue.substring(oobValue.indexOf(":") + 1);
      } else {
        swapStyle = oobValue;
      }
      oobElement.removeAttribute("hx-swap-oob");
      oobElement.removeAttribute("data-hx-swap-oob");
      const targets = querySelectorAllExt(rootNode, selector, false);
      if (targets.length) {
        forEach(
          targets,
          function(target) {
            let fragment;
            const oobElementClone = oobElement.cloneNode(true);
            fragment = getDocument().createDocumentFragment();
            fragment.appendChild(oobElementClone);
            if (!isInlineSwap(swapStyle, target)) {
              fragment = asParentNode(oobElementClone);
            }
            const beforeSwapDetails = { shouldSwap: true, target, fragment };
            if (!triggerEvent(target, "htmx:oobBeforeSwap", beforeSwapDetails)) return;
            target = beforeSwapDetails.target;
            if (beforeSwapDetails.shouldSwap) {
              handlePreservedElements(fragment);
              swapWithStyle(swapStyle, target, target, fragment, settleInfo);
              restorePreservedElements();
            }
            forEach(settleInfo.elts, function(elt) {
              triggerEvent(elt, "htmx:oobAfterSwap", beforeSwapDetails);
            });
          }
        );
        oobElement.parentNode.removeChild(oobElement);
      } else {
        oobElement.parentNode.removeChild(oobElement);
        triggerErrorEvent(getDocument().body, "htmx:oobErrorNoTarget", { content: oobElement });
      }
      return oobValue;
    }
    function restorePreservedElements() {
      const pantry = find("#--htmx-preserve-pantry--");
      if (pantry) {
        for (const preservedElt of [...pantry.children]) {
          const existingElement = find("#" + preservedElt.id);
          existingElement.parentNode.moveBefore(preservedElt, existingElement);
          existingElement.remove();
        }
        pantry.remove();
      }
    }
    function handlePreservedElements(fragment) {
      forEach(findAll(fragment, "[hx-preserve], [data-hx-preserve]"), function(preservedElt) {
        const id = getAttributeValue(preservedElt, "id");
        const existingElement = getDocument().getElementById(id);
        if (existingElement != null) {
          if (preservedElt.moveBefore) {
            let pantry = find("#--htmx-preserve-pantry--");
            if (pantry == null) {
              getDocument().body.insertAdjacentHTML("afterend", "<div id='--htmx-preserve-pantry--'></div>");
              pantry = find("#--htmx-preserve-pantry--");
            }
            pantry.moveBefore(existingElement, null);
          } else {
            preservedElt.parentNode.replaceChild(existingElement, preservedElt);
          }
        }
      });
    }
    function handleAttributes(parentNode, fragment, settleInfo) {
      forEach(fragment.querySelectorAll("[id]"), function(newNode) {
        const id = getRawAttribute(newNode, "id");
        if (id && id.length > 0) {
          const normalizedId = id.replace("'", "\\'");
          const normalizedTag = newNode.tagName.replace(":", "\\:");
          const parentElt2 = asParentNode(parentNode);
          const oldNode = parentElt2 && parentElt2.querySelector(normalizedTag + "[id='" + normalizedId + "']");
          if (oldNode && oldNode !== parentElt2) {
            const newAttributes = newNode.cloneNode();
            cloneAttributes(newNode, oldNode);
            settleInfo.tasks.push(function() {
              cloneAttributes(newNode, newAttributes);
            });
          }
        }
      });
    }
    function makeAjaxLoadTask(child) {
      return function() {
        removeClassFromElement(child, htmx.config.addedClass);
        processNode(asElement(child));
        processFocus(asParentNode(child));
        triggerEvent(child, "htmx:load");
      };
    }
    function processFocus(child) {
      const autofocus = "[autofocus]";
      const autoFocusedElt = asHtmlElement(matches(child, autofocus) ? child : child.querySelector(autofocus));
      if (autoFocusedElt != null) {
        autoFocusedElt.focus();
      }
    }
    function insertNodesBefore(parentNode, insertBefore, fragment, settleInfo) {
      handleAttributes(parentNode, fragment, settleInfo);
      while (fragment.childNodes.length > 0) {
        const child = fragment.firstChild;
        addClassToElement(asElement(child), htmx.config.addedClass);
        parentNode.insertBefore(child, insertBefore);
        if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
          settleInfo.tasks.push(makeAjaxLoadTask(child));
        }
      }
    }
    function stringHash(string, hash) {
      let char = 0;
      while (char < string.length) {
        hash = (hash << 5) - hash + string.charCodeAt(char++) | 0;
      }
      return hash;
    }
    function attributeHash(elt) {
      let hash = 0;
      for (let i = 0; i < elt.attributes.length; i++) {
        const attribute = elt.attributes[i];
        if (attribute.value) {
          hash = stringHash(attribute.name, hash);
          hash = stringHash(attribute.value, hash);
        }
      }
      return hash;
    }
    function deInitOnHandlers(elt) {
      const internalData = getInternalData(elt);
      if (internalData.onHandlers) {
        for (let i = 0; i < internalData.onHandlers.length; i++) {
          const handlerInfo = internalData.onHandlers[i];
          removeEventListenerImpl(elt, handlerInfo.event, handlerInfo.listener);
        }
        delete internalData.onHandlers;
      }
    }
    function deInitNode(element) {
      const internalData = getInternalData(element);
      if (internalData.timeout) {
        clearTimeout(internalData.timeout);
      }
      if (internalData.listenerInfos) {
        forEach(internalData.listenerInfos, function(info) {
          if (info.on) {
            removeEventListenerImpl(info.on, info.trigger, info.listener);
          }
        });
      }
      deInitOnHandlers(element);
      forEach(Object.keys(internalData), function(key) {
        if (key !== "firstInitCompleted") delete internalData[key];
      });
    }
    function cleanUpElement(element) {
      triggerEvent(element, "htmx:beforeCleanupElement");
      deInitNode(element);
      forEach(element.children, function(child) {
        cleanUpElement(child);
      });
    }
    function swapOuterHTML(target, fragment, settleInfo) {
      if (target.tagName === "BODY") {
        return swapInnerHTML(target, fragment, settleInfo);
      }
      let newElt;
      const eltBeforeNewContent = target.previousSibling;
      const parentNode = parentElt(target);
      if (!parentNode) {
        return;
      }
      insertNodesBefore(parentNode, target, fragment, settleInfo);
      if (eltBeforeNewContent == null) {
        newElt = parentNode.firstChild;
      } else {
        newElt = eltBeforeNewContent.nextSibling;
      }
      settleInfo.elts = settleInfo.elts.filter(function(e) {
        return e !== target;
      });
      while (newElt && newElt !== target) {
        if (newElt instanceof Element) {
          settleInfo.elts.push(newElt);
        }
        newElt = newElt.nextSibling;
      }
      cleanUpElement(target);
      target.remove();
    }
    function swapAfterBegin(target, fragment, settleInfo) {
      return insertNodesBefore(target, target.firstChild, fragment, settleInfo);
    }
    function swapBeforeBegin(target, fragment, settleInfo) {
      return insertNodesBefore(parentElt(target), target, fragment, settleInfo);
    }
    function swapBeforeEnd(target, fragment, settleInfo) {
      return insertNodesBefore(target, null, fragment, settleInfo);
    }
    function swapAfterEnd(target, fragment, settleInfo) {
      return insertNodesBefore(parentElt(target), target.nextSibling, fragment, settleInfo);
    }
    function swapDelete(target) {
      cleanUpElement(target);
      const parent = parentElt(target);
      if (parent) {
        return parent.removeChild(target);
      }
    }
    function swapInnerHTML(target, fragment, settleInfo) {
      const firstChild = target.firstChild;
      insertNodesBefore(target, firstChild, fragment, settleInfo);
      if (firstChild) {
        while (firstChild.nextSibling) {
          cleanUpElement(firstChild.nextSibling);
          target.removeChild(firstChild.nextSibling);
        }
        cleanUpElement(firstChild);
        target.removeChild(firstChild);
      }
    }
    function swapWithStyle(swapStyle, elt, target, fragment, settleInfo) {
      switch (swapStyle) {
        case "none":
          return;
        case "outerHTML":
          swapOuterHTML(target, fragment, settleInfo);
          return;
        case "afterbegin":
          swapAfterBegin(target, fragment, settleInfo);
          return;
        case "beforebegin":
          swapBeforeBegin(target, fragment, settleInfo);
          return;
        case "beforeend":
          swapBeforeEnd(target, fragment, settleInfo);
          return;
        case "afterend":
          swapAfterEnd(target, fragment, settleInfo);
          return;
        case "delete":
          swapDelete(target);
          return;
        default:
          var extensions2 = getExtensions(elt);
          for (let i = 0; i < extensions2.length; i++) {
            const ext = extensions2[i];
            try {
              const newElements = ext.handleSwap(swapStyle, target, fragment, settleInfo);
              if (newElements) {
                if (Array.isArray(newElements)) {
                  for (let j = 0; j < newElements.length; j++) {
                    const child = newElements[j];
                    if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
                      settleInfo.tasks.push(makeAjaxLoadTask(child));
                    }
                  }
                }
                return;
              }
            } catch (e) {
              logError(e);
            }
          }
          if (swapStyle === "innerHTML") {
            swapInnerHTML(target, fragment, settleInfo);
          } else {
            swapWithStyle(htmx.config.defaultSwapStyle, elt, target, fragment, settleInfo);
          }
      }
    }
    function findAndSwapOobElements(fragment, settleInfo, rootNode) {
      var oobElts = findAll(fragment, "[hx-swap-oob], [data-hx-swap-oob]");
      forEach(oobElts, function(oobElement) {
        if (htmx.config.allowNestedOobSwaps || oobElement.parentElement === null) {
          const oobValue = getAttributeValue(oobElement, "hx-swap-oob");
          if (oobValue != null) {
            oobSwap(oobValue, oobElement, settleInfo, rootNode);
          }
        } else {
          oobElement.removeAttribute("hx-swap-oob");
          oobElement.removeAttribute("data-hx-swap-oob");
        }
      });
      return oobElts.length > 0;
    }
    function swap(target, content, swapSpec, swapOptions) {
      if (!swapOptions) {
        swapOptions = {};
      }
      let settleResolve = null;
      let settleReject = null;
      let doSwap = function() {
        maybeCall(swapOptions.beforeSwapCallback);
        target = resolveTarget(target);
        const rootNode = swapOptions.contextElement ? getRootNode(swapOptions.contextElement, false) : getDocument();
        const activeElt = document.activeElement;
        let selectionInfo = {};
        selectionInfo = {
          elt: activeElt,
          // @ts-ignore
          start: activeElt ? activeElt.selectionStart : null,
          // @ts-ignore
          end: activeElt ? activeElt.selectionEnd : null
        };
        const settleInfo = makeSettleInfo(target);
        if (swapSpec.swapStyle === "textContent") {
          target.textContent = content;
        } else {
          let fragment = makeFragment(content);
          settleInfo.title = swapOptions.title || fragment.title;
          if (swapOptions.historyRequest) {
            fragment = fragment.querySelector("[hx-history-elt],[data-hx-history-elt]") || fragment;
          }
          if (swapOptions.selectOOB) {
            const oobSelectValues = swapOptions.selectOOB.split(",");
            for (let i = 0; i < oobSelectValues.length; i++) {
              const oobSelectValue = oobSelectValues[i].split(":", 2);
              let id = oobSelectValue[0].trim();
              if (id.indexOf("#") === 0) {
                id = id.substring(1);
              }
              const oobValue = oobSelectValue[1] || "true";
              const oobElement = fragment.querySelector("#" + id);
              if (oobElement) {
                oobSwap(oobValue, oobElement, settleInfo, rootNode);
              }
            }
          }
          findAndSwapOobElements(fragment, settleInfo, rootNode);
          forEach(
            findAll(fragment, "template"),
            /** @param {HTMLTemplateElement} template */
            function(template) {
              if (template.content && findAndSwapOobElements(template.content, settleInfo, rootNode)) {
                template.remove();
              }
            }
          );
          if (swapOptions.select) {
            const newFragment = getDocument().createDocumentFragment();
            forEach(fragment.querySelectorAll(swapOptions.select), function(node) {
              newFragment.appendChild(node);
            });
            fragment = newFragment;
          }
          handlePreservedElements(fragment);
          swapWithStyle(swapSpec.swapStyle, swapOptions.contextElement, target, fragment, settleInfo);
          restorePreservedElements();
        }
        if (selectionInfo.elt && !bodyContains(selectionInfo.elt) && getRawAttribute(selectionInfo.elt, "id")) {
          const newActiveElt = document.getElementById(getRawAttribute(selectionInfo.elt, "id"));
          const focusOptions = { preventScroll: swapSpec.focusScroll !== void 0 ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll };
          if (newActiveElt) {
            if (selectionInfo.start && newActiveElt.setSelectionRange) {
              try {
                newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
              } catch (e) {
              }
            }
            newActiveElt.focus(focusOptions);
          }
        }
        target.classList.remove(htmx.config.swappingClass);
        forEach(settleInfo.elts, function(elt2) {
          if (elt2.classList) {
            elt2.classList.add(htmx.config.settlingClass);
          }
          triggerEvent(elt2, "htmx:afterSwap", swapOptions.eventInfo);
        });
        maybeCall(swapOptions.afterSwapCallback);
        if (!swapSpec.ignoreTitle) {
          handleTitle(settleInfo.title);
        }
        const doSettle = function() {
          forEach(settleInfo.tasks, function(task) {
            task.call();
          });
          forEach(settleInfo.elts, function(elt2) {
            if (elt2.classList) {
              elt2.classList.remove(htmx.config.settlingClass);
            }
            triggerEvent(elt2, "htmx:afterSettle", swapOptions.eventInfo);
          });
          if (swapOptions.anchor) {
            const anchorTarget = asElement(resolveTarget("#" + swapOptions.anchor));
            if (anchorTarget) {
              anchorTarget.scrollIntoView({ block: "start", behavior: "auto" });
            }
          }
          updateScrollState(settleInfo.elts, swapSpec);
          maybeCall(swapOptions.afterSettleCallback);
          maybeCall(settleResolve);
        };
        if (swapSpec.settleDelay > 0) {
          getWindow().setTimeout(doSettle, swapSpec.settleDelay);
        } else {
          doSettle();
        }
      };
      let shouldTransition = htmx.config.globalViewTransitions;
      if (swapSpec.hasOwnProperty("transition")) {
        shouldTransition = swapSpec.transition;
      }
      const elt = swapOptions.contextElement || getDocument();
      if (shouldTransition && triggerEvent(elt, "htmx:beforeTransition", swapOptions.eventInfo) && typeof Promise !== "undefined" && // @ts-ignore experimental feature atm
      document.startViewTransition) {
        const settlePromise = new Promise(function(_resolve, _reject) {
          settleResolve = _resolve;
          settleReject = _reject;
        });
        const innerDoSwap = doSwap;
        doSwap = function() {
          document.startViewTransition(function() {
            innerDoSwap();
            return settlePromise;
          });
        };
      }
      try {
        if (swapSpec?.swapDelay && swapSpec.swapDelay > 0) {
          getWindow().setTimeout(doSwap, swapSpec.swapDelay);
        } else {
          doSwap();
        }
      } catch (e) {
        triggerErrorEvent(elt, "htmx:swapError", swapOptions.eventInfo);
        maybeCall(settleReject);
        throw e;
      }
    }
    function handleTriggerHeader(xhr, header, elt) {
      const triggerBody = xhr.getResponseHeader(header);
      if (triggerBody.indexOf("{") === 0) {
        const triggers = parseJSON(triggerBody);
        for (const eventName in triggers) {
          if (triggers.hasOwnProperty(eventName)) {
            let detail = triggers[eventName];
            if (isRawObject(detail)) {
              elt = detail.target !== void 0 ? detail.target : elt;
            } else {
              detail = { value: detail };
            }
            triggerEvent(elt, eventName, detail);
          }
        }
      } else {
        const eventNames = triggerBody.split(",");
        for (let i = 0; i < eventNames.length; i++) {
          triggerEvent(elt, eventNames[i].trim(), []);
        }
      }
    }
    const WHITESPACE_OR_COMMA = /[\s,]/;
    const SYMBOL_START = /[_$a-zA-Z]/;
    const SYMBOL_CONT = /[_$a-zA-Z0-9]/;
    const STRINGISH_START = ['"', "'", "/"];
    const NOT_WHITESPACE = /[^\s]/;
    const COMBINED_SELECTOR_START = /[{(]/;
    const COMBINED_SELECTOR_END = /[})]/;
    function tokenizeString(str2) {
      const tokens = [];
      let position = 0;
      while (position < str2.length) {
        if (SYMBOL_START.exec(str2.charAt(position))) {
          var startPosition = position;
          while (SYMBOL_CONT.exec(str2.charAt(position + 1))) {
            position++;
          }
          tokens.push(str2.substring(startPosition, position + 1));
        } else if (STRINGISH_START.indexOf(str2.charAt(position)) !== -1) {
          const startChar = str2.charAt(position);
          var startPosition = position;
          position++;
          while (position < str2.length && str2.charAt(position) !== startChar) {
            if (str2.charAt(position) === "\\") {
              position++;
            }
            position++;
          }
          tokens.push(str2.substring(startPosition, position + 1));
        } else {
          const symbol = str2.charAt(position);
          tokens.push(symbol);
        }
        position++;
      }
      return tokens;
    }
    function isPossibleRelativeReference(token, last, paramName) {
      return SYMBOL_START.exec(token.charAt(0)) && token !== "true" && token !== "false" && token !== "this" && token !== paramName && last !== ".";
    }
    function maybeGenerateConditional(elt, tokens, paramName) {
      if (tokens[0] === "[") {
        tokens.shift();
        let bracketCount = 1;
        let conditionalSource = " return (function(" + paramName + "){ return (";
        let last = null;
        while (tokens.length > 0) {
          const token = tokens[0];
          if (token === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              if (last === null) {
                conditionalSource = conditionalSource + "true";
              }
              tokens.shift();
              conditionalSource += ")})";
              try {
                const conditionFunction = maybeEval(
                  elt,
                  function() {
                    return Function(conditionalSource)();
                  },
                  function() {
                    return true;
                  }
                );
                conditionFunction.source = conditionalSource;
                return conditionFunction;
              } catch (e) {
                triggerErrorEvent(getDocument().body, "htmx:syntax:error", { error: e, source: conditionalSource });
                return null;
              }
            }
          } else if (token === "[") {
            bracketCount++;
          }
          if (isPossibleRelativeReference(token, last, paramName)) {
            conditionalSource += "((" + paramName + "." + token + ") ? (" + paramName + "." + token + ") : (window." + token + "))";
          } else {
            conditionalSource = conditionalSource + token;
          }
          last = tokens.shift();
        }
      }
    }
    function consumeUntil(tokens, match) {
      let result = "";
      while (tokens.length > 0 && !match.test(tokens[0])) {
        result += tokens.shift();
      }
      return result;
    }
    function consumeCSSSelector(tokens) {
      let result;
      if (tokens.length > 0 && COMBINED_SELECTOR_START.test(tokens[0])) {
        tokens.shift();
        result = consumeUntil(tokens, COMBINED_SELECTOR_END).trim();
        tokens.shift();
      } else {
        result = consumeUntil(tokens, WHITESPACE_OR_COMMA);
      }
      return result;
    }
    const INPUT_SELECTOR = "input, textarea, select";
    function parseAndCacheTrigger(elt, explicitTrigger, cache) {
      const triggerSpecs = [];
      const tokens = tokenizeString(explicitTrigger);
      do {
        consumeUntil(tokens, NOT_WHITESPACE);
        const initialLength = tokens.length;
        const trigger = consumeUntil(tokens, /[,\[\s]/);
        if (trigger !== "") {
          if (trigger === "every") {
            const every = { trigger: "every" };
            consumeUntil(tokens, NOT_WHITESPACE);
            every.pollInterval = parseInterval(consumeUntil(tokens, /[,\[\s]/));
            consumeUntil(tokens, NOT_WHITESPACE);
            var eventFilter = maybeGenerateConditional(elt, tokens, "event");
            if (eventFilter) {
              every.eventFilter = eventFilter;
            }
            triggerSpecs.push(every);
          } else {
            const triggerSpec = { trigger };
            var eventFilter = maybeGenerateConditional(elt, tokens, "event");
            if (eventFilter) {
              triggerSpec.eventFilter = eventFilter;
            }
            consumeUntil(tokens, NOT_WHITESPACE);
            while (tokens.length > 0 && tokens[0] !== ",") {
              const token = tokens.shift();
              if (token === "changed") {
                triggerSpec.changed = true;
              } else if (token === "once") {
                triggerSpec.once = true;
              } else if (token === "consume") {
                triggerSpec.consume = true;
              } else if (token === "delay" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec.delay = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA));
              } else if (token === "from" && tokens[0] === ":") {
                tokens.shift();
                if (COMBINED_SELECTOR_START.test(tokens[0])) {
                  var from_arg = consumeCSSSelector(tokens);
                } else {
                  var from_arg = consumeUntil(tokens, WHITESPACE_OR_COMMA);
                  if (from_arg === "closest" || from_arg === "find" || from_arg === "next" || from_arg === "previous") {
                    tokens.shift();
                    const selector = consumeCSSSelector(tokens);
                    if (selector.length > 0) {
                      from_arg += " " + selector;
                    }
                  }
                }
                triggerSpec.from = from_arg;
              } else if (token === "target" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec.target = consumeCSSSelector(tokens);
              } else if (token === "throttle" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec.throttle = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA));
              } else if (token === "queue" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec.queue = consumeUntil(tokens, WHITESPACE_OR_COMMA);
              } else if (token === "root" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec[token] = consumeCSSSelector(tokens);
              } else if (token === "threshold" && tokens[0] === ":") {
                tokens.shift();
                triggerSpec[token] = consumeUntil(tokens, WHITESPACE_OR_COMMA);
              } else {
                triggerErrorEvent(elt, "htmx:syntax:error", { token: tokens.shift() });
              }
              consumeUntil(tokens, NOT_WHITESPACE);
            }
            triggerSpecs.push(triggerSpec);
          }
        }
        if (tokens.length === initialLength) {
          triggerErrorEvent(elt, "htmx:syntax:error", { token: tokens.shift() });
        }
        consumeUntil(tokens, NOT_WHITESPACE);
      } while (tokens[0] === "," && tokens.shift());
      if (cache) {
        cache[explicitTrigger] = triggerSpecs;
      }
      return triggerSpecs;
    }
    function getTriggerSpecs(elt) {
      const explicitTrigger = getAttributeValue(elt, "hx-trigger");
      let triggerSpecs = [];
      if (explicitTrigger) {
        const cache = htmx.config.triggerSpecsCache;
        triggerSpecs = cache && cache[explicitTrigger] || parseAndCacheTrigger(elt, explicitTrigger, cache);
      }
      if (triggerSpecs.length > 0) {
        return triggerSpecs;
      } else if (matches(elt, "form")) {
        return [{ trigger: "submit" }];
      } else if (matches(elt, 'input[type="button"], input[type="submit"]')) {
        return [{ trigger: "click" }];
      } else if (matches(elt, INPUT_SELECTOR)) {
        return [{ trigger: "change" }];
      } else {
        return [{ trigger: "click" }];
      }
    }
    function cancelPolling(elt) {
      getInternalData(elt).cancelled = true;
    }
    function processPolling(elt, handler, spec) {
      const nodeData = getInternalData(elt);
      nodeData.timeout = getWindow().setTimeout(function() {
        if (bodyContains(elt) && nodeData.cancelled !== true) {
          if (!maybeFilterEvent(spec, elt, makeEvent("hx:poll:trigger", {
            triggerSpec: spec,
            target: elt
          }))) {
            handler(elt);
          }
          processPolling(elt, handler, spec);
        }
      }, spec.pollInterval);
    }
    function isLocalLink(elt) {
      return location.hostname === elt.hostname && getRawAttribute(elt, "href") && getRawAttribute(elt, "href").indexOf("#") !== 0;
    }
    function eltIsDisabled(elt) {
      return closest(elt, htmx.config.disableSelector);
    }
    function boostElement(elt, nodeData, triggerSpecs) {
      if (elt instanceof HTMLAnchorElement && isLocalLink(elt) && (elt.target === "" || elt.target === "_self") || elt.tagName === "FORM" && String(getRawAttribute(elt, "method")).toLowerCase() !== "dialog") {
        nodeData.boosted = true;
        let verb, path;
        if (elt.tagName === "A") {
          verb = /** @type HttpVerb */
          "get";
          path = getRawAttribute(elt, "href");
        } else {
          const rawAttribute = getRawAttribute(elt, "method");
          verb = /** @type HttpVerb */
          rawAttribute ? rawAttribute.toLowerCase() : "get";
          path = getRawAttribute(elt, "action");
          if (path == null || path === "") {
            path = location.href;
          }
          if (verb === "get" && path.includes("?")) {
            path = path.replace(/\?[^#]+/, "");
          }
        }
        triggerSpecs.forEach(function(triggerSpec) {
          addEventListener(elt, function(node, evt) {
            const elt2 = asElement(node);
            if (eltIsDisabled(elt2)) {
              cleanUpElement(elt2);
              return;
            }
            issueAjaxRequest(verb, path, elt2, evt);
          }, nodeData, triggerSpec, true);
        });
      }
    }
    function shouldCancel(evt, elt) {
      if (evt.type === "submit" && elt.tagName === "FORM") {
        return true;
      } else if (evt.type === "click") {
        const btn = (
          /** @type {HTMLButtonElement|HTMLInputElement|null} */
          elt.closest('input[type="submit"], button')
        );
        if (btn && btn.form && btn.type === "submit") {
          return true;
        }
        const link = elt.closest("a");
        const samePageAnchor = /^#.+/;
        if (link && link.href && !samePageAnchor.test(link.getAttribute("href"))) {
          return true;
        }
      }
      return false;
    }
    function ignoreBoostedAnchorCtrlClick(elt, evt) {
      return getInternalData(elt).boosted && elt instanceof HTMLAnchorElement && evt.type === "click" && // @ts-ignore this will resolve to undefined for events that don't define those properties, which is fine
      (evt.ctrlKey || evt.metaKey);
    }
    function maybeFilterEvent(triggerSpec, elt, evt) {
      const eventFilter = triggerSpec.eventFilter;
      if (eventFilter) {
        try {
          return eventFilter.call(elt, evt) !== true;
        } catch (e) {
          const source = eventFilter.source;
          triggerErrorEvent(getDocument().body, "htmx:eventFilter:error", { error: e, source });
          return true;
        }
      }
      return false;
    }
    function addEventListener(elt, handler, nodeData, triggerSpec, explicitCancel) {
      const elementData = getInternalData(elt);
      let eltsToListenOn;
      if (triggerSpec.from) {
        eltsToListenOn = querySelectorAllExt(elt, triggerSpec.from);
      } else {
        eltsToListenOn = [elt];
      }
      if (triggerSpec.changed) {
        if (!("lastValue" in elementData)) {
          elementData.lastValue = /* @__PURE__ */ new WeakMap();
        }
        eltsToListenOn.forEach(function(eltToListenOn) {
          if (!elementData.lastValue.has(triggerSpec)) {
            elementData.lastValue.set(triggerSpec, /* @__PURE__ */ new WeakMap());
          }
          elementData.lastValue.get(triggerSpec).set(eltToListenOn, eltToListenOn.value);
        });
      }
      forEach(eltsToListenOn, function(eltToListenOn) {
        const eventListener = function(evt) {
          if (!bodyContains(elt)) {
            eltToListenOn.removeEventListener(triggerSpec.trigger, eventListener);
            return;
          }
          if (ignoreBoostedAnchorCtrlClick(elt, evt)) {
            return;
          }
          if (explicitCancel || shouldCancel(evt, eltToListenOn)) {
            evt.preventDefault();
          }
          if (maybeFilterEvent(triggerSpec, elt, evt)) {
            return;
          }
          const eventData = getInternalData(evt);
          eventData.triggerSpec = triggerSpec;
          if (eventData.handledFor == null) {
            eventData.handledFor = [];
          }
          if (eventData.handledFor.indexOf(elt) < 0) {
            eventData.handledFor.push(elt);
            if (triggerSpec.consume) {
              evt.stopPropagation();
            }
            if (triggerSpec.target && evt.target) {
              if (!matches(asElement(evt.target), triggerSpec.target)) {
                return;
              }
            }
            if (triggerSpec.once) {
              if (elementData.triggeredOnce) {
                return;
              } else {
                elementData.triggeredOnce = true;
              }
            }
            if (triggerSpec.changed) {
              const node = evt.target;
              const value = node.value;
              const lastValue = elementData.lastValue.get(triggerSpec);
              if (lastValue.has(node) && lastValue.get(node) === value) {
                return;
              }
              lastValue.set(node, value);
            }
            if (elementData.delayed) {
              clearTimeout(elementData.delayed);
            }
            if (elementData.throttle) {
              return;
            }
            if (triggerSpec.throttle > 0) {
              if (!elementData.throttle) {
                triggerEvent(elt, "htmx:trigger");
                handler(elt, evt);
                elementData.throttle = getWindow().setTimeout(function() {
                  elementData.throttle = null;
                }, triggerSpec.throttle);
              }
            } else if (triggerSpec.delay > 0) {
              elementData.delayed = getWindow().setTimeout(function() {
                triggerEvent(elt, "htmx:trigger");
                handler(elt, evt);
              }, triggerSpec.delay);
            } else {
              triggerEvent(elt, "htmx:trigger");
              handler(elt, evt);
            }
          }
        };
        if (nodeData.listenerInfos == null) {
          nodeData.listenerInfos = [];
        }
        nodeData.listenerInfos.push({
          trigger: triggerSpec.trigger,
          listener: eventListener,
          on: eltToListenOn
        });
        eltToListenOn.addEventListener(triggerSpec.trigger, eventListener);
      });
    }
    let windowIsScrolling = false;
    let scrollHandler = null;
    function initScrollHandler() {
      if (!scrollHandler) {
        scrollHandler = function() {
          windowIsScrolling = true;
        };
        window.addEventListener("scroll", scrollHandler);
        window.addEventListener("resize", scrollHandler);
        setInterval(function() {
          if (windowIsScrolling) {
            windowIsScrolling = false;
            forEach(getDocument().querySelectorAll("[hx-trigger*='revealed'],[data-hx-trigger*='revealed']"), function(elt) {
              maybeReveal(elt);
            });
          }
        }, 200);
      }
    }
    function maybeReveal(elt) {
      if (!hasAttribute(elt, "data-hx-revealed") && isScrolledIntoView(elt)) {
        elt.setAttribute("data-hx-revealed", "true");
        const nodeData = getInternalData(elt);
        if (nodeData.initHash) {
          triggerEvent(elt, "revealed");
        } else {
          elt.addEventListener("htmx:afterProcessNode", function() {
            triggerEvent(elt, "revealed");
          }, { once: true });
        }
      }
    }
    function loadImmediately(elt, handler, nodeData, delay) {
      const load = function() {
        if (!nodeData.loaded) {
          nodeData.loaded = true;
          triggerEvent(elt, "htmx:trigger");
          handler(elt);
        }
      };
      if (delay > 0) {
        getWindow().setTimeout(load, delay);
      } else {
        load();
      }
    }
    function processVerbs(elt, nodeData, triggerSpecs) {
      let explicitAction = false;
      forEach(VERBS, function(verb) {
        if (hasAttribute(elt, "hx-" + verb)) {
          const path = getAttributeValue(elt, "hx-" + verb);
          explicitAction = true;
          nodeData.path = path;
          nodeData.verb = verb;
          triggerSpecs.forEach(function(triggerSpec) {
            addTriggerHandler(elt, triggerSpec, nodeData, function(node, evt) {
              const elt2 = asElement(node);
              if (eltIsDisabled(elt2)) {
                cleanUpElement(elt2);
                return;
              }
              issueAjaxRequest(verb, path, elt2, evt);
            });
          });
        }
      });
      return explicitAction;
    }
    function addTriggerHandler(elt, triggerSpec, nodeData, handler) {
      if (triggerSpec.trigger === "revealed") {
        initScrollHandler();
        addEventListener(elt, handler, nodeData, triggerSpec);
        maybeReveal(asElement(elt));
      } else if (triggerSpec.trigger === "intersect") {
        const observerOptions = {};
        if (triggerSpec.root) {
          observerOptions.root = querySelectorExt(elt, triggerSpec.root);
        }
        if (triggerSpec.threshold) {
          observerOptions.threshold = parseFloat(triggerSpec.threshold);
        }
        const observer = new IntersectionObserver(function(entries) {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isIntersecting) {
              triggerEvent(elt, "intersect");
              break;
            }
          }
        }, observerOptions);
        observer.observe(asElement(elt));
        addEventListener(asElement(elt), handler, nodeData, triggerSpec);
      } else if (!nodeData.firstInitCompleted && triggerSpec.trigger === "load") {
        if (!maybeFilterEvent(triggerSpec, elt, makeEvent("load", { elt }))) {
          loadImmediately(asElement(elt), handler, nodeData, triggerSpec.delay);
        }
      } else if (triggerSpec.pollInterval > 0) {
        nodeData.polling = true;
        processPolling(asElement(elt), handler, triggerSpec);
      } else {
        addEventListener(elt, handler, nodeData, triggerSpec);
      }
    }
    function shouldProcessHxOn(node) {
      const elt = asElement(node);
      if (!elt) {
        return false;
      }
      const attributes = elt.attributes;
      for (let j = 0; j < attributes.length; j++) {
        const attrName = attributes[j].name;
        if (startsWith(attrName, "hx-on:") || startsWith(attrName, "data-hx-on:") || startsWith(attrName, "hx-on-") || startsWith(attrName, "data-hx-on-")) {
          return true;
        }
      }
      return false;
    }
    const HX_ON_QUERY = new XPathEvaluator().createExpression('.//*[@*[ starts-with(name(), "hx-on:") or starts-with(name(), "data-hx-on:") or starts-with(name(), "hx-on-") or starts-with(name(), "data-hx-on-") ]]');
    function processHXOnRoot(elt, elements) {
      if (shouldProcessHxOn(elt)) {
        elements.push(asElement(elt));
      }
      const iter = HX_ON_QUERY.evaluate(elt);
      let node = null;
      while (node = iter.iterateNext()) elements.push(asElement(node));
    }
    function findHxOnWildcardElements(elt) {
      const elements = [];
      if (elt instanceof DocumentFragment) {
        for (const child of elt.childNodes) {
          processHXOnRoot(child, elements);
        }
      } else {
        processHXOnRoot(elt, elements);
      }
      return elements;
    }
    function findElementsToProcess(elt) {
      if (elt.querySelectorAll) {
        const boostedSelector = ", [hx-boost] a, [data-hx-boost] a, a[hx-boost], a[data-hx-boost]";
        const extensionSelectors = [];
        for (const e in extensions) {
          const extension = extensions[e];
          if (extension.getSelectors) {
            var selectors = extension.getSelectors();
            if (selectors) {
              extensionSelectors.push(selectors);
            }
          }
        }
        const results = elt.querySelectorAll(VERB_SELECTOR + boostedSelector + ", form, [type='submit'], [hx-ext], [data-hx-ext], [hx-trigger], [data-hx-trigger]" + extensionSelectors.flat().map((s) => ", " + s).join(""));
        return results;
      } else {
        return [];
      }
    }
    function maybeSetLastButtonClicked(evt) {
      const elt = getTargetButton(evt.target);
      const internalData = getRelatedFormData(evt);
      if (internalData) {
        internalData.lastButtonClicked = elt;
      }
    }
    function maybeUnsetLastButtonClicked(evt) {
      const internalData = getRelatedFormData(evt);
      if (internalData) {
        internalData.lastButtonClicked = null;
      }
    }
    function getTargetButton(target) {
      return (
        /** @type {HTMLButtonElement|HTMLInputElement|null} */
        closest(asElement(target), "button, input[type='submit']")
      );
    }
    function getRelatedForm(elt) {
      return elt.form || closest(elt, "form");
    }
    function getRelatedFormData(evt) {
      const elt = getTargetButton(evt.target);
      if (!elt) {
        return;
      }
      const form = getRelatedForm(elt);
      if (!form) {
        return;
      }
      return getInternalData(form);
    }
    function initButtonTracking(elt) {
      elt.addEventListener("click", maybeSetLastButtonClicked);
      elt.addEventListener("focusin", maybeSetLastButtonClicked);
      elt.addEventListener("focusout", maybeUnsetLastButtonClicked);
    }
    function addHxOnEventHandler(elt, eventName, code) {
      const nodeData = getInternalData(elt);
      if (!Array.isArray(nodeData.onHandlers)) {
        nodeData.onHandlers = [];
      }
      let func;
      const listener = function(e) {
        maybeEval(elt, function() {
          if (eltIsDisabled(elt)) {
            return;
          }
          if (!func) {
            func = new Function("event", code);
          }
          func.call(elt, e);
        });
      };
      elt.addEventListener(eventName, listener);
      nodeData.onHandlers.push({ event: eventName, listener });
    }
    function processHxOnWildcard(elt) {
      deInitOnHandlers(elt);
      for (let i = 0; i < elt.attributes.length; i++) {
        const name = elt.attributes[i].name;
        const value = elt.attributes[i].value;
        if (startsWith(name, "hx-on") || startsWith(name, "data-hx-on")) {
          const afterOnPosition = name.indexOf("-on") + 3;
          const nextChar = name.slice(afterOnPosition, afterOnPosition + 1);
          if (nextChar === "-" || nextChar === ":") {
            let eventName = name.slice(afterOnPosition + 1);
            if (startsWith(eventName, ":")) {
              eventName = "htmx" + eventName;
            } else if (startsWith(eventName, "-")) {
              eventName = "htmx:" + eventName.slice(1);
            } else if (startsWith(eventName, "htmx-")) {
              eventName = "htmx:" + eventName.slice(5);
            }
            addHxOnEventHandler(elt, eventName, value);
          }
        }
      }
    }
    function initNode(elt) {
      triggerEvent(elt, "htmx:beforeProcessNode");
      const nodeData = getInternalData(elt);
      const triggerSpecs = getTriggerSpecs(elt);
      const hasExplicitHttpAction = processVerbs(elt, nodeData, triggerSpecs);
      if (!hasExplicitHttpAction) {
        if (getClosestAttributeValue(elt, "hx-boost") === "true") {
          boostElement(elt, nodeData, triggerSpecs);
        } else if (hasAttribute(elt, "hx-trigger")) {
          triggerSpecs.forEach(function(triggerSpec) {
            addTriggerHandler(elt, triggerSpec, nodeData, function() {
            });
          });
        }
      }
      if (elt.tagName === "FORM" || getRawAttribute(elt, "type") === "submit" && hasAttribute(elt, "form")) {
        initButtonTracking(elt);
      }
      nodeData.firstInitCompleted = true;
      triggerEvent(elt, "htmx:afterProcessNode");
    }
    function maybeDeInitAndHash(elt) {
      if (!(elt instanceof Element)) {
        return false;
      }
      const nodeData = getInternalData(elt);
      const hash = attributeHash(elt);
      if (nodeData.initHash !== hash) {
        deInitNode(elt);
        nodeData.initHash = hash;
        return true;
      }
      return false;
    }
    function processNode(elt) {
      elt = resolveTarget(elt);
      if (eltIsDisabled(elt)) {
        cleanUpElement(elt);
        return;
      }
      const elementsToInit = [];
      if (maybeDeInitAndHash(elt)) {
        elementsToInit.push(elt);
      }
      forEach(findElementsToProcess(elt), function(child) {
        if (eltIsDisabled(child)) {
          cleanUpElement(child);
          return;
        }
        if (maybeDeInitAndHash(child)) {
          elementsToInit.push(child);
        }
      });
      forEach(findHxOnWildcardElements(elt), processHxOnWildcard);
      forEach(elementsToInit, initNode);
    }
    function kebabEventName(str2) {
      return str2.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
    function makeEvent(eventName, detail) {
      return new CustomEvent(eventName, { bubbles: true, cancelable: true, composed: true, detail });
    }
    function triggerErrorEvent(elt, eventName, detail) {
      triggerEvent(elt, eventName, mergeObjects({ error: eventName }, detail));
    }
    function ignoreEventForLogging(eventName) {
      return eventName === "htmx:afterProcessNode";
    }
    function withExtensions(elt, toDo, extensionsToIgnore) {
      forEach(getExtensions(elt, [], extensionsToIgnore), function(extension) {
        try {
          toDo(extension);
        } catch (e) {
          logError(e);
        }
      });
    }
    function logError(msg) {
      console.error(msg);
    }
    function triggerEvent(elt, eventName, detail) {
      elt = resolveTarget(elt);
      if (detail == null) {
        detail = {};
      }
      detail.elt = elt;
      const event = makeEvent(eventName, detail);
      if (htmx.logger && !ignoreEventForLogging(eventName)) {
        htmx.logger(elt, eventName, detail);
      }
      if (detail.error) {
        logError(detail.error);
        triggerEvent(elt, "htmx:error", { errorInfo: detail });
      }
      let eventResult = elt.dispatchEvent(event);
      const kebabName = kebabEventName(eventName);
      if (eventResult && kebabName !== eventName) {
        const kebabedEvent = makeEvent(kebabName, event.detail);
        eventResult = eventResult && elt.dispatchEvent(kebabedEvent);
      }
      withExtensions(asElement(elt), function(extension) {
        eventResult = eventResult && (extension.onEvent(eventName, event) !== false && !event.defaultPrevented);
      });
      return eventResult;
    }
    let currentPathForHistory;
    function setCurrentPathForHistory(path) {
      currentPathForHistory = path;
      if (canAccessLocalStorage()) {
        sessionStorage.setItem("htmx-current-path-for-history", path);
      }
    }
    setCurrentPathForHistory(location.pathname + location.search);
    function getHistoryElement() {
      const historyElt = getDocument().querySelector("[hx-history-elt],[data-hx-history-elt]");
      return historyElt || getDocument().body;
    }
    function saveToHistoryCache(url, rootElt) {
      if (!canAccessLocalStorage()) {
        return;
      }
      const innerHTML = cleanInnerHtmlForHistory(rootElt);
      const title = getDocument().title;
      const scroll = window.scrollY;
      if (htmx.config.historyCacheSize <= 0) {
        sessionStorage.removeItem("htmx-history-cache");
        return;
      }
      url = normalizePath(url);
      const historyCache = parseJSON(sessionStorage.getItem("htmx-history-cache")) || [];
      for (let i = 0; i < historyCache.length; i++) {
        if (historyCache[i].url === url) {
          historyCache.splice(i, 1);
          break;
        }
      }
      const newHistoryItem = { url, content: innerHTML, title, scroll };
      triggerEvent(getDocument().body, "htmx:historyItemCreated", { item: newHistoryItem, cache: historyCache });
      historyCache.push(newHistoryItem);
      while (historyCache.length > htmx.config.historyCacheSize) {
        historyCache.shift();
      }
      while (historyCache.length > 0) {
        try {
          sessionStorage.setItem("htmx-history-cache", JSON.stringify(historyCache));
          break;
        } catch (e) {
          triggerErrorEvent(getDocument().body, "htmx:historyCacheError", { cause: e, cache: historyCache });
          historyCache.shift();
        }
      }
    }
    function getCachedHistory(url) {
      if (!canAccessLocalStorage()) {
        return null;
      }
      url = normalizePath(url);
      const historyCache = parseJSON(sessionStorage.getItem("htmx-history-cache")) || [];
      for (let i = 0; i < historyCache.length; i++) {
        if (historyCache[i].url === url) {
          return historyCache[i];
        }
      }
      return null;
    }
    function cleanInnerHtmlForHistory(elt) {
      const className = htmx.config.requestClass;
      const clone = (
        /** @type Element */
        elt.cloneNode(true)
      );
      forEach(findAll(clone, "." + className), function(child) {
        removeClassFromElement(child, className);
      });
      forEach(findAll(clone, "[data-disabled-by-htmx]"), function(child) {
        child.removeAttribute("disabled");
      });
      return clone.innerHTML;
    }
    function saveCurrentPageToHistory() {
      const elt = getHistoryElement();
      let path = currentPathForHistory;
      if (canAccessLocalStorage()) {
        path = sessionStorage.getItem("htmx-current-path-for-history");
      }
      path = path || location.pathname + location.search;
      const disableHistoryCache = getDocument().querySelector('[hx-history="false" i],[data-hx-history="false" i]');
      if (!disableHistoryCache) {
        triggerEvent(getDocument().body, "htmx:beforeHistorySave", { path, historyElt: elt });
        saveToHistoryCache(path, elt);
      }
      if (htmx.config.historyEnabled) history.replaceState({ htmx: true }, getDocument().title, location.href);
    }
    function pushUrlIntoHistory(path) {
      if (htmx.config.getCacheBusterParam) {
        path = path.replace(/org\.htmx\.cache-buster=[^&]*&?/, "");
        if (endsWith(path, "&") || endsWith(path, "?")) {
          path = path.slice(0, -1);
        }
      }
      if (htmx.config.historyEnabled) {
        history.pushState({ htmx: true }, "", path);
      }
      setCurrentPathForHistory(path);
    }
    function replaceUrlInHistory(path) {
      if (htmx.config.historyEnabled) history.replaceState({ htmx: true }, "", path);
      setCurrentPathForHistory(path);
    }
    function settleImmediately(tasks) {
      forEach(tasks, function(task) {
        task.call(void 0);
      });
    }
    function loadHistoryFromServer(path) {
      const request = new XMLHttpRequest();
      const swapSpec = { swapStyle: "innerHTML", swapDelay: 0, settleDelay: 0 };
      const details = { path, xhr: request, historyElt: getHistoryElement(), swapSpec };
      request.open("GET", path, true);
      if (htmx.config.historyRestoreAsHxRequest) {
        request.setRequestHeader("HX-Request", "true");
      }
      request.setRequestHeader("HX-History-Restore-Request", "true");
      request.setRequestHeader("HX-Current-URL", location.href);
      request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
          details.response = this.response;
          triggerEvent(getDocument().body, "htmx:historyCacheMissLoad", details);
          swap(details.historyElt, details.response, swapSpec, {
            contextElement: details.historyElt,
            historyRequest: true
          });
          setCurrentPathForHistory(details.path);
          triggerEvent(getDocument().body, "htmx:historyRestore", { path, cacheMiss: true, serverResponse: details.response });
        } else {
          triggerErrorEvent(getDocument().body, "htmx:historyCacheMissLoadError", details);
        }
      };
      if (triggerEvent(getDocument().body, "htmx:historyCacheMiss", details)) {
        request.send();
      }
    }
    function restoreHistory(path) {
      saveCurrentPageToHistory();
      path = path || location.pathname + location.search;
      const cached = getCachedHistory(path);
      if (cached) {
        const swapSpec = { swapStyle: "innerHTML", swapDelay: 0, settleDelay: 0, scroll: cached.scroll };
        const details = { path, item: cached, historyElt: getHistoryElement(), swapSpec };
        if (triggerEvent(getDocument().body, "htmx:historyCacheHit", details)) {
          swap(details.historyElt, cached.content, swapSpec, {
            contextElement: details.historyElt,
            title: cached.title
          });
          setCurrentPathForHistory(details.path);
          triggerEvent(getDocument().body, "htmx:historyRestore", details);
        }
      } else {
        if (htmx.config.refreshOnHistoryMiss) {
          htmx.location.reload(true);
        } else {
          loadHistoryFromServer(path);
        }
      }
    }
    function addRequestIndicatorClasses(elt) {
      let indicators = (
        /** @type Element[] */
        findAttributeTargets(elt, "hx-indicator")
      );
      if (indicators == null) {
        indicators = [elt];
      }
      forEach(indicators, function(ic) {
        const internalData = getInternalData(ic);
        internalData.requestCount = (internalData.requestCount || 0) + 1;
        ic.classList.add.call(ic.classList, htmx.config.requestClass);
      });
      return indicators;
    }
    function disableElements(elt) {
      let disabledElts = (
        /** @type Element[] */
        findAttributeTargets(elt, "hx-disabled-elt")
      );
      if (disabledElts == null) {
        disabledElts = [];
      }
      forEach(disabledElts, function(disabledElement) {
        const internalData = getInternalData(disabledElement);
        internalData.requestCount = (internalData.requestCount || 0) + 1;
        disabledElement.setAttribute("disabled", "");
        disabledElement.setAttribute("data-disabled-by-htmx", "");
      });
      return disabledElts;
    }
    function removeRequestIndicators(indicators, disabled) {
      forEach(indicators.concat(disabled), function(ele) {
        const internalData = getInternalData(ele);
        internalData.requestCount = (internalData.requestCount || 1) - 1;
      });
      forEach(indicators, function(ic) {
        const internalData = getInternalData(ic);
        if (internalData.requestCount === 0) {
          ic.classList.remove.call(ic.classList, htmx.config.requestClass);
        }
      });
      forEach(disabled, function(disabledElement) {
        const internalData = getInternalData(disabledElement);
        if (internalData.requestCount === 0) {
          disabledElement.removeAttribute("disabled");
          disabledElement.removeAttribute("data-disabled-by-htmx");
        }
      });
    }
    function haveSeenNode(processed, elt) {
      for (let i = 0; i < processed.length; i++) {
        const node = processed[i];
        if (node.isSameNode(elt)) {
          return true;
        }
      }
      return false;
    }
    function shouldInclude(element) {
      const elt = (
        /** @type {HTMLInputElement} */
        element
      );
      if (elt.name === "" || elt.name == null || elt.disabled || closest(elt, "fieldset[disabled]")) {
        return false;
      }
      if (elt.type === "button" || elt.type === "submit" || elt.tagName === "image" || elt.tagName === "reset" || elt.tagName === "file") {
        return false;
      }
      if (elt.type === "checkbox" || elt.type === "radio") {
        return elt.checked;
      }
      return true;
    }
    function addValueToFormData(name, value, formData) {
      if (name != null && value != null) {
        if (Array.isArray(value)) {
          value.forEach(function(v) {
            formData.append(name, v);
          });
        } else {
          formData.append(name, value);
        }
      }
    }
    function removeValueFromFormData(name, value, formData) {
      if (name != null && value != null) {
        let values = formData.getAll(name);
        if (Array.isArray(value)) {
          values = values.filter((v) => value.indexOf(v) < 0);
        } else {
          values = values.filter((v) => v !== value);
        }
        formData.delete(name);
        forEach(values, (v) => formData.append(name, v));
      }
    }
    function getValueFromInput(elt) {
      if (elt instanceof HTMLSelectElement && elt.multiple) {
        return toArray(elt.querySelectorAll("option:checked")).map(function(e) {
          return (
            /** @type HTMLOptionElement */
            e.value
          );
        });
      }
      if (elt instanceof HTMLInputElement && elt.files) {
        return toArray(elt.files);
      }
      return elt.value;
    }
    function processInputValue(processed, formData, errors, elt, validate) {
      if (elt == null || haveSeenNode(processed, elt)) {
        return;
      } else {
        processed.push(elt);
      }
      if (shouldInclude(elt)) {
        const name = getRawAttribute(elt, "name");
        addValueToFormData(name, getValueFromInput(elt), formData);
        if (validate) {
          validateElement(elt, errors);
        }
      }
      if (elt instanceof HTMLFormElement) {
        forEach(elt.elements, function(input) {
          if (processed.indexOf(input) >= 0) {
            removeValueFromFormData(input.name, getValueFromInput(input), formData);
          } else {
            processed.push(input);
          }
          if (validate) {
            validateElement(input, errors);
          }
        });
        new FormData(elt).forEach(function(value, name) {
          if (value instanceof File && value.name === "") {
            return;
          }
          addValueToFormData(name, value, formData);
        });
      }
    }
    function validateElement(elt, errors) {
      const element = (
        /** @type {HTMLElement & ElementInternals} */
        elt
      );
      if (element.willValidate) {
        triggerEvent(element, "htmx:validation:validate");
        if (!element.checkValidity()) {
          if (triggerEvent(element, "htmx:validation:failed", {
            message: element.validationMessage,
            validity: element.validity
          }) && !errors.length && htmx.config.reportValidityOfForms) {
            element.reportValidity();
          }
          errors.push({ elt: element, message: element.validationMessage, validity: element.validity });
        }
      }
    }
    function overrideFormData(receiver, donor) {
      for (const key of donor.keys()) {
        receiver.delete(key);
      }
      donor.forEach(function(value, key) {
        receiver.append(key, value);
      });
      return receiver;
    }
    function getInputValues(elt, verb) {
      const processed = [];
      const formData = new FormData();
      const priorityFormData = new FormData();
      const errors = [];
      const internalData = getInternalData(elt);
      if (internalData.lastButtonClicked && !bodyContains(internalData.lastButtonClicked)) {
        internalData.lastButtonClicked = null;
      }
      let validate = elt instanceof HTMLFormElement && elt.noValidate !== true || getAttributeValue(elt, "hx-validate") === "true";
      if (internalData.lastButtonClicked) {
        validate = validate && internalData.lastButtonClicked.formNoValidate !== true;
      }
      if (verb !== "get") {
        processInputValue(processed, priorityFormData, errors, getRelatedForm(elt), validate);
      }
      processInputValue(processed, formData, errors, elt, validate);
      if (internalData.lastButtonClicked || elt.tagName === "BUTTON" || elt.tagName === "INPUT" && getRawAttribute(elt, "type") === "submit") {
        const button = internalData.lastButtonClicked || /** @type HTMLInputElement|HTMLButtonElement */
        elt;
        const name = getRawAttribute(button, "name");
        addValueToFormData(name, button.value, priorityFormData);
      }
      const includes = findAttributeTargets(elt, "hx-include");
      forEach(includes, function(node) {
        processInputValue(processed, formData, errors, asElement(node), validate);
        if (!matches(node, "form")) {
          forEach(asParentNode(node).querySelectorAll(INPUT_SELECTOR), function(descendant) {
            processInputValue(processed, formData, errors, descendant, validate);
          });
        }
      });
      overrideFormData(formData, priorityFormData);
      return { errors, formData, values: formDataProxy(formData) };
    }
    function appendParam(returnStr, name, realValue) {
      if (returnStr !== "") {
        returnStr += "&";
      }
      if (String(realValue) === "[object Object]") {
        realValue = JSON.stringify(realValue);
      }
      const s = encodeURIComponent(realValue);
      returnStr += encodeURIComponent(name) + "=" + s;
      return returnStr;
    }
    function urlEncode(values) {
      values = formDataFromObject(values);
      let returnStr = "";
      values.forEach(function(value, key) {
        returnStr = appendParam(returnStr, key, value);
      });
      return returnStr;
    }
    function getHeaders(elt, target, prompt2) {
      const headers = {
        "HX-Request": "true",
        "HX-Trigger": getRawAttribute(elt, "id"),
        "HX-Trigger-Name": getRawAttribute(elt, "name"),
        "HX-Target": getAttributeValue(target, "id"),
        "HX-Current-URL": location.href
      };
      getValuesForElement(elt, "hx-headers", false, headers);
      if (prompt2 !== void 0) {
        headers["HX-Prompt"] = prompt2;
      }
      if (getInternalData(elt).boosted) {
        headers["HX-Boosted"] = "true";
      }
      return headers;
    }
    function filterValues(inputValues, elt) {
      const paramsValue = getClosestAttributeValue(elt, "hx-params");
      if (paramsValue) {
        if (paramsValue === "none") {
          return new FormData();
        } else if (paramsValue === "*") {
          return inputValues;
        } else if (paramsValue.indexOf("not ") === 0) {
          forEach(paramsValue.slice(4).split(","), function(name) {
            name = name.trim();
            inputValues.delete(name);
          });
          return inputValues;
        } else {
          const newValues = new FormData();
          forEach(paramsValue.split(","), function(name) {
            name = name.trim();
            if (inputValues.has(name)) {
              inputValues.getAll(name).forEach(function(value) {
                newValues.append(name, value);
              });
            }
          });
          return newValues;
        }
      } else {
        return inputValues;
      }
    }
    function isAnchorLink(elt) {
      return !!getRawAttribute(elt, "href") && getRawAttribute(elt, "href").indexOf("#") >= 0;
    }
    function getSwapSpecification(elt, swapInfoOverride) {
      const swapInfo = swapInfoOverride || getClosestAttributeValue(elt, "hx-swap");
      const swapSpec = {
        swapStyle: getInternalData(elt).boosted ? "innerHTML" : htmx.config.defaultSwapStyle,
        swapDelay: htmx.config.defaultSwapDelay,
        settleDelay: htmx.config.defaultSettleDelay
      };
      if (htmx.config.scrollIntoViewOnBoost && getInternalData(elt).boosted && !isAnchorLink(elt)) {
        swapSpec.show = "top";
      }
      if (swapInfo) {
        const split = splitOnWhitespace(swapInfo);
        if (split.length > 0) {
          for (let i = 0; i < split.length; i++) {
            const value = split[i];
            if (value.indexOf("swap:") === 0) {
              swapSpec.swapDelay = parseInterval(value.slice(5));
            } else if (value.indexOf("settle:") === 0) {
              swapSpec.settleDelay = parseInterval(value.slice(7));
            } else if (value.indexOf("transition:") === 0) {
              swapSpec.transition = value.slice(11) === "true";
            } else if (value.indexOf("ignoreTitle:") === 0) {
              swapSpec.ignoreTitle = value.slice(12) === "true";
            } else if (value.indexOf("scroll:") === 0) {
              const scrollSpec = value.slice(7);
              var splitSpec = scrollSpec.split(":");
              const scrollVal = splitSpec.pop();
              var selectorVal = splitSpec.length > 0 ? splitSpec.join(":") : null;
              swapSpec.scroll = scrollVal;
              swapSpec.scrollTarget = selectorVal;
            } else if (value.indexOf("show:") === 0) {
              const showSpec = value.slice(5);
              var splitSpec = showSpec.split(":");
              const showVal = splitSpec.pop();
              var selectorVal = splitSpec.length > 0 ? splitSpec.join(":") : null;
              swapSpec.show = showVal;
              swapSpec.showTarget = selectorVal;
            } else if (value.indexOf("focus-scroll:") === 0) {
              const focusScrollVal = value.slice("focus-scroll:".length);
              swapSpec.focusScroll = focusScrollVal == "true";
            } else if (i == 0) {
              swapSpec.swapStyle = value;
            } else {
              logError("Unknown modifier in hx-swap: " + value);
            }
          }
        }
      }
      return swapSpec;
    }
    function usesFormData(elt) {
      return getClosestAttributeValue(elt, "hx-encoding") === "multipart/form-data" || matches(elt, "form") && getRawAttribute(elt, "enctype") === "multipart/form-data";
    }
    function encodeParamsForBody(xhr, elt, filteredParameters) {
      let encodedParameters = null;
      withExtensions(elt, function(extension) {
        if (encodedParameters == null) {
          encodedParameters = extension.encodeParameters(xhr, filteredParameters, elt);
        }
      });
      if (encodedParameters != null) {
        return encodedParameters;
      } else {
        if (usesFormData(elt)) {
          return overrideFormData(new FormData(), formDataFromObject(filteredParameters));
        } else {
          return urlEncode(filteredParameters);
        }
      }
    }
    function makeSettleInfo(target) {
      return { tasks: [], elts: [target] };
    }
    function updateScrollState(content, swapSpec) {
      const first = content[0];
      const last = content[content.length - 1];
      if (swapSpec.scroll) {
        var target = null;
        if (swapSpec.scrollTarget) {
          target = asElement(querySelectorExt(first, swapSpec.scrollTarget));
        }
        if (swapSpec.scroll === "top" && (first || target)) {
          target = target || first;
          target.scrollTop = 0;
        }
        if (swapSpec.scroll === "bottom" && (last || target)) {
          target = target || last;
          target.scrollTop = target.scrollHeight;
        }
        if (typeof swapSpec.scroll === "number") {
          getWindow().setTimeout(function() {
            window.scrollTo(
              0,
              /** @type number */
              swapSpec.scroll
            );
          }, 0);
        }
      }
      if (swapSpec.show) {
        var target = null;
        if (swapSpec.showTarget) {
          let targetStr = swapSpec.showTarget;
          if (swapSpec.showTarget === "window") {
            targetStr = "body";
          }
          target = asElement(querySelectorExt(first, targetStr));
        }
        if (swapSpec.show === "top" && (first || target)) {
          target = target || first;
          target.scrollIntoView({ block: "start", behavior: htmx.config.scrollBehavior });
        }
        if (swapSpec.show === "bottom" && (last || target)) {
          target = target || last;
          target.scrollIntoView({ block: "end", behavior: htmx.config.scrollBehavior });
        }
      }
    }
    function getValuesForElement(elt, attr, evalAsDefault, values, event) {
      if (values == null) {
        values = {};
      }
      if (elt == null) {
        return values;
      }
      const attributeValue = getAttributeValue(elt, attr);
      if (attributeValue) {
        let str2 = attributeValue.trim();
        let evaluateValue = evalAsDefault;
        if (str2 === "unset") {
          return null;
        }
        if (str2.indexOf("javascript:") === 0) {
          str2 = str2.slice(11);
          evaluateValue = true;
        } else if (str2.indexOf("js:") === 0) {
          str2 = str2.slice(3);
          evaluateValue = true;
        }
        if (str2.indexOf("{") !== 0) {
          str2 = "{" + str2 + "}";
        }
        let varsValues;
        if (evaluateValue) {
          varsValues = maybeEval(elt, function() {
            if (event) {
              return Function("event", "return (" + str2 + ")").call(elt, event);
            } else {
              return Function("return (" + str2 + ")").call(elt);
            }
          }, {});
        } else {
          varsValues = parseJSON(str2);
        }
        for (const key in varsValues) {
          if (varsValues.hasOwnProperty(key)) {
            if (values[key] == null) {
              values[key] = varsValues[key];
            }
          }
        }
      }
      return getValuesForElement(asElement(parentElt(elt)), attr, evalAsDefault, values, event);
    }
    function maybeEval(elt, toEval, defaultVal) {
      if (htmx.config.allowEval) {
        return toEval();
      } else {
        triggerErrorEvent(elt, "htmx:evalDisallowedError");
        return defaultVal;
      }
    }
    function getHXVarsForElement(elt, event, expressionVars) {
      return getValuesForElement(elt, "hx-vars", true, expressionVars, event);
    }
    function getHXValsForElement(elt, event, expressionVars) {
      return getValuesForElement(elt, "hx-vals", false, expressionVars, event);
    }
    function getExpressionVars(elt, event) {
      return mergeObjects(getHXVarsForElement(elt, event), getHXValsForElement(elt, event));
    }
    function safelySetHeaderValue(xhr, header, headerValue) {
      if (headerValue !== null) {
        try {
          xhr.setRequestHeader(header, headerValue);
        } catch (e) {
          xhr.setRequestHeader(header, encodeURIComponent(headerValue));
          xhr.setRequestHeader(header + "-URI-AutoEncoded", "true");
        }
      }
    }
    function getPathFromResponse(xhr) {
      if (xhr.responseURL) {
        try {
          const url = new URL(xhr.responseURL);
          return url.pathname + url.search;
        } catch (e) {
          triggerErrorEvent(getDocument().body, "htmx:badResponseUrl", { url: xhr.responseURL });
        }
      }
    }
    function hasHeader(xhr, regexp) {
      return regexp.test(xhr.getAllResponseHeaders());
    }
    function ajaxHelper(verb, path, context) {
      verb = /** @type HttpVerb */
      verb.toLowerCase();
      if (context) {
        if (context instanceof Element || typeof context === "string") {
          return issueAjaxRequest(verb, path, null, null, {
            targetOverride: resolveTarget(context) || DUMMY_ELT,
            returnPromise: true
          });
        } else {
          let resolvedTarget = resolveTarget(context.target);
          if (context.target && !resolvedTarget || context.source && !resolvedTarget && !resolveTarget(context.source)) {
            resolvedTarget = DUMMY_ELT;
          }
          return issueAjaxRequest(
            verb,
            path,
            resolveTarget(context.source),
            context.event,
            {
              handler: context.handler,
              headers: context.headers,
              values: context.values,
              targetOverride: resolvedTarget,
              swapOverride: context.swap,
              select: context.select,
              returnPromise: true,
              push: context.push,
              replace: context.replace,
              selectOOB: context.selectOOB
            }
          );
        }
      } else {
        return issueAjaxRequest(verb, path, null, null, {
          returnPromise: true
        });
      }
    }
    function hierarchyForElt(elt) {
      const arr = [];
      while (elt) {
        arr.push(elt);
        elt = elt.parentElement;
      }
      return arr;
    }
    function verifyPath(elt, path, requestConfig) {
      const url = new URL(path, location.protocol !== "about:" ? location.href : window.origin);
      const origin = location.protocol !== "about:" ? location.origin : window.origin;
      const sameHost = origin === url.origin;
      if (htmx.config.selfRequestsOnly) {
        if (!sameHost) {
          return false;
        }
      }
      return triggerEvent(elt, "htmx:validateUrl", mergeObjects({ url, sameHost }, requestConfig));
    }
    function formDataFromObject(obj) {
      if (obj instanceof FormData) return obj;
      const formData = new FormData();
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] && typeof obj[key].forEach === "function") {
            obj[key].forEach(function(v) {
              formData.append(key, v);
            });
          } else if (typeof obj[key] === "object" && !(obj[key] instanceof Blob)) {
            formData.append(key, JSON.stringify(obj[key]));
          } else {
            formData.append(key, obj[key]);
          }
        }
      }
      return formData;
    }
    function formDataArrayProxy(formData, name, array) {
      return new Proxy(array, {
        get: function(target, key) {
          if (typeof key === "number") return target[key];
          if (key === "length") return target.length;
          if (key === "push") {
            return function(value) {
              target.push(value);
              formData.append(name, value);
            };
          }
          if (typeof target[key] === "function") {
            return function() {
              target[key].apply(target, arguments);
              formData.delete(name);
              target.forEach(function(v) {
                formData.append(name, v);
              });
            };
          }
          if (target[key] && target[key].length === 1) {
            return target[key][0];
          } else {
            return target[key];
          }
        },
        set: function(target, index, value) {
          target[index] = value;
          formData.delete(name);
          target.forEach(function(v) {
            formData.append(name, v);
          });
          return true;
        }
      });
    }
    function formDataProxy(formData) {
      return new Proxy(formData, {
        get: function(target, name) {
          if (typeof name === "symbol") {
            const result = Reflect.get(target, name);
            if (typeof result === "function") {
              return function() {
                return result.apply(formData, arguments);
              };
            } else {
              return result;
            }
          }
          if (name === "toJSON") {
            return () => Object.fromEntries(formData);
          }
          if (name in target) {
            if (typeof target[name] === "function") {
              return function() {
                return formData[name].apply(formData, arguments);
              };
            }
          }
          const array = formData.getAll(name);
          if (array.length === 0) {
            return void 0;
          } else if (array.length === 1) {
            return array[0];
          } else {
            return formDataArrayProxy(target, name, array);
          }
        },
        set: function(target, name, value) {
          if (typeof name !== "string") {
            return false;
          }
          target.delete(name);
          if (value && typeof value.forEach === "function") {
            value.forEach(function(v) {
              target.append(name, v);
            });
          } else if (typeof value === "object" && !(value instanceof Blob)) {
            target.append(name, JSON.stringify(value));
          } else {
            target.append(name, value);
          }
          return true;
        },
        deleteProperty: function(target, name) {
          if (typeof name === "string") {
            target.delete(name);
          }
          return true;
        },
        // Support Object.assign call from proxy
        ownKeys: function(target) {
          return Reflect.ownKeys(Object.fromEntries(target));
        },
        getOwnPropertyDescriptor: function(target, prop) {
          return Reflect.getOwnPropertyDescriptor(Object.fromEntries(target), prop);
        }
      });
    }
    function issueAjaxRequest(verb, path, elt, event, etc, confirmed) {
      let resolve = null;
      let reject = null;
      etc = etc != null ? etc : {};
      if (etc.returnPromise && typeof Promise !== "undefined") {
        var promise = new Promise(function(_resolve, _reject) {
          resolve = _resolve;
          reject = _reject;
        });
      }
      if (elt == null) {
        elt = getDocument().body;
      }
      const responseHandler = etc.handler || handleAjaxResponse;
      const select = etc.select || null;
      if (!bodyContains(elt)) {
        maybeCall(resolve);
        return promise;
      }
      const target = etc.targetOverride || asElement(getTarget(elt));
      if (target == null || target == DUMMY_ELT) {
        triggerErrorEvent(elt, "htmx:targetError", { target: getClosestAttributeValue(elt, "hx-target") });
        maybeCall(reject);
        return promise;
      }
      let eltData = getInternalData(elt);
      const submitter = eltData.lastButtonClicked;
      if (submitter) {
        const buttonPath = getRawAttribute(submitter, "formaction");
        if (buttonPath != null) {
          path = buttonPath;
        }
        const buttonVerb = getRawAttribute(submitter, "formmethod");
        if (buttonVerb != null) {
          if (VERBS.includes(buttonVerb.toLowerCase())) {
            verb = /** @type HttpVerb */
            buttonVerb;
          } else {
            maybeCall(resolve);
            return promise;
          }
        }
      }
      const confirmQuestion = getClosestAttributeValue(elt, "hx-confirm");
      if (confirmed === void 0) {
        const issueRequest = function(skipConfirmation) {
          return issueAjaxRequest(verb, path, elt, event, etc, !!skipConfirmation);
        };
        const confirmDetails = { target, elt, path, verb, triggeringEvent: event, etc, issueRequest, question: confirmQuestion };
        if (triggerEvent(elt, "htmx:confirm", confirmDetails) === false) {
          maybeCall(resolve);
          return promise;
        }
      }
      let syncElt = elt;
      let syncStrategy = getClosestAttributeValue(elt, "hx-sync");
      let queueStrategy = null;
      let abortable = false;
      if (syncStrategy) {
        const syncStrings = syncStrategy.split(":");
        const selector = syncStrings[0].trim();
        if (selector === "this") {
          syncElt = findThisElement(elt, "hx-sync");
        } else {
          syncElt = asElement(querySelectorExt(elt, selector));
        }
        syncStrategy = (syncStrings[1] || "drop").trim();
        eltData = getInternalData(syncElt);
        if (syncStrategy === "drop" && eltData.xhr && eltData.abortable !== true) {
          maybeCall(resolve);
          return promise;
        } else if (syncStrategy === "abort") {
          if (eltData.xhr) {
            maybeCall(resolve);
            return promise;
          } else {
            abortable = true;
          }
        } else if (syncStrategy === "replace") {
          triggerEvent(syncElt, "htmx:abort");
        } else if (syncStrategy.indexOf("queue") === 0) {
          const queueStrArray = syncStrategy.split(" ");
          queueStrategy = (queueStrArray[1] || "last").trim();
        }
      }
      if (eltData.xhr) {
        if (eltData.abortable) {
          triggerEvent(syncElt, "htmx:abort");
        } else {
          if (queueStrategy == null) {
            if (event) {
              const eventData = getInternalData(event);
              if (eventData && eventData.triggerSpec && eventData.triggerSpec.queue) {
                queueStrategy = eventData.triggerSpec.queue;
              }
            }
            if (queueStrategy == null) {
              queueStrategy = "last";
            }
          }
          if (eltData.queuedRequests == null) {
            eltData.queuedRequests = [];
          }
          if (queueStrategy === "first" && eltData.queuedRequests.length === 0) {
            eltData.queuedRequests.push(function() {
              issueAjaxRequest(verb, path, elt, event, etc);
            });
          } else if (queueStrategy === "all") {
            eltData.queuedRequests.push(function() {
              issueAjaxRequest(verb, path, elt, event, etc);
            });
          } else if (queueStrategy === "last") {
            eltData.queuedRequests = [];
            eltData.queuedRequests.push(function() {
              issueAjaxRequest(verb, path, elt, event, etc);
            });
          }
          maybeCall(resolve);
          return promise;
        }
      }
      const xhr = new XMLHttpRequest();
      eltData.xhr = xhr;
      eltData.abortable = abortable;
      const endRequestLock = function() {
        eltData.xhr = null;
        eltData.abortable = false;
        if (eltData.queuedRequests != null && eltData.queuedRequests.length > 0) {
          const queuedRequest = eltData.queuedRequests.shift();
          queuedRequest();
        }
      };
      const promptQuestion = getClosestAttributeValue(elt, "hx-prompt");
      if (promptQuestion) {
        var promptResponse = prompt(promptQuestion);
        if (promptResponse === null || !triggerEvent(elt, "htmx:prompt", { prompt: promptResponse, target })) {
          maybeCall(resolve);
          endRequestLock();
          return promise;
        }
      }
      if (confirmQuestion && !confirmed) {
        if (!confirm(confirmQuestion)) {
          maybeCall(resolve);
          endRequestLock();
          return promise;
        }
      }
      let headers = getHeaders(elt, target, promptResponse);
      if (verb !== "get" && !usesFormData(elt)) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
      if (etc.headers) {
        headers = mergeObjects(headers, etc.headers);
      }
      const results = getInputValues(elt, verb);
      let errors = results.errors;
      const rawFormData = results.formData;
      if (etc.values) {
        overrideFormData(rawFormData, formDataFromObject(etc.values));
      }
      const expressionVars = formDataFromObject(getExpressionVars(elt, event));
      const allFormData = overrideFormData(rawFormData, expressionVars);
      let filteredFormData = filterValues(allFormData, elt);
      if (htmx.config.getCacheBusterParam && verb === "get") {
        filteredFormData.set("org.htmx.cache-buster", getRawAttribute(target, "id") || "true");
      }
      if (path == null || path === "") {
        path = location.href;
      }
      const requestAttrValues = getValuesForElement(elt, "hx-request");
      const eltIsBoosted = getInternalData(elt).boosted;
      let useUrlParams = htmx.config.methodsThatUseUrlParams.indexOf(verb) >= 0;
      const requestConfig = {
        boosted: eltIsBoosted,
        useUrlParams,
        formData: filteredFormData,
        parameters: formDataProxy(filteredFormData),
        unfilteredFormData: allFormData,
        unfilteredParameters: formDataProxy(allFormData),
        headers,
        elt,
        target,
        verb,
        errors,
        withCredentials: etc.credentials || requestAttrValues.credentials || htmx.config.withCredentials,
        timeout: etc.timeout || requestAttrValues.timeout || htmx.config.timeout,
        path,
        triggeringEvent: event
      };
      if (!triggerEvent(elt, "htmx:configRequest", requestConfig)) {
        maybeCall(resolve);
        endRequestLock();
        return promise;
      }
      path = requestConfig.path;
      verb = requestConfig.verb;
      headers = requestConfig.headers;
      filteredFormData = formDataFromObject(requestConfig.parameters);
      errors = requestConfig.errors;
      useUrlParams = requestConfig.useUrlParams;
      if (errors && errors.length > 0) {
        triggerEvent(elt, "htmx:validation:halted", requestConfig);
        maybeCall(resolve);
        endRequestLock();
        return promise;
      }
      const splitPath = path.split("#");
      const pathNoAnchor = splitPath[0];
      const anchor = splitPath[1];
      let finalPath = path;
      if (useUrlParams) {
        finalPath = pathNoAnchor;
        const hasValues = !filteredFormData.keys().next().done;
        if (hasValues) {
          if (finalPath.indexOf("?") < 0) {
            finalPath += "?";
          } else {
            finalPath += "&";
          }
          finalPath += urlEncode(filteredFormData);
          if (anchor) {
            finalPath += "#" + anchor;
          }
        }
      }
      if (!verifyPath(elt, finalPath, requestConfig)) {
        triggerErrorEvent(elt, "htmx:invalidPath", requestConfig);
        maybeCall(reject);
        endRequestLock();
        return promise;
      }
      xhr.open(verb.toUpperCase(), finalPath, true);
      xhr.overrideMimeType("text/html");
      xhr.withCredentials = requestConfig.withCredentials;
      xhr.timeout = requestConfig.timeout;
      if (requestAttrValues.noHeaders) ;
      else {
        for (const header in headers) {
          if (headers.hasOwnProperty(header)) {
            const headerValue = headers[header];
            safelySetHeaderValue(xhr, header, headerValue);
          }
        }
      }
      const responseInfo = {
        xhr,
        target,
        requestConfig,
        etc,
        boosted: eltIsBoosted,
        select,
        pathInfo: {
          requestPath: path,
          finalRequestPath: finalPath,
          responsePath: null,
          anchor
        }
      };
      xhr.onload = function() {
        try {
          const hierarchy = hierarchyForElt(elt);
          responseInfo.pathInfo.responsePath = getPathFromResponse(xhr);
          responseHandler(elt, responseInfo);
          if (responseInfo.keepIndicators !== true) {
            removeRequestIndicators(indicators, disableElts);
          }
          triggerEvent(elt, "htmx:afterRequest", responseInfo);
          triggerEvent(elt, "htmx:afterOnLoad", responseInfo);
          if (!bodyContains(elt)) {
            let secondaryTriggerElt = null;
            while (hierarchy.length > 0 && secondaryTriggerElt == null) {
              const parentEltInHierarchy = hierarchy.shift();
              if (bodyContains(parentEltInHierarchy)) {
                secondaryTriggerElt = parentEltInHierarchy;
              }
            }
            if (secondaryTriggerElt) {
              triggerEvent(secondaryTriggerElt, "htmx:afterRequest", responseInfo);
              triggerEvent(secondaryTriggerElt, "htmx:afterOnLoad", responseInfo);
            }
          }
          maybeCall(resolve);
        } catch (e) {
          triggerErrorEvent(elt, "htmx:onLoadError", mergeObjects({ error: e }, responseInfo));
          throw e;
        } finally {
          endRequestLock();
        }
      };
      xhr.onerror = function() {
        removeRequestIndicators(indicators, disableElts);
        triggerErrorEvent(elt, "htmx:afterRequest", responseInfo);
        triggerErrorEvent(elt, "htmx:sendError", responseInfo);
        maybeCall(reject);
        endRequestLock();
      };
      xhr.onabort = function() {
        removeRequestIndicators(indicators, disableElts);
        triggerErrorEvent(elt, "htmx:afterRequest", responseInfo);
        triggerErrorEvent(elt, "htmx:sendAbort", responseInfo);
        maybeCall(reject);
        endRequestLock();
      };
      xhr.ontimeout = function() {
        removeRequestIndicators(indicators, disableElts);
        triggerErrorEvent(elt, "htmx:afterRequest", responseInfo);
        triggerErrorEvent(elt, "htmx:timeout", responseInfo);
        maybeCall(reject);
        endRequestLock();
      };
      if (!triggerEvent(elt, "htmx:beforeRequest", responseInfo)) {
        maybeCall(resolve);
        endRequestLock();
        return promise;
      }
      var indicators = addRequestIndicatorClasses(elt);
      var disableElts = disableElements(elt);
      forEach(["loadstart", "loadend", "progress", "abort"], function(eventName) {
        forEach([xhr, xhr.upload], function(target2) {
          target2.addEventListener(eventName, function(event2) {
            triggerEvent(elt, "htmx:xhr:" + eventName, {
              lengthComputable: event2.lengthComputable,
              loaded: event2.loaded,
              total: event2.total
            });
          });
        });
      });
      triggerEvent(elt, "htmx:beforeSend", responseInfo);
      const params = useUrlParams ? null : encodeParamsForBody(xhr, elt, filteredFormData);
      xhr.send(params);
      return promise;
    }
    function determineHistoryUpdates(elt, responseInfo) {
      const xhr = responseInfo.xhr;
      let pathFromHeaders = null;
      let typeFromHeaders = null;
      if (hasHeader(xhr, /HX-Push:/i)) {
        pathFromHeaders = xhr.getResponseHeader("HX-Push");
        typeFromHeaders = "push";
      } else if (hasHeader(xhr, /HX-Push-Url:/i)) {
        pathFromHeaders = xhr.getResponseHeader("HX-Push-Url");
        typeFromHeaders = "push";
      } else if (hasHeader(xhr, /HX-Replace-Url:/i)) {
        pathFromHeaders = xhr.getResponseHeader("HX-Replace-Url");
        typeFromHeaders = "replace";
      }
      if (pathFromHeaders) {
        if (pathFromHeaders === "false") {
          return {};
        } else {
          return {
            type: typeFromHeaders,
            path: pathFromHeaders
          };
        }
      }
      const requestPath = responseInfo.pathInfo.finalRequestPath;
      const responsePath = responseInfo.pathInfo.responsePath;
      const pushUrl = responseInfo.etc.push || getClosestAttributeValue(elt, "hx-push-url");
      const replaceUrl = responseInfo.etc.replace || getClosestAttributeValue(elt, "hx-replace-url");
      const elementIsBoosted = getInternalData(elt).boosted;
      let saveType = null;
      let path = null;
      if (pushUrl) {
        saveType = "push";
        path = pushUrl;
      } else if (replaceUrl) {
        saveType = "replace";
        path = replaceUrl;
      } else if (elementIsBoosted) {
        saveType = "push";
        path = responsePath || requestPath;
      }
      if (path) {
        if (path === "false") {
          return {};
        }
        if (path === "true") {
          path = responsePath || requestPath;
        }
        if (responseInfo.pathInfo.anchor && path.indexOf("#") === -1) {
          path = path + "#" + responseInfo.pathInfo.anchor;
        }
        return {
          type: saveType,
          path
        };
      } else {
        return {};
      }
    }
    function codeMatches(responseHandlingConfig, status) {
      var regExp = new RegExp(responseHandlingConfig.code);
      return regExp.test(status.toString(10));
    }
    function resolveResponseHandling(xhr) {
      for (var i = 0; i < htmx.config.responseHandling.length; i++) {
        var responseHandlingElement = htmx.config.responseHandling[i];
        if (codeMatches(responseHandlingElement, xhr.status)) {
          return responseHandlingElement;
        }
      }
      return {
        swap: false
      };
    }
    function handleTitle(title) {
      if (title) {
        const titleElt = find("title");
        if (titleElt) {
          titleElt.textContent = title;
        } else {
          window.document.title = title;
        }
      }
    }
    function resolveRetarget(elt, target) {
      if (target === "this") {
        return elt;
      }
      const resolvedTarget = asElement(querySelectorExt(elt, target));
      if (resolvedTarget == null) {
        triggerErrorEvent(elt, "htmx:targetError", { target });
        throw new Error(`Invalid re-target ${target}`);
      }
      return resolvedTarget;
    }
    function handleAjaxResponse(elt, responseInfo) {
      const xhr = responseInfo.xhr;
      let target = responseInfo.target;
      const etc = responseInfo.etc;
      const responseInfoSelect = responseInfo.select;
      if (!triggerEvent(elt, "htmx:beforeOnLoad", responseInfo)) return;
      if (hasHeader(xhr, /HX-Trigger:/i)) {
        handleTriggerHeader(xhr, "HX-Trigger", elt);
      }
      if (hasHeader(xhr, /HX-Location:/i)) {
        let redirectPath = xhr.getResponseHeader("HX-Location");
        var redirectSwapSpec = {};
        if (redirectPath.indexOf("{") === 0) {
          redirectSwapSpec = parseJSON(redirectPath);
          redirectPath = redirectSwapSpec.path;
          delete redirectSwapSpec.path;
        }
        redirectSwapSpec.push = redirectSwapSpec.push || "true";
        ajaxHelper("get", redirectPath, redirectSwapSpec);
        return;
      }
      const shouldRefresh = hasHeader(xhr, /HX-Refresh:/i) && xhr.getResponseHeader("HX-Refresh") === "true";
      if (hasHeader(xhr, /HX-Redirect:/i)) {
        responseInfo.keepIndicators = true;
        htmx.location.href = xhr.getResponseHeader("HX-Redirect");
        shouldRefresh && htmx.location.reload();
        return;
      }
      if (shouldRefresh) {
        responseInfo.keepIndicators = true;
        htmx.location.reload();
        return;
      }
      const historyUpdate = determineHistoryUpdates(elt, responseInfo);
      const responseHandling = resolveResponseHandling(xhr);
      const shouldSwap = responseHandling.swap;
      let isError = !!responseHandling.error;
      let ignoreTitle = htmx.config.ignoreTitle || responseHandling.ignoreTitle;
      let selectOverride = responseHandling.select;
      if (responseHandling.target) {
        responseInfo.target = resolveRetarget(elt, responseHandling.target);
      }
      var swapOverride = etc.swapOverride;
      if (swapOverride == null && responseHandling.swapOverride) {
        swapOverride = responseHandling.swapOverride;
      }
      if (hasHeader(xhr, /HX-Retarget:/i)) {
        responseInfo.target = resolveRetarget(elt, xhr.getResponseHeader("HX-Retarget"));
      }
      if (hasHeader(xhr, /HX-Reswap:/i)) {
        swapOverride = xhr.getResponseHeader("HX-Reswap");
      }
      var serverResponse = xhr.response;
      var beforeSwapDetails = mergeObjects({
        shouldSwap,
        serverResponse,
        isError,
        ignoreTitle,
        selectOverride,
        swapOverride
      }, responseInfo);
      if (responseHandling.event && !triggerEvent(target, responseHandling.event, beforeSwapDetails)) return;
      if (!triggerEvent(target, "htmx:beforeSwap", beforeSwapDetails)) return;
      target = beforeSwapDetails.target;
      serverResponse = beforeSwapDetails.serverResponse;
      isError = beforeSwapDetails.isError;
      ignoreTitle = beforeSwapDetails.ignoreTitle;
      selectOverride = beforeSwapDetails.selectOverride;
      swapOverride = beforeSwapDetails.swapOverride;
      responseInfo.target = target;
      responseInfo.failed = isError;
      responseInfo.successful = !isError;
      if (beforeSwapDetails.shouldSwap) {
        if (xhr.status === 286) {
          cancelPolling(elt);
        }
        withExtensions(elt, function(extension) {
          serverResponse = extension.transformResponse(serverResponse, xhr, elt);
        });
        if (historyUpdate.type) {
          saveCurrentPageToHistory();
        }
        var swapSpec = getSwapSpecification(elt, swapOverride);
        if (!swapSpec.hasOwnProperty("ignoreTitle")) {
          swapSpec.ignoreTitle = ignoreTitle;
        }
        target.classList.add(htmx.config.swappingClass);
        if (responseInfoSelect) {
          selectOverride = responseInfoSelect;
        }
        if (hasHeader(xhr, /HX-Reselect:/i)) {
          selectOverride = xhr.getResponseHeader("HX-Reselect");
        }
        const selectOOB = etc.selectOOB || getClosestAttributeValue(elt, "hx-select-oob");
        const select = getClosestAttributeValue(elt, "hx-select");
        swap(target, serverResponse, swapSpec, {
          select: selectOverride === "unset" ? null : selectOverride || select,
          selectOOB,
          eventInfo: responseInfo,
          anchor: responseInfo.pathInfo.anchor,
          contextElement: elt,
          afterSwapCallback: function() {
            if (hasHeader(xhr, /HX-Trigger-After-Swap:/i)) {
              let finalElt = elt;
              if (!bodyContains(elt)) {
                finalElt = getDocument().body;
              }
              handleTriggerHeader(xhr, "HX-Trigger-After-Swap", finalElt);
            }
          },
          afterSettleCallback: function() {
            if (hasHeader(xhr, /HX-Trigger-After-Settle:/i)) {
              let finalElt = elt;
              if (!bodyContains(elt)) {
                finalElt = getDocument().body;
              }
              handleTriggerHeader(xhr, "HX-Trigger-After-Settle", finalElt);
            }
          },
          beforeSwapCallback: function() {
            if (historyUpdate.type) {
              triggerEvent(getDocument().body, "htmx:beforeHistoryUpdate", mergeObjects({ history: historyUpdate }, responseInfo));
              if (historyUpdate.type === "push") {
                pushUrlIntoHistory(historyUpdate.path);
                triggerEvent(getDocument().body, "htmx:pushedIntoHistory", { path: historyUpdate.path });
              } else {
                replaceUrlInHistory(historyUpdate.path);
                triggerEvent(getDocument().body, "htmx:replacedInHistory", { path: historyUpdate.path });
              }
            }
          }
        });
      }
      if (isError) {
        triggerErrorEvent(elt, "htmx:responseError", mergeObjects({ error: "Response Status Error Code " + xhr.status + " from " + responseInfo.pathInfo.requestPath }, responseInfo));
      }
    }
    const extensions = {};
    function extensionBase() {
      return {
        init: function(api) {
          return null;
        },
        getSelectors: function() {
          return null;
        },
        onEvent: function(name, evt) {
          return true;
        },
        transformResponse: function(text, xhr, elt) {
          return text;
        },
        isInlineSwap: function(swapStyle) {
          return false;
        },
        handleSwap: function(swapStyle, target, fragment, settleInfo) {
          return false;
        },
        encodeParameters: function(xhr, parameters, elt) {
          return null;
        }
      };
    }
    function defineExtension(name, extension) {
      if (extension.init) {
        extension.init(internalAPI);
      }
      extensions[name] = mergeObjects(extensionBase(), extension);
    }
    function removeExtension(name) {
      delete extensions[name];
    }
    function getExtensions(elt, extensionsToReturn, extensionsToIgnore) {
      if (extensionsToReturn == void 0) {
        extensionsToReturn = [];
      }
      if (elt == void 0) {
        return extensionsToReturn;
      }
      if (extensionsToIgnore == void 0) {
        extensionsToIgnore = [];
      }
      const extensionsForElement = getAttributeValue(elt, "hx-ext");
      if (extensionsForElement) {
        forEach(extensionsForElement.split(","), function(extensionName) {
          extensionName = extensionName.replace(/ /g, "");
          if (extensionName.slice(0, 7) == "ignore:") {
            extensionsToIgnore.push(extensionName.slice(7));
            return;
          }
          if (extensionsToIgnore.indexOf(extensionName) < 0) {
            const extension = extensions[extensionName];
            if (extension && extensionsToReturn.indexOf(extension) < 0) {
              extensionsToReturn.push(extension);
            }
          }
        });
      }
      return getExtensions(asElement(parentElt(elt)), extensionsToReturn, extensionsToIgnore);
    }
    var isReady = false;
    getDocument().addEventListener("DOMContentLoaded", function() {
      isReady = true;
    });
    function ready(fn) {
      if (isReady || getDocument().readyState === "complete") {
        fn();
      } else {
        getDocument().addEventListener("DOMContentLoaded", fn);
      }
    }
    function insertIndicatorStyles() {
      if (htmx.config.includeIndicatorStyles !== false) {
        const nonceAttribute = htmx.config.inlineStyleNonce ? ` nonce="${htmx.config.inlineStyleNonce}"` : "";
        const indicator = htmx.config.indicatorClass;
        const request = htmx.config.requestClass;
        getDocument().head.insertAdjacentHTML(
          "beforeend",
          `<style${nonceAttribute}>.${indicator}{opacity:0;visibility: hidden} .${request} .${indicator}, .${request}.${indicator}{opacity:1;visibility: visible;transition: opacity 200ms ease-in}</style>`
        );
      }
    }
    function getMetaConfig() {
      const element = getDocument().querySelector('meta[name="htmx-config"]');
      if (element) {
        return parseJSON(element.content);
      } else {
        return null;
      }
    }
    function mergeMetaConfig() {
      const metaConfig = getMetaConfig();
      if (metaConfig) {
        htmx.config = mergeObjects(htmx.config, metaConfig);
      }
    }
    ready(function() {
      mergeMetaConfig();
      insertIndicatorStyles();
      let body = getDocument().body;
      processNode(body);
      const restoredElts = getDocument().querySelectorAll(
        "[hx-trigger='restored'],[data-hx-trigger='restored']"
      );
      body.addEventListener("htmx:abort", function(evt) {
        const target = (
          /** @type {CustomEvent} */
          evt.detail.elt || evt.target
        );
        const internalData = getInternalData(target);
        if (internalData && internalData.xhr) {
          internalData.xhr.abort();
        }
      });
      const originalPopstate = window.onpopstate ? window.onpopstate.bind(window) : null;
      window.onpopstate = function(event) {
        if (event.state && event.state.htmx) {
          restoreHistory();
          forEach(restoredElts, function(elt) {
            triggerEvent(elt, "htmx:restored", {
              document: getDocument(),
              triggerEvent
            });
          });
        } else {
          if (originalPopstate) {
            originalPopstate(event);
          }
        }
      };
      getWindow().setTimeout(function() {
        triggerEvent(body, "htmx:load", {});
        body = null;
      }, 0);
    });
    return htmx;
  })();
  window.bny = {
    /**
     * 查询子元素
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cssSelector CSS选择器
     * @returns {HTMLElement|null} 子元素
     */
    queryChild: function(elt, cssSelector) {
      return elt?.querySelector(":scope>" + cssSelector) ?? null;
    },
    /**
     * 查询所有子元素
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cssSelector CSS选择器
     * @returns {NodeList} 子元素数组
     */
    queryChildAll: function(elt, cssSelector) {
      return elt.querySelectorAll(":scope>" + cssSelector);
    },
    /**
     * 获取元素在数组中的索引
     * 
     * @param {HTMLElement} elt 元素
     * @returns {Number|null} 索引
     */
    indexOf: function(elt) {
      if (!elt.parentElement) return null;
      return Array.from(elt.parentElement.children).indexOf(elt);
    },
    /**
     * 动画播放器
     * 
     * @param {HTMLElement} elt 元素 
     * @param {String} anim 动画名称 
     * @param {Boolean} status 状态 默认 true, true 开始 false 结束
     * @param {Function} fn 动画结束回调函数 默认空函数
     */
    animPlayer: function(elt, anim, status = true, fn = () => {
    }) {
      if (!["scale", "left", "right", "down", "up"].includes(anim)) {
        anim = "scale";
      }
      if (status) {
        elt.classList.add(`bny-anim-${anim}`);
        elt.classList.remove(`bny-anim-${anim}Out`);
      } else {
        elt.classList.remove(`bny-anim-${anim}`);
        elt.classList.add(`bny-anim-${anim}Out`);
      }
      const handleAnimationEnd = () => {
        fn();
        elt.removeEventListener("animationend", handleAnimationEnd);
      };
      elt.addEventListener("animationend", handleAnimationEnd);
    },
    /**
     * 转义HTML特殊字符
     * 
     * @param {String} str 输入字符串
     * @returns {String} 转义后的字符串
     */
    escapeChars: function(str2) {
      if (typeof str2 !== "string") {
        str2 = String(str2);
      }
      const escapeMap = {
        "&": "&amp;",
        // 和号
        "<": "&lt;",
        // 小于号
        ">": "&gt;",
        // 大于号
        '"': "&quot;",
        // 双引号
        "'": "&#39;",
        // 单引号
        "/": "&#x2F;",
        // 斜杠
        "`": "&#x60;",
        // 反引号
        "=": "&#x3D;"
        // 等号（预防XSS常用）
      };
      const escapeRegex = new RegExp(Object.keys(escapeMap).join("|"), "g");
      return str2.replace(escapeRegex, (match) => escapeMap[match]);
    },
    /**
     * 检查元素是否有指定的htmx扩展名
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} ext 扩展名
     * @returns {Boolean} 是否有扩展名
     */
    hasExtName: function(elt, ext) {
      const attrs = elt.getAttribute("hx-ext");
      if (!attrs) return false;
      const exts = attrs.trim().split(/\s+/);
      return exts.includes(ext);
    },
    /**
     * 解析属性字符串
     * 
     * @param {object} obj 属性对象
     * @returns {String} 属性字符串
     */
    parAttrStr: function(obj) {
      let str2 = "";
      for (const key in obj) {
        str2 += ` ${key}="${obj[key]}" `;
      }
      return str2;
    },
    /**
     * 移除元素的类名
     * 
     * @param {Object|Array|HTMLElement} elt 元素或元素数组或者元素对象
     * @param {String} cls 类名
     */
    removeClass: function(elt, cls) {
      if (!elt) console.error("removeClass: 元素不存在");
      if (typeof elt === "object") {
        Object.keys(elt).forEach((key) => {
          elt[key].classList.remove(cls);
        });
      }
      if (Array.isArray(elt) || elt instanceof NodeList) {
        Array.from(elt).forEach((e) => e.classList.remove(cls));
        return;
      }
      if (elt.classList) {
        elt.classList.remove(cls);
      }
    },
    /**
     * 检查元素是否有指定的类名
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cls 类名
     * @returns {Boolean} 是否有类名
     */
    hasClass: function(elt, cls) {
      return elt.classList?.contains(cls) || false;
    },
    /**
     * 获取/创建 alert 共享容器（单例，多个 alert 在容器内垂直堆叠，避免重叠在屏幕中心）
     *
     * @returns {HTMLElement} 容器元素
     */
    alertContainer: function() {
      let box = document.getElementById("bny-alert-box");
      if (!box) {
        box = document.createElement("div");
        box.id = "bny-alert-box";
        box.className = "bny-alert-box";
        document.body.appendChild(box);
      }
      return box;
    },
    /**
     * 显示警示弹窗
     * 
     * @param {String} msg 消息
     * @param {Number} code 状态码 默认0
     * @param {String} anim 动画 默认scale
     * @param {Number} time 时间 默认3秒
     */
    alert: function(msg, code = 0, anim = "scale", time = 3) {
      function type(code2) {
        switch (code2) {
          case 1:
            return "green";
          case 2:
            return "yellow";
          case 3:
            return "red";
          case 4:
            return "blue";
          default:
            return "";
        }
      }
      const color = type(code);
      const alert = document.createElement("div");
      alert.classList.add("bny-alert", `bny-anim-${anim}`);
      alert.setAttribute("color", color);
      alert.style.width = "auto";
      alert.innerHTML = bny.escapeChars(msg);
      const closeBtn = document.createElement("i");
      closeBtn.className = "bny-icon icon-close bny-alert-close";
      closeBtn.setAttribute("title", "关闭");
      alert.appendChild(closeBtn);
      this.alertContainer().appendChild(alert);
      let timer = null;
      const removeAlert = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (!alert.parentElement) return;
        this.animPlayer(alert, anim, false, () => {
          alert.remove();
          const box = document.getElementById("bny-alert-box");
          if (box && box.children.length === 0) box.remove();
        });
      };
      closeBtn.addEventListener("click", removeAlert);
      timer = setTimeout(removeAlert, time * 1e3);
    },
    /**
     * 显示确认弹窗
     * 
     * @param {String} msg 消息
     * @param {Object} options 选项
     * @param {String} options.title 标题 默认 提示
     * @param {String} options.anim 动画 默认 scale
     * @param {Function} options.yes_cb 确认回调 默认空函数
     * @param {Function} options.no_cb 取消回调 默认空函数
     */
    confirm: function(msg = "确认操作吗？", options = {
      title: "提示",
      anim: "scale",
      yes_cb: () => {
      },
      no_cb: () => {
      }
    }) {
      const title = options.title ?? "提示";
      const anim = options.anim ?? "scale";
      const yes_cb = options.yes_cb ?? (() => {
      });
      const no_cb = options.no_cb ?? (() => {
      });
      const confirm_shield = document.createElement("div");
      confirm_shield.classList.add("bny-confirm-shield");
      const confirm2 = document.createElement("div");
      confirm2.classList.add("bny-confirm", `bny-anim-${anim}`);
      const confirm_title = document.createElement("h3");
      confirm_title.classList.add("title");
      confirm_title.innerHTML = bny.escapeChars(title);
      const confirm_content = document.createElement("p");
      confirm_content.classList.add("content");
      confirm_content.innerHTML = bny.escapeChars(msg);
      const confirm_btn = document.createElement("div");
      confirm_btn.classList.add("btn");
      const confirm_yes = document.createElement("button");
      confirm_yes.classList.add("bny-btn");
      confirm_yes.setAttribute("color", "blue");
      confirm_yes.innerHTML = "确认";
      const confirm_no = document.createElement("button");
      confirm_no.classList.add("bny-btn");
      confirm_no.innerHTML = "取消";
      let closed = false;
      const close = (cb) => {
        if (closed) return;
        closed = true;
        document.removeEventListener("keydown", onKeydown);
        this.animPlayer(confirm2, anim, false, () => {
          confirm_shield.remove();
          if (typeof cb === "function") cb();
        });
      };
      confirm_shield.addEventListener("click", (e) => {
        if (e.target === confirm_shield) {
          close(no_cb);
        }
      });
      confirm_yes.addEventListener("click", (e) => {
        close(yes_cb);
      });
      confirm_no.addEventListener("click", (e) => {
        close(no_cb);
      });
      const onKeydown = (e) => {
        const top = document.querySelector(".bny-confirm-shield:last-of-type");
        if (top !== confirm_shield) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close(no_cb);
        } else if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          close(yes_cb);
        }
      };
      document.addEventListener("keydown", onKeydown);
      requestAnimationFrame(() => confirm_yes.focus());
      confirm_btn.appendChild(confirm_yes);
      confirm_btn.appendChild(confirm_no);
      confirm2.appendChild(confirm_title);
      confirm2.appendChild(confirm_content);
      confirm2.appendChild(confirm_btn);
      confirm_shield.appendChild(confirm2);
      document.body.appendChild(confirm_shield);
    },
    /**
     * 显示页面弹窗
     * 
     * @param {String} content 页面内容
     * @param {Object} options 选项
     * @param {String} options.title 标题 默认 页面
     * @param {String} options.anim 动画 默认 scale
     * @param {String} options.width 宽度 默认 680px
     * @param {String} options.height 高度 默认 520px
     * @param {String|Array} options.offset 偏移量 默认 auto , 格式为 ['auto', 'auto'] 或 ['100px', '100px'] 或者 'top' 、'bottom' 、'left' 、'right'
     * @param {Boolean} options.shade 是否显示遮罩层 默认 false
     * @returns {HTMLElement} 页面元素
     */
    page: function(content, options = {}) {
      function isSafeUrl(str2) {
        if (typeof str2 !== "string") return false;
        const s = str2.trim().replace(/^[\u0000-\u001F\u007F]+/, "");
        return /^https?:\/\//i.test(s);
      }
      function drag(page2, onUnmount) {
        const header2 = page2.querySelector(".header");
        let startX, startY, newX, newY;
        const onMove = (e) => {
          if (!page2.classList.contains("dragging")) return;
          Object.assign(page2.style, {
            left: `${newX + e.clientX - startX}px`,
            top: `${newY + e.clientY - startY}px`
          });
        };
        const onUp = () => page2.classList.remove("dragging");
        header2.addEventListener("mousedown", (e) => {
          if (e.button !== 0) return;
          if (e.target.closest(".setwin")) return;
          [startX, startY] = [e.clientX, e.clientY];
          [newX, newY] = [parseInt(page2.style.left), parseInt(page2.style.top)];
          page2.classList.add("dragging");
        });
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        onUnmount(() => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        });
      }
      function resize(page2, width2, height2, currentX2, currentY2) {
        const zoomBtn = page2.querySelector(".zoom");
        zoomBtn.addEventListener("click", (e) => {
          if (zoomBtn.classList.contains("icon-fullscreen")) {
            Object.assign(page2.style, { width: "100%", height: "100%", top: "0", left: "0" });
            zoomBtn.classList.remove("icon-fullscreen");
            zoomBtn.classList.add("icon-fullscreen-exit");
          } else {
            Object.assign(page2.style, { width: width2, height: height2, top: `${currentY2}px`, left: `${currentX2}px` });
            zoomBtn.classList.remove("icon-fullscreen-exit");
            zoomBtn.classList.add("icon-fullscreen");
          }
          e.stopPropagation();
        });
      }
      function minimize(page2, num2, width2, height2, currentX2, currentY2) {
        const minBtn = page2.querySelector(".min-auto");
        const pageShade = page2.parentElement;
        minBtn.addEventListener("click", (e) => {
          if (minBtn.classList.contains("icon-minus")) {
            Object.assign(page2.style, { width: "125px", height: "min-content", bottom: "5px", left: `${5 + num2 * 125}px`, top: "unset" });
            page2.querySelector(".content").style.display = "none";
            page2.querySelector(".zoom").style.display = "none";
            minBtn.classList.remove("icon-minus");
            minBtn.classList.add("icon-file-copy");
            if (pageShade.classList.contains("bny-page-shade")) {
              pageShade.style.width = 0;
              pageShade.style.height = 0;
            }
          } else {
            Object.assign(page2.style, { width: width2, height: height2, top: `${currentY2}px`, left: `${currentX2}px`, bottom: "unset" });
            page2.querySelector(".content").style.display = "block";
            page2.querySelector(".zoom").style.display = "inline-block";
            page2.querySelector(".zoom").classList.replace("icon-fullscreen-exit", "icon-fullscreen");
            minBtn.classList.remove("icon-file-copy");
            minBtn.classList.add("icon-minus");
            if (pageShade.classList.contains("bny-page-shade")) {
              pageShade.style.width = "100%";
              pageShade.style.height = "100%";
            }
          }
          e.stopPropagation();
        });
      }
      function zIndex(page2) {
        page2.style.zIndex = ++bny._pageZIndexCounter;
        page2.addEventListener("click", () => {
          page2.style.zIndex = ++bny._pageZIndexCounter;
        });
      }
      function close(page2, shade2, anim2, animPlayer, unloads2) {
        const closeBtn = page2.querySelector(".close-btn");
        if (shade2) {
          const shade3 = document.createElement("div");
          shade3.className = "bny-page-shade";
          shade3.appendChild(page2);
          shade3.addEventListener("click", (e) => {
            if (e.target === shade3) {
              animPlayer(page2, anim2, false, () => {
                unloads2.forEach((fn) => {
                  try {
                    fn();
                  } catch (_) {
                  }
                });
                shade3.remove();
              });
              e.stopPropagation();
            }
          });
          document.body.appendChild(shade3);
        } else {
          document.body.appendChild(page2);
        }
        closeBtn.addEventListener("click", (e) => {
          if (shade2) {
            animPlayer(page2, anim2, false, () => {
              unloads2.forEach((fn) => {
                try {
                  fn();
                } catch (_) {
                }
              });
              page2.parentNode.remove();
            });
          } else {
            animPlayer(page2, anim2, false, () => {
              unloads2.forEach((fn) => {
                try {
                  fn();
                } catch (_) {
                }
              });
              page2.remove();
            });
          }
        });
      }
      const title = options.title ?? "页面";
      const anim = options.anim ?? "scale";
      let width = options.width ?? "680px";
      let height = options.height ?? "520px";
      const offset = options.offset ?? "auto";
      const shade = options.shade ?? false;
      if (typeof content === "string" && isSafeUrl(content)) {
        content = `<iframe src="${content}"></iframe>`;
      }
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      if (width === "100%") width = windowWidth + "px";
      if (height === "100%") height = windowHeight + "px";
      const num = document.querySelectorAll(".bny-page").length;
      const currentX = parseInt(width) >= windowWidth ? 0 : (windowWidth - parseInt(width)) / 2 + num * 10;
      const currentY = parseInt(height) >= windowHeight ? 0 : (windowHeight - parseInt(height)) / 2 + num * 10;
      const page = document.createElement("div");
      page.className = `bny-page bny-anim-${anim}`;
      switch (offset) {
        case "auto":
          Object.assign(page.style, {
            width,
            height,
            left: `${currentX}px`,
            top: `${currentY}px`
          });
          break;
        case "top":
          Object.assign(page.style, {
            width,
            height,
            // 窗口的水平中间位置
            left: `${currentX}px`,
            top: "0"
          });
          break;
        case "bottom":
          Object.assign(page.style, {
            width,
            height,
            // 窗口的水平中间位置
            left: `${currentX}px`,
            top: `${windowHeight - parseInt(height)}px`
          });
          break;
        case "left":
          Object.assign(page.style, {
            width,
            height,
            left: "0",
            top: `${currentY}px`
          });
          break;
        case "right":
          Object.assign(page.style, {
            width,
            height,
            right: `0px`,
            top: `${currentY}px`
          });
          break;
        default:
          Object.assign(page.style, {
            width,
            height,
            left: `${offset[0]}`,
            top: `${offset[1]}`
          });
      }
      page.innerHTML = `
        <div class="header">
            <div class="title">${bny.escapeChars(title === false ? "" : title)}</div>
                <div class="setwin">
                    <span class="bny-icon icon-minus min-auto"></span>
                    <span class="bny-icon icon-fullscreen zoom"></span>
                    <span class="bny-icon icon-close close-btn"></span>
                </div>
            </div>
        </div>
        <div class="content ${title === false ? "not-title" : ""}">${content}</div>`;
      const header = page.querySelector(".header");
      if (title === false) header.style.display = "none";
      const unloads = [];
      close(page, shade, anim, this.animPlayer, unloads);
      drag(page, (fn) => unloads.push(fn));
      resize(page, width, height, currentX, currentY);
      minimize(page, num - 1, width, height, currentX, currentY);
      zIndex(page);
      return page;
    },
    /**
     * bny.page 的 z-index 计数器（模块级单例，避免每次点击遍历所有 .bny-page）
     * 起始值 999，每次创建/聚焦 page 自增
     * @type {Number}
     */
    _pageZIndexCounter: 999,
    /**
     * 加载页面
     * @param {number} style 加载样式 0:旋转 1:线性 2:球型
     * @param {object} options 加载选项
     * @param {string} options.color 加载颜色
     * @param {string} options.size 加载大小
     * @returns {HTMLElement} load 加载元素
     */
    load: function(style = 0, options = {}) {
      const color = options.color ?? "";
      const size = options.size ?? "";
      const load = document.createElement("div");
      load.className = `bny-load-shade`;
      switch (style) {
        case 1:
          load.innerHTML = `<div class="bny-load" color="${color}" size="${size}"></div>`;
          break;
        case 2:
          load.innerHTML = `
                <div class="bny-load-ball" color="${color}" size="${size}">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>`;
          break;
        default:
          load.innerHTML = `<div class="bny-load-rot"></div>`;
      }
      document.body.appendChild(load);
      return load;
    }
  };
  htmx.defineExtension("bny-menu", {
    // 事件
    onEvent: function(name, evt) {
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-menu")) {
          initFocusable(evt.target);
          evt.target.addEventListener("click", function(e) {
            const item = e.target.closest(".item");
            let subMenu = item.querySelector(".sub-menu");
            if (item && subMenu) {
              item.classList.toggle("show");
            }
          });
          evt.target.addEventListener("keydown", onMenuKeydown);
          return false;
        }
      }
      return true;
    },
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      function getMenu(arr) {
        let html = "";
        arr.forEach((v) => {
          const attrStr = bny.parAttrStr(v.attr);
          html += `<div class="item" ${attrStr}>`;
          html += `<div class="trigger" bny-id="${bny.escapeChars(String(v.id))}">`;
          html += `<span>${bny.escapeChars(v.name)}</span>`;
          if (v.child) {
            html += `<i class="bny-icon icon-right"></i>`;
          }
          html += `</div>`;
          if (v.child) {
            html += `<div class="sub-menu">`;
            html += getMenu(v.child);
            html += `</div>`;
          }
          html += `</div>`;
        });
        return html;
      }
      function getHtml(data) {
        const obj = JSON.parse(data);
        return getMenu(obj.data);
      }
      if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const body = getHtml(xhr.responseText);
        return body;
      }
      return text;
    }
  });
  function initFocusable(root) {
    root.querySelectorAll(".item").forEach(function(item) {
      if (item.querySelector(":scope > .trigger")) {
        item.setAttribute("tabindex", "0");
      }
    });
  }
  function getMenuOrientation(item) {
    const parent = item.parentElement;
    if (parent && parent.classList.contains("sub-menu")) {
      return "vertical";
    }
    const menuRoot = item.closest('[hx-ext~="bny-menu"]');
    if (menuRoot) {
      if (menuRoot.getAttribute("mode") === "vertical" || menuRoot.classList.contains("vertical")) {
        return "vertical";
      }
    }
    return "horizontal";
  }
  function getSiblings(item) {
    const parent = item.parentElement;
    if (!parent) return [];
    return Array.from(parent.querySelectorAll(":scope > .item")).filter(function(it) {
      return it.querySelector(":scope > .trigger");
    });
  }
  function onMenuKeydown(e) {
    const item = e.target.closest(".item");
    if (!item) return;
    const orientation = getMenuOrientation(item);
    const sub = item.querySelector(":scope > .sub-menu");
    switch (e.key) {
      case "ArrowRight": {
        e.preventDefault();
        e.stopPropagation();
        if (orientation === "vertical" && sub) {
          if (!item.classList.contains("show")) item.classList.add("show");
          const first = sub.querySelector(":scope > .item[tabindex]");
          if (first) first.focus();
        } else {
          focusSibling(item, 1);
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        e.stopPropagation();
        if (orientation === "vertical") {
          const parentSub = item.parentElement;
          if (parentSub && parentSub.classList.contains("sub-menu")) {
            const parentItem = parentSub.parentElement;
            if (parentItem && parentItem.classList.contains("item")) {
              parentItem.classList.remove("show");
              parentItem.focus();
            }
          }
        } else {
          focusSibling(item, -1);
        }
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        e.stopPropagation();
        if (orientation === "horizontal" && sub) {
          if (!item.classList.contains("show")) item.classList.add("show");
          const first = sub.querySelector(":scope > .item[tabindex]");
          if (first) first.focus();
        } else {
          focusSibling(item, 1);
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        e.stopPropagation();
        if (orientation === "horizontal") {
          if (item.classList.contains("show")) {
            item.classList.remove("show");
          }
        } else {
          focusSibling(item, -1);
        }
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        e.stopPropagation();
        item.click();
        break;
      }
      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        if (item.classList.contains("show")) {
          item.classList.remove("show");
          item.focus();
        } else {
          const parentSub = item.parentElement;
          if (parentSub && parentSub.classList.contains("sub-menu")) {
            const parentItem = parentSub.parentElement;
            if (parentItem && parentItem.classList.contains("item")) {
              parentItem.classList.remove("show");
              parentItem.focus();
            }
          }
        }
        break;
      }
    }
  }
  function focusSibling(item, dir) {
    const siblings = getSiblings(item);
    const idx = siblings.indexOf(item);
    if (idx === -1) return;
    const next = siblings[idx + dir];
    if (next) next.focus();
  }
  htmx.defineExtension("bny-collapse", {
    // 事件
    onEvent: function(name, evt) {
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-collapse")) {
          evt.target.addEventListener("click", function(e) {
            const title = e.target.closest(".title");
            if (title) {
              const item = title.parentElement;
              const accordion = e.target.parentElement.parentElement.getAttribute("mode") === "accordion";
              if (accordion) {
                const isShow = item.classList.contains("show");
                bny.removeClass(item.parentElement.querySelectorAll(".item"), "show");
                if (!isShow) {
                  item.classList.add("show");
                }
              } else {
                item.classList.toggle("show");
              }
            }
          });
        }
      }
      return true;
    },
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      function getCollapse(arr) {
        let html = "";
        arr.forEach((item) => {
          html += `
                    <div class="item" bny-id="${item.id}">
                        <div class="title" ${bny.parAttrStr(item.attr)}>
                            ${item.title}
                        </div>
                        <div class="content">${item.content}</div>
                    </div>
                `;
        });
        return html;
      }
      if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const json = JSON.parse(xhr.responseText);
        return getCollapse(json.data);
      }
      return text;
    }
  });
  htmx.defineExtension("bny-alert", {
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const data = JSON.parse(xhr.responseText);
        bny.alert(data.msg, data.code || 0, data.anim || "scale", data.time || 3);
        return elt.innerHTML;
      }
    }
  });
  function closeDropdown(target) {
    var isShow = target.classList.contains("show");
    var isUp = target.classList.contains("up");
    if (isShow || isUp) {
      target.classList.remove("show", "up");
    }
    target.style.visibility = "hidden";
    target.style.opacity = 0;
  }
  var _dropdownDelegated = false;
  function ensureDropdownDelegation() {
    if (_dropdownDelegated) return;
    _dropdownDelegated = true;
    document.addEventListener("click", function(e) {
      var openList = document.querySelectorAll(".bny-dropdown.show");
      for (var i = 0; i < openList.length; i++) {
        var dropdown = openList[i];
        if (dropdown.contains(e.target)) continue;
        var trigger = dropdown._bnyDropdownTrigger;
        if (trigger && trigger.contains(e.target)) continue;
        closeDropdown(dropdown);
      }
    });
  }
  htmx.defineExtension("bny-dropdown", {
    // 事件
    onEvent: function(name, evt) {
      function open(parent, target) {
        clean(target);
        target.style.visibility = "hidden";
        target.style.opacity = 0;
        target.classList.add("show");
        position(parent, target);
        target.style.visibility = "visible";
        target.style.opacity = 1;
      }
      function close(target) {
        closeDropdown(target);
      }
      function clean(target) {
        target.style.top = "";
        target.style.left = "";
        target.style.right = "";
        target.style.bottom = "";
      }
      function toggle(parent, target) {
        var isShow = target.classList.contains("show");
        var isUp = target.classList.contains("up");
        if (isShow || isUp) {
          close(target);
        } else {
          open(parent, target);
        }
      }
      function position(parent, target) {
        var parentRect = parent.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var gap = 8;
        target.classList.remove("up");
        var top, bottom;
        var spaceBelow = viewportHeight - parentRect.bottom;
        var spaceAbove = parentRect.top;
        var needHeight = targetRect.height + gap;
        if (spaceBelow >= needHeight || spaceBelow >= spaceAbove) {
          top = parentRect.bottom + gap;
          bottom = "auto";
        } else {
          top = "auto";
          bottom = viewportHeight - parentRect.top + gap;
          target.classList.add("up");
        }
        var left = parentRect.left;
        var right = "auto";
        if (left + targetRect.width > viewportWidth - gap) {
          left = "auto";
          right = viewportWidth - parentRect.right;
        }
        if (left !== "auto" && left < gap) {
          left = gap;
        }
        if (right !== "auto" && right < gap) {
          right = gap;
        }
        target.style.top = top === "auto" ? "auto" : top + "px";
        target.style.bottom = bottom === "auto" ? "auto" : bottom + "px";
        target.style.left = left === "auto" ? "auto" : left + "px";
        target.style.right = right === "auto" ? "auto" : right + "px";
      }
      function add(target) {
        var dropdown2 = bny.queryChild(target, ".bny-dropdown");
        if (!dropdown2) {
          dropdown2 = document.createElement("div");
          dropdown2.classList.add("bny-dropdown");
          target.appendChild(dropdown2);
        }
        return dropdown2;
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-dropdown")) {
          var dropdown = add(evt.target);
          dropdown._bnyDropdownTrigger = evt.target;
          evt.target.addEventListener("click", function(e) {
            if (e.target.closest(".bny-dropdown")) {
              return;
            }
            e.stopPropagation();
            toggle(evt.target, dropdown);
          });
          ensureDropdownDelegation();
          return false;
        }
        return true;
      }
      if (name === "htmx:beforeSwap") {
        if (bny.hasExtName(evt.target, "bny-dropdown")) {
          var dd = bny.queryChild(evt.target, ".bny-dropdown");
          if (!dd || !bny.hasClass(dd, "show") || dd.innerHTML.trim() === "") {
            htmx.swap(
              dd,
              evt.detail.xhr.responseText,
              { swapStyle: "innerHTML" }
            );
            open(evt.target, dd);
          }
          return false;
        }
      }
      if (name === "htmx:beforeOnNodeDisposal") {
        if (evt.target && evt.target._bnyDropdownTrigger !== void 0) {
          delete evt.target._bnyDropdownTrigger;
        }
      }
      return true;
    }
  });
  htmx.defineExtension("bny-confirm", {
    onEvent: function(name, evt) {
      if (name === "htmx:confirm") {
        if (bny.hasExtName(evt.target, "bny-confirm")) {
          const msg = evt.target.getAttribute("hx-confirm");
          const title = evt.target.getAttribute("title") || "提示";
          const anim = evt.target.getAttribute("anim") || "scale";
          bny.confirm(msg, {
            title,
            anim,
            yes_cb: () => {
              evt.detail.issueRequest(true);
            }
          });
          return false;
        }
      }
      return true;
    },
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const obj = JSON.parse(xhr.responseText);
        bny.alert(
          obj.msg,
          obj.code || 0,
          obj.anim || "scale",
          obj.time || 3
        );
        return elt.innerHTML;
      }
      return text;
    }
  });
  htmx.defineExtension("bny-page", {
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const json = JSON.parse(xhr.responseText);
        let data = {};
        if (json.data.title) data.title = json.data.title;
        if (json.data.anim) data.anim = json.data.anim;
        if (json.data.width) data.width = json.data.width;
        if (json.data.height) data.height = json.data.height;
        if (json.data.offset) data.offset = json.data.offset;
        if (json.data.shade) data.shade = json.data.shade;
        const page = bny.page(json.data.content, data);
        htmx.process(page);
      } else {
        if (bny.hasExtName(elt, "bny-page")) {
          let data = {};
          const title = elt.getAttribute("title");
          if (title) {
            if (title === "false") {
              data.title = false;
            } else {
              data.title = title;
            }
          }
          data.shade = elt.getAttribute("shade") !== null ? true : false;
          if (elt.hasAttribute("anim")) data.anim = elt.getAttribute("anim");
          if (elt.hasAttribute("width")) data.width = elt.getAttribute("width");
          if (elt.hasAttribute("height")) data.height = elt.getAttribute("height");
          if (elt.hasAttribute("offset")) data.offset = elt.getAttribute("offset");
          const page = bny.page(text, data);
          htmx.process(page);
        }
      }
      return elt.innerHTML;
    }
  });
  htmx.defineExtension("bny-code", {
    // 事件
    onEvent: function(name, evt) {
      function getCode(target, str2) {
        const mode = target.getAttribute("mode");
        const lang = target.getAttribute("lang");
        switch (mode) {
          case "highlight":
            str2 = hljs.highlight(str2, { language: lang }).value;
            break;
          case "prismjs":
            str2 = Prism.highlight(str2, Prism.languages[lang], lang);
            break;
        }
        return str2;
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-code")) {
          const content = evt.target.innerHTML;
          evt.target.innerHTML = "";
          const code = document.createElement("code");
          code.innerHTML = getCode(evt.target, content.trim());
          evt.target.appendChild(code);
          const copyBtn = document.createElement("a");
          copyBtn.setAttribute("title", "copy code");
          copyBtn.classList.add("copy-btn");
          copyBtn.innerHTML = '<i class="bny-icon icon-file-copy"></i>';
          evt.target.appendChild(copyBtn);
          copyBtn.addEventListener("click", (e) => {
            navigator.clipboard.writeText(code.textContent);
            bny.alert("copy success");
          });
        }
      }
      if (name === "htmx:beforeSwap") {
        if (bny.hasExtName(evt.target, "bny-code")) {
          const code = evt.target.querySelector("code");
          let content = evt.detail.xhr.responseText;
          if (evt.detail.xhr.getResponseHeader("Content-Type").includes("application/json")) {
            const json = JSON.parse(content);
            content = json.data;
          }
          const mode = evt.target.getAttribute("mode");
          if (!mode) {
            content = bny.escapeChars(content);
          }
          htmx.swap(code, getCode(evt.target, content), { swapStyle: "innerHTML" });
        }
        return false;
      }
      return true;
    }
  });
  htmx.defineExtension("bny-table", {
    // 事件
    onEvent: function(name, evt) {
      function sortVal(td) {
        return td.getAttribute("data-sort-val") || td.textContent.trim();
      }
      function sortRows(tbody, colIndex, type, asc) {
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const dir = asc ? 1 : -1;
        rows.sort(function(a, b) {
          const tdA = a.querySelectorAll("td")[colIndex];
          const tdB = b.querySelectorAll("td")[colIndex];
          if (!tdA || !tdB) return 0;
          if (type === "number") {
            const va2 = parseFloat(sortVal(tdA)) || 0;
            const vb2 = parseFloat(sortVal(tdB)) || 0;
            return (va2 - vb2) * dir;
          }
          const va = sortVal(tdA);
          const vb = sortVal(tdB);
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
          return 0;
        });
        rows.forEach(function(row) {
          tbody.appendChild(row);
        });
      }
      function initSort(table) {
        let ths = table.querySelectorAll("thead th[data-sort]");
        if (!ths.length) {
          ths = table.querySelectorAll("thead th[sortable]");
        }
        if (!ths.length) return;
        const tableKey = table.getAttribute("data-table-key") || "";
        const storeKey = tableKey ? "bny-table-sort:" + tableKey : "";
        function persistSort(colIndex, type, asc) {
          if (!storeKey) return;
          try {
            sessionStorage.setItem(storeKey, JSON.stringify({
              colIndex,
              type,
              asc
            }));
          } catch (_) {
          }
        }
        function readSort() {
          if (!storeKey) return null;
          try {
            var raw = sessionStorage.getItem(storeKey);
            if (!raw) return null;
            return JSON.parse(raw);
          } catch (_) {
            return null;
          }
        }
        ths.forEach(function(th) {
          const colIndex = Array.from(th.parentElement.querySelectorAll("th")).indexOf(th);
          th.style.cursor = "pointer";
          th.setAttribute("title", "点击排序");
          th.classList.add("sortable");
          th.addEventListener("click", function() {
            const isAsc = th.classList.contains("sort-asc");
            ths.forEach(function(t) {
              t.classList.remove("sort-asc", "sort-desc");
            });
            if (isAsc) {
              th.classList.add("sort-desc");
            } else {
              th.classList.add("sort-asc");
            }
            const type = th.getAttribute("data-sort") || "string";
            const asc = th.classList.contains("sort-asc");
            const tbody = table.querySelector("tbody");
            if (tbody) {
              sortRows(tbody, colIndex, type, asc);
            }
            persistSort(colIndex, type, asc);
          });
        });
        const saved = readSort();
        if (saved) {
          const targetTh = ths[saved.colIndex];
          if (targetTh) {
            targetTh.classList.add(saved.asc ? "sort-asc" : "sort-desc");
            const tbody = table.querySelector("tbody");
            if (tbody) {
              sortRows(tbody, saved.colIndex, saved.type, saved.asc);
            }
          }
        }
      }
      function initLabels(table) {
        const titles = [];
        const ths = table.querySelectorAll("th");
        for (let i = 0; i < ths.length; i++) {
          titles.push(ths[i].textContent);
        }
        const tbodyTrs = table.querySelectorAll("tbody tr");
        for (let j = 0; j < tbodyTrs.length; j++) {
          const tds = tbodyTrs[j].querySelectorAll("td");
          for (let k = 0; k < tds.length; k++) {
            tds[k].setAttribute("label", titles[tds[k].cellIndex] || "");
          }
        }
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-table")) {
          initLabels(evt.target);
          initSort(evt.target);
          return false;
        } else if (evt.target.tagName === "TR") {
          const tds = evt.target.querySelectorAll("td");
          for (let i = 0; i < tds.length; i++) {
            const label = evt.target.parentElement.parentElement.querySelector("th:nth-child(" + (tds[i].cellIndex + 1) + ")");
            tds[i].setAttribute("label", label ? label.textContent : "");
          }
        }
      }
      return true;
    },
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      function renderCell(cell) {
        if (cell !== null && typeof cell === "object" && typeof cell.__html !== "undefined") {
          return String(cell.__html);
        }
        return bny.escapeChars(String(cell));
      }
      function renderCol(col) {
        if (col !== null && typeof col === "object") {
          var name = bny.escapeChars(String(col.name ?? ""));
          var attrs = "";
          if (col.sortable) attrs += " sortable";
          if (col.sort) attrs += ' data-sort="' + bny.escapeChars(String(col.sort)) + '"';
          return "<th" + attrs + ">" + name + "</th>";
        }
        return "<th>" + bny.escapeChars(String(col)) + "</th>";
      }
      function buildTable(data) {
        const cols = data.cols || [];
        const rows = data.rows || [];
        const color = data.color || "";
        const emptyText = data.empty || "暂无数据";
        const tableKey = data.key || color || "";
        let h = "";
        h += '<table hx-ext="bny-table"' + (color ? ' color="' + color + '"' : "");
        if (tableKey) h += ' data-table-key="' + bny.escapeChars(tableKey) + '"';
        h += ">";
        h += "<thead><tr>";
        cols.forEach(function(col) {
          h += renderCol(col);
        });
        h += "</tr></thead>";
        h += "<tbody>";
        if (rows.length === 0) {
          h += '<tr class="bny-table-empty"><td colspan="' + cols.length + '">' + bny.escapeChars(emptyText) + "</td></tr>";
        } else {
          rows.forEach(function(row) {
            h += "<tr>";
            if (Array.isArray(row)) {
              row.forEach(function(cell) {
                h += "<td>" + renderCell(cell) + "</td>";
              });
            } else if (row && typeof row === "object" && row.__html) {
              h += row.__html;
            } else {
              h += "<td>" + renderCell(row) + "</td>";
            }
            h += "</tr>";
          });
        }
        h += "</tbody></table>";
        return h;
      }
      if (xhr.getResponseHeader("Content-Type") && xhr.getResponseHeader("Content-Type").includes("application/json")) {
        const json = JSON.parse(xhr.responseText);
        const data = json.data || json;
        return buildTable(data);
      }
      return text;
    }
  });
  htmx.defineExtension("bny-tab", {
    onEvent: function(name, evt) {
      function addMoveBtn(target) {
        const head = bny.queryChild(target, ".head");
        head.classList.add("scrollbar");
        head.style.cssText = "padding: 0px 64px 0 32px;";
        const leftBtn = document.createElement("div");
        leftBtn.className = "btn-left";
        leftBtn.innerHTML = `<i class="bny-icon icon-doubleleft"></i>`;
        target.appendChild(leftBtn);
        const rightBtn = document.createElement("div");
        rightBtn.className = "btn-right";
        rightBtn.innerHTML = `<i class="bny-icon icon-doubleright"></i>`;
        target.appendChild(rightBtn);
        const moreBtn = document.createElement("div");
        moreBtn.className = "btn-more";
        moreBtn.setAttribute("hx-ext", "bny-dropdown");
        moreBtn.innerHTML = `<i class="bny-icon icon-down"></i>
            <div class="bny-dropdown">
                <div hx-ext="bny-menu" mode="vertical">
                    <div class="item">
                        <div class="trigger btn-close-this">
                            <span>关闭当前</span>
                        </div>
                    </div>
                    <div class="item">
                        <div class="trigger btn-close-other">
                            <span>关闭其他</span>
                        </div>
                    </div>
                    <div class="item">
                        <div class="trigger btn-close-all">
                            <span>关闭全部</span>
                        </div>
                    </div>
                </div>
            </div>`;
        target.appendChild(moreBtn);
        htmx.process(moreBtn);
      }
      function addCloseBtn(target) {
        const closeBtn = document.createElement("i");
        closeBtn.className = "bny-icon icon-close";
        target.appendChild(closeBtn);
      }
      function onTrigger(target, trigger) {
        function switchTab(li) {
          if (li) {
            let lis = li.parentElement.children;
            let bodys = li.parentElement.parentElement.querySelector(".body").children;
            let index = bny.indexOf(li);
            bny.removeClass(lis, "this");
            bny.removeClass(bodys, "show");
            htmx.addClass(lis[index], "this");
            htmx.addClass(bodys[index], "show");
          }
        }
        target.addEventListener(trigger, function(e) {
          const li = e.target.closest(".head>li");
          switchTab(li);
          const more = e.target.closest(".btn-more");
          if (li !== null || more !== null) {
            e.stopPropagation();
          }
        });
      }
      function onClicks(target) {
        target.addEventListener("click", (e) => {
          const closeBtn = e.target.closest("li>i.icon-close");
          if (closeBtn) {
            const index = bny.indexOf(closeBtn.parentElement);
            if (index === null) return;
            const li = bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")");
            const body = bny.queryChild(target, ".body>div:nth-child(" + (index + 1) + ")");
            li.remove();
            body.remove();
            if (li.classList.contains("this")) {
              const nextLi = bny.queryChild(target, ".head>li");
              if (!nextLi) return;
              const nextIndex = bny.indexOf(nextLi);
              const nextBody = bny.queryChild(target, ".body>div:nth-child(" + (nextIndex + 1) + ")");
              htmx.addClass(nextLi, "this");
              htmx.addClass(nextBody, "show");
            }
            e.stopPropagation();
          }
          const leftBtn = e.target.closest("div.btn-left");
          if (leftBtn) {
            const head = bny.queryChild(target, ".head");
            head.scrollBy({ left: -100, behavior: "smooth" });
          }
          const rightBtn = e.target.closest("div.btn-right");
          if (rightBtn) {
            const head = bny.queryChild(target, ".head");
            head.scrollBy({ left: 100, behavior: "smooth" });
          }
          const closeThisBtn = e.target.closest("div.btn-close-this");
          if (closeThisBtn) {
            const thisLi = bny.queryChild(target, ".head>li.this");
            if (thisLi) {
              const thisLiClose = bny.queryChild(thisLi, "i.icon-close");
              if (thisLiClose) {
                thisLiClose.click();
              }
            }
          }
          const closeOtherBtn = e.target.closest("div.btn-close-other");
          if (closeOtherBtn) {
            const lis = bny.queryChildAll(target, ".head>li");
            const thisLi = bny.queryChild(target, ".head>li.this");
            for (let i = 0; i < lis.length; i++) {
              if (lis[i] !== thisLi) {
                const closeBtn2 = bny.queryChild(lis[i], "i.icon-close");
                if (closeBtn2) {
                  closeBtn2.click();
                }
              }
            }
          }
          const closeAllBtn = e.target.closest("div.btn-close-all");
          if (closeAllBtn) {
            const lis = bny.queryChildAll(target, ".head>li");
            for (let i = 0; i < lis.length; i++) {
              const closeBtn2 = bny.queryChild(lis[i], "i.icon-close");
              if (closeBtn2) {
                closeBtn2.click();
              }
            }
          }
        });
      }
      function tabInit(target) {
        const heads = bny.queryChildAll(target, ".head>li");
        const bodys = bny.queryChildAll(target, ".body>div");
        const trigger = target.getAttribute("hx-trigger") ?? "click";
        const mode = target.getAttribute("mode") ?? "normal";
        const index = Number(target.getAttribute("index") ?? 0);
        const addBody = heads.length - bodys.length;
        for (let i = 0; i < addBody; i++) {
          const body = document.createElement("div");
          bny.queryChild(target, ".body").appendChild(body);
          htmx.process(body);
        }
        for (let i = 0; i < heads.length; i++) {
          heads[i].setAttribute("hx-trigger", trigger);
          if (heads[i].getAttribute("closable") !== null && !heads[i].querySelector(":scope>i.icon-close")) {
            addCloseBtn(heads[i]);
          }
          htmx.process(heads[i]);
        }
        if (mode === "scroll") {
          addMoveBtn(target);
        }
        onTrigger(target, trigger);
        onClicks(target);
        if (bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")")) {
          htmx.trigger(bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")"), trigger);
        }
      }
      function isRepetition(target, head) {
        const lis = bny.queryChildAll(head, "li");
        const hxAttrs = ["hx-get", "hx-post", "hx-put", "hx-patch", "hx-delete"];
        for (const attr of hxAttrs) {
          const targetUrl = target.getAttribute(attr);
          if (targetUrl && targetUrl !== "") {
            for (const li of lis) {
              if (li !== target && li.getAttribute(attr) === targetUrl) {
                return li;
              }
            }
          }
        }
        return null;
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-tab")) {
          tabInit(evt.target);
          return false;
        }
        if (evt.target.tagName === "LI") {
          if (evt.target.parentElement.classList.contains("head")) {
            const tab = evt.target.parentElement.parentElement;
            const head = bny.queryChild(tab, ".head");
            const thisLs = isRepetition(evt.target, head);
            if (thisLs != null) {
              if (thisLs.getAttribute("hx-trigger") === "click") {
                thisLs.click();
              }
              evt.target.remove();
              return false;
            }
            const trigger = tab.getAttribute("hx-trigger") ?? "click";
            evt.target.setAttribute("hx-trigger", trigger);
            if (evt.target.getAttribute("closable") !== null && !bny.queryChild(evt.target, "i.icon-close")) {
              addCloseBtn(evt.target);
            }
            const body = document.createElement("div");
            const index = bny.indexOf(evt.target);
            if (!bny.queryChild(tab, ".body>div:nth-child(" + (index + 1) + ")")) {
              bny.queryChild(tab, ".body").appendChild(body);
              htmx.process(body);
            }
            htmx.process(evt.target);
            if (trigger === "click" && evt.target.getAttribute("this") !== null) {
              evt.target.click();
              head.scrollBy({ left: head.scrollWidth, behavior: "smooth" });
            }
            return false;
          }
        }
      }
      if (name === "htmx:beforeSwap") {
        if (evt.target.tagName === "LI") {
          if (evt.target.parentElement.classList.contains("head")) {
            const liSwap = function(evt2) {
              const tab = evt2.target.parentElement.parentElement;
              const html = evt2.detail.xhr.responseText;
              const index = bny.indexOf(evt2.target);
              htmx.swap(
                bny.queryChild(tab, ".body>div:nth-child(" + (index + 1) + ")"),
                html,
                {
                  swapStyle: "innerHTML"
                }
              );
            };
            liSwap(evt);
            return false;
          }
        }
      }
      return true;
    },
    // 响应转换
    transformResponse: function(text, xhr, elt) {
      return text;
    }
  });
  htmx.defineExtension("bny-nav", {
    onEvent: function(name, evt) {
      function onToggle(btn, nav) {
        btn.addEventListener("click", (e) => {
          const collapsed = nav.hasAttribute("collapsed") ?? false;
          if (collapsed) {
            nav.removeAttribute("collapsed");
          } else {
            nav.setAttribute("collapsed", "");
          }
          const isShow = nav.querySelectorAll("li.show");
          if (isShow.length > 0) {
            bny.removeClass(isShow, "show");
          }
        });
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-nav")) {
          const side = evt.target.hasAttribute("side") ?? false;
          const toggle = evt.target.hasAttribute("toggle") ?? false;
          if (side && toggle || !side) {
            const head = bny.queryChild(evt.target, ".head");
            const toggleBtn = document.createElement("div");
            toggleBtn.classList.add("toggle-btn");
            toggleBtn.innerHTML = '<i class="bny-icon icon-doubleleft"></i>';
            head.appendChild(toggleBtn);
            onToggle(toggleBtn, evt.target);
          }
          evt.target.addEventListener("click", (e) => {
            const item = e.target.closest("li");
            const subMenu = item?.querySelector(".sub-menu") ?? false;
            const trigger = bny.queryChild(item, ".trigger");
            if (item) {
              if (subMenu) {
                const collapsed = evt.target.hasAttribute("collapsed") ?? false;
                if (!side || collapsed) {
                  const parent = item.parentElement;
                  if (parent.classList.contains("menu")) {
                    const arr = evt.target.querySelectorAll(".show");
                    for (const i of arr) {
                      if (i !== item) {
                        i.classList.remove("show");
                      }
                    }
                  }
                }
                item.classList.toggle("show");
              } else {
                bny.removeClass(
                  evt.target.querySelectorAll(".active"),
                  "active"
                );
                trigger.classList.add("active");
              }
            }
          });
          return false;
        }
      }
    }
  });
  htmx.defineExtension("bny-anchor", {
    // 事件
    onEvent: function(name, evt) {
      function moveSilder(target, link) {
        const slider = bny.queryChild(target, ".slider");
        if (slider) {
          slider.style.top = link.offsetTop + "px";
        }
        link.classList.add("active");
      }
      if (name === "htmx:afterProcessNode") {
        if (bny.hasExtName(evt.target, "bny-anchor")) {
          const rail = evt.target.getAttribute("rail") !== null ? true : false;
          if (rail) {
            const slider = document.createElement("div");
            slider.classList.add("slider");
            evt.target.appendChild(slider);
          }
          evt.target.addEventListener("click", function(e) {
            const link = e.target.closest(".link");
            if (link) {
              bny.removeClass(evt.target.querySelectorAll(".link"), "active");
              const anchor = link.getAttribute("anchor");
              const section = htmx.find(anchor);
              if (section) {
                section.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }
              moveSilder(evt.target, link);
            }
          });
          evt.target.addEventListener("mouseover", function(e) {
            const link = e.target.closest(".link");
            if (link) {
              bny.removeClass(evt.target.querySelectorAll(".link"), "active");
              moveSilder(evt.target, link);
            }
          });
          let ticking = false;
          const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
              ticking = false;
              if (!evt.target.isConnected) {
                window.removeEventListener("scroll", onScroll, true);
                return;
              }
              const links = evt.target.querySelectorAll(".link");
              let currentLink = null;
              links.forEach((link) => {
                const anchor = link.getAttribute("anchor");
                const section = htmx.find(anchor);
                if (section) {
                  const rect = section.getBoundingClientRect();
                  if (rect.top <= 100 && rect.bottom >= 100) {
                    currentLink = link;
                  }
                }
              });
              if (currentLink) {
                bny.removeClass(links, "active");
                moveSilder(evt.target, currentLink);
              }
            });
          };
          window.addEventListener("scroll", onScroll, { passive: true, capture: true });
          evt.target._bnyAnchorCleanup = function() {
            window.removeEventListener("scroll", onScroll, true);
          };
          return false;
        }
      }
      if (name === "htmx:beforeOnNodeDisposal") {
        if (evt.target && typeof evt.target._bnyAnchorCleanup === "function") {
          evt.target._bnyAnchorCleanup();
          evt.target._bnyAnchorCleanup = null;
        }
      }
    }
  });
  (function() {
    var tip = null;
    var current = null;
    var showTimer = null;
    var hideTimer = null;
    var gap = 6;
    var DIRS = [
      ["top", "top-start", "top-end"],
      ["bottom", "bottom-start", "bottom-end"],
      ["left", "left-start", "left-end"],
      ["right", "right-start", "right-end"]
    ];
    function ensure() {
      if (tip) return;
      tip = document.createElement("div");
      tip.className = "bny-tooltip";
      document.body.appendChild(tip);
    }
    function attr(elt, attr2) {
      return elt.getAttribute(attr2) || null;
    }
    function show(elt) {
      ensure();
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      var delay = parseInt(attr(elt, "data-tip-delay")) || 0;
      showTimer = setTimeout(function() {
        _show(elt);
      }, delay);
    }
    function _show(elt) {
      current = elt;
      var html = attr(elt, "bny-tip-html");
      var text = attr(elt, "bny-tip");
      if (html) {
        tip.innerHTML = html;
      } else if (text) {
        tip.textContent = text;
      } else {
        return;
      }
      var width = attr(elt, "data-tip-width");
      tip.style.maxWidth = width ? width : "";
      var theme = attr(elt, "data-tip-theme");
      var themeClass = theme === "light" ? "bny-tooltip-light" : "";
      tip.className = "bny-tooltip " + themeClass;
      tip.style.display = "block";
      tip.style.visibility = "hidden";
      tip.offsetHeight;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var placement = attr(elt, "data-tip-placement");
      var best;
      if (placement) {
        best = placement;
      } else {
        best = pick(elt, tw, th);
      }
      tip.classList.add(best);
      var r = elt.getBoundingClientRect();
      var p = pos(best, r, tw, th);
      tip.style.left = p.x + "px";
      tip.style.top = p.y + "px";
      tip.style.right = "auto";
      tip.style.bottom = "auto";
      tip.style.visibility = "visible";
      tip.classList.add("visible");
    }
    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function() {
        if (tip) {
          tip.classList.remove("visible");
        }
        current = null;
      }, 100);
    }
    function hideNow() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      if (tip) {
        tip.classList.remove("visible");
      }
      current = null;
    }
    function pick(elt, tw, th) {
      var r = elt.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
      var best = "top", bestS = -9999;
      for (var i = 0; i < DIRS.length; i++) {
        for (var j = 0; j < DIRS[i].length; j++) {
          var d = DIRS[i][j], s = score(d, r, tw, th, vw, vh);
          if (s >= 10 && bestS < 10) {
            bestS = s;
            best = d;
          } else if (s > bestS) {
            bestS = s;
            best = d;
          }
        }
      }
      return best;
    }
    function score(dir, r, tw, th, vw, vh) {
      var p = raw(dir, r, tw, th), s = 0, pad = 4;
      if (p.x >= pad && p.y >= pad && p.x + tw <= vw - pad && p.y + th <= vh - pad) s += 100;
      if (p.x < 0) s += p.x;
      if (p.x + tw > vw) s -= p.x + tw - vw;
      if (p.y < 0) s += p.y;
      if (p.y + th > vh) s -= p.y + th - vh;
      for (var i = 0; i < DIRS.length; i++) if (DIRS[i].indexOf(dir) !== -1) {
        s += (4 - i) * 5;
        break;
      }
      return s;
    }
    function raw(dir, r, tw, th) {
      switch (dir) {
        case "top":
          return { x: r.left + r.width / 2 - tw / 2, y: r.top - gap - th };
        case "top-start":
          return { x: r.left, y: r.top - gap - th };
        case "top-end":
          return { x: r.right - tw, y: r.top - gap - th };
        case "bottom":
          return { x: r.left + r.width / 2 - tw / 2, y: r.bottom + gap };
        case "bottom-start":
          return { x: r.left, y: r.bottom + gap };
        case "bottom-end":
          return { x: r.right - tw, y: r.bottom + gap };
        case "left":
          return { x: r.left - gap - tw, y: r.top + r.height / 2 - th / 2 };
        case "left-start":
          return { x: r.left - gap - tw, y: r.top };
        case "left-end":
          return { x: r.left - gap - tw, y: r.bottom - th };
        case "right":
          return { x: r.right + gap, y: r.top + r.height / 2 - th / 2 };
        case "right-start":
          return { x: r.right + gap, y: r.top };
        case "right-end":
          return { x: r.right + gap, y: r.bottom - th };
      }
      return { x: r.left + r.width / 2 - tw / 2, y: r.top - gap - th };
    }
    function pos(dir, r, tw, th) {
      var p = raw(dir, r, tw, th), pad = 4;
      return {
        x: Math.max(pad, Math.min(p.x, innerWidth - tw - pad)),
        y: Math.max(pad, Math.min(p.y, innerHeight - th - pad))
      };
    }
    function bind(elt) {
      if (elt._bnyTip) return;
      elt._bnyTip = true;
      elt.addEventListener("mouseenter", function() {
        show(elt);
      });
      elt.addEventListener("mouseleave", hide);
      elt.addEventListener("focus", function() {
        show(elt);
      });
      elt.addEventListener("blur", hideNow);
    }
    function scan(root) {
      if (root.nodeType !== 1) return;
      if (root.hasAttribute && (root.hasAttribute("bny-tip") || root.hasAttribute("bny-tip-html"))) bind(root);
      if (root.querySelectorAll) root.querySelectorAll("[bny-tip], [bny-tip-html]").forEach(bind);
    }
    if (typeof htmx !== "undefined") {
      htmx.onLoad(function(content) {
        scan(content);
      });
    } else {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
          scan(document.body);
        });
      } else {
        scan(document.body);
      }
    }
    window.addEventListener("scroll", function() {
      if (current) hideNow();
    }, true);
    window.addEventListener("resize", function() {
      if (current) hideNow();
    });
  })();
  (function() {
    var WEEKS = ["日", "一", "二", "三", "四", "五", "六"];
    var MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    var currentPanel = null;
    var instances = [];
    var globalBound = false;
    function bindGlobalListeners() {
      if (globalBound) return;
      globalBound = true;
      document.addEventListener("click", function(e) {
        for (var i = instances.length - 1; i >= 0; i--) {
          var inst = instances[i];
          if (!inst.input.isConnected) {
            inst._rawDestroy();
            instances.splice(i, 1);
            continue;
          }
          if (!inst.panel.classList.contains("show")) continue;
          if (!inst.panel.contains(e.target) && e.target !== inst.input && (!inst.rangeInput || e.target !== inst.rangeInput)) {
            inst.close();
          }
        }
      });
      window.addEventListener("resize", function() {
        for (var i = 0; i < instances.length; i++) {
          if (instances[i].panel.classList.contains("show")) {
            instances[i].position();
          }
        }
      });
      window.addEventListener("scroll", function() {
        for (var i = 0; i < instances.length; i++) {
          if (instances[i].panel.classList.contains("show")) {
            instances[i].position();
          }
        }
      }, true);
    }
    function DatePicker(input, options) {
      this.input = input;
      this.mode = options.mode || "date";
      this.format = options.format || null;
      this.rangeInput = options.rangeInput || null;
      this.min = options.min || null;
      this.max = options.max || null;
      this._minStamp = parseBoundary(this.min);
      this._maxStamp = parseBoundary(this.max);
      this.viewYear = (/* @__PURE__ */ new Date()).getFullYear();
      this.viewMonth = (/* @__PURE__ */ new Date()).getMonth();
      this.viewType = "calendar";
      this.selected = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };
      this.rangeSelected = { y: null, m: null, d: null };
      this.temp = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };
      this.initPanel();
      this.bindEvents();
    }
    function parseBoundary(v) {
      if (!v) return null;
      var d = v instanceof Date ? v : new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.getTime();
    }
    DatePicker.prototype.initPanel = function() {
      if (this.panel) return;
      this.wrap = document.createElement("span");
      this.wrap.className = "bny-datepicker-wrap";
      this.input.parentNode.insertBefore(this.wrap, this.input);
      this.wrap.appendChild(this.input);
      this.panel = document.createElement("div");
      this.panel.className = "bny-datepicker-panel";
      this.panel.innerHTML = this.buildHTML();
      this.wrap.appendChild(this.panel);
    };
    DatePicker.prototype.buildHTML = function() {
      var h = "";
      if (this.needsDate()) {
        h += '<div class="bny-datepicker-header">';
        h += '<button class="bny-datepicker-nav prev-year" title="上一年">&laquo;</button>';
        h += '<button class="bny-datepicker-nav prev">&lsaquo;</button>';
        h += '<span class="bny-datepicker-title"></span>';
        h += '<button class="bny-datepicker-nav next">&rsaquo;</button>';
        h += '<button class="bny-datepicker-nav next-year" title="下一年">&raquo;</button>';
        h += "</div>";
        h += '<div class="bny-datepicker-body"></div>';
      }
      if (this.needsTime()) {
        h += '<div class="bny-datepicker-time">';
        h += '<div class="time-col"><button class="time-btn up" data-field="H">&#9650;</button><span class="time-val" data-field="H">00</span><button class="time-btn down" data-field="H">&#9660;</button></div>';
        h += '<span class="time-sep">:</span>';
        h += '<div class="time-col"><button class="time-btn up" data-field="M">&#9650;</button><span class="time-val" data-field="M">00</span><button class="time-btn down" data-field="M">&#9660;</button></div>';
        h += '<span class="time-sep">:</span>';
        h += '<div class="time-col"><button class="time-btn up" data-field="S">&#9650;</button><span class="time-val" data-field="S">00</span><button class="time-btn down" data-field="S">&#9660;</button></div>';
        h += "</div>";
      }
      h += '<div class="bny-datepicker-footer">';
      if (this.needsDate()) h += '<button class="bny-datepicker-btn today">今天</button>';
      h += '<button class="bny-datepicker-btn cancel">取消</button>';
      h += '<button class="bny-datepicker-btn confirm">确定</button>';
      h += "</div>";
      return h;
    };
    DatePicker.prototype.bindEvents = function() {
      var self = this;
      this._onClick = function() {
        self.open();
      };
      this._onFocus = function() {
        self.open();
      };
      this._onPanelClick = function(e) {
        e.stopPropagation();
        var el = e.target;
        if (el.closest(".day-cell")) self.handleDayClick(el.closest(".day-cell"));
        else if (el.closest(".month-cell")) self.handleMonthClick(el.closest(".month-cell"));
        else if (el.closest(".year-cell")) self.handleYearClick(el.closest(".year-cell"));
        else if (el.closest(".bny-datepicker-nav.prev")) self.prevMonth();
        else if (el.closest(".bny-datepicker-nav.next")) self.nextMonth();
        else if (el.closest(".bny-datepicker-nav.prev-year")) {
          self.viewYear--;
          self.render();
        } else if (el.closest(".bny-datepicker-nav.next-year")) {
          self.viewYear++;
          self.render();
        } else if (el.closest(".bny-datepicker-title")) self.toggleView();
        else if (el.closest(".time-btn.up")) self.handleTimeBtn(el.closest(".time-btn.up"));
        else if (el.closest(".time-btn.down")) self.handleTimeBtn(el.closest(".time-btn.down"));
        else if (el.closest(".bny-datepicker-btn.today")) self.selectToday();
        else if (el.closest(".bny-datepicker-btn.confirm")) self.confirm();
        else if (el.closest(".bny-datepicker-btn.cancel")) self.cancel();
      };
      this._onKeydown = function(e) {
        self.handleKeydown(e);
      };
      this.input.addEventListener("click", this._onClick);
      this.input.addEventListener("focus", this._onFocus);
      this.panel.addEventListener("click", this._onPanelClick);
      this.panel.addEventListener("keydown", this._onKeydown);
      instances.push(this);
      bindGlobalListeners();
    };
    DatePicker.prototype._rawDestroy = function() {
      if (this.panel && this.panel.classList.contains("show")) this.close();
      if (this._onClick) this.input.removeEventListener("click", this._onClick);
      if (this._onFocus) this.input.removeEventListener("focus", this._onFocus);
      if (this._onPanelClick && this.panel) this.panel.removeEventListener("click", this._onPanelClick);
      if (this._onKeydown && this.panel) this.panel.removeEventListener("keydown", this._onKeydown);
      this.input._bnyDatePicker = false;
    };
    DatePicker.prototype.destroy = function() {
      var idx = instances.indexOf(this);
      if (idx !== -1) instances.splice(idx, 1);
      this._rawDestroy();
    };
    DatePicker.prototype.handleKeydown = function(e) {
      var key = e.key;
      if (key === "Enter") {
        e.preventDefault();
        this.confirm();
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        this.cancel();
        return;
      }
      if (!this.needsDate()) return;
      if (this.viewType === "calendar") {
        if (this.temp.y === null) {
          var t = /* @__PURE__ */ new Date();
          this.temp.y = t.getFullYear();
          this.temp.m = t.getMonth();
          this.temp.d = t.getDate();
        }
        var y = this.temp.y, m = this.temp.m, d = this.temp.d;
        var cur = new Date(y, m, d);
        switch (key) {
          case "ArrowLeft":
            cur.setDate(cur.getDate() - 1);
            break;
          case "ArrowRight":
            cur.setDate(cur.getDate() + 1);
            break;
          case "ArrowUp":
            cur.setDate(cur.getDate() - 7);
            break;
          case "ArrowDown":
            cur.setDate(cur.getDate() + 7);
            break;
          default:
            return;
        }
        e.preventDefault();
        this.temp.y = cur.getFullYear();
        this.temp.m = cur.getMonth();
        this.temp.d = cur.getDate();
        this.viewYear = this.temp.y;
        this.viewMonth = this.temp.m;
        this.render();
      } else if (this.viewType === "months") {
        switch (key) {
          case "ArrowLeft":
            e.preventDefault();
            if (this.temp.m > 0) this.temp.m--;
            else {
              this.temp.m = 11;
              this.viewYear--;
            }
            this.render();
            break;
          case "ArrowRight":
            e.preventDefault();
            if (this.temp.m < 11) this.temp.m++;
            else {
              this.temp.m = 0;
              this.viewYear++;
            }
            this.render();
            break;
          case "ArrowUp":
            e.preventDefault();
            this.viewYear--;
            this.render();
            break;
          case "ArrowDown":
            e.preventDefault();
            this.viewYear++;
            this.render();
            break;
        }
      } else if (this.viewType === "years") {
        if (this.temp.y === null) this.temp.y = this.viewYear;
        switch (key) {
          case "ArrowLeft":
            e.preventDefault();
            this.temp.y--;
            this.render();
            break;
          case "ArrowRight":
            e.preventDefault();
            this.temp.y++;
            this.render();
            break;
          case "ArrowUp":
            e.preventDefault();
            this.temp.y -= 4;
            this.render();
            break;
          case "ArrowDown":
            e.preventDefault();
            this.temp.y += 4;
            this.render();
            break;
        }
      }
    };
    DatePicker.prototype.needsTime = function() {
      return this.mode === "datetime" || this.mode === "time";
    };
    DatePicker.prototype.needsDate = function() {
      return this.mode !== "time";
    };
    DatePicker.prototype.needsMonthOnly = function() {
      return this.mode === "year-month";
    };
    DatePicker.prototype.open = function() {
      if (currentPanel && currentPanel !== this) currentPanel.close();
      currentPanel = this;
      this.parseFromInput();
      this.initTemp();
      if (this.needsMonthOnly()) this.viewType = "months";
      else if (this.needsDate()) this.viewType = "calendar";
      this.panel.className = "bny-datepicker-panel" + (this.mode === "time" ? " mode-time" : "");
      this.render();
      this.position();
      this.panel.classList.add("show");
      var self = this;
      requestAnimationFrame(function() {
        if (self.panel) {
          self.panel.setAttribute("tabindex", "-1");
          self.panel.focus();
        }
      });
    };
    DatePicker.prototype.close = function() {
      this.panel.classList.remove("show");
      if (currentPanel === this) currentPanel = null;
      try {
        var event = new Event("change", { bubbles: true });
        this.input.dispatchEvent(event);
      } catch (_) {
      }
    };
    DatePicker.prototype.cancel = function() {
      this.input.value = "";
      this.close();
    };
    DatePicker.prototype.confirm = function() {
      if (!this.panel.classList.contains("show")) return;
      if (this.needsDate() && this.temp.y === null) {
        var t = /* @__PURE__ */ new Date();
        this.temp.y = t.getFullYear();
        this.temp.m = t.getMonth();
        this.temp.d = t.getDate();
      }
      this.selected.y = this.temp.y;
      this.selected.m = this.temp.m;
      this.selected.d = this.temp.d;
      this.selected.H = this.temp.H;
      this.selected.M = this.temp.M;
      this.selected.S = this.temp.S;
      this.syncInput();
      this.close();
    };
    DatePicker.prototype.parseFromInput = function() {
      var v = this.input.value.trim();
      this.selected = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };
      if (!v) return;
      var match = v.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (match) {
        this.selected.y = +match[1];
        this.selected.m = +match[2] - 1;
        this.selected.d = +match[3];
      }
      var tMatch = v.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (tMatch) {
        this.selected.H = +tMatch[1];
        this.selected.M = +tMatch[2];
        this.selected.S = tMatch[3] ? +tMatch[3] : 0;
      }
      if (this.selected.y) {
        this.viewYear = this.selected.y;
        this.viewMonth = this.selected.m;
      }
    };
    DatePicker.prototype.initTemp = function() {
      var s = this.selected;
      this.temp = {
        y: s.y,
        m: s.m,
        d: s.d,
        H: s.H,
        M: s.M,
        S: s.S
      };
    };
    DatePicker.prototype.syncInput = function() {
      var s = this.selected;
      var pad = function(n) {
        return n < 10 ? "0" + n : "" + n;
      };
      switch (this.mode) {
        case "time":
          this.input.value = pad(s.H) + ":" + pad(s.M) + ":" + pad(s.S);
          break;
        case "year-month":
          if (s.y === null) {
            this.input.value = "";
            return;
          }
          this.input.value = s.y + "-" + pad(s.m + 1);
          break;
        case "datetime":
          if (s.y === null) {
            this.input.value = "";
            return;
          }
          this.input.value = s.y + "-" + pad(s.m + 1) + "-" + pad(s.d) + " " + pad(s.H) + ":" + pad(s.M) + ":" + pad(s.S);
          break;
        default:
          if (s.y === null) {
            this.input.value = "";
            return;
          }
          this.input.value = s.y + "-" + pad(s.m + 1) + "-" + pad(s.d);
      }
    };
    DatePicker.prototype.render = function() {
      if (this.mode === "time") {
        this.renderTime();
        this.toggleTime(true);
        return;
      }
      var title = this.panel.querySelector(".bny-datepicker-title");
      if (this.viewType === "months") {
        title.textContent = this.viewYear + "年";
        this.renderMonths();
        this.toggleTime(false);
        return;
      }
      if (this.viewType === "years") {
        var start = Math.floor(this.viewYear / 10) * 10;
        title.textContent = start + "-" + (start + 9);
        this.renderYears(start);
        this.toggleTime(false);
        return;
      }
      title.textContent = this.viewYear + "年 " + MONTHS[this.viewMonth];
      this.renderCalendar();
      this.toggleTime(this.needsTime());
      this.renderTime();
    };
    DatePicker.prototype.renderCalendar = function() {
      var body = this.panel.querySelector(".bny-datepicker-body");
      var h = '<table class="bny-datepicker-calendar"><thead><tr>';
      for (var i = 0; i < 7; i++) h += "<th>" + WEEKS[i] + "</th>";
      h += "</tr></thead><tbody>";
      var firstDay = new Date(this.viewYear, this.viewMonth, 1).getDay();
      var daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
      var prevDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
      var today = /* @__PURE__ */ new Date();
      var tY = today.getFullYear(), tM = today.getMonth(), tD = today.getDate();
      var day = 1;
      for (var r = 0; r < 6; r++) {
        h += "<tr>";
        for (var c = 0; c < 7; c++) {
          var num, cls = "day-cell";
          if (r === 0 && c < firstDay) {
            num = prevDays - firstDay + c + 1;
            cls += " other-month";
          } else if (day > daysInMonth) {
            num = day - daysInMonth;
            day++;
            cls += " other-month";
          } else {
            num = day++;
            if (this.temp.y === this.viewYear && this.temp.m === this.viewMonth && this.temp.d === num) cls += " selected";
            if (tY === this.viewYear && tM === this.viewMonth && tD === num) cls += " today";
            if (this.isDisabled(this.viewYear, this.viewMonth, num)) cls += " disabled";
          }
          h += '<td><span class="' + cls + '" data-day="' + num + '">' + num + "</span></td>";
        }
        h += "</tr>";
        if (day > daysInMonth) break;
      }
      h += "</tbody></table>";
      body.innerHTML = h;
    };
    DatePicker.prototype.renderMonths = function() {
      var body = this.panel.querySelector(".bny-datepicker-body");
      var h = '<div class="bny-datepicker-months">';
      for (var i = 0; i < 12; i++) {
        var cls = "month-cell";
        if (this.temp.m === i && this.temp.y === this.viewYear) cls += " selected";
        h += '<span class="' + cls + '" data-month="' + i + '">' + MONTHS[i] + "</span>";
      }
      h += "</div>";
      body.innerHTML = h;
    };
    DatePicker.prototype.renderYears = function(start) {
      var body = this.panel.querySelector(".bny-datepicker-body");
      var h = '<div class="bny-datepicker-years">';
      for (var i = start - 1; i <= start + 10; i++) {
        var cls = "year-cell";
        if (i === this.temp.y) cls += " selected";
        h += '<span class="' + cls + '" data-year="' + i + '">' + i + "</span>";
      }
      h += "</div>";
      body.innerHTML = h;
    };
    DatePicker.prototype.renderTime = function() {
      var self = this;
      var panel = this.panel;
      var fields = ["H", "M", "S"];
      fields.forEach(function(f) {
        var el = panel.querySelector('.time-val[data-field="' + f + '"]');
        if (el) el.textContent = (self.temp[f] < 10 ? "0" : "") + self.temp[f];
      });
    };
    DatePicker.prototype.toggleTime = function(show) {
      var el = this.panel.querySelector(".bny-datepicker-time");
      if (el) el.style.display = show ? "" : "none";
    };
    DatePicker.prototype.handleDayClick = function(el) {
      if (el.classList.contains("disabled")) return;
      var day = +el.getAttribute("data-day");
      if (el.classList.contains("other-month")) {
        if (day > 15) this.viewMonth--;
        else this.viewMonth++;
        if (this.viewMonth < 0) {
          this.viewMonth = 11;
          this.viewYear--;
        }
        if (this.viewMonth > 11) {
          this.viewMonth = 0;
          this.viewYear++;
        }
      }
      this.temp.y = this.viewYear;
      this.temp.m = this.viewMonth;
      this.temp.d = day;
      if (this.needsMonthOnly()) ;
      this.render();
    };
    DatePicker.prototype.handleMonthClick = function(el) {
      this.temp.m = +el.getAttribute("data-month");
      if (this.needsMonthOnly()) {
        this.temp.y = this.viewYear;
        this.render();
      } else {
        this.viewMonth = this.temp.m;
        this.viewType = "calendar";
        this.render();
      }
    };
    DatePicker.prototype.handleYearClick = function(el) {
      this.viewYear = +el.getAttribute("data-year");
      this.viewType = "months";
      this.render();
    };
    DatePicker.prototype.handleTimeBtn = function(el) {
      var field = el.getAttribute("data-field");
      var max = field === "H" ? 23 : 59;
      var delta = el.classList.contains("up") ? 1 : -1;
      this.temp[field] = (this.temp[field] + delta + max + 1) % (max + 1);
      this.renderTime();
    };
    DatePicker.prototype.prevMonth = function() {
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
      this.render();
    };
    DatePicker.prototype.nextMonth = function() {
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
      this.render();
    };
    DatePicker.prototype.toggleView = function() {
      if (this.viewType === "calendar") this.viewType = "months";
      else if (this.viewType === "months") this.viewType = "years";
      else this.viewType = "months";
      this.render();
    };
    DatePicker.prototype.selectToday = function() {
      var t = /* @__PURE__ */ new Date();
      if (this.needsDate()) {
        this.temp.y = t.getFullYear();
        this.temp.m = t.getMonth();
        this.temp.d = t.getDate();
        this.viewYear = this.temp.y;
        this.viewMonth = this.temp.m;
      }
      if (this.needsTime()) {
        this.temp.H = t.getHours();
        this.temp.M = t.getMinutes();
        this.temp.S = t.getSeconds();
      }
      this.confirm();
    };
    DatePicker.prototype.isDisabled = function(y, m, d) {
      if (this._minStamp !== null) {
        var cur = new Date(y, m, d).getTime();
        if (cur < this._minStamp) return true;
      }
      if (this._maxStamp !== null) {
        var cur2 = new Date(y, m, d).getTime();
        if (cur2 > this._maxStamp) return true;
      }
      return false;
    };
    DatePicker.prototype.position = function() {
      var rect = this.input.getBoundingClientRect();
      var pw = this.panel.offsetWidth;
      var ph = this.panel.offsetHeight;
      var top = rect.bottom + 4;
      var left = rect.left;
      if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
      if (top + ph > window.innerHeight - 8) top = rect.top - ph - 4;
      if (left < 4) left = 4;
      this.panel.style.top = top + "px";
      this.panel.style.left = left + "px";
    };
    function DateRangePicker(input1, input2, options) {
      this.mode = "range";
      options = options || {};
      var subMode = options.subMode === "range" ? "date" : options.subMode || "date";
      this.picker1 = new DatePicker(input1, { mode: subMode, min: options.min, max: options.max });
      this.picker2 = new DatePicker(input2, { mode: subMode, min: options.min, max: options.max });
      var self = this;
      var origConfirm1 = this.picker1.confirm;
      this.picker1.confirm = function() {
        origConfirm1.call(self.picker1);
        if (self.picker1.selected.y && self.picker2.selected.y) {
          var d1 = new Date(self.picker1.selected.y, self.picker1.selected.m, self.picker1.selected.d);
          var d2 = new Date(self.picker2.selected.y, self.picker2.selected.m, self.picker2.selected.d);
          if (d1 > d2) {
            self.picker2.selected.y = self.picker1.selected.y;
            self.picker2.selected.m = self.picker1.selected.m;
            self.picker2.selected.d = self.picker1.selected.d;
            if (subMode === "datetime") {
              self.picker2.selected.H = self.picker1.selected.H;
              self.picker2.selected.M = self.picker1.selected.M;
              self.picker2.selected.S = self.picker1.selected.S;
            }
            self.picker2.syncInput();
          }
        }
      };
      var origConfirm2 = this.picker2.confirm;
      this.picker2.confirm = function() {
        origConfirm2.call(self.picker2);
        if (self.picker1.selected.y && self.picker2.selected.y) {
          var d1 = new Date(self.picker1.selected.y, self.picker1.selected.m, self.picker1.selected.d);
          var d2 = new Date(self.picker2.selected.y, self.picker2.selected.m, self.picker2.selected.d);
          if (d2 < d1) {
            self.picker1.selected.y = self.picker2.selected.y;
            self.picker1.selected.m = self.picker2.selected.m;
            self.picker1.selected.d = self.picker2.selected.d;
            if (subMode === "datetime") {
              self.picker1.selected.H = self.picker2.selected.H;
              self.picker1.selected.M = self.picker2.selected.M;
              self.picker1.selected.S = self.picker2.selected.S;
            }
            self.picker1.syncInput();
          }
        }
      };
    }
    DateRangePicker.prototype.destroy = function() {
      if (this.picker1) this.picker1.destroy();
      if (this.picker2) this.picker2.destroy();
    };
    function scan(root) {
      if (!root.querySelectorAll) return;
      root.querySelectorAll("input[data-picker]").forEach(function(input) {
        if (input._bnyDatePicker) return;
        input._bnyDatePicker = true;
        var mode = input.getAttribute("data-picker");
        var rangeTarget = input.getAttribute("data-picker-range");
        if (rangeTarget) {
          var other = document.querySelector(rangeTarget);
          if (other && !other._bnyDatePicker) {
            other._bnyDatePicker = true;
            new DateRangePicker(input, other, { subMode: mode === "range" ? "date" : mode });
          }
        } else {
          new DatePicker(input, { mode });
        }
      });
    }
    function cleanupDisconnected() {
      for (var i = instances.length - 1; i >= 0; i--) {
        if (!instances[i].input.isConnected) {
          instances[i]._rawDestroy();
          instances.splice(i, 1);
        }
      }
    }
    if (typeof htmx !== "undefined") {
      htmx.onLoad(function(content) {
        scan(content);
        cleanupDisconnected();
      });
    } else {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function() {
        scan(document.body);
      });
      else scan(document.body);
    }
  })();
  (function() {
    var ticking = false;
    var instances = [];
    function getConfig(elt) {
      var t = elt.getAttribute("data-threshold") || elt.getAttribute("data-bny-backtop");
      var th = t && !isNaN(parseInt(t, 10)) ? parseInt(t, 10) : 200;
      var container = window;
      var isWindow = true;
      var target = elt.getAttribute("data-target");
      if (target) {
        var el = document.querySelector(target);
        if (el && el.scrollHeight > el.clientHeight) {
          container = el;
          isWindow = false;
        }
      }
      if (isWindow) {
        var candidates = document.querySelectorAll("#bny-content, [data-scroll-container]");
        for (var i = 0; i < candidates.length; i++) {
          if (candidates[i].scrollHeight > candidates[i].clientHeight) {
            container = candidates[i];
            isWindow = false;
            break;
          }
        }
      }
      return { threshold: th, container, isWindow };
    }
    function getScrollTop(container, isWindow) {
      if (isWindow) {
        return window.scrollY || document.documentElement.scrollTop || 0;
      }
      return container.scrollTop || 0;
    }
    function scrollToTop(container, isWindow) {
      if (isWindow) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    function updateInstance(inst) {
      if (!inst.btn || !inst.btn.isConnected) return;
      var top = getScrollTop(inst.container, inst.isWindow);
      if (top > inst.threshold) {
        inst.btn.classList.add("visible");
      } else {
        inst.btn.classList.remove("visible");
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        ticking = false;
        for (var i = 0; i < instances.length; i++) {
          updateInstance(instances[i]);
        }
      });
    }
    function bindInstance(btn) {
      if (!btn) return;
      if (btn._bnyBacktop) return;
      btn._bnyBacktop = true;
      if (!btn.classList.contains("bny-backtop")) {
        btn.classList.add("bny-backtop");
      }
      var cfg = getConfig(btn);
      var inst = {
        btn,
        threshold: cfg.threshold,
        container: cfg.container,
        isWindow: cfg.isWindow
      };
      btn.addEventListener("click", function() {
        scrollToTop(inst.container, inst.isWindow);
      });
      if (inst.isWindow) {
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        cfg.container.addEventListener("scroll", onScroll, { passive: true });
      }
      instances.push(inst);
      updateInstance(inst);
    }
    function scan(root) {
      var customBtns = [];
      if (root && root.nodeType === 1) {
        if (root.id === "bny-backtop" || root.hasAttribute && root.hasAttribute("data-bny-backtop")) {
          customBtns.push(root);
        }
        if (root.querySelectorAll) {
          var found = root.querySelectorAll("[data-bny-backtop]");
          for (var i = 0; i < found.length; i++) customBtns.push(found[i]);
        }
      } else {
        var all = document.querySelectorAll("[data-bny-backtop]");
        for (var j = 0; j < all.length; j++) customBtns.push(all[j]);
        var byId = document.getElementById("bny-backtop");
        if (byId && customBtns.indexOf(byId) === -1) customBtns.push(byId);
      }
      if (customBtns.length === 0) {
        if (!document.getElementById("bny-backtop") && !instances.length) {
          var auto = document.createElement("div");
          auto.id = "bny-backtop";
          auto.className = "bny-backtop";
          auto.setAttribute("title", "回到顶部");
          auto.innerHTML = '<i class="bny-icon icon-arrowup"></i>';
          document.body.appendChild(auto);
          bindInstance(auto);
        }
        return;
      }
      for (var k = 0; k < customBtns.length; k++) {
        bindInstance(customBtns[k]);
      }
    }
    if (typeof htmx !== "undefined") {
      htmx.onLoad(function(content) {
        scan(content);
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        scan(document.body);
      });
    } else {
      scan(document.body);
    }
  })();
  (function() {
    if (typeof htmx === "undefined") return;
    function shouldShowLoading(elt) {
      if (!elt || !elt.classList || !elt.classList.contains("bny-btn")) return false;
      if (elt.getAttribute("bny-button-loading") === "false") return false;
      if (elt.getAttribute("bny-button-loading") !== null) return true;
      var global = document.body.getAttribute("data-bny-button-loading-auto");
      return global !== "false";
    }
    function startLoading(evt) {
      var elt = evt.detail && evt.detail.elt;
      if (!shouldShowLoading(elt)) return;
      elt.classList.add("bny-loading");
      elt.setAttribute("disabled", "disabled");
    }
    function stopLoading(evt) {
      var elt = evt.detail && evt.detail.elt;
      if (!elt) return;
      requestAnimationFrame(function() {
        elt.classList.remove("bny-loading");
        if (elt.getAttribute("bny-button-loading") !== null || !elt.hasAttribute("data-bny-keep-disabled")) {
          elt.removeAttribute("disabled");
        }
      });
    }
    function bindListeners() {
      var body = document.body;
      if (!body) return false;
      if (body._bnyBtnLoadingBound) return true;
      body._bnyBtnLoadingBound = true;
      body.addEventListener("htmx:beforeRequest", startLoading);
      body.addEventListener("htmx:afterRequest", stopLoading);
      body.addEventListener("htmx:responseError", stopLoading);
      body.addEventListener("htmx:sendError", stopLoading);
      return true;
    }
    if (!bindListeners()) {
      document.addEventListener("DOMContentLoaded", bindListeners);
    }
  })();
  htmx.defineExtension("bny-validate", {
    onEvent: function(name, evt) {
      if (name === "htmx:afterProcessNode") {
        if (!bny.hasExtName(evt.target, "bny-validate")) return false;
        var form = evt.target;
        if (form._bnyValidateInit) return false;
        form._bnyValidateInit = true;
        form.setAttribute("novalidate", "");
        form.addEventListener("submit", function(e) {
          var ok = validateForm(form);
          if (!ok) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
          var hasHx = form.getAttribute("hx-post") || form.getAttribute("hx-get") || form.getAttribute("hx-put") || form.getAttribute("hx-patch") || form.getAttribute("hx-delete");
          if (!hasHx) {
            if (form.closest('[hx-ext~="bny-spa"]')) return;
            e.preventDefault();
            if (typeof bny !== "undefined" && bny.alert) {
              bny.alert("校验通过");
            }
          }
        }, true);
        var fields = form.querySelectorAll("input, textarea, select");
        Array.prototype.forEach.call(fields, function(field) {
          if (field._bnyValidateBound) return;
          field._bnyValidateBound = true;
          field.addEventListener("blur", function() {
            validateField(field);
          });
          field.addEventListener("input", function() {
            if (field.getAttribute("aria-invalid") === "true") {
              clearError(field);
            }
          });
        });
        return false;
      }
      return true;
    }
  });
  function validateField(field) {
    var error = getFieldError(field);
    if (error) {
      showError(field, error);
      return false;
    }
    clearError(field);
    return true;
  }
  function validateForm(form) {
    var fields = form.querySelectorAll("input, textarea, select");
    var allOk = true;
    var firstInvalid = null;
    Array.prototype.forEach.call(fields, function(field) {
      if (field.disabled || !field.name) return;
      var ok = validateField(field);
      if (!ok && !firstInvalid) {
        firstInvalid = field;
        allOk = false;
      }
    });
    if (firstInvalid) {
      try {
        firstInvalid.focus();
      } catch (_) {
      }
    }
    return allOk;
  }
  function getFieldError(field) {
    if (typeof field.willValidate !== "undefined" && field.checkValidity) {
      if (!field.checkValidity()) {
        var v = field.validity;
        if (v.valueMissing) {
          return field.getAttribute("data-msg-required") || field.getAttribute("data-msg") || "该项为必填";
        }
        if (v.typeMismatch) {
          return field.getAttribute("data-msg-type") || field.getAttribute("data-msg") || "格式不正确";
        }
        if (v.patternMismatch) {
          return field.getAttribute("data-msg-pattern") || field.getAttribute("data-msg") || "格式不符合要求";
        }
        if (v.tooShort) {
          return field.getAttribute("data-msg-min") || field.getAttribute("data-msg") || "长度不能少于 " + field.getAttribute("minlength") + " 个字符";
        }
        if (v.tooLong) {
          return field.getAttribute("data-msg-max") || field.getAttribute("data-msg") || "长度不能超过 " + field.getAttribute("maxlength") + " 个字符";
        }
        if (v.rangeUnderflow) {
          return field.getAttribute("data-msg-min") || field.getAttribute("data-msg") || "值不能小于 " + field.getAttribute("min");
        }
        if (v.rangeOverflow) {
          return field.getAttribute("data-msg-max") || field.getAttribute("data-msg") || "值不能大于 " + field.getAttribute("max");
        }
        return field.getAttribute("data-msg") || field.validationMessage || "校验未通过";
      }
    }
    var rules = field.getAttribute("data-rules");
    if (!rules) return null;
    var val = (field.value || "").trim();
    if (!val) return null;
    var ruleList = rules.split(",");
    var i;
    for (i = 0; i < ruleList.length; i++) {
      var pair = ruleList[i].split(":");
      var key = (pair[0] || "").trim();
      var arg = pair.slice(1).join(":").trim();
      var err = null;
      switch (key) {
        case "min":
          if (val.length < parseInt(arg, 10)) {
            err = field.getAttribute("data-msg-min") || field.getAttribute("data-msg") || "长度不能少于 " + arg + " 个字符";
          }
          break;
        case "max":
          if (val.length > parseInt(arg, 10)) {
            err = field.getAttribute("data-msg-max") || field.getAttribute("data-msg") || "长度不能超过 " + arg + " 个字符";
          }
          break;
        case "min-val":
          if (parseFloat(val) < parseFloat(arg)) {
            err = field.getAttribute("data-msg-min") || field.getAttribute("data-msg") || "值不能小于 " + arg;
          }
          break;
        case "max-val":
          if (parseFloat(val) > parseFloat(arg)) {
            err = field.getAttribute("data-msg-max") || field.getAttribute("data-msg") || "值不能大于 " + arg;
          }
          break;
        case "regexp":
          try {
            var re = new RegExp(arg);
            if (!re.test(val)) {
              err = field.getAttribute("data-msg-pattern") || field.getAttribute("data-msg") || "格式不符合要求";
            }
          } catch (_) {
          }
          break;
        case "equals":
          var other = document.querySelector('[name="' + arg + '"]');
          if (other && val !== other.value) {
            err = field.getAttribute("data-msg-equals") || field.getAttribute("data-msg") || "两次输入不一致";
          }
          break;
      }
      if (err) return err;
    }
    return null;
  }
  function showError(field, msg) {
    field.setAttribute("aria-invalid", "true");
    field.classList.add("bny-input-error");
    var item = field.closest(".form-item");
    if (!item) {
      var next = field.nextElementSibling;
      if (!next || !next.classList.contains("bny-form-error")) {
        var err1 = document.createElement("div");
        err1.className = "bny-form-error";
        err1.textContent = msg;
        field.parentNode.insertBefore(err1, field.nextSibling);
      } else {
        next.textContent = msg;
      }
      return;
    }
    var errEl = item.querySelector(".bny-form-error");
    if (!errEl) {
      errEl = document.createElement("div");
      errEl.className = "bny-form-error";
      item.appendChild(errEl);
    }
    errEl.textContent = msg;
  }
  function clearError(field) {
    field.removeAttribute("aria-invalid");
    field.classList.remove("bny-input-error");
    var item = field.closest(".form-item");
    if (item) {
      var errEl = item.querySelector(".bny-form-error");
      if (errEl) errEl.remove();
    } else {
      var next = field.nextElementSibling;
      if (next && next.classList.contains("bny-form-error")) {
        next.remove();
      }
    }
  }
  htmx.defineExtension("bny-pagination", {
    onEvent: function(name, evt) {
      if (name === "htmx:afterProcessNode") {
        if (!bny.hasExtName(evt.target, "bny-pagination")) return false;
        setupDelegation();
        return false;
      }
      return true;
    },
    // 响应转换：JSON → 分页条 HTML（数据部分保留原样由 htmx swap）
    transformResponse: function(text, xhr, elt) {
      var ct = xhr.getResponseHeader("Content-Type") || "";
      if (!ct.includes("application/json")) return text;
      var json;
      try {
        json = JSON.parse(xhr.responseText);
      } catch (e) {
        return text;
      }
      var data = json.data || json;
      var total = parseInt(data.total, 10) || 0;
      var pageSize = parseInt(data.pageSize || data.size, 10) || parseInt(elt.getAttribute("data-page-size"), 10) || 10;
      var paramName = elt.getAttribute("data-page-param") || "page";
      var page = parsePageFromURL(xhr.responseURL, paramName) || parseInt(data.page, 10) || 1;
      var maxButtons = parseInt(elt.getAttribute("data-max-buttons"), 10) || 7;
      var showJumper = elt.getAttribute("data-jumper") !== "false";
      var showTotal = elt.getAttribute("data-total") !== "false";
      var totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;
      var h = '<div class="bny-pagination"';
      h += carryAttrs(elt, [
        "color",
        "model",
        "data-max-buttons",
        "data-jumper",
        "data-total",
        "data-page-size"
      ]);
      h += ' data-current="' + page + '"';
      h += ' data-total-pages="' + totalPages + '"';
      h += ' data-page-param="' + bny.escapeChars(paramName) + '"';
      h += ">";
      if (showTotal) {
        h += '<span class="bny-pagination-total">共 <em>' + total + "</em> 条</span>";
      }
      h += '<a class="bny-pagination-prev' + (page <= 1 ? " disabled" : "") + '"';
      h += ' data-page="' + Math.max(1, page - 1) + '"';
      h += ' title="上一页"><i class="bny-icon icon-left"></i></a>';
      var btns = computeButtons(page, totalPages, maxButtons);
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b === "...") {
          h += '<span class="bny-pagination-ellipsis">...</span>';
        } else {
          h += '<a class="bny-pagination-btn' + (b === page ? " active" : "") + '"';
          h += ' data-page="' + b + '"';
          h += ">" + b + "</a>";
        }
      }
      h += '<a class="bny-pagination-next' + (page >= totalPages ? " disabled" : "") + '"';
      h += ' data-page="' + Math.min(totalPages, page + 1) + '"';
      h += ' title="下一页"><i class="bny-icon icon-right"></i></a>';
      if (showJumper && totalPages > 1) {
        h += '<span class="bny-pagination-jump">';
        h += '前往 <input type="number" class="bny-pagination-input" min="1" max="' + totalPages + '" value="' + page + '"> 页';
        h += "</span>";
      }
      h += "</div>";
      if (elt.getAttribute("data-render-list") === "true") {
        var list = [];
        var columns = data.columns || [];
        if (Array.isArray(data.allList)) {
          var start = (page - 1) * pageSize;
          list = data.allList.slice(start, start + pageSize);
        } else if (Array.isArray(data.list)) {
          list = data.list;
        }
        if (list.length && columns.length) {
          return renderTable(list, columns) + h;
        } else if (list.length) {
          var listHtml = '<div class="bny-pagination-list">';
          list.forEach(function(item) {
            listHtml += '<div class="bny-pagination-list-item">' + bny.escapeChars(String(item)) + "</div>";
          });
          listHtml += "</div>";
          return listHtml + h;
        }
      }
      return h;
    }
  });
  function renderTable(list, columns) {
    var h = '<table class="bny-table" style="margin-bottom:16px;">';
    h += "<thead><tr>";
    columns.forEach(function(col) {
      h += "<th>" + bny.escapeChars(col.title || col.field) + "</th>";
    });
    h += "</tr></thead><tbody>";
    list.forEach(function(row) {
      h += "<tr>";
      columns.forEach(function(col) {
        var val = row[col.field];
        if (val === null || val === void 0) val = "";
        h += "<td>" + bny.escapeChars(String(val)) + "</td>";
      });
      h += "</tr>";
    });
    h += "</tbody></table>";
    return h;
  }
  function computeButtons(current, total, max) {
    if (total <= max) {
      var arr = [];
      for (var i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    if (max < 5) max = 5;
    var result = [];
    var remaining = max - 2;
    var half = Math.floor(remaining / 2);
    var left = Math.max(2, current - half);
    var right = Math.min(total - 1, current + half);
    if (left <= 2) {
      left = 2;
      right = Math.min(total - 1, remaining + 1);
    }
    if (right >= total - 1) {
      right = total - 1;
      left = Math.max(2, total - remaining);
    }
    result.push(1);
    if (left > 2) result.push("...");
    for (var j = left; j <= right; j++) result.push(j);
    if (right < total - 1) result.push("...");
    result.push(total);
    return result;
  }
  function carryAttrs(elt, names) {
    var s = "";
    names.forEach(function(n) {
      var v = elt.getAttribute(n);
      if (v !== null) {
        s += " " + n + '="' + bny.escapeChars(v) + '"';
      }
    });
    return s;
  }
  function parsePageFromURL(url, paramName) {
    if (!url) return 0;
    try {
      var u = new URL(url, window.location.href);
      var p = u.searchParams.get(paramName);
      return parseInt(p, 10) || 0;
    } catch (e) {
      var re = new RegExp("[?&]" + encodeURIComponent(paramName) + "=([^&]+)");
      var m = String(url).match(re);
      if (m) return parseInt(decodeURIComponent(m[1]), 10) || 0;
      return 0;
    }
  }
  var _bnyPageDelegated = false;
  function setupDelegation() {
    if (_bnyPageDelegated) return;
    _bnyPageDelegated = true;
    document.addEventListener("click", function(e) {
      var btn = e.target.closest && e.target.closest(".bny-pagination-btn, .bny-pagination-prev, .bny-pagination-next");
      if (!btn) return;
      var bar = btn.closest(".bny-pagination");
      if (!bar) return;
      if (btn.classList.contains("disabled") || btn.classList.contains("active")) {
        e.preventDefault();
        return;
      }
      var p = btn.getAttribute("data-page");
      if (!p) return;
      triggerPageRequest(bar, p);
    });
    document.addEventListener("keydown", function(e) {
      if (e.key !== "Enter") return;
      var input = e.target;
      if (!input.classList || !input.classList.contains("bny-pagination-input")) return;
      e.preventDefault();
      var bar = input.closest && input.closest(".bny-pagination");
      if (!bar) return;
      var totalPages = parseInt(bar.getAttribute("data-total-pages"), 10) || 1;
      var p = parseInt(input.value, 10);
      if (isNaN(p) || p < 1) p = 1;
      if (p > totalPages) p = totalPages;
      triggerPageRequest(bar, String(p));
    });
  }
  function triggerPageRequest(bar, page) {
    var container = bar.parentElement;
    var configDiv = null;
    if (container && container.id) {
      configDiv = document.querySelector('[hx-ext~="bny-pagination"][hx-target="#' + container.id + '"]');
    }
    var src = configDiv || bar;
    var url = src.getAttribute("hx-get");
    if (!url) return;
    var targetSel = src.getAttribute("hx-target");
    var swapStyle = src.getAttribute("hx-swap") || "innerHTML";
    var paramName = src.getAttribute("data-page-param") || "page";
    var vals = {};
    vals[paramName] = page;
    var existingVals = src.getAttribute("hx-vals");
    if (existingVals) {
      try {
        Object.assign(vals, JSON.parse(existingVals));
      } catch (_) {
      }
    }
    var target = targetSel ? document.querySelector(targetSel) : src;
    if (targetSel && !target) target = src;
    htmx.ajax("GET", url, {
      source: src,
      target,
      swap: swapStyle,
      values: vals
    });
  }
  (function() {
    var viewer = null;
    var imgEl = null;
    var current = {
      list: [],
      // 当前组的图片大图 src 列表
      index: 0,
      // 当前索引
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0
    };
    function getViewer() {
      if (viewer) return viewer;
      viewer = document.createElement("div");
      viewer.className = "bny-image-viewer";
      viewer.innerHTML = '<div class="bny-image-mask"></div><div class="bny-image-container"><img class="bny-image-large" alt="preview"></div><div class="bny-image-tools"><a class="bny-image-tool" data-action="prev" title="上一张（←）"><i class="bny-icon icon-left"></i></a><a class="bny-image-tool" data-action="zoom-out" title="缩小（-）"><i class="bny-icon icon-minus"></i></a><a class="bny-image-tool" data-action="zoom-in" title="放大（+）"><i class="bny-icon icon-plus"></i></a><a class="bny-image-tool" data-action="reset" title="重置（0）"><i class="bny-icon icon-sync"></i></a><a class="bny-image-tool" data-action="rotate-left" title="左旋"><i class="bny-icon icon-undo"></i></a><a class="bny-image-tool" data-action="rotate-right" title="右旋"><i class="bny-icon icon-redo"></i></a><a class="bny-image-tool" data-action="next" title="下一张（→）"><i class="bny-icon icon-right"></i></a></div><a class="bny-image-close" title="关闭（ESC）"><i class="bny-icon icon-close"></i></a><div class="bny-image-counter"></div>';
      document.body.appendChild(viewer);
      imgEl = viewer.querySelector(".bny-image-large");
      viewer.querySelector(".bny-image-mask").addEventListener("click", close);
      viewer.querySelector(".bny-image-close").addEventListener("click", close);
      viewer.querySelector(".bny-image-tools").addEventListener("click", function(e) {
        var tool = e.target.closest(".bny-image-tool");
        if (!tool) return;
        var action = tool.getAttribute("data-action");
        handleAction(action);
      });
      viewer.querySelector(".bny-image-container").addEventListener("click", function(e) {
        e.stopPropagation();
      });
      imgEl.addEventListener("wheel", function(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setScale(current.scale + 0.1);
        } else {
          setScale(current.scale - 0.1);
        }
      }, { passive: false });
      var dragStart = null;
      imgEl.addEventListener("mousedown", function(e) {
        if (e.button !== 0) return;
        dragStart = { x: e.clientX, y: e.clientY, ox: current.x, oy: current.y };
        imgEl.classList.add("grabbing");
      });
      document.addEventListener("mousemove", function(e) {
        if (!dragStart) return;
        current.x = dragStart.ox + (e.clientX - dragStart.x);
        current.y = dragStart.oy + (e.clientY - dragStart.y);
        applyTransform();
      });
      document.addEventListener("mouseup", function() {
        if (dragStart) {
          dragStart = null;
          imgEl.classList.remove("grabbing");
        }
      });
      return viewer;
    }
    function open(list, index) {
      if (!list || !list.length) return;
      current.list = list;
      current.index = Math.max(0, Math.min(index, list.length - 1));
      resetTransform();
      getViewer();
      showImage();
      viewer.classList.add("show");
      document.addEventListener("keydown", onKeydown);
      document.body.style.overflow = "hidden";
    }
    function close() {
      if (!viewer) return;
      viewer.classList.remove("show");
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    }
    function showImage() {
      var src = current.list[current.index];
      if (!src) return;
      imgEl.classList.add("loading");
      var tmp = new Image();
      tmp.onload = function() {
        imgEl.src = src;
        imgEl.classList.remove("loading");
      };
      tmp.onerror = function() {
        imgEl.classList.remove("loading");
        imgEl.src = "";
        imgEl.alt = "图片加载失败";
      };
      tmp.src = src;
      var counter = viewer.querySelector(".bny-image-counter");
      if (current.list.length > 1) {
        counter.textContent = current.index + 1 + " / " + current.list.length;
        counter.style.display = "";
      } else {
        counter.style.display = "none";
      }
      var prevBtn = viewer.querySelector('[data-action="prev"]');
      var nextBtn = viewer.querySelector('[data-action="next"]');
      prevBtn.classList.toggle("disabled", current.list.length <= 1);
      nextBtn.classList.toggle("disabled", current.list.length <= 1);
    }
    function handleAction(action) {
      switch (action) {
        case "prev":
          if (current.list.length > 1) {
            current.index = (current.index - 1 + current.list.length) % current.list.length;
            resetTransform();
            showImage();
          }
          break;
        case "next":
          if (current.list.length > 1) {
            current.index = (current.index + 1) % current.list.length;
            resetTransform();
            showImage();
          }
          break;
        case "zoom-in":
          setScale(current.scale + 0.2);
          break;
        case "zoom-out":
          setScale(current.scale - 0.2);
          break;
        case "rotate-left":
          current.rotate -= 90;
          applyTransform();
          break;
        case "rotate-right":
          current.rotate += 90;
          applyTransform();
          break;
        case "reset":
          resetTransform();
          applyTransform();
          break;
      }
    }
    function setScale(s) {
      current.scale = Math.max(0.2, Math.min(5, s));
      applyTransform();
    }
    function resetTransform() {
      current.scale = 1;
      current.rotate = 0;
      current.x = 0;
      current.y = 0;
      applyTransform();
    }
    function applyTransform() {
      if (!imgEl) return;
      imgEl.style.transform = "translate(" + current.x + "px, " + current.y + "px) scale(" + current.scale + ") rotate(" + current.rotate + "deg)";
    }
    function onKeydown(e) {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleAction("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          handleAction("next");
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleAction("zoom-in");
          break;
        case "-":
          e.preventDefault();
          handleAction("zoom-out");
          break;
        case "0":
          e.preventDefault();
          handleAction("reset");
          break;
      }
    }
    function scan(root) {
      var imgs = (root || document).querySelectorAll("img[data-preview]");
      Array.prototype.forEach.call(imgs, function(img) {
        if (img._bnyImageBound) return;
        img._bnyImageBound = true;
        img.classList.add("bny-image-thumb");
        img.addEventListener("click", function() {
          var group = img.getAttribute("data-preview-group");
          var fullSrc = img.getAttribute("data-preview-src") || img.src;
          if (group) {
            var groupImgs = document.querySelectorAll('img[data-preview][data-preview-group="' + CSS.escape(group) + '"]');
            var list = [];
            var idx = 0;
            Array.prototype.forEach.call(groupImgs, function(g, i) {
              list.push(g.getAttribute("data-preview-src") || g.src);
              if (g === img) idx = i;
            });
            open(list, idx);
          } else {
            open([fullSrc], 0);
          }
        });
      });
    }
    if (typeof htmx !== "undefined") {
      htmx.onLoad(function(content) {
        scan(content);
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        scan(document);
      });
    } else {
      scan(document);
    }
  })();
  (function() {
    function render(rate) {
      var max = parseInt(rate.getAttribute("data-max"), 10) || 5;
      var value = parseFloat(rate.getAttribute("data-value")) || 0;
      var half = rate.hasAttribute("data-half");
      var readonly = rate.hasAttribute("data-readonly");
      var color = rate.getAttribute("color") || "";
      if (color) rate.setAttribute("color", color);
      rate.classList.add("bny-rate");
      if (readonly) rate.classList.add("is-readonly");
      rate.setAttribute("role", "slider");
      rate.setAttribute("aria-valuemin", "0");
      rate.setAttribute("aria-valuemax", String(max));
      rate.setAttribute("aria-valuenow", String(value));
      if (!readonly) {
        rate.setAttribute("tabindex", "0");
      }
      rate.innerHTML = "";
      var starsEl = document.createElement("div");
      starsEl.className = "bny-rate-stars";
      for (var i = 1; i <= max; i++) {
        var star = document.createElement("span");
        star.className = "bny-rate-star";
        star.setAttribute("data-index", String(i));
        star.innerHTML = makeStarSvg(false);
        starsEl.appendChild(star);
      }
      rate.appendChild(starsEl);
      var showText = rate.hasAttribute("data-show-text");
      var texts = (rate.getAttribute("data-texts") || "很差,失望,一般,满意,惊喜").split(",");
      var textEl = null;
      if (showText) {
        textEl = document.createElement("span");
        textEl.className = "bny-rate-text";
        rate.appendChild(textEl);
      }
      var state = {
        value,
        // 当前值（已确认）
        hover: -1,
        // 当前 hover 索引（-1 表示无）
        max,
        half,
        texts,
        textEl
      };
      setValue(value);
      if (!readonly) {
        starsEl.addEventListener("mousemove", function(e) {
          var star2 = e.target.closest(".bny-rate-star");
          if (!star2) {
            if (state.hover !== -1) {
              state.hover = -1;
              paint();
            }
            return;
          }
          var idx = parseInt(star2.getAttribute("data-index"), 10);
          if (state.half) {
            var rect = star2.getBoundingClientRect();
            var isLeft = e.clientX - rect.left < rect.width / 2;
            idx = isLeft ? idx - 0.5 : idx;
          }
          if (state.hover !== idx) {
            state.hover = idx;
            paint();
          }
        });
        starsEl.addEventListener("mouseleave", function() {
          state.hover = -1;
          paint();
        });
        starsEl.addEventListener("click", function(e) {
          var star2 = e.target.closest(".bny-rate-star");
          if (!star2) return;
          var idx = parseInt(star2.getAttribute("data-index"), 10);
          if (state.half) {
            var rect = star2.getBoundingClientRect();
            var isLeft = e.clientX - rect.left < rect.width / 2;
            idx = isLeft ? idx - 0.5 : idx;
          }
          setValue(idx);
          rate.dispatchEvent(new Event("change", { bubbles: true }));
        });
        rate.addEventListener("keydown", function(e) {
          var step = state.half ? 0.5 : 1;
          var key = e.key;
          if (key === "ArrowRight" || key === "ArrowUp") {
            e.preventDefault();
            setValue(Math.min(state.max, state.value + step));
            rate.dispatchEvent(new Event("change", { bubbles: true }));
          } else if (key === "ArrowLeft" || key === "ArrowDown") {
            e.preventDefault();
            setValue(Math.max(0, state.value - step));
            rate.dispatchEvent(new Event("change", { bubbles: true }));
          } else if (key === "Enter" || key === " ") {
            e.preventDefault();
            rate.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }
      function setValue(v) {
        state.value = Math.max(0, Math.min(state.max, v));
        rate.setAttribute("data-value", String(state.value));
        rate.setAttribute("aria-valuenow", String(state.value));
        paint();
      }
      function paint() {
        var activeVal = state.hover !== -1 ? state.hover : state.value;
        var stars = starsEl.querySelectorAll(".bny-rate-star");
        Array.prototype.forEach.call(stars, function(star2, i2) {
          var starVal = i2 + 1;
          var svg;
          if (activeVal >= starVal) {
            svg = makeStarSvg(true);
          } else if (state.half && activeVal >= starVal - 0.5) {
            svg = makeStarSvg(true, true);
          } else {
            svg = makeStarSvg(false);
          }
          star2.innerHTML = svg;
        });
        if (state.textEl) {
          var idx = Math.ceil(activeVal);
          idx = Math.max(0, Math.min(state.texts.length, idx));
          state.textEl.textContent = state.texts[idx - 1] || "";
        }
      }
    }
    function makeStarSvg(active, half) {
      var fillId = half ? "bny-rate-half-" + Math.random().toString(36).slice(2) : null;
      var fill;
      if (active) {
        fill = "currentColor";
      } else {
        fill = "none";
      }
      var starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
      if (half && fillId) {
        return '<svg viewBox="0 0 24 24" class="bny-rate-icon is-half"><defs><linearGradient id="' + fillId + '"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="none"/></linearGradient></defs><path d="' + starPath + '" fill="url(#' + fillId + ')" stroke="currentColor" stroke-width="1.5"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" class="bny-rate-icon' + (active ? " is-active" : "") + '"><path d="' + starPath + '" fill="' + fill + '" stroke="currentColor" stroke-width="1.5"/></svg>';
    }
    function scan(root) {
      var rates = (root || document).querySelectorAll(".bny-rate");
      Array.prototype.forEach.call(rates, function(rate) {
        if (rate._bnyRateBound) return;
        rate._bnyRateBound = true;
        render(rate);
      });
    }
    if (typeof htmx !== "undefined") {
      htmx.onLoad(function(content) {
        scan(content);
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        scan(document);
      });
    } else {
      scan(document);
    }
  })();
})();
//# sourceMappingURL=bunny.js.map
