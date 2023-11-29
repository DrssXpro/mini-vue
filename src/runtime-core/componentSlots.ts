export function initSlots(instance, children) {
  // instance.slots = Array.isArray(children) ? chilren : [children];
  normalizeObjectSlots(children, instance.slots);
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
