/**
 * component-loader.js
 * Lightweight HTML component include system with config.json support.
 *
 * Elements with data-include="path/to/component.html" are replaced
 * with the fetched component content. Template variables {{varName}}
 * are resolved from (in priority order):
 *   1. data-var-varName attributes on the element (inline overrides)
 *   2. data/config.json          (central single source of truth)
 *
 * Nested paths are supported: {{couple.bride.firstName}}
 *
 * Usage:
 *   <div data-include="components/navbar.html"></div>
 *   <div data-include="components/gallery-item.html"
 *        data-var-src="assets/img/gallery-1.jpg"
 *        data-var-lightbox="Gallery-1"
 *        data-var-delay="0.2s"></div>
 */

(function() {
    'use strict';

    var CONFIG_URL = 'data/config.json';
    var configData = null;
    var configLoaded = false;

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Fetch a URL via XMLHttpRequest (works with file:// and http://).
     * @param  {string} url
     * @return {Promise<string>}
     */
    function loadFile(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // status 0 = file:// protocol success
                    if (xhr.status === 200 || xhr.status === 0) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error('Failed to load ' + url + ' (status: ' + xhr.status + ')'));
                    }
                }
            };
            xhr.onerror = function() {
                reject(new Error('Network error loading ' + url));
            };
            xhr.send();
        });
    }

    /**
     * Load and parse data/config.json. On failure log a warning and
     * set configData to an empty object so the page still renders.
     * @return {Promise}
     */
    function loadConfig() {
        return loadFile(CONFIG_URL).then(function(text) {
            try {
                configData = JSON.parse(text);
                configLoaded = true;
                console.log('[Component Loader] Config loaded successfully.');
            } catch (e) {
                console.error('[Component Loader] Failed to parse config.json:', e.message);
                configData = {};
            }
        }).catch(function(err) {
            console.warn('[Component Loader] Config unavailable, using data-var-* only:', err.message);
            configData = {};
        });
    }

    /**
     * Safely walk a dot-separated path into an object.
     *   resolveNestedKey({ a: { b: 'c' } }, 'a.b') === 'c'
     * @param  {object} obj
     * @param  {string} keyPath   Dot-separated key chain
     * @return {*}                The value, or undefined
     */
    function resolveNestedKey(obj, keyPath) {
        var keys = keyPath.split('.');
        var current = obj;
        for (var i = 0; i < keys.length; i++) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return undefined;
            }
            current = current[keys[i]];
        }
        return current;
    }

    /**
     * Escape HTML metacharacters so plain text can't be interpreted as markup.
     * @param  {string} str
     * @return {string}
     */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Resolve {{variables}} inside a component's HTML.
     *
     * Priority order (highest first):
     *   1. data-var-varName on the placeholder element
     *   2. data/config.json (supports nested dot notation)
     *
     * All resolved values are HTML-escaped before insertion.
     * Unresolved placeholders are left as-is.
     *
     * @param  {string}   html      Component HTML template
     * @param  {Element}  element   The DOM element with data-var-* attrs
     * @return {string}             Resolved HTML
     */
    function replacePlaceholders(html, element) {
        var regex = /\{\{([\w.]+)\}\}/g;
        return html.replace(regex, function(match, varName) {
            // Priority 1: inline data-var-* attribute on placeholder
            var attrValue = element.getAttribute('data-var-' + varName);
            if (attrValue !== null) {
                return escapeHtml(attrValue);
            }

            // Priority 2: config.json (dot-notation supported)
            if (configLoaded && configData !== null) {
                var configValue = resolveNestedKey(configData, varName);
                if (configValue !== undefined && configValue !== null) {
                    return escapeHtml(String(configValue));
                }
            }

            // Not found — leave placeholder unchanged
            return match;
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Post-processing initialisers                                       */
    /* ------------------------------------------------------------------ */

    function hideSpinner() {
        var spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.classList.remove('show');
        }
    }

    function initWow() {
        if (typeof WOW !== 'undefined') {
            new WOW().init();
        }
    }

    function initLightbox() {
        if (typeof lightbox !== 'undefined' && typeof lightbox.updateOptions === 'function') {
            lightbox.updateOptions({});
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Component pipeline                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * Find every [data-include] element, fetch its component file,
     * resolve placeholders, and swap it into the DOM.
     * @param  {Element} container  Root element to search
     * @return {Promise}
     */
    function processIncludes(container) {
        var elements = (container || document).querySelectorAll('[data-include]');
        var promises = [];

        elements.forEach(function(el) {
            var url = el.getAttribute('data-include');
            var promise = loadFile(url).then(function(html) {
                html = replacePlaceholders(html, el);
                var wrapper = document.createElement('div');
                wrapper.innerHTML = html;

                // innerHTML does NOT execute <script> elements. Extract them so
                // we can re-create and trigger execution after content insertion.
                var deferredScripts = [];
                var scriptNodes = wrapper.querySelectorAll('script');
                scriptNodes.forEach(function(s) {
                    deferredScripts.push({
                        src: s.getAttribute('src') || '',
                        text: s.textContent || ''
                    });
                    s.parentNode.removeChild(s);
                });

                // Insert non-script content into the DOM
                var fragment = document.createDocumentFragment();
                while (wrapper.firstChild) {
                    fragment.appendChild(wrapper.firstChild);
                }
                var parent = el.parentNode;
                var ref = el.nextSibling;
                parent.replaceChild(fragment, el);

                // Re-create script elements so the browser executes them.
                // External scripts load and execute sequentially in original
                // order — each waits for onload before the next is inserted.
                // Inline scripts execute synchronously upon insertion.
                function insertNextScript(i) {
                    if (i >= deferredScripts.length) {
                        return Promise.resolve();
                    }
                    var s = deferredScripts[i];
                    var newScript = document.createElement('script');
                    if (s.src) {
                        newScript.setAttribute('src', s.src);
                    }
                    if (s.text) {
                        newScript.textContent = s.text;
                    }
                    parent.insertBefore(newScript, ref);

                    if (s.src) {
                        return new Promise(function(resolve) {
                            newScript.onload = resolve;
                            newScript.onerror = resolve;
                        }).then(function() {
                            return insertNextScript(i + 1);
                        });
                    }
                    // Inline scripts execute synchronously on insertion
                    return insertNextScript(i + 1);
                }

                return insertNextScript(0);
            }).catch(function(err) {
                console.error('[Component Loader]', err.message);
            });
            promises.push(promise);
        });

        return Promise.all(promises);
    }

    /* ------------------------------------------------------------------ */
    /*  Bootstrap                                                          */
    /* ------------------------------------------------------------------ */

    document.addEventListener('DOMContentLoaded', function() {
        // Phase 1: load config
        loadConfig()
        // Phase 2: load & render components using config
        .then(function() {
            return processIncludes(document);
        })
        // Phase 2.5: notify that components are in the DOM
        .then(function() {
            console.log('componentsLoaded fired');
            document.dispatchEvent(new Event('componentsLoaded'));
        })
        // Phase 3: init animation / lightbox libraries
        .then(function() {
            initWow();
            initLightbox();
        })
        // Phase 4: hide spinner (element now exists in DOM)
        .then(function() {
            hideSpinner();
        });
    });
})();
