/**
 * Function to remove empty text node.
 */
export default function noEmptyTextNode(): (node: ChildNode) => (boolean | true) {
    return (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return /\S/.test(node.textContent);
        }
        return true;
    };
}
