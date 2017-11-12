import React from 'react'; 
import { connect } from 'reshow-flux';
import {
    mixClass,
    Dimmer,
    SemanticUI
} from 'react-atomic-molecule';
import Animate from 'organism-react-animate';
import getWindowOffset from 'get-window-offset';

import { PopupOverlay } from '../organisms/PopupOverlay';
import {
    popupDispatch
} from '../../src/index';

let originBodyStyle;
if ('undefined' !== typeof document) {
    originBodyStyle = document.body.style.overflow;
}

/**
 * if you need trace show: true
 * it extend from PopupOverlay
 */
class PopupModal extends PopupOverlay
{
   static defaultProps = {
    scrolling: false,
    name: 'modal'
   };

    handleClick = () =>
    {
        popupDispatch({
            type: 'dom/closeOne',
            params: {
                popup: this 
            }
        });
        if (typeof this.props.closeCallBack === 'function') {
            this.props.closeCallBack();
        }
    }

    resize = () =>
    {
        if (this.el) {
            const offset = getWindowOffset(this.el);
            const scrollInfo = offset.scrollInfo;
            const domInfo = offset.domInfo;
            const domHalfHeight = (domInfo.bottom - domInfo.top) / 2;
            if (domInfo.top - domHalfHeight > scrollInfo.top) {
                this.el.style.marginTop = (1-domHalfHeight)+'px';
            }
        }
    }

    detach()
    {
        if ('undefined' !== typeof document) {
            document.body.style.overflow = originBodyStyle;
        }
    }

    componentDidMount()
    {
        window.addEventListener('resize', this.resize);
    }

    componentWillUnmount()
    {
        this.detach();
        window.removeEventListener('resize', this.resize);
    }

    render()
    {
        let {
            scrolling,
            appear,
            enter,
            leave,
            fullScreenStyle,
            closeEl,
            closeCallBack,
            ...props
        } = this.props;
        let containerClick = null;
        let content;
        const stateShow = this.state.show;
        if (stateShow) {
            if ('undefined' !== typeof document) {
                document.body.style.overflow = 'hidden';
            }
            if (!closeEl) {
                containerClick = this.handleClick;
            } else {
                closeEl = React.cloneElement(
                     closeEl,
                     {
                        onClick: this.handleClick,
                        key: 'close',
                        style: {
                            zIndex:1001,
                            position: 'fixed',
                            ...closeEl.props.style
                        }
                     }
                );
            }
            content = (
                <Dimmer
                    className="page modals"
                    show={stateShow}
                    center={false}
                    style={{ ...Styles.container, ...props.style }}
                    onClick={containerClick}
                    key='modals'
                >
                    <Dimmer 
                        {...props}
                        fullScreen="true" 
                        style={{
                            ...Styles.fullScreen,
                            ...fullScreenStyle,
                        }}
                        className={mixClass({scrolling: scrolling},props.className)}
                        refCb={ el=>{this.el=el;this.resize();} }
                        show={stateShow}
                    />
                </Dimmer>
            );
        } else {
            this.detach();
            closeEl = null;
        }

        return (
            <Animate {...{ appear, enter, leave }}>
                {content}
                {closeEl}
            </Animate>
        );
    }
}

const PopupModalContainer = connect(
    PopupModal,
    { withProps:true }
);

export default PopupModalContainer;

const Styles = {
    container: {
        overflow: 'auto'
    },
    fullScreen: {
        boxSizing: 'border-box',
        right: 'auto',
        bottom: 'auto'
    }
};
