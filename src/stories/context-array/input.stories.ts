import {object, withKnobs} from "@storybook/addon-knobs";
import "../../index";
import {useJavascript} from "../useJavascript";
import {ArrayContextElement} from "../../array-context-element";
import {ArrayAction} from "../../types";

export default {title: 'Context Array', decorators: [withKnobs]};

export const input = () => {
    const html = `<context-array id="myElement" data.key="id" style="display: flex;flex-direction: column">
                        <p>Sample of action in array</p>
                        <input type="text" input.action="SET_FAVORITE">
                        <div style="display: flex">Your favorite <div watch="name" style="margin-left: 1rem;font-weight: bold"></div></div>
                  </context-array>`;

    useJavascript(() => {
        interface Data {
            name: string,
            id: number
        }

        const el = document.getElementById('myElement') as ArrayContextElement<Data>;

        el.data = object('data', [{
            id: 1,
            name: 'Javascript'
        }, {
            id: 2,
            name: 'Typescript'
        }]);

        el.reducer = (array, action: ArrayAction<Data>) => {
            let {type, event, index, data} = action;
            if (type === 'SET_FAVORITE') {
                {
                    const newData = {
                        ...data,
                        name: (event.target as any).value
                    };
                    return [...array.slice(0, index), newData, ...array.slice(index + 1, array.length)]
                }
            }
            return [...array];
        }
    });
    return html;
};
