'use strict';

import {Dispatcher} from 'flux';

const instance = new Dispatcher();
export default instance;

// So we can conveniently do, `import {dispatch} from './TodoDispatcher';`

export const popupDispatch = instance.dispatch.bind(instance);
