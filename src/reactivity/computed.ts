import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _value: any;
  private _effect: ReactiveEffect;
  private _dirty: boolean = true;
  constructor(getter) {
    // 💡：scheduler 控制 _dirty 来表示是否使用缓存中的数据
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) this._dirty = true;
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

// computed API
export function computed(getter) {
  return new ComputedRefImpl(getter);
}
