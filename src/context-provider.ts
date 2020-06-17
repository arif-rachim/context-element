import noEmptyTextNode from "./libs/no-empty-text-node";
import {Reducer, Renderer} from "./types";

class ContextProvider extends HTMLElement{
    public reducer: Reducer<any>;
    private template: Array<Node>;
    private renderers: Map<string, Renderer>;
    private onMountedCallback:() => void;
    constructor() {
        super();
    }
    connectedCallback(){
        if(this.template === null) {
            this.setAttribute('style', 'display:none');
            requestAnimationFrame(() => {
                this.populateTemplate();
                this.removeAttribute('style');
                this.render();
                if(this.onMountedCallback){
                    this.onMountedCallback();
                    this.onMountedCallback = null;
                }
            });
        }
    }
    onMounted(onMountedCallback:() => void){
        this.onMountedCallback = onMountedCallback;
    }
    private populateTemplate():void{
        this.template = Array.from(this.childNodes).filter(noEmptyTextNode());
        this.innerHTML = ''; // we cleanup the innerHTML
    }
    private render(): void {
        // TODO
    }
}

customElements.define('context-provider',ContextProvider);
