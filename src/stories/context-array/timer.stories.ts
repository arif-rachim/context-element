import {object, withKnobs} from "@storybook/addon-knobs";
import {useJavascript} from "../useJavascript";
import {ArrayContextElement} from "../../array-context-element";

export default { title: 'Context Array',decorators:[withKnobs] };

export const timer = () => {
    const html = `<context-array id="myElement" data.key="id" style="display: flex;flex-direction: column">
                        <p>Generate Random Data</p>
                        <input type="text" value.watch="time" >
                  </context-array>`;

    useJavascript(() => {
        interface Data{
            time : string,
            id : number
        }
        const el = document.getElementById('myElement') as ArrayContextElement<Data>;

        el.data = object('data',[{
            id : 1,
            time : Math.round(Math.random() * 1000).toFixed()
        },{
            id : 2,
            time : Math.round(Math.random() * 1000).toFixed()
        }]);
        setInterval(() => {
            el.data = [{
                id : 1,
                time : Math.round(Math.random() * 1000).toFixed()
            },{
                id : 2,
                time : Math.round(Math.random() * 1000).toFixed()
            }];
            },1000);
    });
    return html;
};
