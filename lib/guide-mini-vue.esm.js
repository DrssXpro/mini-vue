var extend = Object.assign;
var isObject = function (value) {
    return value !== null && typeof value === "object";
};
var isOn = function (key) { return /^on[^a-z]/.test(key); };
var hasOwn = function (value, key) { return Object.prototype.hasOwnProperty.call(value, key); };
// string: add-foo => addFoo
var camelize = function (str) { return str.replace(/-(\w)/g, function (_, c) { return (c ? c.toUpperCase() : ""); }); };
// string: add => Add
var capitalize = function (str) { return str.charAt(0).toUpperCase() + str.slice(1); };
// string: add => onAdd
var toHandlerKey = function (str) { return (str ? "on" + capitalize(str) : ""); };

// 依赖收集：WeakMap => Map => Set (obj => key => fns)
var targetMap = new WeakMap();
// 触发依赖：获取 fns => 遍历执行 run 方法
function trigger(target, key) {
    var depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    var dep = depsMap.get(key);
    if (!dep)
        return;
    triggerEffects(dep);
}
// 💡 抽离逻辑：reactive ref API 公共部分触发依赖
function triggerEffects(dep) {
    for (var _i = 0, dep_1 = dep; _i < dep_1.length; _i++) {
        var effect_1 = dep_1[_i];
        if (effect_1.scheduler)
            effect_1.scheduler();
        else
            effect_1.run();
    }
}

// 💡：优化，重复调用时直接使用 get 变量，而不是重复执行 create 函数
var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var shallowReadonlyGet = createGetter(true, true);
// 💡：抽离出 Proxy 中的 get 逻辑
function createGetter(isReadonly, isShallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (isShallow === void 0) { isShallow = false; }
    return function get(target, key) {
        // 💡：判断 reactive 对象，访问一个指定的属性，同时区分 readonly
        if (key === ReactiveFlags.IS_RECTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        var res = Reflect.get(target, key);
        // 💡：增加 shallow 额外判断，不再进行深度代理
        if (isShallow)
            return res;
        // 💡：考虑 value 为引用值的情况，针对于 value 进行代理
        if (isObject(res)) {
            // 注意 readonly 的区分
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// 💡：抽离出 Proxy 中的 set 逻辑
function createSetter() {
    return function set(target, key, value) {
        var res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
// 💡： Proxy 里的 handle 逻辑单独抽离
var mutableHandlers = {
    get: get,
    set: set,
};
var readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key) {
        // 💡：readonly set 时给予警告
        console.warn("Set operation on key \"".concat(String(key), "\" failed: target is readonly."), target);
        return true;
    },
};
var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
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

function emit(instance, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var props = instance.props;
    // string: add => onAdd
    var handlerName = toHandlerKey(camelize(event));
    var handler = props[handlerName];
    handler && handler.apply(void 0, args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

// 💡：针对于 this 上的不同$属性，进行 map 抽离
var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return i.slots; },
};
// 💡：组件 this 访问代理 proxy 的 getter、setter 抽离
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        // setupState
        var setupState = instance.setupState, props = instance.props;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        if (hasOwn(props, key)) {
            return props[key];
        }
        // $ 属性
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    var vnode = instance.vnode;
    // 💡优化：增加判断只有带有插槽的节点再进行 init
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    var _loop_1 = function (key) {
        var value = children[key];
        slots[key] = function (props) { return normalizeSlotValue(value(props)); };
    };
    for (var key in children) {
        _loop_1(key);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    var component = {
        vnode: vnode,
        type: vnode.type,
        // 💡：setup 返回的对象 value
        setupState: {},
        // 💡：组件接收 props
        props: {},
        // 💡：slots, 存放 children
        slots: {},
        // 💡：provide API 存放数据的容器，每个组件实例对象都具备
        provides: parent ? parent.provides : {},
        // 💡：parent 属性存放父级实例
        parent: parent,
        // 💡：emit 方法
        emit: function () { },
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
    var Component = instance.type;
    var setup = Component.setup;
    if (setup) {
        // 💡：在 setup 之前保存当前实例对象
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    // TODO: function
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    instance.render = Component.render;
}
// 利用全局变量保存当前 instance
var currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

var Fragment = Symbol("Fragment");
var Text = Symbol("Text");
function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
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

function render(vnode, container) {
    // 💡patch：整个应用挂载阶段不存在父级节点
    patch(vnode, container, null);
}
function patch(vnode, container, parentComponent) {
    // 💡 基于 ShapeFlags 判断： element / component
    var shapeFlag = vnode.shapeFlag, type = vnode.type;
    // 💡：增加对 Fragment、Text 判断的逻辑
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                processComponent(vnode, container, parentComponent);
            }
    }
}
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    // 拿到纯文本
    var children = vnode.children;
    var textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    // 💡：创建 DOM 同时在 vnode 上进行保存
    var el = (vnode.el = document.createElement(vnode.type));
    // handle props
    var props = vnode.props;
    for (var key in props) {
        var val = props[key];
        // 💡：事件处理 on 开头属性
        if (isOn(key)) {
            var event_1 = key.slice(2).toLowerCase();
            el.addEventListener(event_1, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // 💡：ShapeFlags handle Children
    var children = vnode.children, shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el, parentComponent);
    }
    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(function (v) {
        patch(v, container, parentComponent);
    });
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(vnode, container, parentComponent) {
    var instance = createComponentInstance(vnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    var proxy = instance.proxy;
    var subTree = instance.render.call(proxy);
    // 💡：当前组件作为下一次 patch 的父组件
    patch(subTree, container, instance);
    // 💡：组件的 el 需要取到其 render 函数执行后的第一个节点创建的真实 DOM
    vnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            var vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(vnode, props, children) {
    return createVNode(vnode, props, children);
}

function renderSlots(slots, name, props) {
    var slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 💡：使用 Fragment 节点包裹 slots
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var provides = currentInstance.provides;
        var parentProviders = currentInstance.parent.provides;
        // 💡init：创建组件实例时设置的 provides 属性值是父组件实例的 provides，作为初始化判断依据
        if (provides === parentProviders) {
            provides = currentInstance.provides = Object.create(parentProviders);
        }
        provides[key] = value;
    }
}
function inject(key, defalutValue) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 💡：这里 inject 是拿到 parent的 Proviers
        var parentProviders = currentInstance.parent.provides;
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

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
