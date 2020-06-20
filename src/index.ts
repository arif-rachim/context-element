import {ContextArray} from "./context-array";
import {ContextElement} from "./context-element";
import {HIDE_CLASS} from "./types";

const style = document.createElement('style');
style.innerHTML = `.${HIDE_CLASS} {display: none !important;}`;
document.head.appendChild(style);

customElements.define('context-array', ContextArray);
customElements.define('context-element', ContextElement);
