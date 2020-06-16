const DATA_WATCH_ATTRIBUTE = 'watch';
const DATA_KEY_ATTRIBUTE = 'data-key';
const DATA_ACTION_ATTRIBUTE = 'action';
const STATE_PROPERTY = '@state';

type Renderer = { render: (data: any) => void, dataNode: Array<Node>, onAction: (callback: ActionCallback) => void };
type Action = { type: string, data: any, key: string, event: Event };
type Reducer<Type> = (data: Type, action: Action) => Type
type ActionCallback = (type: Map<string, string>, event: Event) => void;
type SetDataProvider = (oldDataProvider: Array<any>) => Array<any>;

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

function printDataOnNode(node: ChildNode, data: any): void {
    // first we convert into HTMLElement
    const element = node as HTMLElement;
    // we check if data contains @state property
    const state = data[STATE_PROPERTY] || '';
    // we filter element attribute names
    const attributesToWatch = element.getAttributeNames().filter(name => {
        // if data has state, then we check if the attribute name has state.watch property
        if (state) {
            return name.indexOf(`${state}.${DATA_WATCH_ATTRIBUTE}`) > 0;
        }
        // if data does not have state, the we check the watch property, and it should be less than 2 values
        return name.indexOf(DATA_WATCH_ATTRIBUTE) >= 0 && name.split('.').length <= 2;
    });

    attributesToWatch.forEach(attributeName => {
        // now we have attributes to watch, lets split the attribute
        let [attributeNameToBind] = attributeName.split('.');
        // now we have attribute to bind
        let attributeValueToBind = element.getAttribute(attributeName);
        // now we have the attribute of the data to bind
        const value = data[attributeValueToBind];
        // maybe we want to make conversion dataToString callback here
        if (attributeNameToBind === DATA_WATCH_ATTRIBUTE) {
            // if the attributeNameToBind does not contains and prefix attribute then we just bleed them inside the innerHtml
            element.innerHTML = value;
        } else {
            // if the attribute is available then we set the value of the attribute
            element.setAttribute(attributeNameToBind, value);
            if (attributeNameToBind === 'value' && 'value' in element) {
                (element as HTMLInputElement).value = value;
            }
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
    const nodesThatWatchingData = findNodesThatHaveAttributes([DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE], dataNode);

    return {
        render: (data: any) => {
            nodesThatWatchingData.forEach(node => {
                printDataOnNode(node, data);
            })
        },
        onAction: (callback: ActionCallback) => {
            nodesThatWatchingData.forEach(node => {
                // first we get the element
                const element = node as HTMLElement;
                // then we get the attributes to watch (event/action)
                const actionAttributes = element.getAttributeNames().filter(name => {
                    return name.indexOf(DATA_ACTION_ATTRIBUTE) > 0 && name.split('.').length > 1;
                });

                // then we convert into map, click.action="iDontKnow" click.disabled.action="cool"
                const stateTypeMap = actionAttributes.reduce((accumulator: Map<string, Map<string, string>>, attribute) => {
                    // first we takeout name of the event, and the state
                    let [eventName, state] = attribute.split('.');
                    // then we take out the value of the attribute
                    let actionType = element.getAttribute(attribute);
                    // next we store the event name and the state and action type
                    if (!accumulator.has(eventName)) {
                        accumulator.set(eventName, new Map<string, string>());
                    }
                    accumulator.get(eventName).set(state, actionType);
                    return accumulator;
                }, new Map<string, Map<string, string>>());

                stateTypeMap.forEach((stateActionType, eventName) => {
                    element.addEventListener(eventName, function eventListenerWrapper(event) {
                        callback(stateActionType, event);
                    });
                });

            });
        },
        dataNode
    };
}


class DataGroup extends HTMLElement {
    public reducer: Reducer<any>;
    public dataKeySelector: (data: any) => string;
    private template: Array<Node>;
    private dataKeyField: string;
    private renderers: Map<string, Renderer>;
    private dataProvider: Array<any>;

    constructor() {
        super();
        this.template = null;
        this.renderers = new Map<string, Renderer>();
        this.dataKeySelector = (data: any) => data[this.dataKeyField];
        this.reducer = (data) => data;
    }

    setDataProvider(dataProvider: Array<any> | SetDataProvider): void {
        if (Array.isArray(dataProvider)) {
            this.dataProvider = dataProvider;
        } else {
            this.dataProvider = dataProvider(this.dataProvider);
        }
        this.render();
    }

    connectedCallback() {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE) || 'id';
        if (this.template === null) {
            this.setAttribute('style', 'display:none');
            setTimeout(() => {
                this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
                this.innerHTML = ''; // we cleanup the innerHTML
                this.removeAttribute('style');
                this.render();
            }, 0);
        }
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
                        action.type = stateActionTypeMapping.get(DATA_ACTION_ATTRIBUTE) || '';
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
