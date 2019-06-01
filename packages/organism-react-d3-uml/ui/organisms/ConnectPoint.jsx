import React, {PureComponent} from 'react';
import {build} from 'react-atomic-molecule';
import {DragAndDrop} from 'organism-react-graph';
import {mouse, toSvgXY} from 'getoffset';
import get from 'get-object-value';
import callfunc from 'call-func';
import {queryAncestor} from 'css-query-selector';

// files
import ConnectPointDefaultLayout from '../molecules/ConnectPointDefaultLayout';

let connPointId = 1;
const keys = Object.keys;

class ConnectPoint extends PureComponent {
  static defaultProps = {
    component: ConnectPointDefaultLayout,
  };

  state = {
    start: null,
    absX: 0,
    absY: 0,
  };

  start = false;
  dnd = null;
  lines = {};

  getEl = () => {
    if (this.dnd) {
      return callfunc(this.dnd.getEl, null, this.dnd);
    }
  };

  handleDragStart = e => {
    const {start} = e;
    const {onDragStart, host} = this.props;
    callfunc(onDragStart, [true]);
    const lineId = host.oConn.addLine();
    start.center = this.getCenter();
    start.lineId = lineId;
    this.setState({start});
    host.setConnectStartPoint(this);
  };

  handleDrag = e => {
    const {absX, absY, sourceEvent} = e;
    this.setState({absX, absY});
    const {host} = this.props;
    const {lineId, center} = this.state.start;
    let endXY;
    const target = e.destTarget;
    if (target) {
      let targetId = target.getAttribute('data-id');
      let targetGroup = target.getAttribute('data-group');
      if (!targetId && !targetGroup) {
        const pDom = queryAncestor(target, '[data-id]');
        if (pDom) {
          targetId = pDom.getAttribute('data-id');
          targetGroup = pDom.getAttribute('data-group');
        }
      }
      if (targetId && targetGroup) {
        const targetBox = host.getBox(targetId, targetGroup);
        const targetPoint = targetBox.getConnectPoint(center);
        endXY = targetPoint.getCenter();
        host.setConnectEndPoint(targetPoint);
      }
    }
    if (!endXY) {
      host.setConnectEndPoint(null);
      const hostEl = host.getVectorEl();
      const end = mouse(sourceEvent, hostEl);
      endXY = host.applyXY(end[0], end[1]);
    }
    host.oConn.updateLine(lineId, {start: center, end: endXY});
  };

  handleDragEnd = e => {
    const {lineId} = this.state.start;
    const {onDragStart, host} = this.props;
    const oConn = host.oConn;
    const endPoint = host.getConnectEndPoint();
    let isAddConnected = false;
    if (endPoint) {
      isAddConnected = oConn.addConnected(lineId, this, endPoint);
    }

    // after connected
    this.setState({start: null});
    host.setConnectStartPoint(null);
    if (!endPoint || !isAddConnected) {
      oConn.deleteLine(lineId);
    }
    callfunc(onDragStart, [false]);
  };

  setLine(id, type) {
    this.lines[id] = type;
  }

  delLine(id) {
    delete this.lines[id];
  }

  getVectorCenter(el, host) {
    const bbox = el.getBBox();
    const {left, top, width, height} = el.getBoundingClientRect();
    const x = width / 2 + bbox.x;
    const y = height / 2 + bbox.y;
    return host.applyXY(x, y, el);
  }

  getHtmlCenter(el, host) {
    const {left, top, width, height} =
      el && el.getBoundingClientRect
        ? el.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
          };
    const x = width / 2 + left;
    const y = height / 2 + top;
    const hostEl = host.getVectorEl();
    const sXY = toSvgXY(hostEl)(x, y);
    return host.applyXY(sXY.x, sXY.y);
  }

  getCenter() {
    const {host} = this.props;
    const el = this.getEl();
    let center;
    if (host.insideVector(el)) {
      center = this.getVectorCenter(el, host);
    } else {
      if (host.insideHtml(el)) {
        center = this.getHtmlCenter(el, host);
      }
    }
    return center;
  }

  getBox() {
    const {host, boxId, boxGroupId} = this.props;
    return host.getBox(boxId, boxGroupId);
  }

  getBoxGroupName() {
    return this.getBox()
      .getBoxGroup()
      .getName();
  }

  getId() {
    return this.id;
  }

  isShow() {
    let {show} = this.props;
    if (this.state.start) {
      show = true;
    }
    const linesLen = keys(this.lines).length;
    if (linesLen) {
      show = true;
    }
    return show;
  }

  handleEl = el => {
    if (el) {
      this.dnd = el;
    }
  };

  constructor(props) {
    super(props);
    this.id = connPointId;
    connPointId++;
  }

  componentDidMount() {
    const {onMount} = this.props;
    onMount(this);
  }

  componentWillUnmount() {
    const lineKeys = keys(this.lines);
    if (lineKeys.length) {
      const {host} = this.props;
      lineKeys.forEach(lineId => host.oConn.deleteLine(lineId));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {boxGroupAbsX, boxGroupAbsY} = this.props;
    const {boxGroupAbsX: prevBoxGroupAbsX, boxGroupAbsY: prevBoxGroupAbsY} = prevProps || {};
    if (
      boxGroupAbsX === prevBoxGroupAbsX &&
      boxGroupAbsY === prevBoxGroupAbsY
    ) {
      return;
    }
    const lineKeys = keys(this.lines);
    if (lineKeys.length) {
      const {host} = this.props;
      const center = this.getCenter();
      lineKeys.forEach(lineId => {
        const lineType = this.lines[lineId];
        if ('from' === lineType) {
          host.oConn.updateLine(lineId, {start: center});
        } else {
          host.oConn.updateLine(lineId, {end: center});
        }
      });
    }
  }

  render() {
    const {
      host,
      boxId,
      boxGroupId,
      boxGroupAbsX,
      boxGroupAbsY,
      onDragStart,
      onMount,
      show,
      component,
      ...props
    } = this.props;
    const {absX, absY} = this.state;
    return (
      <DragAndDrop
        {...props}
        data-id={this.id}
        absX={absX}
        absY={absY}
        data-is-show={this.isShow()}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDrag={this.handleDrag}
        ref={this.handleEl}
        component={component}
      />
    );
  }
}

export default ConnectPoint;
