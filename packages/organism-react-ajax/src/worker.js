import get, {getDefault} from 'get-object-value';
import nonWorker from 'non-worker';
import req from 'superagent';

const keys = Object.keys;
const arrWs = {};

const handleMessage = e => {
  const data = get(e, ['data']);
  switch (data.type) {
    case 'initWs':
      initWs(data.ws)(data.params);
      break;
    case 'closeWs':
      closeWs(data.ws);
      break;
    case 'ajaxGet':
      ajaxGet(data);
      break;
    case 'ajaxPost':
      ajaxPost(data);
      break;
  }
};

const oNonWorker = new nonWorker().onMessage(handleMessage);
const post = oNonWorker.post;
export default oNonWorker;

const cookParams = (action, callReq) => {
  const params = get(action, ['params'], {});
  const cookHeaders = {
    ...get(params, ['globalHeaders'], {}),
    ...get(params, ['headers'], {}),
    Accept: get(params, ['accept'], 'application/json'),
  };
  params.cookHeaders = cookHeaders;
  const superagent = params.superagent || {};
  const syncKeys = ['responseType'];
  syncKeys.forEach(key => {
    if (params[key]) {
      superagent[key] = params[key];
    }
  });
  keys(superagent).forEach(key => {
    callReq = callReq[key].apply(callReq, superagent[key]);
  });
  return params;
};

const ajaxGet = ({url, action}) => {
  let callReq = req.get(url);
  const params = cookParams(action, callReq);
  callReq
    .query(params.query)
    .set(params.cookHeaders)
    .end((err, res) => {
      if (res) {
        const {error, req, text, xhr, ...response} = res;
        post({
          ...action,
          text,
          response,
        });
      }
    });
};

const ajaxPost = ({url, action}) => {
  let callReq;
  switch (get(action, ['params', 'method'])) {
    case 'delete':
      callReq = req.del(url);
      break;
    case 'head':
      callReq = req.head(url);
      break;
    case 'patch':
      callReq = req.patch(url);
      break;
    case 'put':
      callReq = req.put(url);
      break;
    default:
      callReq = req.post(url);
      break;
  }
  const {query, isSendJson, cookHeaders, responseType, ...params} = cookParams(
    action,
    callReq,
  );
  let isSend = false;
  if (isSendJson) {
    isSend = true;
  } else {
    if (null == isSendJson && query) {
      keys(query).every(key => {
        if ('object' !== typeof query[key]) {
          return true;
        }
        isSend = true;
        return false;
      });
    }
  }
  if (!isSend) {
    callReq = callReq.type('form');
  }
  callReq
    .send(query)
    .set(cookHeaders)
    .end((err, res) => {
      if (res) {
        const {error, req, text, xhr, ...response} = res;
        post({
          ...action,
          text,
          response,
        });
      }
    });
};

const closeWs = url => {
  if (arrWs[url]) {
    arrWs[url].close();
    delete arrWs[url];
  }
  return !arrWs[url];
};

class WebSocketHelper {
  isWsConnect = false;

  constructor(url, params) {
    this.ws = null;
    this.pingTimeout = null;
    this.url = url;
    this.params = params;
    this.open();
  }

  open() {
    if (this.isWsConnect) {
      return;
    }
    const url = this.url;
    const params = this.params;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = e => {
      this.isWsConnect = true;
      this.ping();
      const {messages} = params;
      if (get(messages, ['length'])) {
        messages.forEach(m => ws.send(JSON.stringify(m)));
      }
    };
    ws.onerror = e => {
      this.isWsConnect = false;
    };
    ws.onmessage = e => {
      switch (e.data) {
        case 'pong':
          break;
        default:
          post({
            type: 'ws',
            text: e.data,
            url,
          });
          break;
      }
    };
    ws.onclose = e => {
      this.isWsConnect = false;
      console.warn('WS close', url);
    };
  }

  close() {
    this.ws.close();
    clearTimeout(this.pingTimeout);
  }

  ping = () => {
    this.pingTimeout = setTimeout(() => {
      if (!this.isWsConnect) {
        console.warn(this.url, 'ajaxws-restore');
        this.open();
      } else {
        this.ws.send(JSON.stringify({type: 'ping'}));
      }
      this.ping();
    }, 15000);
  };
}

const initWs = url => params => {
  const create = () => {
    arrWs[url] = new WebSocketHelper(url, params);
  };

  if (!arrWs[url]) {
    create(url);
  }
};
