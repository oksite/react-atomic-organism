import React, { PureComponent, useEffect } from "react";
import { createPortal } from "react-dom";
import get from "get-object-value";
import getOffset from "getoffset";
import smoothScrollTo from "smooth-scroll-to";
import exec from "exec-script";
import { SemanticUI, Unsafe } from "react-atomic-molecule";
import { queryFrom } from "css-query-selector";
import callfunc from "call-func";

import IframeContainer from "../organisms/IframeContainer";

const keys = Object.keys;

const IframeInner = ({ children, inlineCSS, onLoad }) => {
  useEffect(() => {
    callfunc(onLoad);
  }, [children]);
  return (
    <SemanticUI>
      <Unsafe atom="style">
        {() =>
          inlineCSS || "body {padding: 0; margin: 0; background: transparent;}"
        }
      </Unsafe>
      {children}
    </SemanticUI>
  );
};

class Iframe extends PureComponent {
  static defaultProps = {
    disableSmoothScroll: false,
    keepTargetInIframe: false,
    initialContent: "<html><body /></html>",
    autoHeight: false,
    onLoadDelay: 500
  };

  html = null;

  execStop = null;

  appendHtml = html => {
    let div = document.createElement("div");
    div.innerHTML = html;
    const root = get(this.root, ["childNodes", 0, "childNodes", 0], this.root);
    root.appendChild(div);
    this.handleScript(div);
  };

  postHeight = () => this.iframe.postHeight(this.getWindow());

  scrollToEl = el => {
    const pos = getOffset(el);
    if (pos.rect) {
      smoothScrollTo(pos.rect.top);
    }
  };

  getBody = () => get(this.getDoc(), ["body"]);

  getDoc = () => get(this.getWindow(), ["document"]);

  getWindow = () => get(this.el, ["contentWindow", "window"]);

  handleBodyClick = e => {
    const { keepTargetInIframe, disableSmoothScroll, onLinkClick } = this.props;
    const query = queryFrom(() => this.getBody());
    const evTarget = e.target;
    const link =
      evTarget.nodeName === "A" ? evTarget : query.ancestor(evTarget, "a");
    if (!link) {
      return;
    }
    if (link.target && "_blank" === link.target.toLowerCase()) {
      return;
    }

    const isContinue = callfunc(onLinkClick, [e, link]);

    if (false === isContinue) {
      e.preventDefault();
      return;
    }

    if (link.hash && !disableSmoothScroll) {
      let tarDom;
      try {
        tarDom = query.one(link.hash);
      } catch (e) {
        const tarId = decodeURIComponent(link.hash.substr(1));
        tarDom = query.one(`[id="${tarId}"]`) || query.one(`[name="${tarId}"]`);
      }
      if (!tarDom) {
        console.warn("Can not handle hash", { e });
        return;
      } else {
        const URI = document.location;
        if (URI.pathname === link.pathname && URI.host === link.host) {
          e.preventDefault();
          this.scrollToEl(tarDom);
          return;
        }
      }
    }

    if (keepTargetInIframe) {
      return;
    } else {
      e.preventDefault();
      if (link.href) {
        location.href = link.href;
      }
    }
  };

  handleLinkClick() {
    const body = this.getBody();
    if (!body) {
      return;
    }
    body.removeEventListener("click", this.handleBodyClick);
    body.addEventListener("click", this.handleBodyClick);
  }

  handleScript = el => {
    const win = this.getWindow();
    if (win) {
      this.execStop = exec(el, win, this.root.parentNode);
    }
  };

  handleRef = el => (this.iframe = el);

  handleRefCb = el => {
    if (el) {
      const { refCb } = this.props;
      this.el = el;
      callfunc(refCb, [el]);
    }
  };

  renderIframe(props) {
    if (!this.root) {
      this.init();
    }
    const root = this.root;

    const { children, autoHeight, onLoadDelay, onLoad, inlineCSS } = props;

    this.html = root.innerHTML;
    const callback = () => {
      const html = root.innerHTML;
      if (html !== this.html) {
        this.handleScript(root);
        this.handleLinkClick();
        this.onLoadTimer = setTimeout(() => {
          if (autoHeight) {
            this.postHeight();
          }
          callfunc(onLoad);
        }, onLoadDelay);
      }
    };
    return createPortal(
      <IframeInner {...props} inlineCSS={inlineCSS} onLoad={callback} />,
      this.root
    );
  }

  init() {
    const { initialContent, onUnload, onBeforeUnload, autoHeight } = this.props;
    this.root = document.createElement("div");
    const doc = this.getDoc();
    if (doc) {
      // fixed firfox innerHTML suddenly disappear.
      doc.open("text/html", "replace");
      doc.write(initialContent);
      doc.close();

      const body = this.getBody();
      body.appendChild(this.root);
      body.addEventListener("unload", onUnload);
      body.addEventListener("beforeunload", onBeforeUnload);
    }
  }

  componentDidMount() {
    !this.root && this.forceUpdate();
  }

  componentWillUnmount() {
    if (this.onLoadTimer) {
      clearTimeout(this.onLoadTimer);
    }
    callfunc(this.execStop);
    callfunc(this.props.onUnmount);
  }

  render() {
    const {
      inlineCSS,
      initialContent,
      children,
      keepTargetInIframe,
      disableSmoothScroll,
      refCb,
      autoHeight,
      onLinkClick,
      onLoad,
      onLoadDelay,
      onUnload,
      onBeforeUnload,
      onUnmount,
      ...others
    } = this.props;
    if (autoHeight) {
      others.scrolling = "no";
    }
    return (
      <IframeContainer
        {...others}
        ref={this.handleRef}
        refCb={this.handleRefCb}
      >
        {this.el && this.renderIframe(this.props)}
      </IframeContainer>
    );
  }
}

export default Iframe;
