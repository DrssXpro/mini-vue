import { extend } from "../shared";

// 全局变量
let activeEffect; // 当前活跃副作用函数
let shouldTrack; // 💡：是否进行依赖收集

export class ReactiveEffect {
  private _fn: any;
  // 💡：add active lock，避免 stop 重复调用执行逻辑
  public active = true;
  public deps = [];
  public onStop?: () => void;
  constructor(fn, public scheduler: any = null) {
    this._fn = fn;
  }
  run() {
    // 💡：active标志 stop 的调用，如果 stop 调用后则不再继续执行，shouldTrack 永远为 false
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const res = this._fn();
    shouldTrack = false;
    return res;
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
  // 💡 优化：cleanup后 deps 里存放的依赖已经为空，直接设置为空即可
  deps.length = 0;
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
  // 💡：将判断依赖收集提前
  if (!isTracking()) return;
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
  // 抽离依赖
  trackEffects(dep);
}

// 💡 抽离逻辑： reactive ref API 公共部分收集依赖
export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

// 💡：抽离逻辑，判断是否需要进行依赖收集
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

// 触发依赖：获取 fns => 遍历执行 run 方法
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  triggerEffects(dep);
}

// 💡 抽离逻辑：reactive ref API 公共部分触发依赖
export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) effect.scheduler();
    else effect.run();
  }
}

export function stop(runner) {
  runner.effect.stop();
}
