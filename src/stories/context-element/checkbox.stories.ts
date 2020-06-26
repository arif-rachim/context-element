import {ContextElement} from "../../context-element";
import {object, withKnobs} from "@storybook/addon-knobs";
import {useJavascript} from "../useJavascript";

export default { title: 'Context Element',decorators:[withKnobs] };

export const checkbox = () => {
    const html = `<context-element id="myElement">
                        <label >
                            <input type="checkbox" value.watch="isDone" input.action="TOGGLE_CHECKBOX">
                            If you click checkbox the action will call reducer function
                        </label>
                        <p>Value of checkbox is : <p watch="isDone"></p></p>
                      </context-element>`;

    useJavascript(() => {

        interface Data{
            isDone : boolean
        }

        const el = document.getElementById('myElement') as ContextElement<Data>;
        el.data = object('Default State',{
            isDone : false
        });
        el.reducer = (data,action) => {
            const {type,event} = action;
            if (type === 'TOGGLE_CHECKBOX') {
                {
                    const isDone =  (event.target as HTMLInputElement).checked;
                    return {...data,isDone}
                }
            }
            return {...data}
        }
    });
    return html;
};