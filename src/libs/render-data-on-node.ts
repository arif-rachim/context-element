import {
    composeChangeEventName,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DoubleMap,
    STATE_GLOBAL,
    STATE_PROPERTY,
    TripleMap
} from "../types";
import isValidAttribute from "./attribute-validator";

const watchAttribute = (element: any, data: any) => (property: string, attribute: string) => {
    const val = data[property];
    if (isValidAttribute(attribute, element.tagName)) {
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
};

const toggleAttribute = (element: any, data: any, state: string) => (value: string, attribute: string) => {
    // we need to think about this toggle
    // if(attribute === 'class'){
    //     const htmlElement = element as HTMLElement;
    //     htmlElement.setAttribute(attribute,value);
    //     if(state !== STATE_GLOBAL){
    //         (element as HTMLElement).classList.add(value);
    //     }
    // }
};

export default function renderDataOnNode<Type>(element: HTMLElement, typeStateAttribute: TripleMap<string>, data: Type): void {

    const dataState = (data as any)[STATE_PROPERTY] || '';
    typeStateAttribute.forEach((stateAttribute: DoubleMap<string>, type: string) => {
        if (stateAttribute.has(dataState) || (stateAttribute.has(STATE_GLOBAL))) {
            const attributeProperty: Map<string, string> = stateAttribute.has(dataState) ? stateAttribute.get(dataState) : stateAttribute.get(STATE_GLOBAL);
            if (type === DATA_WATCH_ATTRIBUTE) {
                attributeProperty.forEach(watchAttribute(element, data));
            }
            if (type === DATA_TOGGLE_ATTRIBUTE) {
                attributeProperty.forEach(toggleAttribute(element, data, dataState));
            }
        }
    });
}
