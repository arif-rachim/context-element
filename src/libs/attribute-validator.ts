const ignoredAttributes = ['data', 'reducer'];

/**
 * isValidAttribute return if there is active-attribute to be ignore by the ContextElement.
 * @param attributeName
 */
export default function isValidAttribute(attributeName: string) {
    return ignoredAttributes.indexOf(attributeName) < 0;
};
