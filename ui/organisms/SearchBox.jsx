import React, {isValidElement, cloneElement} from 'react';
import {FUNCTION} from 'reshow-constant';
import {mixClass, SemanticUI, List} from 'react-atomic-molecule';
import {win} from 'win-doc';
import callfunc from 'call-func';
import get from 'get-object-value';

const SearchBox = ({
  className,
  compHd,
  wrapRefCb,
  wrapStyle,
  onWrapClick,
  results,
  onItemClick,
  itemLocator,
  itemsLocator,
  resultsStyle,
  selIndex,
  ...props
}) => {
  const classes = mixClass(className, 'search');
  if (results && results.length) {
    results = (
      <List type="results" style={{...Styles.results, ...resultsStyle}}>
        {itemsLocator(results).map((itemData, key) => {
          const item = itemLocator(itemData);
          const itemClasses = mixClass(
            get(item, ['props', 'className']),
            'result',
            {
              active: selIndex - 1 === key,
            },
          );
          const itemNextProps = {className: itemClasses, key};
          if (FUNCTION === typeof onItemClick) {
            itemNextProps.onClick = e => onItemClick(e, itemData);
          }
          if (isValidElement(item)) {
            return cloneElement(item, itemNextProps);
          } else {
            return <SemanticUI {...itemNextProps}>{item}</SemanticUI>;
          }
        })}
      </List>
    );
  }
  return (
    <SemanticUI
      className={classes}
      style={wrapStyle}
      refCb={wrapRefCb}
      onClick={e => callfunc(onWrapClick, [e])}>
      {compHd}
      {/*className: prompt is for semantic-ui. https://semantic-ui.com/modules/search.html*/}
      <SemanticUI atom="input" className="prompt" type="text" {...props} />
      {results}
    </SemanticUI>
  );
};

SearchBox.defaultProps = {
  autoComplete: win().chrome ? 'none' : 'off',
};

export default SearchBox;

const Styles = {
  results: {
    display: 'block',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
};
