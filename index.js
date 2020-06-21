(function () {
    'use strict';

    const composeChangeEventName = (attribute) => `${attribute}Changed`;
    const hasValue = (param) => param !== undefined && param !== null && param !== '';
    const hasNoValue = (param) => !hasValue(param);
    const contains = (text, texts) => texts.reduce((acc, txt) => acc || text.indexOf(txt) >= 0, false);
    const DATA_WATCH_ATTRIBUTE = 'watch';
    const DATA_KEY_ATTRIBUTE = 'data-key';
    const DATA_ACTION_ATTRIBUTE = 'action';
    const DATA_TOGGLE_ATTRIBUTE = 'toggle';
    const STATE_PROPERTY = '@state';
    const STATE_GLOBAL = '*';
    const HIDE_CLASS = "data-element-hidden";

    /**
     * Function to remove empty text node.
     */
    function noEmptyTextNode() {
        return (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return /\S/.test(node.textContent);
            }
            return true;
        };
    }

    const ignoredAttributes = ['data', 'reducer'];
    function isValidAttribute(attributeName) {
        return ignoredAttributes.indexOf(attributeName) < 0;
    }

    const arrayContextElementMissingDataKey = () => `'<context-array>' requires 'data-key' attribute. Data-key value should refer to the unique attribute of the data.`;
    const toggleMissingStateAndProperty = () => `toggle require 3 parameters separated with dot(.) : ' eg <div class="my-div" class.disabled.toggle="disabledCss"></div>`;

    function populateDefaultAttributeValue(element) {
        const attributeValue = new Map();
        element.getAttributeNames().forEach(attributeName => {
            attributeValue.set(attributeName, element.getAttribute(attributeName));
        });
        return attributeValue;
    }
    class AttributeEvaluator {
        constructor(activeNode, dataGetter, updateData, reducer) {
            // mapping for watch
            this.stateAttributeProperty = null;
            // mapping for toggle
            this.attributeStateProperty = null;
            // mapping for action
            this.eventStateAction = null;
            this.render = () => {
                const element = this.activeNode;
                const stateAttributeProperty = this.stateAttributeProperty;
                const attributeStateProperty = this.attributeStateProperty;
                const dataGetterValue = this.dataGetter();
                const data = dataGetterValue.data;
                const dataState = data[STATE_PROPERTY];
                const defaultAttributeValue = this.defaultAttributeValue;
                updateWatchAttribute(element, stateAttributeProperty, dataGetterValue, dataState);
                updateToggleAttribute(element, attributeStateProperty, dataState, defaultAttributeValue);
            };
            this.activeNode = activeNode;
            this.dataGetter = dataGetter;
            this.updateData = updateData;
            this.reducer = reducer;
            this.activeAttributeValue = populateActiveAttributeValue(activeNode);
            this.defaultAttributeValue = populateDefaultAttributeValue(activeNode);
            this.eventStateAction = mapEventStateAction(this.activeAttributeValue);
            this.stateAttributeProperty = mapStateAttributeProperty(this.activeAttributeValue);
            this.attributeStateProperty = mapAttributeStateProperty(this.activeAttributeValue);
            initEventListener(activeNode, this.eventStateAction, dataGetter, updateData, reducer);
        }
    }
    const mapEventStateAction = (attributeValue) => {
        const eventStateAction = new Map();
        attributeValue.forEach((value, attributeName) => {
            if (attributeName.endsWith(DATA_ACTION_ATTRIBUTE)) {
                const attributes = attributeName.split('.');
                let event = '';
                let state = '';
                if (attributes.length === 1) {
                    event = 'click';
                    state = STATE_GLOBAL;
                }
                else if (attributes.length === 2) {
                    event = attributes[0];
                    state = STATE_GLOBAL;
                }
                else if (attributes.length > 2) {
                    event = attributes[0];
                    state = attributes[1];
                }
                if (!eventStateAction.has(event)) {
                    eventStateAction.set(event, new Map());
                }
                eventStateAction.get(event).set(state, value);
            }
        });
        return eventStateAction;
    };
    const mapStateAttributeProperty = (attributeValue) => {
        const stateAttributeProperty = new Map();
        attributeValue.forEach((value, attributeName) => {
            if (attributeName.endsWith(DATA_WATCH_ATTRIBUTE)) {
                const attributes = attributeName.split('.');
                let attribute = '';
                let state = '';
                if (attributes.length === 1) {
                    attribute = 'content';
                    state = STATE_GLOBAL;
                }
                else if (attributes.length === 2) {
                    attribute = attributes[0];
                    state = STATE_GLOBAL;
                }
                else if (attributes.length > 2) {
                    attribute = attributes[0];
                    state = attributes[1];
                }
                if (!stateAttributeProperty.has(state)) {
                    stateAttributeProperty.set(state, new Map());
                }
                stateAttributeProperty.get(state).set(attribute, value);
            }
        });
        return stateAttributeProperty;
    };
    const mapAttributeStateProperty = (attributeValue) => {
        const attributeStateProperty = new Map();
        attributeValue.forEach((value, attributeName) => {
            if (attributeName.endsWith(DATA_TOGGLE_ATTRIBUTE)) {
                const attributes = attributeName.split('.');
                let attribute = '';
                let state = '';
                if (attributes.length === 3) {
                    attribute = attributes[0];
                    state = attributes[1];
                    if (!attributeStateProperty.has(attribute)) {
                        attributeStateProperty.set(attribute, new Map());
                    }
                    attributeStateProperty.get(attribute).set(state, value);
                }
                else {
                    throw new Error(toggleMissingStateAndProperty());
                }
            }
        });
        return attributeStateProperty;
    };
    const populateActiveAttributeValue = (element) => {
        const attributeValue = new Map();
        element.getAttributeNames().filter(name => contains(name, [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE])).forEach(attributeName => {
            attributeValue.set(attributeName, element.getAttribute(attributeName));
            element.removeAttribute(attributeName);
        });
        return attributeValue;
    };
    const initEventListener = (element, eventStateAction, dataGetter, updateData, reducer) => {
        eventStateAction.forEach((stateAction, event) => {
            event = event.startsWith('on') ? event.substring('on'.length, event.length) : event;
            element.addEventListener(event, (event) => {
                if (event.type === 'submit') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                }
                const dataGetterValue = dataGetter();
                let dataState = dataGetterValue.data[STATE_PROPERTY];
                if (stateAction.has(dataState) || stateAction.has(STATE_GLOBAL)) {
                    updateData((oldData) => {
                        return reducer(oldData, {
                            type: stateAction.get(dataState) || stateAction.get(STATE_GLOBAL),
                            data: dataGetterValue.data,
                            event,
                            key: dataGetterValue.key,
                            index: dataGetterValue.index
                        });
                    });
                }
            });
        });
    };
    const updateWatchAttribute = (element, stateAttributeProperty, dataGetterValue, dataState) => {
        const data = dataGetterValue.data;
        const stateAttributeProps = stateAttributeProperty.get(dataState) || stateAttributeProperty.get(STATE_GLOBAL);
        if (hasNoValue(stateAttributeProps)) {
            return;
        }
        stateAttributeProps.forEach((property, attribute) => {
            const val = data[property];
            if (isValidAttribute(attribute)) {
                element.setAttribute(attribute, val);
            }
            if (attribute in element) {
                element[attribute] = val;
                const eventName = composeChangeEventName(attribute);
                element[eventName] = (val) => data[property] = val;
            }
            if (attribute === 'content') {
                element.innerHTML = val;
            }
        });
    };
    const updateToggleAttribute = (element, attributeStateProperty, dataState, defaultAttributeValue) => {
        attributeStateProperty.forEach((stateProperty, attribute) => {
            const attributeValue = [];
            const defaultValue = defaultAttributeValue.get(attribute);
            const propertyValue = stateProperty.get(dataState);
            if (hasValue(defaultValue)) {
                attributeValue.push(defaultValue);
            }
            if (hasValue(propertyValue)) {
                attributeValue.push(propertyValue);
            }
            const newAttributeValue = attributeValue.join(' ');
            if (element.getAttribute(attribute) !== newAttributeValue) {
                element.setAttribute(attribute, newAttributeValue);
            }
        });
    };

    class DataRenderer {
        constructor(nodes, updateData, reducer) {
            this.render = (getter) => {
                this.dataGetter = getter;
                this.attributeEvaluators.forEach((attributeEvaluator) => attributeEvaluator.render());
            };
            this.nodes = nodes;
            this.updateData = updateData;
            this.reducer = reducer;
            const activeAttributes = [DATA_WATCH_ATTRIBUTE, DATA_ACTION_ATTRIBUTE, DATA_TOGGLE_ATTRIBUTE];
            const activeNodes = Array.from(activeNodesLookup(activeAttributes, this.nodes));
            const dataGetter = () => this.dataGetter();
            this.attributeEvaluators = activeNodes.map(activeNode => new AttributeEvaluator(activeNode, dataGetter, this.updateData, this.reducer));
        }
    }
    const activeNodesLookup = (attributesSuffix, nodes) => {
        return nodes.filter(noEmptyTextNode()).reduce((accumulator, node) => {
            if (!(node instanceof HTMLElement)) {
                return accumulator;
            }
            const element = node;
            const attributeNames = element.getAttributeNames();
            for (const attribute of attributeNames) {
                if (contains(attribute, attributesSuffix)) {
                    accumulator.add(element);
                }
            }
            if (!contains(element.tagName, ['CONTEXT-ARRAY', 'CONTEXT-ELEMENT'])) {
                const childrenNodes = activeNodesLookup(attributesSuffix, Array.from(element.childNodes));
                Array.from(childrenNodes).forEach(childNode => accumulator.add(childNode));
            }
            return accumulator;
        }, new Set());
    };

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
     * There are 3 kinds of active-attribute,  (watch / toggle / action). each attribute works with a different mechanism when ContextElement renders the data.
     *
     */
    class ContextElement extends HTMLElement {
        /**
         * Constructor sets default value of reducer to return the parameter immediately (param) => param.
         */
        constructor() {
            super();
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
            this.setData = (context) => {
                this.dataSource = context(this.dataSource);
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
            this.onMounted = (onMountedListener) => {
                this.onMountedCallback = onMountedListener;
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
            this.updateDataCallback = (dataSetter) => {
                this.setData(dataSetter);
                const dataChangedEvent = composeChangeEventName('data');
                if (dataChangedEvent in this) {
                    this[dataChangedEvent].call(this, this.dataSource);
                }
            };
            /**
             * render method is invoked by the component when it received a new data-update.
             * First it will create DataRenderer object if its not exist.
             * DataRenderer require ContextElement template, updateDataCallback, and reducer.
             * Each time render method is invoked, a new callback to get the latest data (dataGetter) is created and passed to
             * DataRenderer render method.
             *
             * DataRenderer then will use the dataGetter to call reducer to get a new updated copy of the data, update the template
             * and call the updateDataCallback to update the original data with a new copy.
             *
             */
            this.render = () => {
                if (hasNoValue(this.dataSource) || hasNoValue(this.template)) {
                    return;
                }
                if (hasNoValue(this.renderer)) {
                    const dataNodes = this.template.map(node => node.cloneNode(true));
                    this.renderer = new DataRenderer(dataNodes, this.updateDataCallback, this.reducer);
                }
                const reversedNodes = [...this.renderer.nodes].reverse();
                let anchorNode = document.createElement('template');
                this.append(anchorNode);
                for (const node of reversedNodes) {
                    if (anchorNode.previousSibling !== node) {
                        this.insertBefore(node, anchorNode);
                    }
                    anchorNode = node;
                }
                // @ts-ignore
                const data = this.dataSource;
                const dataGetter = () => ({data});
                this.renderer.render(dataGetter);
                this.lastChild.remove();
            };
            /**
             * initAttribute is the method to initialize ContextElement attribute invoked each time connectedCallback is called.
             */
            this.initAttribute = () => {
                // we are nt implementing here
            };
            /**
             * Populate the ContextElement template by storing the node child-nodes into template property.
             * Once the child nodes is stored in template property, ContextElement will clear its content by calling this.innerHTML = ''
             */
            this.populateTemplate = () => {
                this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
                this.innerHTML = ''; // we cleanup the innerHTML
            };
            this.template = null;
            this.renderer = null;
            this.reducer = (data) => data;
        }

        /**
         * Get the value of data in this ContextElement
         */
        get data() {
            return this.dataSource;
        }

        /**
         * Set the value of ContextElement data
         * @param value
         */
        set data(value) {
            this.setData(() => value);
        }

        /**
         * connectedCallback is invoked each time the custom element is appended into a document-connected element.
         * When connectedCallback invoked, it will initialize the active attribute, populate the template, and call
         * onMountedCallback. Populating the template will be invoke one time only, the next call of connectedCallback will not
         * repopulate the template again.
         */
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
    }

    /**
     * ArrayContextElement is ContextElement which can render array instead of javascript object.
     * The following is an example of how we display the context-array page.
     *
     * <pre>
     *     <code>
     *         <context-array id="my-element"  data-key="id">
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
    class ArrayContextElement extends ContextElement {
        constructor() {
            super();
            this.setDataKeyPicker = (dataKeyPicker) => {
                this.dataKeyPicker = dataKeyPicker;
            };
            this.initAttribute = () => {
                this.dataKeyField = this.getAttribute(DATA_KEY_ATTRIBUTE);
            };
            this.render = () => {
                const dataSource = this.dataSource;
                const template = this.template;
                const renderers = this.renderers;
                if (hasNoValue(dataSource) || hasNoValue(template)) {
                    return;
                }
                this.removeExpiredData();
                let anchorNode = document.createElement('template');
                this.append(anchorNode);
                const dpLength = dataSource.length - 1;
                [...dataSource].reverse().forEach((data, index) => {
                    const dataKey = this.dataKeyPicker(data);
                    if (!renderers.has(dataKey)) {
                        const dataNode = template.map(node => node.cloneNode(true));
                        const itemRenderer = new DataRenderer(dataNode, this.updateDataCallback, this.reducer);
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
                    const dataGetter = () => ({ data, key: dataKey, index: (dpLength - index) });
                    itemRenderer.render(dataGetter);
                });
                this.lastChild.remove();
            };
            this.removeExpiredData = () => {
                const renderers = this.renderers;
                const dataSource = this.dataSource;
                const dataSourceKeys = dataSource.map(data => this.dataKeyPicker(data));
                const prevKeys = Array.from(renderers.keys());
                const discardedKeys = prevKeys.filter(key => dataSourceKeys.indexOf(key) < 0);
                discardedKeys.forEach(discardedKey => {
                    const discardNode = (node) => node.remove();
                    renderers.get(discardedKey).nodes.forEach(discardNode);
                    renderers.delete(discardedKey);
                });
            };
            const defaultDataKeyPicker = (data) => {
                if (hasNoValue(this.dataKeyField)) {
                    throw new Error(arrayContextElementMissingDataKey());
                }
                return data[this.dataKeyField];
            };
            this.renderers = new Map();
            this.dataKeyPicker = defaultDataKeyPicker;
            this.reducer = (data) => data;
        }
        static get observedAttributes() {
            return [DATA_KEY_ATTRIBUTE];
        }
        attributeChangedCallback(name, oldValue, newValue) {
            if (name === DATA_KEY_ATTRIBUTE) {
                this.dataKeyField = newValue;
            }
        }
    }

    const style = document.createElement('style');
    style.innerHTML = `.${HIDE_CLASS} {display: none !important;}`;
    document.head.appendChild(style);
    customElements.define('array-context-element', ArrayContextElement);
    customElements.define('context-element', ContextElement);

}());
