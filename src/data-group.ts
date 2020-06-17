import {ActionCallback, DoubleMap, FunctionReturnString, Reducer, Renderer, SetDataProvider, TripleMap} from "./types";

const DATA_WATCH_ATTRIBUTE = 'watch';
const DATA_KEY_ATTRIBUTE = 'data-key';
const DATA_ACTION_ATTRIBUTE = 'action';
const DATA_TOGGLE_ATTRIBUTE = 'toggle';
const STATE_PROPERTY = '@state';
const STATE_GLOBAL = '*';

/**
 * Function to remove empty text node.
 */
function noEmptyTextNode(): (node: ChildNode) => (boolean | true) {
    return (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return /\S/.test(node.textContent);
        }
        return true;
    };
}

function printDataOnNode(element: HTMLElement,dictionary:TripleMap<string>, data: any): void {
    const dataState = data[STATE_PROPERTY] || '';
    dictionary.forEach((stateDictionary:DoubleMap<string>,type:string) => {
        if(type === DATA_WATCH_ATTRIBUTE){
            if(stateDictionary.has(dataState) || (stateDictionary.has(STATE_GLOBAL))){
                const attributeMapping:Map<string,string> = stateDictionary.has(dataState) ? stateDictionary.get(dataState) : stateDictionary.get(STATE_GLOBAL);
                attributeMapping.forEach((bindingAttribute:string,attributeName:string) => {
                    const val = data[bindingAttribute];
                    element.setAttribute(attributeName,val);
                    if(attributeName in element){
                        (element as any)[attributeName] = val;
                    }
                    if(attributeName === 'content'){
                        element.innerHTML = val;
                    }
                });
            }
        }
        if(type === DATA_TOGGLE_ATTRIBUTE){

        }
    });
}

function toDictionaries(element: HTMLElement): Map<string, Map<string, Map<string, string>>> {

    const attributesToWatch = element.getAttributeNames().filter(name => {
        return (name.indexOf(DATA_WATCH_ATTRIBUTE) >= 0) || (name.indexOf(DATA_TOGGLE_ATTRIBUTE) >= 0) || (name.indexOf(DATA_ACTION_ATTRIBUTE))
    });

    return attributesToWatch.reduce((acc:TripleMap<string>,attributeKey:string) => {
        let attribute = '',state = STATE_GLOBAL,type = '';
        let keys = attributeKey.split('.');
        if(keys.length === 3){
            attribute = keys[0];
            state = keys[1];
            type = keys[2];
        }else if (keys.length === 2){
            attribute = keys[0];
            type = keys[1];
        }else if(keys.length === 1){
            type = keys[0];
            if(type === DATA_WATCH_ATTRIBUTE){
                attribute = 'content';
            }
            if(type === DATA_ACTION_ATTRIBUTE){
                attribute = 'click';
            }
            if(type === DATA_TOGGLE_ATTRIBUTE){
                attribute = 'class';
            }
        }
        const value = element.getAttribute(attributeKey);
        if(!acc.has(type)){
            acc.set(type,new Map<string, Map<string,string>>());
        }
        if(!acc.get(type).has(state)){
            acc.get(type).set(state,new Map<string,string>())
        }
        acc.get(type).get(state).set(attribute,value);
        return acc;

    },new Map<string,Map<string,Map<string,string>>>());

}

function listenEventOnNode(element: HTMLElement, dictionary: Map<string, Map<string, Map<string, string>>>, callback: (type: Map<string, string>, event: Event) => void) {

    dictionary.forEach((stateDictionary: Map<string, Map<string, string>>, type: string) => {
        if (type === DATA_ACTION_ATTRIBUTE) {
            const eventDictionary: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
            stateDictionary.forEach((eventActionType, state) => {
                eventActionType.forEach((actionType, eventName) => {
                    if (!eventDictionary.has(eventName)) {
                        eventDictionary.set(eventName, new Map<string, string>());
                    }
                    eventDictionary.get(eventName).set(state, actionType);
                });
            });

            const eventListenerRemover = (element as any).eventListenerRemover || [];
            eventListenerRemover.forEach((unregisterListeners:any) => unregisterListeners());
            (element as any).eventListenerRemover = [];

            eventDictionary.forEach((stateAction, eventName) => {
                const eventListenerWrapper = (event:Event) => {
                    callback(stateAction, event);
                };
                element.addEventListener(eventName, eventListenerWrapper);
                (element as any).eventListenerRemover.push(()=> element.removeEventListener(eventName,eventListenerWrapper));
            });
        }
    });
}

/**
 * Function to create ItemRenderer
 * @param dataNode
 */
function createItemRenderer(dataNode: Array<Node>): Renderer {
    const findNodesThatHaveAttributes = (attributesSuffix: Array<string>, childNodes: Array<Node>) => {
        return Array.from(childNodes).filter(noEmptyTextNode()).reduce((accumulator, childNode) => {
            let childrenNodes: ChildNode[] = [];
            if (!(childNode instanceof HTMLElement)) {
                return accumulator;
            }
            const element = childNode as HTMLElement;
            const attributeNames = element.getAttributeNames();
            for (const attribute of attributeNames) {
                for (const attributeSuffix of attributesSuffix) {
                    if (attribute.split('.').indexOf(attributeSuffix) >= 0) {
                        accumulator.push(element);
                        break;
                    }
                }
            }
            if (!(element instanceof DataGroup)) {
                childrenNodes = findNodesThatHaveAttributes(attributesSuffix, Array.from(element.childNodes));
            }
            return [...accumulator, ...childrenNodes];
        }, Array<ChildNode>());
    };
    const activeNodes = findNodesThatHaveAttributes([DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE,DATA_TOGGLE_ATTRIBUTE], dataNode);
    const nodesDictionary = Array.from(activeNodes).map(node => ({dictionary:toDictionaries(node as HTMLElement),node}));
    return {
        render: (data: any) => {
            nodesDictionary.forEach(({dictionary,node}) => printDataOnNode(node as HTMLElement,dictionary, data));
        },
        onAction: (callback: ActionCallback) => {
            nodesDictionary.forEach(({dictionary,node}) => listenEventOnNode(node as HTMLElement, dictionary, callback));
        },
        dataNode
    };
}

export class DataGroup extends HTMLElement {
    public reducer: Reducer<any>;
    private dataKeySelector: FunctionReturnString<any>;
    private template: Array<Node>;
    private dataKeyField: string;
    private renderers: Map<string, Renderer>;
    private dataProvider: Array<any>;
    private onMountedCallback:() => void;
    constructor() {
        super();
        this.template = null;
        this.dataProvider = null;
        this.renderers = new Map<string, Renderer>();
        this.dataKeySelector = (data: any) => {
            if(this.dataKeyField === undefined || this.dataKeyField === null){
                const errorMessage = `'<data-group>' requires 'data-key' attribute. Data-key value should refer to the unique attribute of the data.`;
                throw new Error(errorMessage);
            }
            return data[this.dataKeyField];
        };
        this.reducer = (data) => data;
    }

    setDataKeySelector(selector:FunctionReturnString<any>){
        this.dataKeySelector = selector;
    }

    setDataProvider(dataProvider: Array<any> | SetDataProvider): void {
        if (Array.isArray(dataProvider)) {
            this.dataProvider = dataProvider;
        } else {
            this.dataProvider = dataProvider(this.dataProvider);
        }
        this.render();
    }

    onMounted(onMountedCallback:() => void){
        this.onMountedCallback = onMountedCallback;
    }

    connectedCallback() {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
        if (this.template === null) {
            this.setAttribute('style', 'display:none');
            requestAnimationFrame(() => {
                this.populateTemplate();
                this.removeAttribute('style');
                this.render();
                if(this.onMountedCallback){
                    this.onMountedCallback();
                    this.onMountedCallback = null;
                }
            });
        }
    }

    private populateTemplate():void{
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    }


    private render(): void {
        if (this.dataProvider === null || this.template === null) {
            return;
        }
        const newKeys = this.dataProvider.map(data => this.dataKeySelector(data));
        const oldKeys = Array.from(this.renderers.keys());
        const removedKeys = oldKeys.filter(key => newKeys.indexOf(key) < 0);
        removedKeys.forEach(key => {
            this.renderers.get(key).dataNode.forEach(node => (node as ChildNode).remove());
            this.renderers.delete(key);
        });

        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        [...this.dataProvider].reverse().forEach((data) => {
            const dataKey = this.dataKeySelector(data);
            if (!this.renderers.has(dataKey)) {
                const dataNode = this.template.map(node => node.cloneNode(true));
                const itemRenderer = createItemRenderer(dataNode);
                // if we have action then we need to rerender this guy
                const onActionCallback = (stateActionTypeMapping: Map<string, string>, event: Event) => {
                    const setDataProviderCallback = (oldDataProvider: Array<any>) => {
                        let action = {data, key: dataKey, event: event, type: ''};
                        action.type = stateActionTypeMapping.get(STATE_GLOBAL) || '';
                        action.type = stateActionTypeMapping.get(data[STATE_PROPERTY]) || action.type;
                        if (action.type) {
                            return this.reducer(oldDataProvider, action);
                        }
                    };
                    this.setDataProvider(setDataProviderCallback);
                };
                itemRenderer.onAction(onActionCallback);
                this.renderers.set(dataKey, itemRenderer);
            }
            const itemRenderer = this.renderers.get(dataKey);
            const reversedDataNodes = [...itemRenderer.dataNode].reverse();
            for (const node of reversedDataNodes) {
                if (lastNode.previousSibling !== node) {
                    this.insertBefore(node, lastNode);
                }
                lastNode = node;
            }
            this.renderers.get(dataKey).render(data);
        });
        this.lastChild.remove();
    }
}


customElements.define('data-group', DataGroup);
