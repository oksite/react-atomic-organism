require("setimmediate");
import React, {PureComponent} from 'react'; 
import ReactDOM from 'react-dom';
import get from 'get-object-value';
import { SemanticUI } from 'react-atomic-molecule';
import {js} from 'create-el';

import IframeContainer from '../organisms/IframeContainer';

const keys = Object.keys;

class Iframe extends PureComponent
{
    html = null;

    appendHtml = (html)=>
    {
        let div = document.createElement('div');
        div.innerHTML = html;
        const root = get(
            this.root,
            ['childNodes', 0, 'childNodes', 0],
            this.root
        );
        root.appendChild(div);
        this.handleScript(div);
    }

    getBody = ()=>
    {
        return this.el.contentWindow.document.body;
    }

    handleScript = (el) =>
    {
        // init variable
        let scriptCount = 0;
        let inlineScripts=[];
        let queueScripts=[];
        let handleScriptOnload = (i) => {
            if (i) {
                delete(queueScripts[i]);
            }
            if (!keys(queueScripts).length) {
                inlineScripts.forEach((script, key)=>{
                    this.el.contentWindow.window.eval(script);
                });
                inlineScripts = [];
            }
        };

        // start to parse
        const scripts = el.getElementsByTagName('script'); 
        let i=0;
        for (let i=0, len=scripts.length; i < len; i++) {
            const script = scripts[i]; 
            const src = get(script, ['src']);
            if (src) {
                const key = 'id-'+scriptCount;
                const dScript = js(this.root.parentNode)(()=>handleScriptOnload(key))(src, {key});
                queueScripts[key] = true;
                scriptCount++;
            } else {
                inlineScripts.push(script.innerHTML);
            }
        }
        handleScriptOnload();
    }

    renderIframe(props)
    {
        const {children} = props;

        // setTimeout for https://gist.github.com/HillLiu/013d94ce76cfb7e8c46dd935164e4d72
        setImmediate(()=>{
            this.html = this.root.innerHTML;
            ReactDOM.render(
               <SemanticUI>{children}</SemanticUI>,
               this.root,
               () => {
                    const html = this.root.innerHTML;
                    if (html !== this.html) {
                        this.handleScript(this.root);
                    }
               }
            );
        });
    }

    componentDidMount()
    {
        this.root = document.createElement('div');
        this.getBody().appendChild(this.root);
        this.renderIframe(this.props);
    } 

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        this.renderIframe(this.props);
    }
    
    componentWillUnmount()
    {
        // https://facebook.github.io/react/docs/react-dom.html#unmountcomponentatnode
        ReactDOM.unmountComponentAtNode(this.root);
    }

    render()
    {
        const {children, ...others} = this.props;
        return (
            <IframeContainer
                {...others}
                refCb={el=>this.el=el}
            />
        ); 
    }
}

export default Iframe;
