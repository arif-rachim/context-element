import {ArrayContextElement} from "./array-context-element";
import {ContextElement} from "./context-element";
import {HIDE_CLASS} from "./types";

const style = document.createElement('style');
style.innerHTML = `.${HIDE_CLASS} {display: none !important;}`;
document.head.appendChild(style);

customElements.define('array-context-element', ArrayContextElement);
customElements.define('context-element', ContextElement);
