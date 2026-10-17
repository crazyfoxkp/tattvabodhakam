/*
title: $:/plugins/orange/mermaid-tw5/wrapper.js
type: application/javascript
module-type: widget
author: Nathaniel Jones 2017-05-26
modified: E Furlan 2022-05-08
*/
(function() {
    // jslint node: true, browser: true
    // global $tw: false
    'use strict';

    var Rocklib = require('$:/plugins/orange/mermaid-tw5/widget-tools.js').rocklib,
        Widget = require('$:/core/modules/widgets/widget.js').widget,
        rocklib = new Rocklib(),
        mermaidModule = null,
        mermaidAPI = null,
        d3 = null;

    function escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function decodeHtmlEntities(text) {
        if (!text) return text;
        var el = document.createElement('textarea');
        el.innerHTML = text;
        return el.value;
    }

    function getSimpleStack(ex) {
        if (!ex || !ex.stack) {
            return '';
        }
        var lines = String(ex.stack).split('\n');
        var frames = [];
        for (var i = 0; i < lines.length && frames.length < 3; i++) {
            var line = lines[i].trim();
            if (line.indexOf('at ') === 0) {
                var match = line.match(/at\s+(?:[^\s(]+\s+\()?([^)]+)\)?/);
                if (match) {
                    var loc = match[1];
                    var fileName = loc.split('/').pop().split(':')[0];
                    frames.push(fileName);
                }
            }
        }
        return frames.join('\n');
    }

    var SECURE_KEYS = ['secure', 'securityLevel', 'startOnLoad',
                       'maxTextSize', 'maxEdges', 'suppressErrorRendering'];

    var CONFIG_WHITELIST = [
        'theme', 'themeVariables', 'themeCSS', 'look', 'handDrawnSeed',
        'fontFamily', 'altFontFamily', 'fontSize', 'darkMode', 'wrap',
        'htmlLabels', 'markdownAutoWrap', 'logLevel',
        'arrowMarkerAbsolute', 'deterministicIds', 'deterministicIDSeed',
        'flowchart', 'sequence', 'gantt', 'pie', 'class', 'state', 'er',
        'journey', 'gitGraph', 'quadrantChart', 'xyChart', 'sankey',
        'timeline', 'mindmap', 'packet', 'block', 'architecture', 'kanban',
        'c4', 'requirement', 'radar',
        'securityLevel', 'maxTextSize', 'maxEdges', 'suppressErrorRendering'
    ];

    var NON_SECURE_INJECT_KEYS = ['theme', 'look', 'fontFamily', 'fontSize',
                                   'themeVariables', 'darkMode'];

    function buildSiteConfig() {
        var config = {
            startOnLoad: false,
            securityLevel: 'loose',
            flowchart: { useMaxWidth: true, htmlLabels: true }
        };
        var configTitle = '$:/plugins/orange/mermaid-tw5/config';
        var data = $tw.wiki.getTiddlerData(configTitle, {});
        for (var k in data) {
            if (Object.prototype.hasOwnProperty.call(data, k) &&
                CONFIG_WHITELIST.indexOf(k) !== -1) {
                if (k === 'startOnLoad') continue;  // D-07: never allow override
                config[k] = data[k];                // shallow replace per D-04
            }
        }
        return config;
    }

    function buildPerWidgetInit(options) {
        var init = {};
        for (var i = 0; i < NON_SECURE_INJECT_KEYS.length; i++) {
            var k = NON_SECURE_INJECT_KEYS[i];
            if (options[k] !== undefined && options[k] !== '') {
                init[k] = options[k];
            }
        }
        return Object.keys(init).length > 0 ? init : null;
    }

    var MermaidWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };
    MermaidWidget.prototype = new Widget();
    // Render this widget into the DOM
    MermaidWidget.prototype.render = function(parent, nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();
        var tag = 'mermaid',
            scriptBody = rocklib.getScriptBody(this, 'text'),
            divNode = rocklib.getCanvas(this, tag);
        var _insertSVG = function(svgCode, bindFunctions) {
                divNode.innerHTML = svgCode;
                if (bindFunctions) {
                    try {
                        bindFunctions(divNode);
                    } catch (bfErr) {
                        console.error('[mermaid-tw5] bindFunctions error:', bfErr);
                    }
                }
            };

        // Skip rendering during static HTML generation (Node.js build).
        // Mermaid 11 requires a browser DOM (document) to render diagrams.
        if (!$tw.browser) {
            divNode.innerHTML = '<div style="border-left:3px solid #2196F3;background:#e3f2fd;padding:8px 12px;">' +
                '<strong>Mermaid diagram</strong> (interactive rendering requires a browser)' +
                '</div>';
            parent.insertBefore(divNode, nextSibling);
            this.domNodes.push(divNode);
            return;
        }

        try {
            // Lazy-load mermaid and D3 on first render
            // Libraries are only loaded when a diagram is actually rendered
            if (!mermaidAPI) {
                divNode.innerHTML = '<div style="border-left:3px solid #999;background:#f5f5f5;padding:8px 12px;">Loading diagram…</div>';
                mermaidModule = require('$:/plugins/orange/mermaid-tw5/mermaid.min.js');
                mermaidAPI = mermaidModule.mermaidAPI || mermaidModule;
                d3 = require('$:/plugins/orange/mermaid-tw5/d3.v6.min.js');
                mermaidAPI.initialize(buildSiteConfig());  // D-05: once per page load
            }

            var options = {
                theme: ''
            };
            rocklib.getOptions(this, tag, options);
            // mermaidAPI.initialize() removed from per-render path (was hardcoded lines)
            // START ZOOM LOGIC: Enable zooming the mermaid diagram with D3
            // by fkmiec 2023-05-21
            var zoomEventListenersApplied = false;
            var isZoomEnabled = false;

            divNode.addEventListener('click', function() {
                if(!zoomEventListenersApplied) {
                    var id = Date.now().toString(36);
                    this.firstChild.setAttribute('id', id);
                    var svg = d3.select('#' + id);
                    svg.html('<g>' + svg.html() + '</g>');
                    var inner = svg.select('g');
                    var zoom = d3.zoom().filter(function() { return isZoomEnabled; }).on('zoom', function(event) {
                        inner.attr('transform', event.transform);
                    });
                    svg.call(zoom);
                    zoomEventListenersApplied = true;
                }
                isZoomEnabled ? isZoomEnabled = false : isZoomEnabled = true;
            });
            //END ZOOM LOGIC

            scriptBody = decodeHtmlEntities(scriptBody);

            // D-02: inject per-widget non-secure config as %%{init}%% PREPENDED
            // before any author's %%{init}%% so the author's in-source directive wins.
            var perWidgetInit = buildPerWidgetInit(options);
            if (perWidgetInit) {
                scriptBody = '%%{init: ' + JSON.stringify(perWidgetInit) + '}%%\n' + scriptBody;
            }

            var renderDiagram = function() {
                // Mermaid 11 calls document.getElementById(id)?.remove() before rendering
                // to clean up stale elements. We must NOT pass divNode.id as the SVG id,
                // or Mermaid will silently remove divNode from the DOM before the async
                // render completes, leaving the SVG set on a detached element.
                var svgId = divNode.id + '_svg';
                var result = mermaidAPI.render(svgId, scriptBody);
                // Mermaid 10+/11 returns a Promise; handle it explicitly
                if (result && typeof result.then === 'function') {
                    result.then(function(res) {
                        _insertSVG(res.svg, res.bindFunctions);
                    }).catch(function(renderErr) {
                        // renderAsync is absent from the vendored Mermaid 11.14.0 bundle
                        // (grep confirms 0 occurrences). This guard never fires but is kept
                        // as a forward-compatibility safety net for future bundle upgrades.
                        if (renderErr.message && renderErr.message.indexOf('Diagram is a promise') !== -1 && mermaidModule.renderAsync) {
                            mermaidModule.renderAsync(divNode.id, scriptBody, _insertSVG).catch(function(asyncEx) {
                                var errorHtml = '<div style="border-left:3px solid #ff4444;background:#fff0f0;padding:8px 12px;">' +
                                    '<p><strong>Mermaid diagram could not be rendered.</strong> The diagram syntax may contain an error.</p>' +
                                    '<pre style="margin:8px 0;padding:6px;background:#ffffff;border:1px solid #ffcccc;overflow:auto;">' +
                                    escapeHtml(scriptBody) +
                                    '</pre>' +
                                    '<details>' +
                                    '<summary style="cursor:pointer;color:#666;font-size:12px;">Technical details</summary>' +
                                    '<p style="margin:8px 0 0 0;font-size:12px;"><strong>' + escapeHtml(asyncEx.name || 'Error') + ':</strong> ' +
                                    escapeHtml(asyncEx.message || String(asyncEx)) + '</p>' +
                                    '<pre style="margin:4px 0 0 0;font-size:11px;overflow:auto;">' + escapeHtml(getSimpleStack(asyncEx)) + '</pre>' +
                                    '</details>' +
                                    '</div>';
                                divNode.innerHTML = errorHtml;
                            });
                        } else {
                            var errorHtml = '<div style="border-left:3px solid #ff4444;background:#fff0f0;padding:8px 12px;">' +
                                '<p><strong>Mermaid diagram could not be rendered.</strong> The diagram syntax may contain an error.</p>' +
                                '<pre style="margin:8px 0;padding:6px;background:#ffffff;border:1px solid #ffcccc;overflow:auto;">' +
                                escapeHtml(scriptBody) +
                                '</pre>' +
                                '<details>' +
                                '<summary style="cursor:pointer;color:#666;font-size:12px;">Technical details</summary>' +
                                '<p style="margin:8px 0 0 0;font-size:12px;"><strong>' + escapeHtml(renderErr.name || 'Error') + ':</strong> ' +
                                escapeHtml(renderErr.message || String(renderErr)) + '</p>' +
                                '<pre style="margin:4px 0 0 0;font-size:11px;overflow:auto;">' + escapeHtml(getSimpleStack(renderErr)) + '</pre>' +
                                '</details>' +
                                '</div>';
                            divNode.innerHTML = errorHtml;
                        }
                    });
                }
            };

            try {
                renderDiagram();
            } catch (ex) {
                // Synchronous error from Mermaid 9 or unhandled sync errors
                throw ex;
            }

        } catch (ex) {
            var errorHtml = '<div style="border-left:3px solid #ff4444;background:#fff0f0;padding:8px 12px;">' +
                '<p><strong>Mermaid diagram could not be rendered.</strong> The diagram syntax may contain an error.</p>' +
                '<pre style="margin:8px 0;padding:6px;background:#ffffff;border:1px solid #ffcccc;overflow:auto;">' +
                escapeHtml(scriptBody) +
                '</pre>' +
                '<details>' +
                '<summary style="cursor:pointer;color:#666;font-size:12px;">Technical details</summary>' +
                '<p style="margin:8px 0 0 0;font-size:12px;"><strong>' + escapeHtml(ex.name || 'Error') + ':</strong> ' +
                escapeHtml(ex.message || String(ex)) + '</p>' +
                '<pre style="margin:4px 0 0 0;font-size:11px;overflow:auto;">' + escapeHtml(getSimpleStack(ex)) + '</pre>' +
                '</details>' +
                '</div>';
            divNode.innerHTML = errorHtml;
        }
        parent.insertBefore(divNode, nextSibling);
        this.domNodes.push(divNode);
    };
    MermaidWidget.prototype.execute = function() {
        // Nothing to do
    };
    /*
    Selectively refreshes the widget if needed. Returns true if the
    widget or any of its children needed re-rendering
    */
    MermaidWidget.prototype.refresh = function(changedTiddlers) {
        return false;
    };
    exports.mermaid = MermaidWidget;
})();
