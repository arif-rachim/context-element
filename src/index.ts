import {DataGroup} from "./data-group";
import {DataElement} from "./data-element";
import {HIDE_CLASS} from "./types";

const style = document.createElement('style');
style.innerHTML = `.${HIDE_CLASS} {display: none !important;}`;
document.head.appendChild(style);

customElements.define('data-group', DataGroup);
customElements.define('data-element', DataElement);
