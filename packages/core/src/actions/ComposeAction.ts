import { BaseAction, actionProxyKeys } from './BaseAction';
import { Meta, metaReducer, IMetaAction } from '../reducers/MetaReducer';
import { BaseModel, State, StateReturn } from '../models/BaseModel';
import { setActionName } from '../utils/setActionName';
import { Action } from 'redux';
import { storeHelper } from '../stores/StoreHelper';
import { DEFAULT_META } from '../reducers/MetaReducer';

export interface IActionCompose extends Action<string>, IMetaAction {
  message?: string;
  loading: boolean;
}

export interface ComposeSubscriber<CustomData>{
  when: string;
  effect?: (state: State<CustomData>) => StateReturn<CustomData>;
  effectCallback?: () => void;
}

export const composeActionProxyKeys: {
  methods: (keyof ComposeAction<any, any>)[];
  getters: (keyof ComposeAction<any, any>)[];
} = {
  methods: [
    'onSuccess', 'onPrepare', 'onFail',
    'afterSuccess', 'afterPrepare', 'afterFail',
    'getPrepareType', 'getFailType',
    ...actionProxyKeys.methods
  ],
  getters: ['meta', 'loading', ...actionProxyKeys.getters],
};

// FIXME: 这里的Meta是子集，也许有必要做一个ComposeMeta
export class ComposeAction<Data, Runner extends (...args: any[]) => Promise<any>> extends BaseAction<Data> {
  protected readonly runner: Runner;
  private __prepareType?: string;
  private __failType?: string;

  constructor(model: BaseModel<Data>, runner: Runner, fromSubClass: boolean = false) {
    super(model);
    this.runner = runner;

    return fromSubClass ? this : this.proxy();
  }

  public get meta(): Meta {
    return metaReducer.getMeta(this.getActionName()) || DEFAULT_META;
  }

  public get loading(): boolean {
    return this.meta.loading;
  }

  /**
   * @override
   */
  protected getProxyMethods(): string[] {
    return composeActionProxyKeys.methods;
  }

  /**
   * @override
   */
  protected getProxyGetters(): string[] {
    return composeActionProxyKeys.getters;
  }

  protected getProxyFn(): Function {
    return (...args: Parameters<Runner>): Promise<any> => {
      const actionName = this.getActionName();

      storeHelper.dispatch<IActionCompose>({
        type: this.getPrepareType(),
        metaKey: true,
        metaActionName: actionName,
        loading: true,
      });

      return this
        .runner(...args)
        .then((result) => {
          storeHelper.dispatch<IActionCompose>({
            type: this.getSuccessType(),
            metaKey: true,
            metaActionName: actionName,
            loading: false,
          });

          return result;
        })
        .catch((e: Error) => {
          storeHelper.dispatch<IActionCompose>({
            type: this.getFailType(),
            metaKey: true,
            metaActionName: actionName,
            message: e.message,
            loading: false,
          });

          return Promise.reject(e);
        });
    };
  }

  /**
   * @override
   */
  public/*protected*/ setName(name: string | number): void {
    super.setName(name);
    this.__prepareType = this.__actionName + ' prepare';
    this.__failType = this.__actionName + ' fail';
  }

  public getPrepareType(): string {
    return this.__prepareType || setActionName(this).__prepareType!;
  }

  public getFailType(): string {
    return this.__failType || setActionName(this).__failType!;
  }

  public onSuccess<CustomData>(effect: NonNullable<ComposeSubscriber<CustomData>['effect']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getSuccessType(),
      effect,
    };
  }

  public afterSuccess<CustomData>(callback: NonNullable<ComposeSubscriber<CustomData>['effectCallback']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getSuccessType(),
      effectCallback: callback,
    };
  }

  public onPrepare<CustomData>(effect: NonNullable<ComposeSubscriber<CustomData>['effect']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getPrepareType(),
      effect,
    };
  }

  public afterPrepare<CustomData>(callback: NonNullable<ComposeSubscriber<CustomData>['effectCallback']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getPrepareType(),
      effectCallback: callback,
    };
  }

  public onFail<CustomData>(effect: NonNullable<ComposeSubscriber<CustomData>['effect']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getFailType(),
      effect,
    };
  }

  public afterFail<CustomData>(callback: NonNullable<ComposeSubscriber<CustomData>['effectCallback']>): ComposeSubscriber<CustomData> {
    return {
      when: this.getFailType(),
      effectCallback: callback,
    };
  }
}
