const DATA_WATCH_ATTRIBUTE = 'data-watch';
type Renderer = { render: (data: any) => void };

function removeEmptyTextNode() {
    return (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return /\S/.test(node.textContent);
        }
        return true;
    };
}


function printDataOnNode(node: ChildNode, data: any) {
    const element = node as HTMLElement;
    const dataToWatch = element.getAttribute(DATA_WATCH_ATTRIBUTE);
    if (element instanceof HTMLDivElement) {
        element.innerText = data[dataToWatch];
    }
}

function createRenderer(dataNode: Array<Node>) {
    const findNodesThatHaveAttribute = (attribute: string, childNodes: Array<Node>) => {
        return Array.from(childNodes).filter(removeEmptyTextNode()).reduce((accumulator, childNode) => {
            let childrenNodes: ChildNode[] = [];
            if (childNode instanceof HTMLElement) {
                if ((childNode as HTMLElement).getAttribute(attribute)) {
                    accumulator.push(childNode);
                }
                if (!(childNode instanceof DataGroup)) {
                    childrenNodes = findNodesThatHaveAttribute(attribute, Array.from(childNode.childNodes));
                }
            }
            return [...accumulator, ...childrenNodes];
        }, Array<ChildNode>());
    };
    const nodesThatWatchingData = findNodesThatHaveAttribute(DATA_WATCH_ATTRIBUTE, dataNode);
    return {
        render: (data: any) => {
            nodesThatWatchingData.forEach(node => {
                printDataOnNode(node, data);
            })
        }
    };
}

class DataGroup extends HTMLElement {

    private _template: Array<Node>;
    private _dataKeyField: string;
    private _renderers: Map<string, Renderer>;

    constructor() {
        super();
        this._template = null;
        this._renderers = new Map<string, Renderer>();
        this._dataKeySelector = (data: any) => data[this._dataKeyField];
    }

    private _dataProvider: Array<any>;

    get dataProvider(): Array<any> {
        return this._dataProvider;
    }

    set dataProvider(value: Array<any>) {
        this._dataProvider = value;
        this.render();
    }

    private _dataKeySelector: (data: any) => string;

    set dataKeySelector(value: (data: any) => string) {
        this._dataKeySelector = value;
    }

    connectedCallback() {
        this._dataKeyField = this.getAttribute('data-key') || 'id';
        if (this._template === null) {
            // first we hide it before we render it to screen
            this.setAttribute('style', 'display:none');
            setTimeout(() => {
                this._template = Array.from(this.childNodes).filter(removeEmptyTextNode());
                this.innerHTML = ''; // we cleanup the innerHTML
                this.removeAttribute('style');
                this.render();
            }, 0);
        }
    }

    private render() {
        if (this._dataProvider && this._template) {
            this._dataProvider.forEach((data) => {
                const dataKey = this._dataKeySelector(data);
                if (!this.cacheHasRenderer(dataKey)) {
                    // watch out cloneNode(deep) might not work in IE !! maybe we need to create polyfill of this
                    const dataNode = this._template.map(node => node.cloneNode(true));
                    const renderer = createRenderer(dataNode);
                    this.append(...dataNode);
                    this.cacheRenderer(dataKey, renderer);
                }
                this.getRenderer(dataKey).render(data);
            })
        }

    }

    private cacheRenderer(dataKey: string, renderer: Renderer) {
        this._renderers.set(dataKey, renderer);
    }

    private cacheHasRenderer(dataKey: string): boolean {
        return this._renderers.has(dataKey);
    }

    private getRenderer(dataKey: string): Renderer {
        return this._renderers.get(dataKey);
    }
}

customElements.define('data-group', DataGroup);