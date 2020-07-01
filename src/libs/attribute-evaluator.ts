import {
    ArrayDataGetterValue,
    AssetGetter,
    BubbleChildAction,
    composeChangeEventName,
    contains,
    DATA_ACTION_ATTRIBUTE,
    DATA_ASSET_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    DataGetterValue,
    hasNoValue,
    hasValue,
    ReducerGetter,
    UpdateDataCallback
} from "../types";
import isValidAttribute from "./attribute-validator";


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
export default class AttributeEvaluator<Context> {

    /**
     * active-node is the actual HTMLElement attached to the document.body
     */
    private readonly activeNode: ChildNode;

    /**
     * active-attribute, is a map of node attribute which has either `watch|toggle|action` and its value
     */
    private readonly activeAttributeValue: Map<string, string>;

    /**
     * DataGetter is a callback function to get the current actual data.
     */
    private readonly dataGetter: DataGetter<Context>;

    /**
     * AssetGetter is a callback function to get the asset from the context-element
     */
    private readonly assetGetter: AssetGetter;

    /**
     * DataUpdateCallback is a callback to inform DataRenderer that a new copy of data is available.
     */
    private readonly updateData: UpdateDataCallback<Context>;

    /**
     * Bubble child action is a callback to bubble action to the parent data renderer.
     */
    private readonly bubbleChildAction: BubbleChildAction<Context>;

    /**
     * callback function that is called when an action is triggered by dom event.
     */
    private readonly reducerGetter: ReducerGetter<Context>;

    // mapping for watch & assets
    private readonly attributeProperty: Map<string, Map<string, string>> = null;


    // mapping for action
    private readonly eventAction: Map<string, string> = null;

    /**
     * Constructor will perform initialization by constructing activeAttributeValue, defaultAttributeValue, eventStateAction,
     * stateAttributeProperty and attributeStateProperty.
     * The last process would be initialization of event listener.
     *
     * @param activeNode : node that contains active-attribute.
     * @param assetGetter : callback function to get the asset from context-data
     * @param dataGetter : callback function to return current data.
     * @param updateData : callback function to inform DataRenderer that a new data is created because of user action.
     * @param reducerGetter : function to map data into a new one because of user action.
     * @param activeAttributes : attributes that is used to lookup the nodes
     * @param bubbleChildAction
     */
    constructor(activeNode: ChildNode, assetGetter: AssetGetter, dataGetter: DataGetter<Context>, updateData: UpdateDataCallback<Context>, reducerGetter: ReducerGetter<Context>, activeAttributes: string[], bubbleChildAction: BubbleChildAction<Context>) {
        this.activeNode = activeNode;
        this.dataGetter = dataGetter;
        this.assetGetter = assetGetter;
        this.updateData = updateData;
        this.bubbleChildAction = bubbleChildAction;
        this.reducerGetter = reducerGetter;
        this.activeAttributeValue = populateActiveAttributeValue(activeNode as HTMLElement, activeAttributes);
        this.eventAction = mapEventStateAction(this.activeAttributeValue);
        this.attributeProperty = mapAttributeProperty(this.activeAttributeValue, [DATA_WATCH_ATTRIBUTE, DATA_ASSET_ATTRIBUTE]);
        initEventListener(activeNode as HTMLElement, this.eventAction, dataGetter, updateData, reducerGetter, bubbleChildAction);
    }

    /**
     * Render method will be invoked my DataRenderer.render. Render method will perform 2 major things,
     * update active-attribute `watch:updateAttributeWatch`  and `toggle:updateToggleAttribute`.
     */
    public render = () => {
        const element = this.activeNode as any;
        const stateAttributeProperty = this.attributeProperty;
        const dataGetterValue = this.dataGetter();
        const data: any = dataGetterValue.data;
        const assetGetter = this.assetGetter;
        updateWatchAttribute(element, stateAttributeProperty, data,assetGetter);
    }
}

/**
 * mapEventStateAction is a function to convert `action` active-attribute to action group by first event, then state.
 * @param attributeValue is an active attribute
 */
const mapEventStateAction = (attributeValue: Map<string, string>) => {
    const eventStateAction: Map<string, string> = new Map<string, string>();
    attributeValue.forEach((value, attributeName) => {
        if (attributeName.endsWith(DATA_ACTION_ATTRIBUTE)) {
            const attributes = attributeName.split('.');
            let event = '';
            if (attributes.length === 1) {
                event = 'click';
            }else{
                event = attributes[0];
            }
            eventStateAction.set(event, value);
        }
    });
    return eventStateAction;
};

/**
 * mapStateAttributeProperty is a function to convert `watch` active-attribute to property group by first state, then attribute.
 * @param attributeValue
 * @param attributePrefixes
 */
const mapAttributeProperty = (attributeValue: Map<string, string>, attributePrefixes: string[]) => {
    const attributeProperty: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    attributeValue.forEach((value, attributeName) => {
        if (attributePrefixes.filter(attributePrefix => attributeName.endsWith(attributePrefix)).length > 0) {
            const attributes = attributeName.split('.');
            let attribute = '';
            let type = '';
            if (attributes.length === 1) {
                attribute = 'content';
                type = attributes[0];
            }else{
                attribute = attributes[0];
                type = attributes[1]
            }
            if (!attributeProperty.has(attribute)) {
                attributeProperty.set(attribute, new Map<string, string>());
            }
            attributeProperty.get(attribute).set(type, value);
        }
    });
    return attributeProperty;
};


/**
 * populateActiveAttributeValue will extract the active-attributes from the element.
 * @param element
 * @param activeAttributes
 */
const populateActiveAttributeValue = (element: HTMLElement, activeAttributes: string[]) => {
    const attributeValue: Map<string, string> = new Map<string, string>();
    element.getAttributeNames().filter(name => contains(name, activeAttributes)).forEach(attributeName => {
        attributeValue.set(attributeName, element.getAttribute(attributeName));
        element.removeAttribute(attributeName);
    });
    return attributeValue;
};

/**
 * InitEventListener is the function to attach `toggle` active-attribute to HTMLElement.addEventListener.
 * This method requires htmlElement, eventStateAction, dataGetter, updateData and reducer.
 *
 * initEventListener will iterate over the eventStateAction map. Based on the event in eventStateAction, the function
 * will addEventListener to the element.
 *
 * When an event is triggered by the element, the eventListener callback will check event.type.
 * If the event.type is `submit` then the event will be prevented and propagation stopped.
 *
 * When element triggered an event, the current data.state will be verified against the eventStateAction.
 * If the current data.state is not available in the eventStateAction, then the event will be ignored.
 *
 * If the current data.state is available in the eventStateAction, or when GlobalState exist in the eventStateAction, then the
 * updateData callback will invoked to inform DataRenderer that user is triggering an action.
 *
 * @param element
 * @param eventStateAction
 * @param dataGetter
 * @param updateData
 * @param reducerGetter
 * @param bubbleChildAction
 */
const initEventListener = <Context>(element: HTMLElement, eventStateAction: Map<string, string>, dataGetter: DataGetter<Context>, updateData: UpdateDataCallback<Context>, reducerGetter: ReducerGetter<Context>, bubbleChildAction: BubbleChildAction<Context>) => {
    eventStateAction.forEach((stateAction: string, event: string) => {
        event = event.startsWith('on') ? event.substring('on'.length, event.length) : event;
        element.addEventListener(event, (event: Event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const dataGetterValue: DataGetterValue<any> | ArrayDataGetterValue<any> = dataGetter();
            const reducer = reducerGetter();
            const type = stateAction;
            let data = dataGetterValue.data;
            const action: any = {type, event};

            if ('key' in dataGetterValue) {
                const arrayDataGetterValue = dataGetterValue as ArrayDataGetterValue<any>;
                data = arrayDataGetterValue.data;
                action.data = data;
                action.key = arrayDataGetterValue.key;
                action.index = arrayDataGetterValue.index;
            }
            if (hasNoValue(reducer)) {
                bubbleChildAction(action);
            }else{
                updateData((oldData) => reducer(oldData, action));
            }

        })
    });
};

/**
 * Function to set property of an element, it will check if the attribute is a valid attribute, if its a valid attribute
 * then it will set the attribute value, and if the attribute is element property, then the element will be assigned for the attribute.
 *
 * @param attribute
 * @param element
 * @param val
 * @param data
 * @param property
 */
function setPropertyValue(attribute: string, element: any, val: any, data: any, property: string) {

    if (isValidAttribute(attribute) && element.getAttribute(attribute) !== val) {
        element.setAttribute(attribute, val);
    }
    if (attribute in element) {
        element[attribute] = val;
        if (attribute === 'data') {
            element.dataPath = property;
        }
        const eventName = composeChangeEventName(attribute);
        element[eventName] = (val: any) => injectValue(data, property, val);
    }
    if (attribute === 'content') {
        element.innerHTML = val;
    }
}

/**
 * UpdateWatchAttribute is a method that will perform update against `watch` active-attribute.
 *
 * UpdateWatchAttribute will get the current attributeProps from stateAttributeProps based on the data.state.
 * It will iterate over the attribute from the attributeProps.
 * On each attribute iteration, the method will set the element.attribute based on the value of data[property].
 *
 * If the attribute is also a valid element.property, it will set the value of element.property against the
 * data[property] value either.
 *
 * If the attribute value is `content`,  the element.innerHTML value will be set against the data[property] value.
 *
 * @param element : node or also an HTMLElement
 * @param stateAttributeProperty : object that store the mapping of property against state and attribute.
 * @param data : current value of the data.
 * @param dataState : state value of the object.
 * @param assetGetter : callback to get the asset of the context element.
 */
const updateWatchAttribute = (element: any, stateAttributeProperty: Map<string, Map<string, string>>, data: any, assetGetter: AssetGetter) => {

    const attributeProps = stateAttributeProperty;
    if (hasNoValue(attributeProps)) {
        return;
    }
    attributeProps.forEach((typeProperty: Map<string, string>, attribute: string) => {
        const watchProperty = typeProperty.get(DATA_WATCH_ATTRIBUTE);
        const assetProperty = typeProperty.get(DATA_ASSET_ATTRIBUTE);
        let val = null;
        if (hasValue(watchProperty)) {
            val = extractValue(data, watchProperty);
        } else if (hasValue(assetProperty)) {
            val = assetGetter(assetProperty);
        }
        setPropertyValue(attribute, element, val, data, watchProperty);
    });
};


/**
 * Function to extract the value of json from jsonPath
 * @param data
 * @param prop
 */
const extractValue = (data: any, prop: string) => {
    if (hasNoValue(data)) {
        return data;
    }
    try {
        const evaluate = new Function('data', `return data.${prop};`);
        return evaluate.call(null, data);
    } catch (err) {
        console.warn(data, err.message);
    }
    return null;
};


/**
 * Function to extract the value of json from jsonPath
 * @param data
 * @param prop
 * @param value
 *
 */
const injectValue = (data: any, prop: string, value: any) => {
    if (hasNoValue(data)) {
        return;
    }
    try {
        const evaluate = new Function('data', 'value', `data.${prop} = value;`);
        return evaluate.call(null, data, value);
    } catch (err) {
        console.warn(err.message);
    }

};
