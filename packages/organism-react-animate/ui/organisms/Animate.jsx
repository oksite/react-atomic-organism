import React, {Component} from 'react';
import AnimateGroup from './AnimateGroup';
import {reactStyle, SemanticUI} from 'react-atomic-molecule';

import getKeyframe from 'keyframe-css';

let inject = {};

class Animate extends Component {
  static defaultProps = {
    component: SemanticUI,
    appear: null,
    enter: null,
    leave: null,
  };

  state = {
    receive: false,
  };

  init(key, ani, timeout) {
    reactStyle(
      {
        animationName: [ani],
        animationDuration: [timeout * 1 + 30 + 'ms'],
        ...Styles.linear,
      },
      '.' + key,
      key,
    );

    // Need locate after reactStyle, for inject latest style in getKeyframe function
    getKeyframe(ani);
    inject[key] = true;
  }

  parseAniValue(s) {
    const data = s.split('-');
    const name = data[0];
    let timeout = 500;
    let delay = 0;
    if (!isNaN(data[1])) {
      timeout = parseInt(data[1], 10);
    }
    if (!isNaN(data[2])) {
      delay = parseInt(data[2], 10);
    }
    const key = [name, timeout, delay].join('-');
    return {
      className: key + ' ' + name,
      key,
      name,
      timeout,
      delay,
    };
  }

  update(props) {
    const {appear, enter, leave} = props;
    let data;
    if (appear) {
      data = this.parseAniValue(appear);
      this.appear = data.name;
      this.appearKey = data.key;
      this.appearTimeout = data.timeout;
      this.appearDelay = data.delay;
      this.appearClass = data.className;
    }
    if (enter) {
      data = this.parseAniValue(enter);
      this.enter = data.name;
      this.enterKey = data.key;
      this.enterTimeout = data.timeout;
      this.enterDelay = data.delay;
      this.enterClass = data.className;
    }
    if (leave) {
      data = this.parseAniValue(leave);
      this.leave = data.name;
      this.leaveKey = data.key;
      this.leaveTimeout = data.timeout;
      this.leaveDelay = data.delay;
      this.leaveClass = data.className;
    }
  }

  updateClient(props) {
    if ('undefined' === typeof document) {
      return;
    }
    const {appear, enter, leave} = props;
    if (appear) {
      if (!inject[this.appearKey]) {
        this.init(this.appearKey, this.appear, this.appearTimeout);
      }
    }
    if (enter) {
      if (!inject[this.enterKey]) {
        this.init(this.enterKey, this.enter, this.enterTimeout);
      }
    }
    if (leave) {
      if (!inject[this.leaveKey]) {
        this.init(this.leaveKey, this.leave, this.leaveTimeout);
      }
    }
  }

  constructor(props) {
    super(props);
    this.update(props);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      receive: !prevState.receive,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {receive} = nextState;
    if (receive !== this.state.receive) {
      this.update(nextProps);
      this.updateClient(nextProps);
      return true;
    } else {
      return false;
    }
  }

  componentDidMount() {
    this.updateClient(this.props);
  }

  render() {
    const {appear, enter, leave, ...others} = this.props;
    return (
      <AnimateGroup
        timeout={{
          appear: this.appearTimeout,
          enter: this.enterTimeout,
          exit: this.leaveTimeout,
        }}
        delay={{
          appear: this.appearDelay,
          enter: this.enterDelay,
          exit: this.leaveDelay,
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
    animationTimingFunction: ['linear'],
  },
};
