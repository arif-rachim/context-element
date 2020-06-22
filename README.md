# _context-element_
**_`context-element`_** is an HTMLElement that makes it easy to render data or array in html page.

**_`context-element`_** is a very small (3kb gzip). It can render an array of data efficiently and quickly. You can directly use **_`context-element`_** on the html page by supplying `arrays or object` to the attribute `data` into the **_`context-element`_** element. You can determine how the data will be displayed by creating a template inside the **_`context-element`_**.

## Motivation
To build interactive html pages and display data dynamically, we can use a front-end `framework/library` that has an engine to detect data changes and render these pages in a browser efficiently.

The framework will organize how pages are displayed based on the template that we define as components.

**_`context-element`_** have similarities as frameworks, but context-elements are not frameworks engine, rather than simple **`HTMLElement`** that can organize how data is displayed based on templates.


```html
<html>
    <head>
        <!-- here we import the context-element -->
        <script src="https://unpkg.com/context-element"></script>
    </head>
    <body>
        <context-element id="myElement">
            <div>Current time is</div>
            <!-- attribute watch is watching data `time` property -->
            <div watch="time"></div>
        </context-element>
        <script>
            const el = document.getElementById('myElement');
            setInterval(() => {
                el.data = {
                    time : new Date().toLocaleTimeString()
                }
            });
        </script>
    </body>
</html>
```

## How it works
context-element has a property called `data`. The `data` property in context-element is also known as the `context-data`.
When we supply values to the context-element `context-data`, the context-element will automatically re-render its template. 

To set `context-data` values, 
We can do it _imperatively_ via javascript 
```javascript
contextElement.data = { time:new Date() }
```

Or  _declaratively_ using context-element  `data` attribute
```html
<context-element data.watch="mydata">...</context-element>
```
note: We can only use declarative if the context-element is not a root element

Inside the context element, we can write a template which is then used to render the data we provide.
To bind the attribute or innerHTML of the template, we can use the `watch` attribute.

```html
<context-element >

    <!-- we can use the watch attribute to bind innerHTML with data.time --> 
    <div watch="time"></div>

    <!-- we can also bind to any html attribute by adding the `watch` keyword --> 
    <input type="text" value.watch="time">
    
</context-element>
```

## watch
The keyword `watch` is used by context-components to indicate that an attribute is an active-attribute. Besides `watch`
active-attribute in context-components also marked with the `toggle` and` action` keywords.

In the following example `<input value.watch =" time ">` means that the context-element will set the `value` attribute with a value
from the `time` property of the data (`data.time`).

## action
The keyword action used by context-component to indicate an attribute is an event listener.
To consume the event, we must use the `reducer` function. Reducer is a pure function that is
receive the previous data and action, and return the next data. `(previousData, action) => nextData`.

Following is an example of how the `action` attribute is used
```html
<context-element id="my-element">
    <input type="text" input.action="SET_NAME">
    <div watch="name"></div>
</context-element>
```

```javascript
const el = document.getElementById('my-element');

el.data = { name : '' };

el.reducer = (data,action) => {
    const {type,event} = action;
    switch (type) {
        case 'SET_NAME' : {
            const name = event.target.value;
            return {...data,name}
        }
    }
    return {...data}
}
```

# _context-array_
To render an array, we can use `context-array`. `context-array` is the tag-name of ArrayContextElement class.
ArrayContextElement is a subclass of ContextElement. What distinguishes ArrayContextElement from ContextElement is
type of data. ContextElement can only accept `Object` type data. Whereas ArrayContextElement can only accept
`Array` type data.

ArrayContextElement requires the `data.key` attribute. The `data.key` attribute must contain the name of the property of the data, which has a unique value.
This data.key will then be used as a marker when there is a new array accepted by the data property, to let ArrayContextElement
to decide whether the active-node should be discarded or updated in the dom.

### watch
The following is an example of how we can use the `watch` attribute in ArrayContextElement or` context-array`.
```html
<context-array id="my-element" data.key="id">
    <input type="text" value.watch="city">
</context-array>
<script>
    const el = document.getElementById('my-element');
    el.data = [{
        city:'Dubai',
        id : 1
    },{
        city : 'Abu Dhabi',
        id : 2
    },{
        city : 'Tokyo',
        id : 3
    }];
</script>
```

### action

The `action` attribute in` context-array` is slightly different from the action attribute in `context-element`, the action object in
context-array has 4 values:
1. action.type: is the value given when we declare the action attribute in the template.
2. action.event: is a dom event that triggers action.
3. action.data: is a data item from an array.
4. action.index: is an index of data items against an array.
