export type Reducer<T, O> = (data: T, action: Action<O>) => T
export type Action<O> = { type: string, data: O, key: string, event: Event };
export type Renderer = { render: (dataGetter: () => any) => void, nodes: ChildNode[] };
export type DataSetter<O> = (oldData: O) => O;
export type DoubleMap<O> = Map<O, Map<O, O>>;
export type TripleMap<O> = Map<O, DoubleMap<O>>;
export type ToString<O> = (data: O) => string;
export type DataGetter<O> = () => DataGetterValue<O>;
export type DataGetterValue<O> = { key?: string, data: O, index?: number };
export type UpdateDataCallback<O> = (value: DataSetter<O>) => void;
export type TypeStateAttribute = { activeNode: ChildNode; typeStateAttribute: Map<string, DoubleMap<string>> };

export const composeChangeEventName = (attribute: any) => `${attribute}Changed`;
export const hasValue = (param: any) => param !== undefined && param !== null && param !== '';
export const hasNoValue = (param: any) => !hasValue(param);

export const DATA_WATCH_ATTRIBUTE = 'watch';
export const DATA_KEY_ATTRIBUTE = 'data-key';
export const DATA_ACTION_ATTRIBUTE = 'action';
export const DATA_TOGGLE_ATTRIBUTE = 'toggle';
export const STATE_PROPERTY = '@state';
export const STATE_GLOBAL = '*';
export const IGNORE_DATA: any = "IGNORE_DATA";
export const HIDE_CLASS: string = "data-element-hidden";
