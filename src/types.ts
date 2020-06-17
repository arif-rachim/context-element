export type Reducer<Type> = (data: Type, action: Action) => Type
export type Action = { type: string, data: any, key: string, event: Event };

export type Renderer = { render: (data: any) => void, dataNode: Array<Node>, onAction: (callback: ActionCallback) => void };
export type ActionCallback = (type: Map<string, string>, event: Event) => void;
export type SetDataProvider = (oldDataProvider: Array<any>) => Array<any>;
export type DoubleMap<Type> = Map<Type,Map<Type,Type>>;
export type TripleMap<Type> = Map<Type,DoubleMap<Type>>;
export type FunctionReturnString<Type> = (data: Type) => string;
