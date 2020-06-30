import {
    Action,
    ActionPath,
    ArrayAction,
    CHILD_ACTION_EVENT,
    ChildAction,
    composeChangeEventName,
    DataGetter,
    DataSetter,
    hasNoValue,
    hasValue,
    HIDE_CLASS,
    Reducer
} from "./types";
import noEmptyTextNode from "./libs/no-empty-text-node";
import DataRenderer from "./libs/data-renderer";

/**
 * ContextElement is HTMLElement which can render data in accordance with the template defined in it.
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
 * ContextElement will populate the data into template by looking at the attribute which has watch keyword in it.
 * These attribute which has keyword `watch` in it are also known as active-attribute.
 * There are 4 kinds of active-attribute,  (watch / toggle / action / assets). each attribute works with a different mechanism when ContextElement renders the data.
 *
 */
export class ContextElement<Context> extends HTMLElement {
    public reducer: Reducer<Context>;
    public assets: any;
    public dataPath: string;
    protected template: ChildNode[];
    protected renderer: DataRenderer<Context>;
    protected contextData: Context;
    protected onMountedCallback: () => void;
    private superContextElement: ContextElement<any>;

    /**
     * Constructor sets default value of reducer to return the parameter immediately (param) => param.
     */
    constructor() {
        super();
        this.template = null;
        this.renderer = null;
        this.reducer = null;
        this.contextData = {} as Context;
        this.assets = {};
    }

    /**
     * Get the value of data in this ContextElement
     */
    get data(): Context {
        return this.contextData;
    }

    /**
     * Set the value of ContextElement data
     * @param value
     */
    set data(value: Context) {
        this.setData(() => value);
    }

    /**
     * Callback function to set the data,
     * <pre>
     *     <code>
     *         contextElement.setData(data => ({...data,attribute:newValue});
     *     </code>
     * </pre>
     *
     * @param context
     */
    public setData = (context: DataSetter<Context>) => {
        this.contextData = context(this.contextData);
        this.render();
    };

    /**
     * onMounted is invoke when the Element is ready and mounted to the window.document.
     * <pre>
     *     <code>
     *         contextElement.onMounted(() => console.log(`ChildNodes Ready `,contextElement.childNodes.length > 0));
     *     </code>
     * </pre>
     * @param onMountedListener
     */
    public onMounted = (onMountedListener: () => void) => {
        this.onMountedCallback = onMountedListener;
    };

    // noinspection JSUnusedGlobalSymbols
    /**
     * connectedCallback is invoked each time the custom element is appended into a document-connected element.
     * When connectedCallback invoked, it will initialize the active attribute, populate the template, and call
     * onMountedCallback. Populating the template will be invoke one time only, the next call of connectedCallback will not
     * repopulate the template again.
     */
    connectedCallback() {
        this.superContextElement = this.getSuperContextElement(this.parentNode);
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
            //requestAnimationFrame(requestAnimationFrameCallback);
            setTimeout(requestAnimationFrameCallback, 0);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Invoked each time the custom element is disconnected from the document's DOM.
     */
    disconnectedCallback() {
        this.superContextElement = null;
    }

    /**
     * Get the assets from the current assets or the parent context element assets.
     * @param key
     */
    public getAsset = (key: string): any => {
        const assets = this.assets;
        if (hasValue(assets) && key in assets) {
            return assets[key];
        }
        const superContextElement = this.superContextElement;
        if (hasValue(superContextElement)) {
            return superContextElement.getAsset(key);
        }
        return null;
    };

    /**
     * Convert action to ActionPath
     * @param arrayAction
     */
    actionToPath = (arrayAction: ArrayAction<any>) => {
        const actionPath: ActionPath = {path: this.dataPath};
        if (hasValue(arrayAction.key)) {
            actionPath.key = arrayAction.key;
            actionPath.index = arrayAction.index;
            actionPath.data = arrayAction.data;
        }
        return actionPath;
    };

    /**
     * updateDataCallback is a callback function that will set the data and call `dataChanged` method.
     * <pre>
     *     <code>
     *         contextElement.dataChanged = (data) => console.log("data changed");
     *     </code>
     * </pre>
     * @param dataSetter
     */
    protected updateDataCallback = (dataSetter: DataSetter<Context>) => {
        this.setData(dataSetter);
        const dataChangedEvent: string = composeChangeEventName('data');
        if (dataChangedEvent in this) {
            (this as any)[dataChangedEvent].call(this, this.contextData);
        }
    };

    /**
     * To bubble child action to the parent.
     * @param action
     */
    protected bubbleChildAction = (action: ArrayAction<any> | Action) => {
        const childAction: ChildAction = {
            event: action.event,
            type: action.type,
            childActions: [this.actionToPath(action as ArrayAction<any>)]
        };
        this.dispatchDetailEvent(childAction);
    };

    /**
     * Updating current data from child action
     * @param action
     * @param currentAction
     */
    protected updateDataFromChild = (action: ChildAction, currentAction: ArrayAction<any>) => {
        const reducer = this.reducer;
        this.updateDataCallback((oldData: Context) => {
            if (hasNoValue(reducer)) {
                action.childActions = [this.actionToPath(currentAction), ...action.childActions];
                this.dispatchDetailEvent(action);
                return oldData;
            }
            return reducer(oldData, action);
        });
    };

    /**
     * render method is invoked by the component when it received a new data-update.
     * First it will create DataRenderer object if its not exist.
     * DataRenderer require ContextElement cloned template , updateDataCallback, and reducer.
     *
     * `cloned template` will be used by the DataRenderer as the real node that will be attached to document body.
     * `updateDataCallback` will be used by the DataRenderer to inform the ContextElement if there's new data-update performed by user action.
     * `reducer` is an function that will return a new copy of the data.Reducer is invoked when there's user action/
     *
     * Each time render method is invoked, a new callback to get the latest data (dataGetter) is created and passed to
     * DataRenderer render method.
     *
     */
    protected render = () => {
        if (hasNoValue(this.contextData) || hasNoValue(this.template)) {
            return;
        }
        if (hasNoValue(this.renderer)) {
            const dataNodes: ChildNode[] = this.template.map(node => node.cloneNode(true)) as ChildNode[];
            this.renderer = new DataRenderer(dataNodes, this.getAsset, this.updateDataCallback, () => this.reducer, this.bubbleChildAction, this.updateDataFromChild);
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

        const data = this.contextData;
        const dataGetter: DataGetter<Context> = () => ({data});
        this.renderer.render(dataGetter);
        this.lastChild.remove();
    };

    /**
     * initAttribute is the method to initialize ContextElement attribute invoked each time connectedCallback is called.
     */
    protected initAttribute = () => {
    };

    /**
     * Dispatch child action event.
     * @param childAction
     */
    private dispatchDetailEvent = (childAction: ChildAction) => {
        const event = new CustomEvent(CHILD_ACTION_EVENT, {detail: childAction, cancelable: true, bubbles: true});
        this.dispatchEvent(event);
    };

    /**
     * Populate the ContextElement template by storing the node child-nodes into template property.
     * Once the child nodes is stored in template property, ContextElement will clear its content by calling this.innerHTML = ''
     */
    private populateTemplate = () => {
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    };

    /**
     * Get the super context element, this function will lookup to the parentNode which is instanceof ContextElement,
     * If the parent node is instance of contextElement then this node will return it.
     *
     * @param parentNode
     */
    private getSuperContextElement = (parentNode: Node): ContextElement<any> => {
        if (parentNode instanceof ContextElement) {
            return parentNode;
        } else if (hasValue(parentNode.parentNode)) {
            return this.getSuperContextElement(parentNode.parentNode);
        }
        return null;
    };

}
