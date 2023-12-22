const queue: any[] = [];
let isFlushPending = false;

// nextTick 的实现原理就是将任务推至微任务队列
export function nextTick(fn) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

// 内部维护任务队列
export function queueJobs(job) {
  // 防止任务重复添加
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
  // 避免创建多个 Promise 执行，上锁
  if (isFlushPending) return;
  isFlushPending = true;
  // 任务的执行统一放到 Promise 的 then 回调中执行
  nextTick(flushJobs);
}

function flushJobs() {
  let job;
  isFlushPending = false;
  while ((job = queue.shift())) {
    job && job();
  }
}
