import React, {useState, useEffect, useReducer, useMemo} from 'react';
import {build, SemanticUI} from 'react-atomic-molecule';
import callfunc from 'call-func';

const keys = Object.keys;

export const UNMOUNTED = 'unmounted';
export const EXITSTART = 'exit-start';
export const EXITING = 'exiting';
export const EXITED = 'exited';
export const ENTERSTART = 'enter-start';
export const ENTERING = 'entering';
export const ENTERED = 'entered';

const reducer = (state, action) => {
  keys(action).forEach(key => (state[key] = action[key]));
  return state;
};

const getTimeouts = timeout => {
  let exit, enter, appear;

  exit = enter = appear = timeout;

  if (timeout != null && typeof timeout !== 'number') {
    exit = timeout.exit;
    enter = timeout.enter;
    // TODO: remove fallback for next major
    appear = timeout.appear !== undefined ? timeout.appear : enter;
  }
  return {exit, enter, appear};
};

const setNextCallback = callback => {
  let active = true;
  const nextCallback = event => {
    if (active) {
      callfunc(callback, [event]);
    }
    nextCallback.reset();
  };
  nextCallback.reset = () => {
    active = false;
  };
  return nextCallback;
};

const cancelNextCallback = (state, dispatch) => {
  if (state.nextCallback !== null) {
    state.nextCallback.reset();
    dispatch({nextCallback: null});
  }
};

const Transition = ({
  component,
  children,
  mountOnEnter,
  unmountOnExit,
  appear,
  enter,
  exit,
  timeout,
  addEndListener,
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  ...props
}) => {
  const [state, dispatch] = useReducer(reducer, {
    in: null,
    callbackWith: null,
    nextCallback: null,
    init: false,
    node: false,
  });

  const [status, setStatus] = useState(() => {
    const thisAppear = appear;
    let initialStatus;
    if (props.in) {
      if (thisAppear) {
        initialStatus = EXITED;
      } else {
        initialStatus = ENTERED;
      }
    } else {
      if (unmountOnExit || mountOnEnter) {
        initialStatus = UNMOUNTED;
      } else {
        initialStatus = EXITED;
      }
    }
    return initialStatus;
  });

  useEffect(() => {
    if (state.callbackWith === status) {
      callfunc(state.nextCallback, [status]);
    }

    const safeSetState = (nextStatus, callback) => {
      // This shouldn't be necessary, but there are weird race conditions with
      // setState callbacks and unmounting in testing, so always make sure that
      // we can cancel any pending setState callbacks after we unmount.
      dispatch({
        callbackWith: nextStatus,
        nextCallback: callback ? setNextCallback(callback) : null,
      });
      setStatus(nextStatus);
    };

    const onTransitionEnd = (node, timeout, handler) => {
      if (state.timer) {
        clearTimeout(state.timer);
      }
      const callback = setNextCallback(() => {
        callfunc(handler);
        callfunc(addEndListener, [{node, state, status}]);
      });
      dispatch({
        nextCallback: callback,
        timer: setTimeout(
          () => callfunc(state.nextCallback, ['onTransitionEnd']),
          timeout || 0,
        ),
      });
    };

    const perform = ({
      step1,
      step1Cb,
      step2,
      step2Cb,
      step3,
      step3Cb,
      goToLast,
      isAppear,
      timeout,
    }) => {
      const last = () => {
        onTransitionEnd(state.node, timeout, () => {
          safeSetState(step3, () => callfunc(step3Cb, [state.node, isAppear]));
        });
      };
      if (goToLast) {
        last();
      } else {
        safeSetState(step1, () => {
          callfunc(step1Cb, [state.node, isAppear]);
          safeSetState(step2, () => {
            callfunc(step2Cb, [state.node, isAppear]);
            last();
          });
        });
      }
    };

    const updateStatus = (mounting, nextStatus) => {
      if (nextStatus !== null) {
        // nextStatus will always be ENTERING or EXITING.
        cancelNextCallback(state, dispatch);
        const timeouts = getTimeouts(timeout);
        if (nextStatus === ENTERING) {
          perform({
            step1: ENTERSTART,
            step1Cb: onEnter,
            step2: ENTERING,
            step2Cb: onEntering,
            step3: ENTERED,
            step3Cb: onEntered,
            goToLast: (mounting && !appear) || (!mounting && !enter),
            isAppear: mounting,
            timeout: mounting ? timeouts.appear : timeouts.enter,
          });
        } else {
          perform({
            step1: EXITSTART,
            step1Cb: onExit,
            step2: EXITING,
            step2Cb: onExiting,
            step3: EXITED,
            step3Cb: onExited,
            goToLast: !exit,
            timeout: timeouts.exit,
          });
        }
      } else if (unmountOnExit && status === EXITED) {
        safeSetState(UNMOUNTED);
      }
    };

    let nextStatus = null;
    let mounting = null;
    if (state.in !== props.in) {
      mounting = false;
      dispatch({in: props.in});
      if (props.in) {
        if (status !== ENTERING && status !== ENTERED) {
          nextStatus = ENTERING;
        } else if (!state.init) {
          dispatch({init: true});
          if (appear) {
            nextStatus = ENTERING;
            mounting = true;
          }
        }
      } else {
        if (status === ENTERING || status === ENTERED) {
          nextStatus = EXITING;
        }
      }
    }
    updateStatus(mounting, nextStatus);

    return () => {
      // useEffect clean
      if (state.timer) {
        clearTimeout(state.timer);
      }
    };
  }, [props.in, status]);

  return useMemo(() => {
    let myChild = undefined;
    if (status !== UNMOUNTED) {
      const nextProps = {...props};
      delete nextProps.in;
      myChild = build(children)(nextProps);
    }
    return build(component)(
      {
        'data-status': status,
        refCb: el => dispatch({node: el}),
      },
      myChild,
    );
  }, [props]);
};

Transition.defaultProps = {
  component: SemanticUI,
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  enter: true,
  exit: true,

  onEnter: false,
  onEntering: false,
  onEntered: false,

  onExit: false,
  onExiting: false,
  onExited: false,
};

export default Transition;
