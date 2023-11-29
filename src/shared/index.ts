export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const hasChanged = (newValue, oldValue) => {
  return !Object.is(newValue, oldValue);
};

export const isOn = (key: string) => /^on[^a-z]/.test(key);

export const hasOwn = (value: object, key: string | symbol) => Object.prototype.hasOwnProperty.call(value, key);

// string: add-foo => addFoo
export const camelize = (str: string) => str.replace(/-(\w)/g, (_, c: string) => (c ? c.toUpperCase() : ""));

// string: add => Add
export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// string: add => onAdd
export const toHandlerKey = (str: string) => (str ? "on" + capitalize(str) : "");
