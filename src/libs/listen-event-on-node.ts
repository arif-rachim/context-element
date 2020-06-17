import {DATA_ACTION_ATTRIBUTE, DoubleMap, TripleMap} from "../types";


/**
 * This is to reverse state dictionary to event dictionary
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


export default function listenEventOnNode(element: HTMLElement, dictionary: TripleMap<string>, callback: (type: Map<string, string>, event: Event) => void) {
    dictionary.forEach((stateDictionary: DoubleMap<string>, type: string) => {
        if (type === DATA_ACTION_ATTRIBUTE) {
            const eventDictionary = stateDictionaryToEventDictionary(stateDictionary);
            eventDictionary.forEach((stateAction, eventName) => {
                const eventListenerWrapper = (event: Event) => callback(stateAction, event);
                element.addEventListener(eventName, eventListenerWrapper);
            });
        }
    });
}
