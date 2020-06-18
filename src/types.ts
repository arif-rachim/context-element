export type Reducer<Type, Output> = (data: Type, action: Action<Output>) => Type
export type Action<Output> = { type: string, data: Output, key: string, event: Event };
export type Renderer = { render: (dataGetter: () => any) => void, dataNode: Node[] };
export type SetData<Type> = (oldData: Type) => Type;
export type DoubleMap<Type> = Map<Type, Map<Type, Type>>;
export type TripleMap<Type> = Map<Type, DoubleMap<Type>>;
export type FunctionReturnString<Type> = (data: Type) => string;
export type DataGetter<Output> = () => { key: string, data: Output, index: number };

export const getChangeEventName = (attribute: any) => `${attribute}Changed`;
export const isFunction = (functionToCheck: any) => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';

export const DATA_WATCH_ATTRIBUTE = 'watch';
export const DATA_KEY_ATTRIBUTE = 'data-key';
export const DATA_ACTION_ATTRIBUTE = 'action';
export const DATA_TOGGLE_ATTRIBUTE = 'toggle';
export const STATE_PROPERTY = '@state';
export const STATE_GLOBAL = '*';
export const IGNORE_CONTEXT: Array<any> = [];
