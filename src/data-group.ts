import {DATA_KEY_ATTRIBUTE, FunctionReturnString, getChangeEventName, Reducer, Renderer, SetData} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";

export class DataGroup<Type> extends HTMLElement {

    public reducer: Reducer<Type[], Type>;
    private dataKeySelector: FunctionReturnString<Type>;
    private template: Array<Node>;
    private dataKeyField: string;
    private renderers: Map<string, Renderer>;
    private dataProvider: Type[];
    private onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.dataProvider = null;
        this.renderers = new Map<string, Renderer>();
        this.dataKeySelector = (data: Type) => {
            if (this.dataKeyField === undefined || this.dataKeyField === null) {
                const errorMessage = `'<data-group>' requires 'data-key' attribute. Data-key value should refer to the unique attribute of the data.`;
                throw new Error(errorMessage);
            }
            return (data as any)[this.dataKeyField];
        };
        this.reducer = (data) => data;
    }

    get data(): Type[] {
        return this.dataProvider;
    }

    set data(value: Type[]) {
        this.setDataProvider(() => value);
    }

    public setDataKeySelector = (selector: FunctionReturnString<Type>) => {
        this.dataKeySelector = selector;
    };

    public setDataProvider = (dataProvider: SetData<Type[]>) => {
        this.dataProvider = dataProvider(this.dataProvider);
        this.render();
    };

    public onMounted = (onMountedCallback: () => void) => {
        this.onMountedCallback = onMountedCallback;
    };

    connectedCallback() {

        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
        if (this.template === null) {
            this.setAttribute('style', 'display:none');
            const requestAnimationFrameCallback = () => {
                this.populateTemplate();
                this.removeAttribute('style');
                this.render();
                if (this.onMountedCallback) {
                    this.onMountedCallback();
                    this.onMountedCallback = null;
                }
            };
            requestAnimationFrame(requestAnimationFrameCallback);
        }
    }

    private populateTemplate = () => {
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    };

    private updateContextCallback = (value: SetData<Type[]>) => {
        this.setDataProvider(value);
        const dataChangedEvent = getChangeEventName('data');
        if (dataChangedEvent in this) {
            (this as any)[dataChangedEvent].call(this, this.dataProvider);
        }
    };

    private render = () => {
        if (this.dataProvider === null || this.template === null) {
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
            itemRenderer.render(() => ({data, key: dataKey, index: (dpLength - index)}));
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

