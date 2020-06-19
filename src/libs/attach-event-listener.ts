import {DATA_ACTION_ATTRIBUTE, DoubleMap, TripleMap} from "../types";

/**
 * This is to reverse state typeStateAttribute to event typeStateAttribute
 * @param stateAttribute
 */
function stateAttributeToAttributeState(stateAttribute: DoubleMap<string>) {
    const attributeState: DoubleMap<string> = new Map<string, Map<string, string>>();
    stateAttribute.forEach((attributes, state) => {
        attributes.forEach((attributeMapping, attributeName) => {
            if (!attributeState.has(attributeName)) {
                attributeState.set(attributeName, new Map<string, string>());
            }
            attributeState.get(attributeName).set(state, attributeMapping);
        });
    });
    return attributeState;
}


function furnishDomEvent(event: Event) {
    if (event.type === 'submit') {
        event.stopImmediatePropagation();
        event.preventDefault();
    }
}

export default function attachEventListener(element: HTMLElement, typeStateAttribute: TripleMap<string>, eventHandler: (type: Map<string, string>, event: Event) => void) {
    typeStateAttribute.forEach((stateAttribute: DoubleMap<string>, type: string) => {
        if (type === DATA_ACTION_ATTRIBUTE) {
            const attributeState = stateAttributeToAttributeState(stateAttribute);
            attributeState.forEach((stateMapping, attribute) => {
                const onEventHandler = (event: Event) => {
                    furnishDomEvent(event);
                    eventHandler(stateMapping, event);
                };
                element.addEventListener(attribute, onEventHandler);
            });
        }
    });
}
