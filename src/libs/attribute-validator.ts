const ignoredAttributes = ['data', 'reducer'];
export default function isValidAttribute(attributeName: string) {
    return ignoredAttributes.indexOf(attributeName) < 0;
};
