import {
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    hasNoValue,
    IGNORE_CONTEXT,
    Reducer,
    Renderer,
    STATE_GLOBAL,
    STATE_PROPERTY,
    TripleMap,
} from "../types";

import listenEventOnNode from "./listen-event-on-node";
import printDataOnNode from "./print-data-on-node";
import noEmptyTextNode from "./no-empty-text-node";
import {DataGroup} from "../data-group";
import {DataElement} from "../data-element";

export default function createItemRenderer<ReducerType, Output>(dataNode: Array<Node>, updateContextCallback: any, reducer: Reducer<ReducerType, Output>): Renderer {

    let dataGetter: DataGetter<Output>;
    const activeAttributes = [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE];
    const activeNodes = Array.from(findNodesThatHaveAttributes(activeAttributes, dataNode));
    const nodesDictionary = activeNodes.map(node => ({dictionary: toDictionaries(node as HTMLElement), node}));

    const onActionCallback = (stateActionTypeMapping: Map<string, string>, event: Event) => {
        const onUpdateContextCallback = (oldContext: ReducerType) => {
            const {data, key, index} = dataGetter();
            let action = {event: event, type: '', data: data, key: key, index};
            action.type = stateActionTypeMapping.get(STATE_GLOBAL) || '';
            action.type = stateActionTypeMapping.get((data as any)[STATE_PROPERTY]) || action.type;

            if (hasNoValue(key)) {
                delete action.key;
                delete action.data;
                delete action.index;
            }

            if (action.type) {
                return reducer(oldContext, action);
            }
            return IGNORE_CONTEXT;
        };
        updateContextCallback(onUpdateContextCallback);
    };
    nodesDictionary.forEach(({dictionary, node}) => listenEventOnNode(node as HTMLElement, dictionary, onActionCallback));
    return {
        render: (getter: DataGetter<Output>) => {
            dataGetter = getter;
            const {data} = getter();
            nodesDictionary.forEach(({dictionary, node}) => printDataOnNode(node as HTMLElement, dictionary, data));
        },
        dataNode
    };
}


function toDictionaries(element: HTMLElement): TripleMap<string> {

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

const findNodesThatHaveAttributes = (attributesSuffix: Array<string>, childNodes: Array<Node>) => {
    return Array.from(childNodes).filter(noEmptyTextNode()).reduce((accumulator, childNode) => {
        if (!(childNode instanceof HTMLElement)) {
            return accumulator;
        }
        const element = childNode as HTMLElement;

        const attributeNames = element.getAttributeNames();
        for (const attribute of attributeNames) {
            for (const attributeSuffix of attributesSuffix) {
                if (attribute.split('.').indexOf(attributeSuffix) >= 0) {
                    accumulator.add(element);
                    break;
                }
            }
        }
        if (!(element instanceof DataGroup || element instanceof DataElement)) {
            const childrenNodes = findNodesThatHaveAttributes(attributesSuffix, Array.from(element.childNodes));
            Array.from(childrenNodes).forEach(childNode => accumulator.add(childNode));
        }
        return accumulator;
    }, new Set<ChildNode>());
};
