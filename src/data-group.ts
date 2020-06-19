import {DATA_KEY_ATTRIBUTE, hasNoValue, Renderer, ToString} from "./types";
import createItemRenderer from "./libs/create-item-renderer";
import {DataElement} from "./data-element";
import {dataGroupMissingDataKey} from "./libs/error-message";

export class DataGroup<Type> extends DataElement<Type[], Type> {

    private dataKeyPicker: ToString<Type>;
    private dataKeyField: string;
    private readonly renderers: Map<string, Renderer>;

    constructor() {
        super();
        const defaultDataKeyPicker = (data: Type) => {
            if (hasNoValue(this.dataKeyField)) {
                throw new Error(dataGroupMissingDataKey());
            }
            return (data as any)[this.dataKeyField];
        };
        this.renderers = new Map<string, Renderer>();
        this.dataKeyPicker = defaultDataKeyPicker;
        this.reducer = (data) => data;
    }

    static get observedAttributes() {
        return [DATA_KEY_ATTRIBUTE];
    }

    protected initAttribute = () => {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
    };

    public setDataKeyPicker = (dataKeyPicker: ToString<Type>) => {
        this.dataKeyPicker = dataKeyPicker;
    };

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === DATA_KEY_ATTRIBUTE) {
            this.dataKeyField = newValue;
        }
    }

    protected render = () => {
        const dataSource: Type[] = this.dataSource;
        const template: ChildNode[] = this.template;
        const renderers: Map<string, Renderer> = this.renderers;
        if (hasNoValue(dataSource) || hasNoValue(template)) {
            return;
        }
        this.removeExpiredData();
        let anchorNode: Node = document.createElement('template');
        this.append(anchorNode);
        const dpLength = dataSource.length - 1;
        [...dataSource].reverse().forEach((data, index) => {
            const dataKey = this.dataKeyPicker(data);
            if (!renderers.has(dataKey)) {
                const dataNode: ChildNode[] = template.map(node => node.cloneNode(true)) as ChildNode[];
                const itemRenderer = createItemRenderer(dataNode, this.updateDataCallback, this.reducer);
                renderers.set(dataKey, itemRenderer);
            }
            const itemRenderer = renderers.get(dataKey);
            const reversedNodes = [...itemRenderer.nodes].reverse();
            for (const node of reversedNodes) {
                if (anchorNode.previousSibling !== node) {
                    this.insertBefore(node, anchorNode);
                }
                anchorNode = node;
            }
            const dataGetter = () => ({data, key: dataKey, index: (dpLength - index)});
            itemRenderer.render(dataGetter);
        });
        this.lastChild.remove();
    };

    private removeExpiredData = () => {
        const renderers: Map<string, Renderer> = this.renderers;
        const dataSource: Type[] = this.dataSource;

        const dataSourceKeys = dataSource.map(data => this.dataKeyPicker(data));
        const prevKeys = Array.from(renderers.keys());
        const discardedKeys = prevKeys.filter(key => dataSourceKeys.indexOf(key) < 0);
        discardedKeys.forEach(discardedKey => {
            const discardNode = (node: ChildNode) => node.remove();
            renderers.get(discardedKey).nodes.forEach(discardNode);
            renderers.delete(discardedKey);
        });
    };
}

