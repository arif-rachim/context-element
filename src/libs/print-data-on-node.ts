import {
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DoubleMap,
    getChangeEventName,
    STATE_GLOBAL,
    STATE_PROPERTY,
    TripleMap
} from "../types";
import isValidAttribute from "./html-attributes";

export default function printDataOnNode(element: HTMLElement, dictionary: TripleMap<string>, data: any): void {

    const dataState = data[STATE_PROPERTY] || '';
    dictionary.forEach((stateDictionary: DoubleMap<string>, type: string) => {
        if (type === DATA_WATCH_ATTRIBUTE) {
            if (stateDictionary.has(dataState) || (stateDictionary.has(STATE_GLOBAL))) {
                const attributeMapping: Map<string, string> = stateDictionary.has(dataState) ? stateDictionary.get(dataState) : stateDictionary.get(STATE_GLOBAL);
                attributeMapping.forEach((bindingAttribute: string, attributeName: string) => {
                    const val = data[bindingAttribute];
                    if (isValidAttribute(attributeName, element.tagName)) {
                        element.setAttribute(attributeName, val);
                    } else {
                        console.warn(`attribute ${attributeName} is not valid attribute for ${element.tagName}`);
                    }

                    if (attributeName in element) {
                        (element as any)[attributeName] = val;
                        const eventName = getChangeEventName(attributeName);
                        (element as any)[eventName] = (val: any) => data[bindingAttribute] = val;
                    }
                    if (attributeName === 'content') {
                        element.innerHTML = val;
                    }
                });
            }
        }
        if (type === DATA_TOGGLE_ATTRIBUTE) {

        }
    });
}
