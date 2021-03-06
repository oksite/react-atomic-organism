import React, {
  PureComponent,
  cloneElement,
  createElement,
  isValidElement,
} from 'react';
import {
  build,
  mixClass,
  reactStyle,
  Icon,
  Rail,
  SemanticUI,
} from 'react-atomic-molecule';
import Hamburger from 'ricon/HamburgerToArrow';
import {connect} from 'reshow-flux';
import get, {toJS} from 'get-object-value';
import {hasClass, removeClass} from 'class-lib';
import {queryOne} from 'css-query-selector';
import getOffset from 'getoffset';
import callfunc from 'call-func';

const keys = Object.keys;

import {navigationStore, navigationDispatch} from '../../src/index';

const getMenuByArray = onClick => (arr, component, active, menuOrder) => {
  if (!arr) {
    return null;
  }
  const results = [];
  const buildComp = build(component);
  if (!menuOrder) {
    menuOrder = keys(arr);
  }
  menuOrder.forEach(key => {
    const {href, text, className, ...others} = arr[key];
    const classes = mixClass(className, 'item', {
      active: active === key,
    });
    results.push(
      buildComp(
        {
          ...others,
          key,
          href,
          name: key,
          className: classes,
          onClick,
        },
        text,
      ),
    );
  });
  return results;
};

const DefaultIcon = ({
  className,
  on,
  right,
  onClick,
  iconStyle,
  hamburgerStyle,
}) => (
  <Icon
    onClick={onClick}
    className={mixClass(className, 'hamburger-icon')}
    styles={reactStyle(
      {
        ...Styles.icon,
        ...iconStyle,
      },
      false,
      false,
    )}>
    <Hamburger
      on={on}
      right={right}
      styles={reactStyle(
        {
          ...Styles.hamburger,
          ...hamburgerStyle,
        },
        false,
        false,
      )}
    />
  </Icon>
);

class SideMenu extends PureComponent {
  static getStores() {
    return [navigationStore];
  }

  static defaultProps = {
    component: SemanticUI,
    linkComponent: 'a',
    menus: [],
    root: null,
    rootActiveClass: 'side-menu-active',
    rootInactiveClass: 'side-menu-inactive',
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const {on} = nextProps;
    if (on !== prevState.prePropsOn) {
      return {
        on,
        prePropsOn: on,
      };
    } else {
      return null;
    }
  }

  static calculateState(prevState, props) {
    let id = get(props, ['id'], 'default');
    const state = navigationStore.getState();
    const settings = state.get(id);
    const storeOn = get(settings, ['on']);
    let on;
    if ('undefined' === typeof storeOn) {
      on = prevState.on;
    } else {
      on = storeOn;
    }
    return {
      on,
      activeMenu: get(settings, ['activeMenu']),
    };
  }

  getRoot() {
    const {root} = this.props;
    let thisRoot = root;
    if (!thisRoot) {
      thisRoot = document.body;
    }
    return thisRoot;
  }

  updateRoot(on) {
    const {rootActiveClass, rootInactiveClass} = this.props;
    const thisRoot = this.getRoot();
    if (!thisRoot) {
      console.wanr('root not found');
      return;
    }
    if (on) {
      thisRoot.className = mixClass(thisRoot.className, rootActiveClass);
      thisRoot.className = removeClass(thisRoot.className, rootInactiveClass);
    } else {
      thisRoot.className = mixClass(thisRoot.className, rootInactiveClass);
      thisRoot.className = removeClass(thisRoot.className, rootActiveClass);
    }
  }

  handleSwitch(stateOn, e) {
    const {id, onSwitch} = this.props;
    const isValidStateOn = 'boolean' === typeof stateOn;
    const on = !(isValidStateOn ? stateOn : this.state.on);
    const defaultOff = getOffset(queryOne('.sidebar .default-off'));
    const isSet = isValidStateOn || (defaultOff.w && defaultOff.h);
    if (isSet) {
      navigationDispatch({
        id,
        params: {on},
      });
    }
    callfunc(onSwitch, [e, on, isSet]);
  }

  componentDidMount() {
    const {on} = this.state;
    if ('undefined' !== typeof on) {
      this.updateRoot(on);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {on} = this.state;
    if (on !== prevState.on) {
      this.updateRoot(on);
    }
  }

  componentWillUnmount() {
    const {rootActiveClass, rootInactiveClass} = this.props;
    const thisRoot = this.getRoot();
    thisRoot.className = removeClass(thisRoot.className, rootActiveClass);
    thisRoot.className = removeClass(thisRoot.className, rootInactiveClass);
  }

  render() {
    const {
      onSwitch,
      fixedMini,
      defaultOnIcon,
      defaultOffIcon,
      iconStyle,
      hamburgerStyle,
      component,
      linkComponent,
      className,
      menus,
      menuOrder,
      root,
      rootActiveClass,
      rootInactiveClass,
      ...others
    } = this.props;
    const {activeMenu, on} = this.state;
    const isInit = !on && false !== on;
    const menuItems = getMenuByArray(this.handleSwitch.bind(this, null))(
      toJS(menus),
      linkComponent,
      activeMenu,
      toJS(menuOrder),
    );
    const menuElement = build(component)(others, menuItems);
    let thisDefaultOnIcon = null;
    let thisDefaultOffIcon = defaultOffIcon;
    let defaultOff = isInit ? false : on;
    if (!thisDefaultOffIcon) {
      thisDefaultOffIcon = <DefaultIcon />;
    }
    thisDefaultOffIcon = cloneElement(thisDefaultOffIcon, {
      on: defaultOff,
      onClick: this.handleSwitch.bind(this, defaultOff),
      className: 'default-off',
      iconStyle,
      hamburgerStyle,
    });
    if (!fixedMini) {
      let defaultOn = isInit ? true : on;
      thisDefaultOnIcon = defaultOnIcon;
      if (!thisDefaultOnIcon) {
        thisDefaultOnIcon = <DefaultIcon />;
      }
      thisDefaultOnIcon = cloneElement(thisDefaultOnIcon, {
        on: true,
        right: !defaultOn,
        onClick: this.handleSwitch.bind(this, defaultOn),
        className: 'default-on',
        iconStyle,
        hamburgerStyle,
      });
    }
    const classes = mixClass(
      {
        active: on,
        inactive: on === false,
      },
      'sidebar',
      className,
    );
    return (
      <Rail className={classes}>
        {menuElement}
        {thisDefaultOnIcon}
        {thisDefaultOffIcon}
      </Rail>
    );
  }
}

export default connect(
  SideMenu,
  {withProps: true},
);

const Styles = {
  icon: {
    background: '#000',
    padding: 5,
    width: 24,
    height: 24,
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1,
    cursor: 'pointer',
    opacity: '.5',
    transition: ['all 0.2s ease-out'],
  },
  hamburger: {
    fill: '#fff',
  },
};
