import {DATA_KEY_ATTRIBUTE, FunctionReturnString, IGNORE_CONTEXT, Reducer, Renderer, SetDataProvider} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";

export class DataGroup extends HTMLElement {
    public reducer: Reducer<Array<any>>;
    private dataKeySelector: FunctionReturnString<any>;
    private template: Array<Node>;
    private dataKeyField: string;
    private renderers: Map<string, Renderer>;
    private dataProvider: Array<any>;
    private onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.dataProvider = null;
        this.renderers = new Map<string, Renderer>();
        this.dataKeySelector = (data: any) => {
            if (this.dataKeyField === undefined || this.dataKeyField === null) {
                const errorMessage = `'<data-group>' requires 'data-key' attribute. Data-key value should refer to the unique attribute of the data.`;
                throw new Error(errorMessage);
            }
            return data[this.dataKeyField];
        };
        this.reducer = (data) => data;
    }

    public setDataKeySelector = (selector: FunctionReturnString<any>) => {
        this.dataKeySelector = selector;
    };

    public setDataProvider = (dataProvider: Array<any> | SetDataProvider) => {
        if (dataProvider === IGNORE_CONTEXT) {
            return;
        }
        this.dataProvider = Array.isArray(dataProvider) ? dataProvider : dataProvider(this.dataProvider);
        this.render();
    };

    public onMounted = (onMountedCallback: () => void) => {
        this.onMountedCallback = onMountedCallback;
    };

    connectedCallback() {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
        if (this.template === null) {
            this.setAttribute('style', 'display:none');
            requestAnimationFrame(() => {
                this.populateTemplate();
                this.removeAttribute('style');
                this.render();
                if (this.onMountedCallback) {
                    this.onMountedCallback();
                    this.onMountedCallback = null;
                }
            });
        }
    }

    private populateTemplate = () => {
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    };

    private render = () => {
        if (this.dataProvider === null || this.template === null) {
            return;
        }
        this.removeExpiredData();
        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        [...this.dataProvider].reverse().forEach((data) => {
            const dataKey = this.dataKeySelector(data);
            if (!this.renderers.has(dataKey)) {
                const dataNode = this.template.map(node => node.cloneNode(true));
                const itemRenderer = createItemRenderer<Array<any>>(dataNode, this.setDataProvider, this.reducer);
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
            itemRenderer.render(() => ({data, key: dataKey}));
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
    }
}

