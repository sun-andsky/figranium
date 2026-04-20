const { JSDOM } = require('jsdom');

// Copy of current cleanHtml from src/agent/dom-utils.js (simplified for node environment)
function cleanHtmlOriginal(dom, withShadow) {
    const stripUseless = (root) => {
        const useless = root.querySelectorAll(
            'script, style, link, meta, noscript, svg, canvas, ' +
            'iframe, object, embed, applet, param, source, track, ' +
            'head > *:not(title)'
        );
        useless.forEach(node => node.remove());

        const keepAttrs = new Set(['id', 'class', 'href', 'src', 'alt', 'title', 'name', 'value', 'type', 'placeholder', 'aria-label', 'data-id', 'data-key', 'data-value', 'data-name', 'data-url', 'data-href', 'data-src', 'data-index', 'data-type', 'data-page', 'data-price', 'data-sku', 'data-product', 'data-category', 'data-item', 'data-label', 'data-text', 'data-title', 'selected', 'checked', 'disabled', 'multiple', 'for', 'action', 'method', 'content', 'datetime', 'colspan', 'rowspan', 'scope']);
        const allEls = root.querySelectorAll('*');
        allEls.forEach(el => {
            const toRemove = [];
            for (const attr of el.attributes) {
                if (!keepAttrs.has(attr.name) && !attr.name.startsWith('data-')) {
                    toRemove.push(attr.name);
                }
            }
            toRemove.forEach(a => el.removeAttribute(a));
        });
    };

    const clone = dom.window.document.documentElement.cloneNode(true);
    stripUseless(clone);
    return clone.outerHTML;
}

// Optimized version
const KEEP_ATTRS = new Set(['id', 'class', 'href', 'src', 'alt', 'title', 'name', 'value', 'type', 'placeholder', 'aria-label', 'data-id', 'data-key', 'data-value', 'data-name', 'data-url', 'data-href', 'data-src', 'data-index', 'data-type', 'data-page', 'data-price', 'data-sku', 'data-product', 'data-category', 'data-item', 'data-label', 'data-text', 'data-title', 'selected', 'checked', 'disabled', 'multiple', 'for', 'action', 'method', 'content', 'datetime', 'colspan', 'rowspan', 'scope']);

function cleanHtmlOptimized(dom, withShadow) {
    const stripUseless = (root) => {
        const useless = root.querySelectorAll(
            'script, style, link, meta, noscript, svg, canvas, ' +
            'iframe, object, embed, applet, param, source, track, ' +
            'head > *:not(title)'
        );
        for (let i = 0; i < useless.length; i++) {
            useless[i].remove();
        }

        const allEls = root.querySelectorAll('*');
        for (let i = 0; i < allEls.length; i++) {
            const el = allEls[i];
            if (!el.hasAttributes()) continue;

            const attrNames = el.getAttributeNames();
            for (let j = 0; j < attrNames.length; j++) {
                const name = attrNames[j];
                if (!KEEP_ATTRS.has(name) && !name.startsWith('data-')) {
                    el.removeAttribute(name);
                }
            }
        }
    };

    const clone = dom.window.document.documentElement.cloneNode(true);
    stripUseless(clone);
    return clone.outerHTML;
}

function generateLargeDom(nodeCount) {
    let html = '<html><body>';
    for (let i = 0; i < nodeCount; i++) {
        html += `<div id="div-${i}" class="container" data-id="${i}" title="title-${i}" unknown-attr="val-${i}" style="color: red;">
            <span class="text" data-index="${i}" onclick="alert(1)">Some text ${i}</span>
            <img src="img-${i}.png" alt="image ${i}" width="100" height="100">
            <script>console.log(${i})</script>
        </div>`;
    }
    html += '</body></html>';
    return html;
}

const nodeCount = 500;
console.log(`Generating DOM with ~${nodeCount * 3} elements...`);
const html = generateLargeDom(nodeCount);
const dom = new JSDOM(html);

console.log('Running benchmark...');

const runs = 10;
let originalTotal = 0;
let optimizedTotal = 0;

// Warmup
cleanHtmlOriginal(dom, false);
cleanHtmlOptimized(dom, false);

for (let i = 0; i < runs; i++) {
    const startOrig = Date.now();
    cleanHtmlOriginal(dom, false);
    originalTotal += (Date.now() - startOrig);

    const startOpt = Date.now();
    cleanHtmlOptimized(dom, false);
    optimizedTotal += (Date.now() - startOpt);
}

console.log(`Original average: ${(originalTotal / runs).toFixed(2)}ms`);
console.log(`Optimized average: ${(optimizedTotal / runs).toFixed(2)}ms`);
const improvement = ((originalTotal - optimizedTotal) / originalTotal * 100).toFixed(2);
console.log(`Improvement: ${improvement}%`);
