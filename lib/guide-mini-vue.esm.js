const EMPTY_OBJECT = {};
const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const hasChanged = (newValue, oldValue) => {
    return !Object.is(newValue, oldValue);
};
const isOn = (key) => /^on[^a-z]/.test(key);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
// string: add-foo => addFoo
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
// string: add => Add
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
// string: add => onAdd
const toHandlerKey = (str) => (str ? "on" + capitalize(str) : "");

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        // 💡：初始化节点类型
        shapeFlag: getShapeFlag(type),
        // 💡：保存虚拟 DOM 创建后的真实 DOM
        el: undefined,
    };
    // 💡：设置节点的 children 类型
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 💡：设置节点插槽的类型：组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(vnode.children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
// 💡：纯文本处理 API
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
// 初始化根据 type 判断类型
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(vnode, props, children) {
    return createVNode(vnode, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 💡：使用 Fragment 节点包裹 slots
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// 全局变量
let activeEffect; // 当前活跃副作用函数
let shouldTrack; // 💡：是否进行依赖收集
class ReactiveEffect {
    constructor(fn, scheduler = null) {
        this.scheduler = scheduler;
        // 💡：add active lock，避免 stop 重复调用执行逻辑
        this.active = true;
        this.deps = [];
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
    deps.forEach((item) => {
        item.delete(effect);
    });
    // 💡 优化：cleanup后 deps 里存放的依赖已经为空，直接设置为空即可
    deps.length = 0;
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    // 💡：抽离 extend 工具（Object.assign），优化赋值逻辑
    extend(_effect, options);
    _effect.run();
    // 💡: run 方法内部访问了 this，因此需要手动绑定 this 实例
    const runner = _effect.run.bind(_effect);
    // 在 runner 上绑定 ReactiveEffect 实例
    runner.effect = _effect;
    return runner;
}
// 依赖收集：WeakMap => Map => Set (obj => key => fns)
const targetMap = new WeakMap();
function track(target, key) {
    // 💡：将判断依赖收集提前
    if (!isTracking())
        return;
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
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
// 💡：抽离逻辑，判断是否需要进行依赖收集
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
// 触发依赖：获取 fns => 遍历执行 run 方法
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const dep = depsMap.get(key);
    if (!dep)
        return;
    triggerEffects(dep);
}
// 💡 抽离逻辑：reactive ref API 公共部分触发依赖
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler)
            effect.scheduler();
        else
            effect.run();
    }
}

// 💡：优化，重复调用时直接使用 get 变量，而不是重复执行 create 函数
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 💡：抽离出 Proxy 中的 get 逻辑
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // 💡：判断 reactive 对象，访问一个指定的属性，同时区分 readonly
        if (key === ReactiveFlags.IS_RECTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 💡：增加 shallow 额外判断，不再进行深度代理
        if (isShallow)
            return res;
        // 💡：考虑 value 为引用值的情况，针对于 value 进行代理
        if (isObject(res)) {
            // 注意 readonly 的区分
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly)
            track(target, key);
        return res;
    };
}
// 💡：抽离出 Proxy 中的 set 逻辑
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
// 💡： Proxy 里的 handle 逻辑单独抽离
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key) {
        // 💡：readonly set 时给予警告
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

// 💡：私有属性功能属性枚举
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_RECTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
// 💡：针对于 Proxy 代理对象的创建进一步抽离
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}

// 💡：Ref 接口类
class RefImpl {
    constructor(value) {
        this.__v_isRef = true; // 判断 ref 标识
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
        if (!hasChanged(newValue, this._rawValue))
            return;
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
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objWidthRef) {
    return new Proxy(objWidthRef, {
        get(target, key) {
            // 判断该对象里的 value 如果是 ref 对象则返回其 value 值 (脱 ref)
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // set 时额外判断：set 的对象是 ref 并且 set 的 value 不是 ref，则需要修改 ref 的 value 值
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                // 其他情况直接进行 set 修改
                return Reflect.set(target, key, value);
            }
        },
    });
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // string: add => onAdd
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

// 💡：针对于 this 上的不同$属性，进行 map 抽离
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
// 💡：组件 this 访问代理 proxy 的 getter、setter 抽离
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        if (hasOwn(props, key)) {
            return props[key];
        }
        // $ 属性
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    // 💡优化：增加判断只有带有插槽的节点再进行 init
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
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

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        // 💡：判断是否已经挂载（初始化区分）
        isMounted: false,
        // 💡：存储当前的 vnode tree（下次 patch 更新当作旧 tree 使用）
        subTree: {},
        // 💡：setup 返回的对象 value
        setupState: {},
        // 💡：组件接收 props
        props: {},
        // 💡：slots, 存放 children
        slots: {},
        // 💡：provide API 存放数据的容器，每个组件实例对象都具备
        provides: parent ? parent.provides : {},
        // 💡：parent 属性存放父级实例
        parent,
        // 💡：emit 方法
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        // 💡：在 setup 之前保存当前实例对象
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    // TODO: function
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
// 利用全局变量保存当前 instance
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProviders = currentInstance.parent.provides;
        // 💡init：创建组件实例时设置的 provides 属性值是父组件实例的 provides，作为初始化判断依据
        if (provides === parentProviders) {
            provides = currentInstance.provides = Object.create(parentProviders);
        }
        provides[key] = value;
    }
}
function inject(key, defalutValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 💡：这里 inject 是拿到 parent的 Proviers
        const parentProviders = currentInstance.parent.provides;
        if (key in parentProviders) {
            return parentProviders[key];
        }
        else if (defalutValue) {
            if (typeof defalutValue === "function") {
                return defalutValue.call(currentInstance);
            }
            else {
                return defalutValue;
            }
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 💡patch：整个应用挂载阶段不存在父级节点
        patch(null, vnode, container, null);
    }
    // 💡 n1:旧 vnodeTree，b2: 新 vnodeTree
    function patch(n1, n2, container, parentComponent) {
        // 💡 基于 ShapeFlags 判断： element / component
        const { shapeFlag, type } = n2;
        // 💡：增加对 Fragment、Text 判断的逻辑
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        // 拿到纯文本
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        // update props
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const prevShapeFlag = n1.shapeFlag;
        const currentShapeFlag = n2.shapeFlag;
        if (currentShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // n1: [vnode ,vnode]  n2: "text"
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(n1.children);
            }
            // n1: "text" or 卸载过后的 children 数组  n2: "text"
            if (n1.children !== n2.children) {
                hostSetElementText(container, n2.children);
            }
        }
        else {
            // n1: "text" n2: [vnode, vnode]
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(n2.children, container, parentComponent);
            }
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // update prop => traverse newProps
            for (const key in newProps) {
                const prevVal = oldProps[key];
                const newVal = newProps[key];
                if (prevVal !== newVal) {
                    hostPatchProps(el, key, prevVal, newVal);
                }
            }
            if (oldProps !== EMPTY_OBJECT) {
                // delete prop => traverse oldProps
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProps(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent) {
        // 💡：创建 DOM 同时在 vnode 上进行保存
        const el = (vnode.el = hostCreateElement(vnode.type));
        // handle props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProps(el, key, null, val);
        }
        // 💡：ShapeFlags handle Children
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            hostRemove(el);
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container);
    }
    function setupRenderEffect(instance, vnode, container) {
        effect(() => {
            // 实例增加额外变量判断初始化
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 将当前的 subTree 保存至实例上
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 💡：当前组件作为下一次 patch 的父组件
                patch(null, subTree, container, instance);
                // 💡：组件的 el 需要取到其 render 函数执行后的第一个节点创建的真实 DOM
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                // 更新逻辑
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                // 及时更新实例上的 subTree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevVal, newVal) {
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, newVal);
    }
    else {
        if (newVal === undefined || newVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRender({ createElement, patchProps, insert, remove, setElementText });
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRender, createTextVNode, effect, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots, shallowReadonly };
