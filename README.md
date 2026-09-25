# context-element

![gzip size](http://img.badgesize.io/https://unpkg.com/context-element/index.min.js?compression=gzip&label=MinJS%20gzip%20size)
[![codecov](https://codecov.io/gh/arif-rachim/context-element/branch/master/graph/badge.svg)](https://codecov.io/gh/arif-rachim/context-element)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/arif-rachim/context-element/master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![GitHub](https://img.shields.io/github/license/arif-rachim/context-element)

**_`context-element`_** is a small, dependency-free Web Component library that renders JavaScript objects and arrays into an HTML page using plain HTML as the template. It exists for pages that need data binding but where a full UI framework, a build toolchain, or a template language with its own syntax would be too heavy. You place a `<context-element>` (for one object) or a `<context-array>` (for a list) in the page, write ordinary markup inside it, and mark the parts that should change with "active attributes" such as `watch="name"`, `value.watch="city"` or `click.action="SAVE"`. When you assign a new value to the element's `data` property, it updates only the bound attributes and text, without a virtual DOM; `<context-array>` uses a `data.key` property to reuse, add and remove item nodes. User events become `{type, event}` action objects passed to a reducer that returns the next data, which gives a one-way data flow. It is written in TypeScript, bundled with Rollup into a single script that can be loaded from unpkg or installed from npm (latest `1.4.7`), tested with Jest, and demonstrated with Storybook stories. Development took place in mid-2020 and the project is no longer active.

> Status: published on npm, last code change July 2020. Not actively maintained.

**Live demo (Storybook):** https://www.rach.im/context-element/

## Installation

From CDN
```html
<script src="https://unpkg.com/context-element"></script>
```

npm module
```bash
npm install context-element
```

Loading the script registers the two custom elements `context-element` and `context-array`.

## Why context-element
1. context-elements are native `HTMLElement`s (custom elements), so no framework runtime is needed.
2. Popular UI frameworks take a large share of a page's bandwidth budget.
3. It does not use a virtual DOM, which keeps memory usage low.
4. The template syntax is plain HTML attributes, so the same markup can be used by UX design tools.
5. State changes go through a reducer, so app behaviour is easy to follow with one-way data flow.

## Motivation
Currently to be able to render objects or arrays on html pages we can use the template engine, or UI framework.

Unfortunately template engine forces us to use syntax that is not the same as how elements in html are structured.

In addition to the UI Framework library sometimes has a file size that is not small, we also have to download the framework tools to start the project.

WebComponent aims to enable us to create new elements that are recognized by the browser. It would be great, if there is a web component, which uses the html structure as templating, and works efficiently like the UI Framework.

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
            <div watch="time"></div>
        </context-element>
        <script>
            const el = document.getElementById('myElement');
            setInterval(() => {
                el.data = {
                    time : new Date().toLocaleTimeString()
                }
            }, 1000);
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

The value of a `watch` attribute is evaluated as a property path on the data, so nested properties such as `address.city` also work. Evaluation uses `new Function`, so pages with a strict Content Security Policy must allow `unsafe-eval`.

### Active-Attribute
Context-element templates are html code that has special attributes that we refer to as active-attributes. Active-attribute is an html attribute that has a specific keyword or what we call an active-attribute type (AAT), and each AAT works differently.
At the moment there are 3 AATs supported by context elements:
1. Watch
2. Asset
3. Action

(A fourth type, `toggle`, together with state-based bindings through `data._state`, was removed in July 2020.)

### watch
Watch, is an Active Attribute Type (AAT) that is used to bind property data, with html elements

In the following example `<input value.watch =" time ">` means that the context-element will set the `value` attribute with a value
from the `time` property of the data (`data.time`).

### action
Action, is an AAT used to listen to html Event elements. 
The html Event is wrapped into an action, then given to the reducer. 
Users can implement reducers, to create new data based on old data and action objects. 
Html event elements for example are "onclick", "onmouseenter", "onmouseleave", "onsubmit", "oninput" and others.
We can also eliminate the use of prefix on when we declare AAT actions.

An action object in `context-element` consists of 2 attributes, type and event.

1. Action.type is the value that we define in the active-attribute action.
2. Action.event is the dom event that triggers the action.

eg : ```<button click.action='DO_SOMETHING'>Proceed</button>```
The action type would be `DO_SOMETHING` and the event would be MouseEvent.click.

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

## _context-array_
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
1. Action.type: is the value given when we declare the action attribute in the template.
2. Action.event: is a dom event that triggers action.
3. Action.data: is a data item from an array.
4. Action.index: is an index of data items against an array.
5. Action.key: is the key value of the data item (from `data.key`).

Following is an example of how we can use actions in `context-array`

```html
<context-array id="my-element" data.key="id">
    <div>
        <input type="checkbox" input.action="SET_CHECKBOX">
        <div watch="isChecked"></div>
    </div>
</context-array>

<script>
    const el = document.getElementById('my-element');
    el.data = [
        { id : 1, isChecked:false},
        { id : 2, isChecked:false},
    ];
    el.reducer = (array,action) => {
        const {type,event,data,index} = action;
        switch (type) {
            case 'SET_CHECKBOX' : {
                const newData = {...data,isChecked:event.target.checked};
                return [...array.slice(0,index),newData, ...array.slice(index+1,array.length)]
            }  
        }
        return [...array];
    }
</script>
```

With the above code we can see that the `SET_CHECKBOX` action will set the value of isChecked with value
the new one from `checkbox.checked` property.


### asset
Assets are active attributes that will bound values from attributes not from data, but from context-element `asset` property.
Following is an example of using Assets.

```html
<context-element>  
    <input type="text" placeholder.asset="placeHolderText">
</context-element>
<script>
    const el = document.querySelector('context-element');
    el.assets = {
        placeHolderText : 'Please type your input here ?'
    }
</script>
```
Inside the script tag in the sample code above, we assign the value of `assets` to the context-element. `context-element` will bind the value of the placeholder to the value
`Please type your input here?`.


In contrast to `data`, assigning `assets` does not re-render the content of the context-element.

Apart from that, if the context-element cannot find the key of the asset that we are looking for, then the context-element will look to the parent assets.

#### active-attributes semantic
semantic | meaning
--- | ---
`<div watch="name">` | Bind the `data.name` property into the div content. This is the same as `<div content.watch="name">`
`<input value.watch="name">` | Bind the `data.name` property into the input value.
`<div watch="address.city">` | Bind a nested property, `data.address.city`.
`<input placeholder.asset="placeHolderText">` | Bind the placeholder to `assets.placeHolderText`, looking up parent context-elements if the key is missing.
`<button click.action="SAVE">` | Send `{type: 'SAVE', event}` to the reducer when the button is clicked (`onclick.action` also works).

## Nested context-elements

A context-element inside another one can receive part of the parent's data declaratively with `data.watch`, and its reducer with `reducer.watch`. When the child updates its data, the change is written back into the parent's data at that path. If a child has no reducer, its actions bubble up to the nearest parent context-element that has one, as a `ChildAction` with a `childActions` list describing the path (and, for arrays, the `key`, `index` and `data` of the item).

```html
<context-element id="myelement">
    <div watch="name"></div>
    <context-element data.watch="address" reducer.watch="addressReducer">
        <div watch="city"></div>
        <input type="text" input.action="SET_CITY">
    </context-element>
</context-element>
<script>
    const el = document.getElementById('myelement');
    el.data = {
        name : 'Example of how to change the node',
        address : { city : 'You can change this value' },
        addressReducer : (address, action) => {
            if (action.type === 'SET_CITY') {
                return {...address, city : action.event.target.value};
            }
            return {...address};
        }
    };
</script>
```

## Development

```bash
npm install
npm test                  # Jest with coverage
npm run build             # Rollup: src/index.ts -> index.js and index.min.js
npm run storybook         # Storybook dev server with the stories in src/stories
npm run build-storybook   # build the Storybook site into docs/ (served by GitHub Pages)
npm run todo              # run the todo example with Parcel
npm run commit            # Commitizen conventional commit prompt
```

Releases are published by semantic-release from `master`. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Project structure

```text
src/context-element.ts         ContextElement (<context-element>)
src/array-context-element.ts   ArrayContextElement (<context-array>)
src/libs/                      attribute evaluator, validator, data renderer, error messages
src/stories/                   Storybook stories (built into docs/)
example/                       standalone HTML examples (watch, action, array, nested, todo, color palette)
index.js, index.min.js         built bundles published to npm
```

## Examples & GitHub Page
Head over to the [ContextElement Storybook page](https://www.rach.im/context-element/) to see more context elements in action, or open the files in [`example/`](example/).

## License

MIT. See [LICENSE.txt](LICENSE.txt).

