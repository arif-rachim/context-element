import {
    ARRAY_CONTEXT_ELEMENT_TAG_NAME,
    contains,
    CONTEXT_ELEMENT_TAG_NAME,
    DATA_ACTION_ATTRIBUTE,
    DATA_TOGGLE_ATTRIBUTE,
    DATA_WATCH_ATTRIBUTE,
    DataGetter,
    Reducer,
    UpdateDataCallback,
} from "../types";
import noEmptyTextNode from "./no-empty-text-node";
import AttributeEvaluator from "./attribute-evaluator";

/**
 * DataRenderer is an object that store cloned ContextElement.template and store it in 'nodes' property.
 * During initialization, DataRenderer scanned for the active-nodes against nodes property.
 * active-nodes are the node that contain active-attributes such as `watch|toggle|action`.
 *
 * When the active nodes identifed, DataRenderer create AttributeEvaluator against each active-node, and store them in
 * attributeEvaluators property.
 *
 * When DataRenderer.render invoked by the ContextElement, DataRenderer iterate all ActiveAttributes and call
 * ActiveAttribte.render method.
 */
export default class DataRenderer<DataSource, Item> {

    /**
     * Real node (copy of ContextElement.template) that is attached to the document.body
     */
    public readonly nodes: ChildNode[];

    /**
     * ContextElement.updateDataCallback, this callback is to inform ContextElement to update the dataSource.
     */
    private readonly updateData: UpdateDataCallback<DataSource>;

    /**
     * Callback that responsible to convert oldData into a newData based on the user action.
     */
    private readonly reducer: Reducer<DataSource, Item>;

    /**
     * Callback to get the latest ContextElement.data
     */
    private dataGetter: DataGetter<Item>;

    /**
     * Collection of AttributeEvaluator.
     */
    private readonly attributeEvaluators: AttributeEvaluator<DataSource, Item>[];

    /**
     * Constructor to setup the DataRenderer initialization.
     *
     * @param nodes is a cloned of ContextElement.template
     * @param updateData
     * @param reducer
     */
    constructor(nodes: ChildNode[], updateData: UpdateDataCallback<DataSource>, reducer: Reducer<DataSource, Item>) {
        this.nodes = nodes;
        this.updateData = updateData;
        this.reducer = reducer;

        const activeAttributes: (string)[] = [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE];
        const activeNodes: ChildNode[] = Array.from(activeNodesLookup(activeAttributes, this.nodes));
        const dataGetter = () => this.dataGetter();
        this.attributeEvaluators = activeNodes.map(activeNode => new AttributeEvaluator(activeNode, dataGetter, this.updateData, this.reducer));
    }

    /**
     * Render with iterate all the AttributeEvaluators and call the AttributeEvaluator.render
     * @param getter
     */
    public render = (getter: DataGetter<Item>) => {
        this.dataGetter = getter;
        this.attributeEvaluators.forEach((attributeEvaluator: AttributeEvaluator<DataSource, Item>) => attributeEvaluator.render());
    };

}


/**
 * activeNodesLookup will return nodes which has the `active-attributes`. Active attributes are the node attribute that contains attributesSuffix.
 * Example of active-attributes value.watch .
 * <pre>
 *     <code>
 *         <form submit.action="ADD_DATA">
 *              <input value.watch="name" >
 *         </form>
 *     </code>
 * </pre>
 * @param attributesSuffix watch|toggle|action
 * @param nodes filter
 */
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
        if (!contains(element.tagName, [ARRAY_CONTEXT_ELEMENT_TAG_NAME.toUpperCase(), CONTEXT_ELEMENT_TAG_NAME.toUpperCase()])) {
            const childrenNodes = activeNodesLookup(attributesSuffix, Array.from(element.childNodes));
            Array.from(childrenNodes).forEach(childNode => accumulator.add(childNode));
        }
        return accumulator;
    }, new Set<ChildNode>());
};
