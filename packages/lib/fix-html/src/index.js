import {win} from 'win-doc';
import callfunc from 'call-func';

const allAttr = JSON.parse(`[
"accept", "accept-charset", "accesskey", "action", "allowfullscreen", "allowtransparency", "align", "alt", "async", "autocomplete", "autofocus", "autoplay", "autocorrect", "aria-*", 
"border",
"capture", "cellpadding",  "cellspacing", "charset", "challenge", "checked", "class", "cols", "colspan", "content", "contenteditable", "contextmenu", "controls", "coords", "crossorigin",
"data-*", "datetime", "defer", "dir", "disabled", "download", "draggable",
"enctype",
"for", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "frameborder",
"headers", "height", "hidden", "high", "href", "hreflang", "http-equiv",
"item*", "icon", "id", "inputmode",
"js*",
"keyparams", "keytype",
"label", "lang", "list", "loop", "low",
"manifest", "marginheight", "marginwidth", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted",
"name", "novalidate", "nonce",
"open", "optimum",
"pattern", "placeholder", "ping", "poster", "preload",
"radiogroup", "readonly", "rel", "required", "role", "rows", "rowspan",
"sandbox", "scope", "scoped", "scrolling", "seamless", "selected", "shape", "size", "sizes", "span", "spellcheck", "src", "srcdoc", "srcset", "start", "step", "style", "summary",
"tabIndex", "target", "title", "type",
"usemap",
"value",
"width", "wmode", "wrap",

"clip-path", "cx", "cy",
"d", "dx", "dy",
"fill", "fill-opacity", "focusable", "font-family", "font-size", "fx", "fy",
"gradientTransform", "gradientUnits",
"marker-end", "marker-mid", "marker-start",
"offset", "opacity",
"patternContentUnits", "patternUnits", "points", "preserveAspectRatio",
"r", "rx", "ry",
"spreadMethod",
"stop-color", "stop-opacity",
"stroke", "stroke-dasharray", "stroke-linecap", "stroke-opacity", "stroke-width",
"text-anchor", "transform",
"version", "viewBox",
"x1", "x2", "x",
"xlink:actuate", "xlink:arcrole", "xlink:href", "xlink:role", "xlink:show", "xlink:title", "xlink:type",
"xmlns", "xmlns:v", "xmlns:o", "xml:base", "xml:lang", "xml:space",
"y1", "y2", "y"
]`);

const docTypeReg = /^<!DOCTYPE .*?>/i;

const fixHtml = (s, cb) => {
  const d = new (win()).DOMParser();
  const xml = new (win()).XMLSerializer();
  const docType = ((s || '').match(docTypeReg) || [])[0] || '';
  const html = xml.serializeToString(d.parseFromString(s || '', 'text/html'));
  return cb
    ? docType+callfunc(cb, [
        html,
        {allowedTags: false, allowedAttributes: {'*': allAttr}},
      ])
    : html;
};
export default fixHtml;
