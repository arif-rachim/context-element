import {DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE, DATA_WATCH_ATTRIBUTE, STATE_GLOBAL, TripleMap} from "../types";

export function createTypeStateAttribute(element: HTMLElement): TripleMap<string> {
    const attributesToWatch = element.getAttributeNames().filter(name => {
        return (name.indexOf(DATA_WATCH_ATTRIBUTE) >= 0) || (name.indexOf(DATA_TOGGLE_ATTRIBUTE) >= 0) || (name.indexOf(DATA_ACTION_ATTRIBUTE) >= 0);
    });
    return attributesToWatch.reduce((acc: TripleMap<string>, attributeKey: string) => {
        let attribute = '', state = STATE_GLOBAL, type = '';
        let keys = attributeKey.split('.');
        if (keys.length === 3) {
            attribute = keys[0];
            state = keys[1];
            type = keys[2];
        } else if (keys.length === 2) {
            attribute = keys[0];
            type = keys[1];
        } else if (keys.length === 1) {
            type = keys[0];
            if (type === DATA_WATCH_ATTRIBUTE) {
                attribute = 'content';
            }
            if (type === DATA_ACTION_ATTRIBUTE) {
                attribute = 'click';
            }
            if (type === DATA_TOGGLE_ATTRIBUTE) {
                attribute = 'class';
            }
        }
        const value = element.getAttribute(attributeKey);
        element.removeAttribute(attributeKey);

        if (!acc.has(type)) {
            acc.set(type, new Map<string, Map<string, string>>());
        }
        if (!acc.get(type).has(state)) {
            acc.get(type).set(state, new Map<string, string>())
        }
        acc.get(type).get(state).set(attribute, value);

        return acc;
    }, new Map<string, Map<string, Map<string, string>>>());
}
