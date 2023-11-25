import { extend } from "../shared";

// 全局变量
let activeEffect;

class ReactiveEffect {
  private _fn: any;
  // 💡：add active lock，避免 stop 重复调用执行逻辑
  public active = true;
  public deps = [];
  public onStop?: () => void;
  constructor(fn, public scheduler: any = null) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

// 💡：stop 删除逻辑抽离
function cleanupEffect(effect) {
  const { deps } = effect;
  deps.forEach((item: Set<any>) => {
    item.delete(effect);
  });
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);
  // 💡：抽离 extend 工具（Object.assign），优化赋值逻辑
  extend(_effect, options);
  _effect.run();
  // 💡: run 方法内部访问了 this，因此需要手动绑定 this 实例
  const runner: any = _effect.run.bind(_effect);
  // 在 runner 上绑定 ReactiveEffect 实例
  runner.effect = _effect;
  return runner;
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
  if (activeEffect) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
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

export function stop(runner) {
  runner.effect.stop();
}
