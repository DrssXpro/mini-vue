# 手写 mini-vue

手写实现 Vue 三大核心：编译器、响应式系统、渲染器

集成 vitest 补充单元测试

只实现核心逻辑，因此使用 TS 将不再完全按照 Vue 规范中的变量类型

## reactivity

- effect ✅

- reactive ✅

- effect return runner ✅

- scheduler ✅

- stop、onStop ✅

- readonly ✅

- isReactive、isReadonly ✅

- shallowReadonly ✅

- isProxy ✅

- ref ✅

- isRef、unRef ✅

- proxyRefs ✅

- computed ✅

## renderer

- component、element init ✅

- 实例代理对象获取 setup 返回值 ✅

- $ 属性代理 ✅

- 组件注册事件功能 ✅

- 组件 props 功能 ✅

- 组件 emit 功能 ✅

- 组件 slot、named slot、scoped slot 功能 ✅

- ShapeFlags ✅

- Fragment、Text node 类型 ✅

- getCurrentIntance ✅

- provide、inject ✅

- createRender ✅

  