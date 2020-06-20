import {
    contains,
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    Reducer,
    UpdateDataCallback,
} from "../types";
import noEmptyTextNode from "./no-empty-text-node";
import AttributeEvaluator from "./attribute-evaluator";

export default class DataRenderer<DataSource, Item> {

    public readonly nodes: ChildNode[];
    private readonly updateData: UpdateDataCallback<DataSource>;
    private readonly reducer: Reducer<DataSource, Item>;
    private dataGetter: DataGetter<Item>;
    private readonly attributeEvaluators: AttributeEvaluator<DataSource, Item>[];

    constructor(nodes: ChildNode[], updateData: UpdateDataCallback<DataSource>, reducer: Reducer<DataSource, Item>) {
        this.nodes = nodes;
        this.updateData = updateData;
        this.reducer = reducer;

        const activeAttributes: (string)[] = [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE];
        const activeNodes: ChildNode[] = Array.from(activeNodesLookup(activeAttributes, this.nodes));
        const dataGetter = () => this.dataGetter();
        this.attributeEvaluators = activeNodes.map(activeNode => new AttributeEvaluator(activeNode, dataGetter, this.updateData, this.reducer));
    }

    public render = (getter: DataGetter<Item>) => {
        this.dataGetter = getter;
        this.attributeEvaluators.forEach((attributeEvaluator: AttributeEvaluator<DataSource, Item>) => attributeEvaluator.render());
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
            if (contains(attribute, attributesSuffix)) {
                accumulator.add(element);
            }
        }
        if (!contains(element.tagName, ['CONTEXT-ARRAY', 'CONTEXT-ELEMENT'])) {
            const childrenNodes = activeNodesLookup(attributesSuffix, Array.from(element.childNodes));
            Array.from(childrenNodes).forEach(childNode => accumulator.add(childNode));
        }
        return accumulator;
    }, new Set<ChildNode>());
};
