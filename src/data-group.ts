import {DATA_KEY_ATTRIBUTE, FunctionReturnString, hasNoValue, Renderer} from "./types";
import createItemRenderer from "./libs/create-item-renderer";
import {DataElement} from "./data-element";

export class DataGroup<Type> extends DataElement<Type[], Type> {

    private dataKeySelector: FunctionReturnString<Type>;
    private dataKeyField: string;
    private renderers: Map<string, Renderer>;

    constructor() {
        super();
        this.renderers = new Map<string, Renderer>();
        this.dataKeySelector = (data: Type) => {
            if (hasNoValue(this.dataKeyField)) {
                const errorMessage = `'<data-group>' requires 'data-key' attribute. Data-key value should refer to the unique attribute of the data.`;
                throw new Error(errorMessage);
            }
            return (data as any)[this.dataKeyField];
        };
        this.reducer = (data) => data;
    }

    public setDataKeySelector = (selector: FunctionReturnString<Type>) => {
        this.dataKeySelector = selector;
    };

    protected initAttribute = () => {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
    };


    protected render = () => {
        if (hasNoValue(this.dataProvider) || hasNoValue(this.template)) {
            return;
        }
        this.removeExpiredData();
        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        const dpLength = this.dataProvider.length - 1;
        [...this.dataProvider].reverse().forEach((data, index) => {
            const dataKey = this.dataKeySelector(data);
            if (!this.renderers.has(dataKey)) {
                const dataNode = this.template.map(node => node.cloneNode(true));
                const itemRenderer = createItemRenderer(dataNode, this.updateContextCallback, this.reducer);
                this.renderers.set(dataKey, itemRenderer);
            }
            const itemRenderer = this.renderers.get(dataKey);
            const reversedDataNodes = [...itemRenderer.dataNode].reverse();
            for (const node of reversedDataNodes) {
                if (lastNode.previousSibling !== node) {
                    this.insertBefore(node, lastNode);
                }
                lastNode = node;
            }
            const dataRenderer = () => ({data, key: dataKey, index: (dpLength - index)});
            itemRenderer.render(dataRenderer);
        });
        this.lastChild.remove();
    };

    private removeExpiredData = () => {
        const newKeys = this.dataProvider.map(data => this.dataKeySelector(data));
        const oldKeys = Array.from(this.renderers.keys());
        const removedKeys = oldKeys.filter(key => newKeys.indexOf(key) < 0);
        removedKeys.forEach(key => {
            this.renderers.get(key).dataNode.forEach(node => (node as ChildNode).remove());
            this.renderers.delete(key);
        });
    };
}

