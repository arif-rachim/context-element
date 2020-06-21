import {
    composeChangeEventName,
    contains,
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    DataGetterValue,
    hasNoValue,
    hasValue,
    Reducer,
    STATE_GLOBAL,
    STATE_PROPERTY,
    UpdateDataCallback
} from "../types";
import isValidAttribute from "./attribute-validator";
import {toggleMissingStateAndProperty} from "./error-message";


/**
 * AttributeEvaluator is a class that stores information about node that have active-attributes.
 * The AttributeEvaluator is called by the DataRenderer object when DataRenderer.render is executed.
 *
 * AttributeEvaluator require the activeNode,dataGetter,updateDataCallback, and the reducer function from the DataRenderer.
 *
 * When the AttributeEvaluator initiated, the attribute evaluator will extract all the active-attributes from active-node and store them in
 * `activeAttributeValue`.
 *
 * Once the activeAttribute extracted from the node, AttributeEvaluator will remove those attributes from the node, remaining
 * only non-active attributes.
 *
 * The non active attributes then will be extracted from the node, and stored in the `defaultAttributeValue` property.
 *
 * The next step of the initialization process it to extract the active attributes and group them into 3 different map.
 * 1. stateAttributeProperty :  mapping of `data.property` group by first state then attribute.
 * 2. attributeStateProperty : mapping of `data.property` group by first attribute then state.
 * 3. eventStateAction : mapping of action group by first event then state.
 *
 * The last step of the initialization of AttributeEvaluator, is to bind the node against eventStateAction.
 */
export default class AttributeEvaluator<DataSource, Item> {
    private readonly activeNode: ChildNode;
    private readonly activeAttributeValue: Map<string, string>;
    private readonly defaultAttributeValue: Map<string, string>;
    private readonly dataGetter: DataGetter<Item>;
    private readonly updateData: UpdateDataCallback<DataSource>;
    private readonly reducer: Reducer<DataSource, Item>;
    // mapping for watch
    private readonly stateAttributeProperty: Map<string, Map<string, string>> = null;
    // mapping for toggle
    private readonly attributeStateProperty: Map<string, Map<string, string>> = null;
    // mapping for action
    private readonly eventStateAction: Map<string, Map<string, string>> = null;

    /**
     * Constructor will perform initialization by constructing activeAttributeValue, defaultAttributeValue, eventStateAction,
     * stateAttributeProperty and attributeStateProperty.
     * The last process would be initialization of event listener.
     *
     * @param activeNode : node that contains active-attribute.
     * @param dataGetter : callback function to return current data.
     * @param updateData : callback function to inform DataRenderer that a new data is created because of user action.
     * @param reducer : function to map data into a new one because of user action.
     */
    constructor(activeNode: ChildNode, dataGetter: DataGetter<Item>, updateData: UpdateDataCallback<DataSource>, reducer: Reducer<DataSource, Item>) {
        this.activeNode = activeNode;
        this.dataGetter = dataGetter;
        this.updateData = updateData;
        this.reducer = reducer;
        this.activeAttributeValue = populateActiveAttributeValue(activeNode as HTMLElement);
        this.defaultAttributeValue = populateDefaultAttributeValue(activeNode as HTMLElement);
        this.eventStateAction = mapEventStateAction(this.activeAttributeValue);
        this.stateAttributeProperty = mapStateAttributeProperty(this.activeAttributeValue);
        this.attributeStateProperty = mapAttributeStateProperty(this.activeAttributeValue);
        initEventListener(activeNode as HTMLElement, this.eventStateAction, dataGetter, updateData, reducer);
    }

    /**
     * Render method will be invoked my DataRenderer.render. Render method will perform 2 major things,
     * update active-attribute `watch:updateAttributeWatch`  and `toggle:updateToggleAttribute`.
     */
    public render = () => {
        const element = this.activeNode as any;
        const stateAttributeProperty = this.stateAttributeProperty;
        const attributeStateProperty = this.attributeStateProperty;
        const dataGetterValue = this.dataGetter();
        const data: any = dataGetterValue.data;
        const dataState = data[STATE_PROPERTY];
        const defaultAttributeValue = this.defaultAttributeValue;
        updateWatchAttribute(element, stateAttributeProperty, dataGetterValue, dataState);
        updateToggleAttribute(element, attributeStateProperty, dataState, defaultAttributeValue);
    }
}

const mapEventStateAction = (attributeValue: Map<string, string>) => {
    const eventStateAction: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    attributeValue.forEach((value, attributeName) => {
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
            } else if (attributes.length > 2) {
                event = attributes[0];
                state = attributes[1];
            }
            if (!eventStateAction.has(event)) {
                eventStateAction.set(event, new Map<string, string>());
            }
            eventStateAction.get(event).set(state, value);
        }
    });
    return eventStateAction;
};

const mapStateAttributeProperty = (attributeValue: Map<string, string>) => {
    const stateAttributeProperty: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    attributeValue.forEach((value, attributeName) => {
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
            } else if (attributes.length > 2) {
                attribute = attributes[0];
                state = attributes[1];
            }
            if (!stateAttributeProperty.has(state)) {
                stateAttributeProperty.set(state, new Map<string, string>());
            }
            stateAttributeProperty.get(state).set(attribute, value);
        }
    });
    return stateAttributeProperty;
};


const mapAttributeStateProperty = (attributeValue: Map<string, string>) => {
    const attributeStateProperty: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    attributeValue.forEach((value, attributeName) => {
        if (attributeName.endsWith(DATA_TOGGLE_ATTRIBUTE)) {
            const attributes = attributeName.split('.');
            let attribute = '';
            let state = '';
            if (attributes.length === 3) {
                attribute = attributes[0];
                state = attributes[1];
                if (!attributeStateProperty.has(attribute)) {
                    attributeStateProperty.set(attribute, new Map<string, string>());
                }
                attributeStateProperty.get(attribute).set(state, value);
            } else {
                throw new Error(toggleMissingStateAndProperty())
            }
        }
    });
    return attributeStateProperty;
};

const populateActiveAttributeValue = (element: HTMLElement) => {
    const attributeValue: Map<string, string> = new Map<string, string>();
    element.getAttributeNames().filter(name => contains(name, [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE])).forEach(attributeName => {
        attributeValue.set(attributeName, element.getAttribute(attributeName));
        element.removeAttribute(attributeName);
    });
    return attributeValue;
};

const initEventListener = <DataSource, Item>(element: HTMLElement, eventStateAction: Map<string, Map<string, string>>, dataGetter: DataGetter<Item>, updateData: UpdateDataCallback<DataSource>, reducer: Reducer<DataSource, Item>) => {
    eventStateAction.forEach((stateAction: Map<string, string>, event: string) => {
        event = event.startsWith('on') ? event.substring('on'.length, event.length) : event;
        element.addEventListener(event, (event: Event) => {
            if (event.type === 'submit') {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
            }
            const dataGetterValue: DataGetterValue<any> = dataGetter();
            let dataState = dataGetterValue.data[STATE_PROPERTY];
            if (stateAction.has(dataState) || stateAction.has(STATE_GLOBAL)) {
                updateData((oldData) => {
                    return reducer(oldData, {
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

/**
 * UpdateWatchAttribute is a method that will perform update against node active-attribute. First it will get the current
 * stateAttributeProps based on the data state, then it will iterate over the attributeProps of the data. On each attribute
 * the method will then assign the actual value of the data.property against the element attribute.
 *
 * If the attribute is also a valid element.property, then this method will set the value of element.property against the
 * data.property value.
 *
 * If the attribute value is `content`, then the element.innerHTML value will be set against the data.property value.
 *
 * @param element : node or also an HTMLElement
 * @param stateAttributeProperty : object that store the mapping of property against state and attribute.
 * @param dataGetterValue : object that get the current value of the data.
 * @param dataState : state value of the object.
 */
const updateWatchAttribute = (element: any, stateAttributeProperty: Map<string, Map<string, string>>, dataGetterValue: DataGetterValue<any>, dataState: string) => {
    const data = dataGetterValue.data;
    const attributePropies = stateAttributeProperty.get(dataState) || stateAttributeProperty.get(STATE_GLOBAL);
    if (hasNoValue(attributePropies)) {
        return;
    }
    attributePropies.forEach((property: string, attribute: string) => {
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
};

/**
 * UpdateToggleAttribute is a method that will append the value of attribute based on the data.state. It will iterate over
 * attributeStateProperty, if the current data.state is available in the attributeStateProperty, then the value of the attribute
 * will be appended against the default attribute value.
 *
 * @param element : node or also an HTMLElement
 * @param attributeStateProperty : object that store the mapping of property against attribute and state.
 * @param dataState : state value of the object.
 * @param defaultAttributeValue : default value of the active-attribute toggle.
 */
const updateToggleAttribute = (element: HTMLElement, attributeStateProperty: Map<string, Map<string, string>>, dataState: any, defaultAttributeValue: Map<string, string>) => {
    attributeStateProperty.forEach((stateProperty: Map<string, string>, attribute: string) => {
        const attributeValue: string[] = [];

        const defaultValue = defaultAttributeValue.get(attribute);
        const propertyValue = stateProperty.get(dataState);

        if (hasValue(defaultValue)) {
            attributeValue.push(defaultValue);
        }
        if (hasValue(propertyValue)) {
            attributeValue.push(propertyValue);
        }
        const newAttributeValue = attributeValue.join(' ');
        if (element.getAttribute(attribute) !== newAttributeValue) {
            element.setAttribute(attribute, newAttributeValue);
        }
    });
};


/**
 * PopulateDefaultAttributeValue will iterate over all element attributeNames, and return them in the form of Map.
 * @param element : active node or the HTMLElement
 */
function populateDefaultAttributeValue(element: HTMLElement) {
    const attributeValue: Map<string, string> = new Map<string, string>();
    element.getAttributeNames().forEach(attributeName => {
        attributeValue.set(attributeName, element.getAttribute(attributeName));
    });
    return attributeValue;
}
