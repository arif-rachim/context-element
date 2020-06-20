import {DATA_KEY_ATTRIBUTE, hasNoValue, Renderer, ToString} from "./types";
import {ContextElement} from "./context-element";
import {arrayContextElementMissingDataKey} from "./libs/error-message";
import DataRenderer from "./libs/data-renderer";

export class ArrayContextElement<Item> extends ContextElement<Item[], Item> {

    private dataKeyPicker: ToString<Item>;
    private dataKeyField: string;
    private readonly renderers: Map<string, Renderer>;

    constructor() {
        super();
        const defaultDataKeyPicker = (data: Item) => {
            if (hasNoValue(this.dataKeyField)) {
                throw new Error(arrayContextElementMissingDataKey());
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

    public setDataKeyPicker = (dataKeyPicker: ToString<Item>) => {
        this.dataKeyPicker = dataKeyPicker;
    };

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === DATA_KEY_ATTRIBUTE) {
            this.dataKeyField = newValue;
        }
    }

    protected initAttribute = () => {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
    };

    protected render = () => {
        const dataSource: Item[] = this.dataSource;
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
                const itemRenderer = new DataRenderer(dataNode, this.updateDataCallback, this.reducer);
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
        const dataSource: Item[] = this.dataSource;
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

