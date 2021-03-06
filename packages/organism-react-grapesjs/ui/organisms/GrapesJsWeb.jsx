import React, { Component } from "react";
import { Unsafe } from "react-atomic-molecule";
import Iframe from "organism-react-iframe";
import callfunc from "call-func";
import get from "get-object-value";
import { queryFrom } from "css-query-selector";
import { popupDispatch, FullScreen } from "organism-react-popup";
import { openCodeEditor } from "organism-react-codeeditor";
import fixHtml from "fix-html";

import getAsset from "../../src/getAsset";
import getGjsPresetWebpage from "../../src/getGjsPresetWebpage";
import getInlinedHtmlCss from "../../src/getInlinedHtmlCss";

const defaultAssets = {
  "sanitize-html":
    "https://cdn.jsdelivr.net/npm/sanitize-html@1.20.1/dist/sanitize-html.min.js",
  "grapesjs-preset-webpage.min.js":
    "https://cdn.jsdelivr.net/npm/grapesjs-preset-webpage@0.1.11/dist/grapesjs-preset-webpage.min.js"
};

const cleanClassReg = /(class\=")([^"]*)(c\d{0,4})(\s)?([^"]*)/g;

const ERROR_HTML_INVALID_SYNTAX = "HTML invalid syntax";

const initViewSource = host => {
  const panelManager = host.getPanel();
  panelManager.addButton("options", [
    {
      id: "edit-code",
      className: "gjs-pn-btn fa fa-code",
      command: function(editor1, sender) {
        openCodeEditor(host.getDesign(), code => {
          host.getEditor().setComponents(code);
        });
      },
      attributes: { title: "Edit Html" }
    }
  ]);
};

class GrapesJsWeb extends Component {
  getAsset(fileName) {
    return getAsset(fileName, this.props, defaultAssets);
  }

  resetUploadField() {
    if (!this.iframeWindow) {
      return;
    }
    const dom = this.iframeWindow.document.getElementById("gjs-am-uploadFile");
    if (dom) {
      dom.value = "";
    }
  }

  beforeGetHtml() {
    if (!this.editor) {
      return false;
    }
    const sel = this.editor.getSelected();
    if (sel && sel.view && sel.view.disableEditing) {
      sel.view.disableEditing();
    }
    return true;
  }

  getHtml() {
    if (!this.beforeGetHtml()) {
      return;
    }
    let html = this.getDesign();
    if (html) {
      html = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
${html}
</body>
</html>
`;
      return html;
    }
  }

  getDesign() {
    return getInlinedHtmlCss(this.editor);
  }

  handleIframe = el => {
    this.dIframe = el;
  };

  handleRemoveAsset = asset => {
    const { onRemoveAsset } = this.props;
    const src = asset.get("src");
    const wrapper = this.editor.DomComponents.getWrapper();
    const css = queryFrom(
      get(queryFrom(this.iframeWindow.document).one("iframe"), [
        "contentWindow",
        "window",
        "document"
      ])
    );
    const images = css.all('img[src="' + src + '"]');
    if (images && images.length) {
      images.forEach(img => {
        const ancestor = css.ancestor(img, '[data-gjs-type="mj-image"]');
        if (ancestor) {
          const ancestorWrapper = wrapper.find("#" + ancestor.id);
          ancestorWrapper[0].remove();
        }
      });
    }
    callfunc(onRemoveAsset, [asset]);
  };

  getImportButtonName() {
    return "gjs-open-import-webpage";
  }

  handleLoad = e => {
    this.iframeWindow = this.dIframe.contentWindow.window;
    this.iframeWindow.debug = this;
    this.timer = setInterval(() => {
      if (this.iframeWindow.initEditor) {
        clearInterval(this.timer);
        this.handleInitGrapesJS();
      }
    }, 10);
  };

  handleInitGrapesJS = () => {
    const {
      font,
      onEditorInit,
      onBeforeEditorInit,
      mergeTags,
      host,
      init
    } = this.props;
    const CKEDITOR = this.iframeWindow.CKEDITOR;
    CKEDITOR.dtd.$editable.span = 1;
    CKEDITOR.dtd.$editable.a = 1;
    let extraPlugins = "sharedspace,justify,colorbutton,panelbutton,font";
    const fontItems = font ? ["Font"] : [];
    fontItems.push("FontSize");
    const toolbar = [
      { name: "styles", items: fontItems },
      ["Bold", "Italic", "Underline", "Strike"],
      { name: "paragraph", items: ["NumberedList", "BulletedList"] },
      { name: "links", items: ["Link", "Unlink"] },
      { name: "colors", items: ["TextColor", "BGColor"] }
    ];
    if (mergeTags) {
      extraPlugins = host.handleMergeTags(
        mergeTags,
        CKEDITOR,
        extraPlugins,
        toolbar
      );
    }
    const plugins = ["gjs-preset-webpage", "gjs-plugin-ckeditor"];

    const initGrapesJS = {
      noticeOnUnload: false,
      clearOnRender: true,
      height: "100%",
      storageManager: {
        autosave: false,
        autoload: false,
        type: null
      },
      container: "#gjs",
      plugins,
      pluginsOpts: {
        "gjs-plugin-ckeditor": {
          position: "center",
          options: {
            startupFocus: true,
            extraAllowedContent: "*(*);*{*}", // Allows any class and any inline style
            allowedContent: true, // Disable auto-formatting, class removing, etc.
            enterMode: CKEDITOR.ENTER_BR,
            extraPlugins,
            toolbar
          }
        },
        "gjs-preset-webpage": getGjsPresetWebpage()
      },
      ...init
    };
    callfunc(onBeforeEditorInit, [{ CKEDITOR, initGrapesJS, component: this }]);

    const editor = this.iframeWindow.initEditor(initGrapesJS);
    const { BlockManager, Commands } = editor;
    this.editor = editor;
    this.initGrapesJS = initGrapesJS;
    Commands.extend("canvas-clear", {
      run() {
        host.execClean();
        return true;
      }
    });
    editor.on("load", this.handleEditorLoad);
    editor.on("asset:remove", this.handleRemoveAsset);
    this.hadleInitBlockManager(BlockManager);
    callfunc(onEditorInit, [{ editor, component: this }]);
  };

  hadleInitBlockManager = blockManager => {
    const { onInitBlockManager } = this.props;
    callfunc(onInitBlockManager, [{ blockManager, editor: this.editor }]);
  };

  handleEditorLoad = () => {
    setTimeout(() => {
      const { host, onEditorLoad, onError, design } = this.props;
      const doc = this.iframeWindow.document;
      host.execReset();
      if (design) {
        try {
          const html = fixHtml(design, this.iframeWindow.sanitizeHtml);
          this.editor.setComponents(html);
        } catch (e) {
          callfunc(onError, [
            { e, design, message: ERROR_HTML_INVALID_SYNTAX }
          ]);
          console.warn({ e, design });
        }
      }
      doc.getElementById("root").className = "";
      setTimeout(() => {
        callfunc(onEditorLoad, [{ editor: this.editor, component: this }]);
        initViewSource(host);
      }, 10);
    }, 100);
  };

  clearTimeout = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  componentWillUnmount() {
    this.clearTimeout();
  }

  render() {
    const { style, host, images, id } = this.props;
    host.execUpdateImages(get(images));
    const html = `
      <link rel="stylesheet" href="${this.getAsset("grapes.min.css")}" />
      <style>
        .gjs-pn-buttons {overflow: hidden}
        .loading {display: none}
        #root.hidden .loading {display: block; visibility: visible}
        #root.hidden {visibility: hidden}
      </style>
      <script async src="${this.getAsset("sanitize-html")}"></script>
      <script src="${this.getAsset("grapes.min.js")}"></script>
      <script src="${this.getAsset("ckeditor.js")}"></script>
      <script src="${this.getAsset(
        "grapesjs-plugin-ckeditor.min.js"
      )}"></script>
      <script src="${this.getAsset("grapesjs-preset-webpage.min.js")}"></script>
      <script>
      window.initEditor = function(init) {
         return grapesjs.init(init); 
      };
     </script>
     <div class="hidden" id="root">
      <div class="loading">Loading...</div>
      <div id="gjs"></div>
     </div> 
    `;
    const thisStyle = {
      ...Styles.iframe,
      ...style
    };
    return (
      <Iframe
        id={id}
        style={thisStyle}
        refCb={this.handleIframe}
        onLoad={this.handleLoad}
      >
        <Unsafe>{html}</Unsafe>
      </Iframe>
    );
  }
}

export default GrapesJsWeb;

const Styles = {
  iframe: {
    height: "100%"
  }
};
