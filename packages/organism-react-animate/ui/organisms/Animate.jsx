import React, {Component} from 'react';
import AnimateGroup from './AnimateGroup';
import {
    reactStyle,
    SemanticUI
} from 'react-atomic-molecule';

import getKeyframe from 'keyframe-css';

let inject = {};

class Animate extends Component
{
    static defaultProps = {
        component: SemanticUI,
        appear: null,
        enter: null,
        leave: null
    }

    constructor(props)
    {
        super(props);
        this.update(props);
    }

    componentDidMount()
    {
        this.updateClient(this.props);
    }

    componentWillReceiveProps(nextProps)
    {
        this.update(nextProps);
        if ('undefined' !== typeof document) {
            this.updateClient(nextProps);
        }
    }

    init(key, ani, timeout)
    {
        reactStyle({
            ...{
                animationName: [ani],
                animationDuration: [timeout+'ms']
            },
            ...Styles.linear, 
        }, '.'+key);

        // Need locate after reactStyle, for inject latest style in getKeyframe function
        getKeyframe(ani);
        inject[key] = true;
    }

    parseAniValue(s)
    {
        let data = s.split('-');
        if (!isNaN(data[1])) {
            data[1] = parseInt(data[1],10);
        } else {
            data[1] = 500;
        }
        return {
            name: data[0],
            timeout: data[1]
        };
    }

    update(props)
    {
        const { 
            appear,
            enter,
            leave
        } = props;
        let data;
        if (appear) {
            data = this.parseAniValue(appear);
            this.appear = data.name;
            this.appearTimeout = data.timeout;
            this.appearClass = appear+ ' '+ data.name;
        }
        if (enter) {
            data = this.parseAniValue(enter);
            this.enter = data.name;
            this.enterTimeout = data.timeout;
            this.enterClass = enter+ ' '+ data.name;
        }
        if (leave) {
            data = this.parseAniValue(leave);
            this.leave = data.name;
            this.leaveTimeout = data.timeout;
            this.leaveClass = leave+ ' '+ data.name;
        }
    }

    updateClient(props)
    {
        const { 
            appear,
            enter,
            leave
        } = props;
        if (appear) {
            if (!inject[appear]) {
                this.init(appear, this.appear, this.appearTimeout);
            }
        }
        if (enter) {
            if (!inject[enter]) {
                this.init(enter, this.enter, this.enterTimeout);
            }
        }
        if (leave) {
            if (!inject[leave]) {
                this.init(leave, this.leave, this.leaveTimeout);
            }
        }
    }

    render()
    {
        const {
            appear,
            enter,
            leave,
            ...others
        } = this.props;
        return (
            <AnimateGroup
                timeout={{
                    appear: this.appearTimeout,
                    enter: this.enterTimeout,
                    exit: this.leaveTimeout
                }}
                classNames={{
                    appear: this.appearClass,
                    enter: this.enterClass,
                    exit: this.leaveClass,
                }}
                appear={!!appear}
                enter={!!enter}
                exit={!!leave}
                {...others}
            />
        );
    }
}

export default Animate;

const Styles = {
    linear: {
        animationIterationCount: [1],
        animationTimingFunction: ['linear']
    }
};
