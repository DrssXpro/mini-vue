import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

// 💡：Ref 接口类
class RefImpl {
  private _value: any;
  private _rawValue: any; // 保存传入的初始值
  public dep: Set<any>;
  public __v_isRef = true; // 判断 ref 标识
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 💡：判断前后 value 是否相同，相同则不再触发 trigger
    // key：注意需要使用 _rawValue 即始终为用户传入的 value 值对比，而不是 Proxy 代理对象
    if (!hasChanged(newValue, this._rawValue)) return;
    this._rawValue = newValue;
    this._value = convert(newValue);
    triggerEffects(this.dep);
  }
}

// 💡：针对于 value 为引用类型需要进行 reactive 代理
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

// 💡：ref get 逻辑抽离
function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

// ref API
export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
