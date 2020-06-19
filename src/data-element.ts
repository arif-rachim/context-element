import {composeChangeEventName, DataSetter, hasNoValue, hasValue, Reducer, Renderer} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";

export class DataElement<Type, Output> extends HTMLElement {
    public reducer: Reducer<Type, Output>;
    protected template: ChildNode[];
    protected renderer: Renderer;
    protected dataSource: Type;
    protected onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = (data) => data;
    }

    get data(): Type {
        return this.dataSource;
    }

    set data(value: Type) {
        this.setData(() => value);
    }

    public setData = (context: DataSetter<Type>) => {
        this.dataSource = context(this.dataSource);
        this.render();
    };

    public onMounted = (onMountedListener: () => void) => {
        this.onMountedCallback = onMountedListener;
    };

    connectedCallback() {
        this.initAttribute();
        if (hasNoValue(this.template)) {
            this.setAttribute('style', 'display:none');
            const requestAnimationFrameCallback = () => {
                this.populateTemplate();
                this.removeAttribute('style');
                this.render();
                if (hasValue(this.onMountedCallback)) {
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

    protected updateDataCallback = (value: DataSetter<Type>) => {
        this.setData(value);
        const dataChangedEvent: string = composeChangeEventName('data');
        if (dataChangedEvent in this) {
            (this as any)[dataChangedEvent].call(this, this.dataSource);
        }
    };

    protected render = () => {
        if (hasNoValue(this.dataSource) || hasNoValue(this.template)) {
            return;
        }
        if (hasNoValue(this.renderer)) {
            const dataNodes: ChildNode[] = this.template.map(node => node.cloneNode(true)) as ChildNode[];
            this.renderer = createItemRenderer(dataNodes, this.updateDataCallback, this.reducer);
        }
        const reversedNodes: Node[] = [...this.renderer.nodes].reverse();
        let anchorNode: Node = document.createElement('template');
        this.append(anchorNode);
        for (const node of reversedNodes) {
            if (anchorNode.previousSibling !== node) {
                this.insertBefore(node, anchorNode);
            }
            anchorNode = node;
        }
        const dataGetter = () => ({data: this.dataSource});
        this.renderer.render(dataGetter);
        this.lastChild.remove();
    };

    protected initAttribute = () => {
        // we are nt implementing here
    };
}

