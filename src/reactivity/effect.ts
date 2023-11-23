// 全局变量
let activeEffect;

class ReactiveEffect {
  private _fn: any;
  public scheduler: any;
  // add options: scheduler
  constructor(fn, options) {
    this._fn = fn;
    this.scheduler = options.scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}

export function effect(fn, options: any = {}) {
  // add options: scheduler
  const scheduler = options.scheduler;
  const _effect = new ReactiveEffect(fn, { scheduler });
  _effect.run();
  // 💡: run 方法内部访问了 this，因此需要手动绑定 this 实例
  return _effect.run.bind(_effect);
}

// 依赖收集：WeakMap => Map => Set (obj => key => fns)
const targetMap = new WeakMap();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

// 触发依赖：获取 fns => 遍历执行 run 方法
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  // add scheduler 优先调用
  for (const effect of dep) {
    if (effect.scheduler) effect.scheduler();
    else effect.run();
  }
}
