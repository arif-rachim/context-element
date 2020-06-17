import {IGNORE_CONTEXT, Reducer, Renderer, SetDataProvider} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import createItemRenderer from "./libs/create-item-renderer";

function isFunction(functionToCheck: any) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

export class ContextProvider extends HTMLElement {
    public reducer: Reducer<any>;
    private template: Array<Node>;
    private renderer: Renderer;
    private context: any;
    private onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = (data) => data;
    }

    public setContext = (context: any | SetDataProvider) => {
        if (context === IGNORE_CONTEXT) {
            return;
        }
        this.context = isFunction(context) ? context(this.context) : context;
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

    private render = () => {
        if (this.context === null || this.template === null) {
            return;
        }
        let lastNode: Node = document.createElement('template');
        this.append(lastNode);
        if (this.renderer === null) {
            const dataNode = this.template.map(node => node.cloneNode(true));
            this.renderer = createItemRenderer(dataNode, this.setContext, this.reducer);
        }
        const reversedDataNodes = [...this.renderer.dataNode].reverse();
        for (const node of reversedDataNodes) {
            if (lastNode.previousSibling !== node) {
                this.insertBefore(node, lastNode);
            }
            lastNode = node;
        }
        this.renderer.render(() => ({data: this.context, key: ''}));
        this.lastChild.remove();
    };

}

