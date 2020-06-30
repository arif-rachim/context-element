import {ContextElement} from "../../context-element";
import {object, withKnobs} from "@storybook/addon-knobs";
import {useJavascript} from "../useJavascript";

export default {title: 'Context Element', decorators: [withKnobs]};

export const timer = () => {
    const html = `<context-element id="myElement" >
                        <input type="text" value.watch="time" >
                  </context-element>`;

    useJavascript(() => {
        interface Data {
            time: string
        }

        const el = document.getElementById('myElement') as ContextElement<Data>;
        el.data = object('data', {
            time: new Date().toLocaleTimeString()
        });
        setInterval(() => {
            el.data = {
                time: new Date().toLocaleTimeString()
            }
        }, 1000);
    });
    return html;
};
