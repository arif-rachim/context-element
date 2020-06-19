import {
    composeChangeEventName,
    contains,
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    DataGetterValue,
    hasNoValue,
    Reducer,
    STATE_GLOBAL,
    STATE_PROPERTY,
    UpdateDataCallback
} from "../types";
import isValidAttribute from "./attribute-validator";

export default class AttributeEvaluator<DataSource, Item> {
    private readonly activeNode: ChildNode;
    private readonly attributeValue: Map<string, string>;
    private readonly dataGetter: DataGetter<Item>;
    private readonly updateData: UpdateDataCallback<DataSource>;
    private readonly reducer: Reducer<DataSource, Item>;
    private stateAttributeProperty: Map<string, Map<string, string>> = null;

    constructor(activeNode: ChildNode, dataGetter: DataGetter<Item>, updateData: UpdateDataCallback<DataSource>, reducer: Reducer<DataSource, Item>) {
        this.activeNode = activeNode;
        this.attributeValue = new Map<string, string>();
        this.dataGetter = dataGetter;
        this.updateData = updateData;
        this.reducer = reducer;
        const element = this.activeNode as HTMLElement;

        element.getAttributeNames().filter(name => contains(name, [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE])).forEach(attributeName => {
            this.attributeValue.set(attributeName, element.getAttribute(attributeName));
            element.removeAttribute(attributeName);
        });
        this.initEventListener();
    }

    public initEventListener = () => {
        const element = this.activeNode as HTMLElement;
        const eventStateAction: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
        this.attributeValue.forEach((value, attributeName) => {
            if (attributeName.endsWith(DATA_ACTION_ATTRIBUTE)) {
                const attributes = attributeName.split('.');
                let event = '';
                let state = '';
                if (attributes.length === 1) {
                    event = 'click';
                    state = STATE_GLOBAL;
                } else if (attributes.length === 2) {
                    event = attributes[0];
                    state = STATE_GLOBAL;
                }
                if (attributes.length > 2) {
                    event = attributes[0];
                    state = attributes[1];
                }
                if (!eventStateAction.has(event)) {
                    eventStateAction.set(event, new Map<string, string>());
                }
                eventStateAction.get(event).set(state, value);
            }
        });

        eventStateAction.forEach((stateAction: Map<string, string>, event: string) => {
            event = event.startsWith('on') ? event.substring('on'.length, event.length) : event;
            element.addEventListener(event, (event: Event) => {
                if (event.type === 'submit') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                }
                const dataGetterValue: DataGetterValue<any> = this.dataGetter();
                let dataState = dataGetterValue.data[STATE_PROPERTY];
                if (stateAction.has(dataState) || stateAction.has(STATE_GLOBAL)) {
                    this.updateData((oldData) => {
                        return this.reducer(oldData, {
                            type: stateAction.get(dataState) || stateAction.get(STATE_GLOBAL),
                            data: dataGetterValue.data,
                            event,
                            key: dataGetterValue.key,
                            index: dataGetterValue.index
                        });
                    });
                }
            })
        });
    };

    public render = () => {

        const element = this.activeNode as any;
        const stateAttributeProperty = this.initStateAttributeProperty();
        const dataGetterValue = this.dataGetter();
        const data: any = dataGetterValue.data;

        const dataState = data[STATE_PROPERTY];
        const stateAttributeProps = stateAttributeProperty.get(dataState) || stateAttributeProperty.get(STATE_GLOBAL);
        if (hasNoValue(stateAttributeProps)) {
            return;
        }
        stateAttributeProps.forEach((property: string, attribute: string) => {
            const val = data[property];
            if (isValidAttribute(attribute)) {
                element.setAttribute(attribute, val);
            }
            if (attribute in element) {
                element[attribute] = val;
                const eventName = composeChangeEventName(attribute);
                element[eventName] = (val: any) => data[property] = val;
            }
            if (attribute === 'content') {
                element.innerHTML = val;
            }
        });
    }

    private initStateAttributeProperty = () => {
        if (this.stateAttributeProperty === null) {
            const stateAttributeProperty: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
            this.attributeValue.forEach((value, attributeName) => {
                if (attributeName.endsWith(DATA_WATCH_ATTRIBUTE)) {
                    const attributes = attributeName.split('.');
                    let attribute = '';
                    let state = '';
                    if (attributes.length === 1) {
                        attribute = 'content';
                        state = STATE_GLOBAL;
                    } else if (attributes.length === 2) {
                        attribute = attributes[0];
                        state = STATE_GLOBAL;
                    }
                    if (attributes.length > 2) {
                        attribute = attributes[0];
                        state = attributes[1];
                    }
                    if (!stateAttributeProperty.has(state)) {
                        stateAttributeProperty.set(state, new Map<string, string>());
                    }
                    stateAttributeProperty.get(state).set(attribute, value);
                }
            });
            this.stateAttributeProperty = stateAttributeProperty;
        }
        return this.stateAttributeProperty;
    };

}
