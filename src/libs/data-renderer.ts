import {
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    hasNoValue,
    IGNORE_DATA,
    Reducer,
    STATE_GLOBAL,
    STATE_PROPERTY,
    TypeStateAttribute,
    UpdateDataCallback,
} from "../types";

import attachEventListener from "./attach-event-listener";
import printDataOnNode from "./print-data-on-node";
import noEmptyTextNode from "./no-empty-text-node";
import {DataGroup} from "../data-group";
import {DataElement} from "../data-element";
import {createTypeStateAttribute} from "./type-state-attribute";

export default class DataRenderer<T, O> {

    public readonly nodes: ChildNode[];
    private readonly updateData: UpdateDataCallback<T>;
    private readonly reducer: Reducer<T, O>;
    private dataGetter: DataGetter<O>;
    private typeStateAttributeNode: TypeStateAttribute[];

    constructor(nodes: ChildNode[], updateData: UpdateDataCallback<T>, reducer: Reducer<T, O>) {
        this.nodes = nodes;
        this.updateData = updateData;
        this.reducer = reducer;
        this.init();
    }

    public render = (getter: DataGetter<any>) => {
        this.dataGetter = getter;
        const {data} = getter();
        this.typeStateAttributeNode.forEach(({typeStateAttribute, activeNode}) => printDataOnNode(activeNode as HTMLElement, typeStateAttribute, data));
    };

    private init = () => {
        const activeAttributes: (string)[] = [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE];
        const activeNodes: ChildNode[] = Array.from(activeNodesLookup(activeAttributes, this.nodes));
        const typeStateAttributeNode: TypeStateAttribute[] = activeNodes.map(activeNode => ({
            typeStateAttribute: createTypeStateAttribute(activeNode as HTMLElement),
            activeNode
        }));
        this.typeStateAttributeNode = typeStateAttributeNode;

        const eventHandler = (stateActionTypeMapping: Map<string, string>, event: Event) => {
            const updateDataHandler = (prevData: T) => {
                const {data, key, index} = this.dataGetter();
                let action = {event: event, type: '', data: data, key: key, index};
                action.type = stateActionTypeMapping.get(STATE_GLOBAL) || '';
                action.type = stateActionTypeMapping.get((data as any)[STATE_PROPERTY]) || action.type;

                if (hasNoValue(key)) {
                    delete action.key;
                    delete action.data;
                    delete action.index;
                }
                if (action.type) {
                    return this.reducer(prevData, action);
                }
                return IGNORE_DATA;
            };
            this.updateData(updateDataHandler);
        };
        typeStateAttributeNode.forEach(({typeStateAttribute, activeNode}) => attachEventListener(activeNode as HTMLElement, typeStateAttribute, eventHandler));
    };
}

const activeNodesLookup = (attributesSuffix: string[], nodes: ChildNode[]) => {
    return nodes.filter(noEmptyTextNode()).reduce((accumulator, node) => {
        if (!(node instanceof HTMLElement)) {
            return accumulator;
        }
        const element = node as HTMLElement;
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
            const childrenNodes = activeNodesLookup(attributesSuffix, Array.from(element.childNodes));
            Array.from(childrenNodes).forEach(childNode => accumulator.add(childNode));
        }
        return accumulator;
    }, new Set<ChildNode>());
};
