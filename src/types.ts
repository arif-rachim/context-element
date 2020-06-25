export interface Action{
    type: string;
    event: Event;
}
export interface ArrayAction<T> extends Action{
    data:T;
    index:number;
    key:string;
}

export type Reducer<T> = (data: T, action: Action|ArrayAction<T>) => T

export type Renderer = { render: (dataGetter: () => any) => void, nodes: ChildNode[] };
export type DataSetter<T> = (oldData: T) => T;
export type ToString<T> = (data: T) => string;
export type DataGetter<O> = () => DataGetterValue<O> | ArrayDataGetterValue<O>;

export interface DataGetterValue<T> {
    data: T;
}
export interface ArrayDataGetterValue<T> extends DataGetterValue<T[]>{
    key: string;
    index: number;
}


export type UpdateDataCallback<O> = (value: DataSetter<O>) => void;

export const composeChangeEventName = (attribute: any) => `${attribute}Changed`;
export const hasValue = (param: any) => param !== undefined && param !== null && param !== '';
export const hasNoValue = (param: any) => !hasValue(param);
export const contains = (text: string, texts: string[]) => texts.reduce((acc, txt) => acc || text.indexOf(txt) >= 0, false);

export const DATA_WATCH_ATTRIBUTE = 'watch';
export const DATA_ACTION_ATTRIBUTE = 'action';
export const DATA_TOGGLE_ATTRIBUTE = 'toggle';
export const STATE_PROPERTY = '_state';
export const STATE_GLOBAL = '*';
export const DATA_KEY_ATTRIBUTE = 'data.key';
export const HIDE_CLASS: string = "data-element-hidden";
export const ARRAY_CONTEXT_ELEMENT_TAG_NAME = 'context-array';
export const CONTEXT_ELEMENT_TAG_NAME = 'context-element';

const style = document.createElement('style');
style.innerHTML = `.${HIDE_CLASS} {display: none !important;}`;
document.head.appendChild(style);
