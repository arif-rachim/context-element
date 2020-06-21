/**
 * Error message to show when data.key is missing in context-array
 */
export const arrayContextElementMissingDataKey = () => `'<context-array>' requires 'data.key' attribute. Data-key value should refer to the unique attribute of the data.`;

/**
 * Error message when toggle active-attributes does not have attribute and state
 */
export const toggleMissingStateAndProperty = () => `toggle require 3 parameters separated with dot(.) : ' eg <div class="my-div" class.disabled.toggle="disabledCss"></div>`;
