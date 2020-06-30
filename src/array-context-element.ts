import {DATA_KEY_ATTRIBUTE, DataGetter, hasNoValue, Renderer, ToString} from "./types";
import {ContextElement} from "./context-element";
import {arrayContextElementMissingDataKey} from "./libs/error-message";
import DataRenderer from "./libs/data-renderer";

/**
 * ArrayContextElement is ContextElement which can render array instead of javascript object.
 * The following is an example of how we display the context-array page.
 *
 * <pre>
 *     <code>
 *         <context-array id="my-element"  data.key="id">
 *             <div watch="name"></div>
 *             <div watch="city"></div>
 *             <div watch="email"></div>
 *         </context-array>
 *         <script>
 *             const contextElement = document.getElementById('my-element');
 *             contextElement.data = [
 *                  {name:"Javascript",city:"Tokyo",email:"javascript@contextelement.com,dataId:"1"},
 *                  {name:"Go",city:"Dubai",email:"go@contextelement.com,dataId:"2"},
 *                  {name:"Java",city:"Doha",email:"java@contextelement.com,dataId:"3"}
 *             ];
 *         </script>
 *     </code>
 * </pre>
 *
 */
export class ArrayContextElement<Context> extends ContextElement<Context[]> {

    private dataKeyPicker: ToString<Context>;
    private dataKeyField: string;
    private readonly renderers: Map<string, Renderer>;

    /**
     * Set the default dataKeyPicker using callback that return value of object dataKeyField.
     */
    constructor() {
        super();
        const defaultDataKeyPicker = (data: Context) => {
            if (hasNoValue(this.dataKeyField)) {
                throw new Error(arrayContextElementMissingDataKey());
            }
            return (data as any)[this.dataKeyField];
        };
        this.renderers = new Map<string, Renderer>();
        this.dataKeyPicker = defaultDataKeyPicker;
        this.contextData = [];
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Observed attributes in context element
     */
    static get observedAttributes() {
        return [DATA_KEY_ATTRIBUTE];
    }

    /**
     * DataKeyPicker is a callback function to get the string key value of a data.
     *
     * @param dataKeyPicker
     */
    public setDataKeyPicker = (dataKeyPicker: ToString<Context>) => {
        this.dataKeyPicker = dataKeyPicker;
    };

    // noinspection JSUnusedGlobalSymbols
    /**
     * update the dataKeyField if there's a new change in the attribute.
     *
     * @param name of the attribute
     * @param oldValue
     * @param newValue
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === DATA_KEY_ATTRIBUTE) {
            this.dataKeyField = newValue;
        }
    }

    /**
     * initAttribute store the data.key attribute value to dataKeyField property.
     */
    protected initAttribute = () => {
        this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
    };

    /**
     * render method is invoked by the component when it received a new array-update.
     *
     * It will iterate the array and get the key value of the data.
     * It will create a DataRenderer if there is no dataRenderer exist.
     * The newly created DataRenderer then stored in the ContextElement renderers Map object along with the key.
     *
     * Each time ContexElement.render method is invoked, a new callback to get the latest data (dataGetter) is created and passed to
     * DataRenderer.render method.
     *
     */
    protected render = () => {
        const contextData: Context[] = this.contextData;
        const template: ChildNode[] = this.template;
        const renderers: Map<string, Renderer> = this.renderers;

        if (hasNoValue(contextData) || hasNoValue(template)) {
            return;
        }

        this.removeExpiredData();
        let anchorNode: Node = document.createElement('template');
        this.append(anchorNode);
        const dpLength = contextData.length - 1;
        [...contextData].reverse().forEach((data: Context, index: number) => {
            const dataKey = this.dataKeyPicker(data);
            if (!renderers.has(dataKey)) {
                const dataNode: ChildNode[] = template.map(node => node.cloneNode(true)) as ChildNode[];
                const itemRenderer = new DataRenderer(dataNode, this.getAsset, this.updateDataCallback, () => this.reducer, this.bubbleChildAction, this.updateDataFromChild);
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
            const dataGetter: DataGetter<Context> = () => ({data, key: dataKey, index: (dpLength - index)});
            itemRenderer.render(dataGetter);
        });
        this.lastChild.remove();
    };

    /**
     * Function to remove keys that is no longer exist in the ContextElement.renderers.
     * When ContextElement received new data (dataSource),it will check the obsolete keys in the ContextElement.renderers.
     * The obsolate keys along with the DataRenderer attach to it, removed from the ContextElement.renderers, and the template
     * node removed from the document.body.
     */
    private removeExpiredData = () => {
        const renderers: Map<string, Renderer> = this.renderers;
        const contextData: Context[] = this.contextData;
        const dataSourceKeys = contextData.map(data => this.dataKeyPicker(data));
        const prevKeys = Array.from(renderers.keys());
        const discardedKeys = prevKeys.filter(key => dataSourceKeys.indexOf(key) < 0);
        discardedKeys.forEach(discardedKey => {
            const discardNode = (node: ChildNode) => node.remove();
            renderers.get(discardedKey).nodes.forEach(discardNode);
            renderers.delete(discardedKey);
        });
    };
}

