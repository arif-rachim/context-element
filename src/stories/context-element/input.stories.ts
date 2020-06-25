import {ContextElement} from "../../context-element";
import {withKnobs} from "@storybook/addon-knobs";
import {useJavascript} from "../useJavascript";

export default { title: 'Context Element',decorators:[withKnobs] };

export const input = (args:any) => {
    const html = `<context-element id="myElement" style="display: flex;flex-direction: column">
                        <input type="text" input.action="SET_NAME" placeholder="Type something here ...">
                        <input type="text" value.watch="name" >
                  </context-element>`;

    useJavascript(() => {
        interface Data{
            name : string
        }
        const el = document.getElementById('myElement') as ContextElement<Data>;
        el.data = {
            name : 'This is example of binding'
        }
        el.reducer = (data,action) => {
            const {event,type} = action;
            switch (type) {
                case 'SET_NAME' : {
                    const name = (event.target as HTMLInputElement).value;
                    return {...data,name}
                }
            }
            return {...data}
        }
    });
    return html;
};
