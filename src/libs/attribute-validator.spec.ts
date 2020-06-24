import isValidAttribute from "./attribute-validator";


test('It should validate the validator', () => {
    expect(isValidAttribute('data')).toBe(false);
    expect(isValidAttribute('reducer')).toBe(false);
    expect(isValidAttribute('value')).toBe(true);
    expect(isValidAttribute('style')).toBe(true);
    expect(isValidAttribute('class')).toBe(true);
});