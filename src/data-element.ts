import {getChangeEventName, hasNoValue, Reducer, Renderer, SetData} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";

export class DataElement<Type, Output> extends HTMLElement {
    public reducer: Reducer<Type, Output>;
    protected template: Node[];
    protected renderer: Renderer;
    protected dataProvider: Type;
    protected onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = (data) => data;
    }

    get data(): Type {
        return this.dataProvider;
    }

    set data(value: Type) {
        this.setData(() => value);
    }

    public setData = (context: SetData<Type>) => {
        this.dataProvider = context(this.dataProvider);
        this.render();
    };

    public onMounted = (onMountedCallback: () => void) => {
        this.onMountedCallback = onMountedCallback;
    };

    connectedCallback() {
        this.initAttribute();
        if (hasNoValue(this.template)) {
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

    protected updateContextCallback = (value: SetData<Type>) => {
        this.setData(value);
        const dataChangedEvent = getChangeEventName('data');
        if (dataChangedEvent in this) {
            (this as any)[dataChangedEvent].call(this, this.dataProvider);
        }
    };

    protected render = () => {
        if (hasNoValue(this.dataProvider) || hasNoValue(this.template)) {
            return;
        }
        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        if (hasNoValue(this.renderer)) {
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
        const dataRenderer = () => ({data: this.dataProvider, key: ''});
        this.renderer.render(dataRenderer);
        this.lastChild.remove();
    };

    protected initAttribute = () => {
        // we are nt implementing here
    };
}

