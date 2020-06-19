import {
    composeChangeEventName,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DoubleMap,
    STATE_GLOBAL,
    STATE_PROPERTY,
    TripleMap
} from "../types";
import isValidAttribute from "./html-attributes";

export default function printDataOnNode<Type>(element: HTMLElement, dictionary: TripleMap<string>, data: Type): void {

    const dataState = (data as any)[STATE_PROPERTY] || '';
    dictionary.forEach((stateDictionary: DoubleMap<string>, type: string) => {
        if (type === DATA_WATCH_ATTRIBUTE) {
            if (stateDictionary.has(dataState) || (stateDictionary.has(STATE_GLOBAL))) {
                const attributeMapping: Map<string, string> = stateDictionary.has(dataState) ? stateDictionary.get(dataState) : stateDictionary.get(STATE_GLOBAL);
                attributeMapping.forEach((bindingAttribute: string, attributeName: string) => {
                    const val = (data as any)[bindingAttribute];
                    if (isValidAttribute(attributeName, element.tagName)) {
                        element.setAttribute(attributeName, val);
                    }

                    if (attributeName in element) {
                        (element as any)[attributeName] = val;
                        const eventName = composeChangeEventName(attributeName);
                        (element as any)[eventName] = (val: any) => (data as any)[bindingAttribute] = val;
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
