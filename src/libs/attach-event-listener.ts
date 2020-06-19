import {DATA_ACTION_ATTRIBUTE, DoubleMap, TripleMap} from "../types";

/**
 * This is to reverse state typeStateAttribute to event typeStateAttribute
 * @param stateDictionary
 */
function stateDictionaryToEventDictionary(stateDictionary: Map<string, Map<string, string>>) {
    const eventDictionary: DoubleMap<string> = new Map<string, Map<string, string>>();
    stateDictionary.forEach((eventActionType, state) => {
        eventActionType.forEach((actionType, eventName) => {
            if (!eventDictionary.has(eventName)) {
                eventDictionary.set(eventName, new Map<string, string>());
            }
            eventDictionary.get(eventName).set(state, actionType);
        });
    });
    return eventDictionary;
}


export default function attachEventListener(element: HTMLElement, typeStateAttribute: TripleMap<string>, eventHandler: (type: Map<string, string>, event: Event) => void) {
    typeStateAttribute.forEach((stateDictionary: DoubleMap<string>, type: string) => {
        if (type === DATA_ACTION_ATTRIBUTE) {
            const eventDictionary = stateDictionaryToEventDictionary(stateDictionary);
            eventDictionary.forEach((stateAction, eventName) => {
                const onEventHandler = (event: Event) => {
                    if (event.type === 'submit') {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                    }
                    eventHandler(stateAction, event);
                };
                element.addEventListener(eventName, onEventHandler);
            });
        }
    });
}
