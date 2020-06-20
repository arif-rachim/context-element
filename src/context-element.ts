import {composeChangeEventName, DataSetter, hasNoValue, hasValue, HIDE_CLASS, Reducer} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import DataRenderer from "./libs/data-renderer";

/**
 * ContextElement is HTMLElement which can render data in accordance with the template defined in it.
 * Shortly after we assign a value to the data property, ContextElement will then render the data based on the template
 *
 * The following is an example of how we display the template page.
 *
 * <pre>
 *     <code>
 *         <context-element id="my-element">
 *             <div watch="name"></div>
 *             <div watch="city"></div>
 *             <div watch="email"></div>
 *         </context-element>
 *         <script>
 *             const contextElement = document.getElementById('my-element');
 *             contextElement.data = {name:"Javascript",city:"Tokyo",email:"javascript@contextelement.com};
 *         </script>
 *     </code>
 * </pre>
 *
 * Based on the above code ContextElement will populate the data into template elements by binding the watch attribute with the data property.
 * Attribute watch, is one of the 3 attributes used by ContextElement to render data.
 * The three attributes are watch / toggle / action
 *
 */
export class ContextElement<DataSource, Item> extends HTMLElement {
    public reducer: Reducer<DataSource, Item>;
    protected template: ChildNode[];
    protected renderer: DataRenderer<DataSource, Item>;
    protected dataSource: DataSource;
    protected onMountedCallback: () => void;

    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = (data) => data;
    }

    get data(): DataSource {
        return this.dataSource;
    }

    set data(value: DataSource) {
        this.setData(() => value);
    }

    public setData = (context: DataSetter<DataSource>) => {
        this.dataSource = context(this.dataSource);
        this.render();
    };

    public onMounted = (onMountedListener: () => void) => {
        this.onMountedCallback = onMountedListener;
    };

    connectedCallback() {
        this.initAttribute();
        if (hasNoValue(this.template)) {
            this.classList.add(HIDE_CLASS);
            const requestAnimationFrameCallback = () => {
                this.populateTemplate();
                this.classList.remove(HIDE_CLASS);
                this.render();
                if (hasValue(this.onMountedCallback)) {
                    this.onMountedCallback();
                    this.onMountedCallback = null;
                }
            };
            requestAnimationFrame(requestAnimationFrameCallback);
        }
    }

    protected updateDataCallback = (dataSetter: DataSetter<DataSource>) => {
        this.setData(dataSetter);
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
            this.renderer = new DataRenderer(dataNodes, this.updateDataCallback, this.reducer);
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
        // @ts-ignore
        const data = this.dataSource as Item;
        const dataGetter = () => ({data});
        this.renderer.render(dataGetter);
        this.lastChild.remove();
    };

    protected initAttribute = () => {
        // we are nt implementing here
    };

    private populateTemplate = () => {
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    };
}

