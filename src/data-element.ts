import {getChangeEventName, IGNORE_CONTEXT, isFunction, Reducer, Renderer, SetDataProvider} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";


export class DataElement extends HTMLElement {
    public reducer: Reducer<any>;
    private template: Array<Node>;
    private renderer: Renderer;
    private dataProvider: any;
    private onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = (data) => data;
    }

    get data(): any {
        return this.dataProvider;
    }

    set data(value: any) {
        this.setDataProvider(() => value);
    }

    public setDataProvider = (context: any | SetDataProvider) => {
        if (context === IGNORE_CONTEXT) {
            return;
        }
        this.dataProvider = isFunction(context) ? context(this.dataProvider) : context;
        this.render();
    };

    public onMounted = (onMountedCallback: () => void) => {
        this.onMountedCallback = onMountedCallback;
    };

    connectedCallback() {
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

    private updateContextCallback = (value: any) => {
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
        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        if (this.renderer === null) {
            const dataNode = this.template.map(node => node.cloneNode(true));
            this.renderer = createItemRenderer(dataNode, this.updateContextCallback, this.reducer);
        }
        const reversedDataNodes = [...this.renderer.dataNode].reverse();
        for (const node of reversedDataNodes) {
            if (lastNode.previousSibling !== node) {
                this.insertBefore(node, lastNode);
            }
            lastNode = node;
        }
        this.renderer.render(() => ({data: this.dataProvider, key: ''}));
        this.lastChild.remove();
    };
}

