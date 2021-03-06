import { METHOD } from '../utils/method';
import { IBaseRequestAction } from '../actions/BaseRequestAction';
import { ThrottleOptions } from './HttpServiceBuilder';
import { ACTION_TYPE_ORPHAN_REQUEST } from '../utils/actionType';

export type OrphanRequestOptions<T> = Partial<Pick<IBaseRequestAction, 'uri' | 'query' | 'body' | 'requestOptions' >> &
  {
    uri: string;
    requestOptions?: T;
    throttle?: ThrottleOptions;
  };

export class OrphanHttpService<T = object> {
  protected readonly uniqueId: number;
  protected readonly config: OrphanRequestOptions<T>;
  protected readonly method: METHOD = METHOD.get;

  constructor(config: OrphanRequestOptions<T>, method: METHOD, uniqueId: number) {
    this.config = config;
    this.uniqueId = uniqueId;
    this.method = method;
  }

  collect(): IBaseRequestAction {
    const config = this.config;
    const throttle: ThrottleOptions = config.throttle === undefined ? { duration: 0 } : config.throttle;

    const action: IBaseRequestAction = {
      uniqueId: this.uniqueId,
      body: config.body || {},
      query: config.query || {},
      successText: '',
      failText: '',
      hideError: true,
      requestOptions: config.requestOptions || {},
      uri: config.uri,
      type: {
        prepare: '',
        success: ACTION_TYPE_ORPHAN_REQUEST,
        fail: '',
      },
      method: this.method,
      useThrottle: throttle.enable !== false,
      throttleMillSeconds: throttle.duration,
      throttleKey: '',
      throttleTransfer: throttle.transfer || null,
      metaKey: false,
      metaActionName: '',
      payload: undefined,
      onPrepare: null,
      afterPrepare: null,
      onSuccess: null,
      afterSuccess: null,
      onFail: null,
      afterFail: null,
      modelName: '',
    };

    return action;
  }
}
