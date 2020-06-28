# _context-element_

[![Build Status](https://travis-ci.org/marsa-emreef/context-element.svg?branch=master)](https://travis-ci.org/marsa-emreef/context-element)
![gzip size](http://img.badgesize.io/https://unpkg.com/context-element/index.min.js?compression=gzip&label=MinJS%20gzip%20size)
[![codecov](https://codecov.io/gh/marsa-emreef/context-element/branch/master/graph/badge.svg)](https://codecov.io/gh/marsa-emreef/context-element)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/marsa-emreef/context-element/master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![GitHub](https://img.shields.io/github/license/marsa-emreef/context-element)


**_`context-element`_** is an HTMLElement that makes it easy to render data or array in html page.

**_`context-element`_** is a very small ![gzip size](http://img.badgesize.io/https://unpkg.com/context-element/index.min.js?compression=gzip&label=MinJS%20gzip%20size). It can render an array of data efficiently and quickly. You can directly use **_`context-element`_** on the html page by supplying `arrays or object` to the attribute `data` into the **_`context-element`_** element. You can determine how the data will be displayed by creating a template inside the **_`context-element`_**.

### installation

From CDN
```html
<script src="https://unpkg.com/context-element"></script>
```

npm module
```
npm install context-element
```


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

### Active-Attribute
Context-element templates are html code that has special attributes that we refer to as active-attributes. Active-attribute is an html attribute that has a specific keyword or what we call an active-attribute type (AAT), and each AAT works differently.
At the moment there are 4 AATs supported by context elements:
1. Watch
2. Assets
3. Toggle
4. Action

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
        { dataId : 1, isChecked:false},
        { dataId : 2, isChecked:false},
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


### toggle
Toogle is an active-attribute that is used to toggle the value of the attribute. To use the toggle attribute
we must use the `state` of the context. Consider the following example how toggle used :

```html
<context-element>
    <input type="text" class="text-style" class.highlight.toggle="text-highlight" mouseenter.action="SET_HIGHLIGHT" mouseleave.action="HIDE_HIGHLIGHT">
</context-element>
<script>
    const el = document.getElementsByTagName('context-element');
    el.reducer = (data,action) => {
        switch(action.type){
            case 'SET_HIGHTLIGHT' : {
                const newData = {...data};
                // here we set the _state to highlight.
                newData._state = 'highlight';
                return newData;
            }
            case 'HIDE_HIGHTLIGHT' : {
                const newData = {...data};
                delete newData._state;
                return newData;
            }
        }       
        return {...data}
    }
</script>
```
The code above means, if the value of **`data._state`** is` highlight` then the context-element will render the template above to

```html
<context-element>
    <input type="text" class="text-style text-highlight" >
</context-element>
```
 
### asset
Assets are active attributes that will bound values from attributes not from data, but from context-element `asset` property.
Following is an example of using Assets.

```html
<context-element>  
    <input type="text" placeholder.asset="placeHolderText">
</context-element>
<script>
    const el = document.getElementsByTagName('context-element');
    el.assets = {
        placeHolderText : 'Please type your input here ?'
    }
</script>
```
Inside the script tag in the sample code above, we assign the value of `assets` to the context-element. `context-element` will bind the value of the placeholder to the value
`Please type your input here?`.


In contrast to `data`, if we assign the value of an `asset`, the context-element will not rerendered its content.

Apart from that, if the context-element cannot find the key of the asset that we are looking for, then the context-element will look to the parent assets.

#### active-attributes semantic
semantic | meaning
--- | --- | 
```<div watch="name">``` | Bind the data name property into the div content. This is the same as ```<div content.watch="name">``` 
```<div content.simple.watch="firstName" content.detail.watch="fullName"></div>``` | If `data._state` value is `simple`: then bind content div with the property `data.firstName`, if `data._state` value is `detail` : then bind content div with the property` data.fullName`.
```<input value.watch="name">``` | Bind the `data.name` property into the input value.
```<input value.people.watch="name" value.address.watch="city">``` | If `data._state` value is `people`: then bind the element attribute `input.value` with` data.name`. If `data._state` value is `address`: then bind the element attribute `input.value` with` data.city`
```<div class="default" class.disabled.toggle="disabled">Cloud Strife</div>``` | If `data._state` has no value, the value of the class attribute is` <div class = "default"> Cloud Strife </div> `, If` data._state` has a value of `disabled` then the value of the class is` < div class = "default disabled"> Cloud Strife </div> `



##### Examples & Github Page
head over our [ContextElement page](https://marsa-emreef.github.io/context-element/)  to see more context elements in action

