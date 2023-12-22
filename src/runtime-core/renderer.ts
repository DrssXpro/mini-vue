import { effect } from "../reactivity";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text, isSameVNodeType } from "./vnode";

export function createRender(options) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  function render(vnode, container) {
    // 💡patch：整个应用挂载阶段不存在父级节点
    patch(null, vnode, container, null, null);
  }

  // 💡 n1:旧 vnodeTree，b2: 新 vnodeTree
  function patch(n1, n2, container, parentComponent, anchor) {
    // 💡 基于 ShapeFlags 判断： element / component
    const { shapeFlag, type } = n2;
    // 💡：增加对 Fragment、Text 判断的逻辑
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
    }
  }

  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2, container) {
    // 拿到纯文本
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // update props
    const oldProps = n1.props || EMPTY_OBJECT;
    const newProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const currentShapeFlag = n2.shapeFlag;
    if (currentShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // n1: [vnode ,vnode]   n2: "text"
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children);
      }
      // n1: "text" or 卸载过后的 children 数组  n2: "text"
      if (n1.children !== n2.children) {
        hostSetElementText(container, n2.children);
      }
    } else {
      // n1: "text"   n2: [vnode, vnode]
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(n2.children, container, parentComponent, anchor);
      } else {
        // n1: [vnode, vnode]   n2: [vnode, vnode]
        patchKeyedChildren(n1.children, n2.children, container, parentComponent, anchor);
      }
    }
  }

  // 💡：有 key 对比，快速 diff
  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    // 步骤一：从两端向中间遍历找相同节点 patch 更新
    // left -> right
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // left <- right
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 步骤二：判断两侧需要挂载或者卸载的节点进行处理
    /**
     *  右侧挂载              左侧挂载
     *  n1: (a b c)           n1:     (c d e)
     *  n2: (a b c) d e       n2: a b (c d e)
     *  i: 3, e1: 2, e2: 4    i: 0, e1: -1, e2: 1
     */

    if (i > e1 && i <= e2) {
      // 挂载操作
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : null;
      while (i <= e2) {
        patch(null, c2[i], container, parentComponent, anchor);
        i++;
      }
    } else if (i > e2 && i <= e1) {
      /**
       *  右侧卸载              左侧卸载
       *  n1: (a b c) d e       n1: a b (c d e)
       *  n2: (a b c)           n2:     (c d e)
       *  i: 3, e1: 4, e2: 2    i: 0, e1: 1, e2: -1
       */
      // 卸载操作
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 步骤三：针对于中间节点:存在相同节点进行更新，n1中存在但n2不存在进行删除
      let s1 = i;
      let s2 = i;
      const toBePatched = e2 - s2 + 1; // 记录 n2 中节点总数
      let patched = 0; // 记录当前 patch 节点的数量
      // 将中间的 n2 存储至 Map 中： key: vnode.key value: vnode index
      const keyToNewIndexMap = new Map();

      // 记录是否需要进行移动（步骤四）
      let moved = false;
      let maxNewIndexSoFar = 0;

      // 存储n1的中间节点的索引，数组元素顺序是在 n2 中 (💡)
      // 先初始化为 0，注意这里的长度是 n2 中间节点的总数（步骤四）
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // 遍历 n1 利用 n2 的 Map 去查找相同节点，如果存在则进行 patch 更新，不存在则进行卸载
      /**
       *    n1: a (b c d e) f
       *    n2: a (c b g e) f
       *    c、b: update  d: unmount
       */
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        //
        /**
         *  优化点
         *  n1: a (b c d e) f
         *  n2: a (b c)     f
         *  patch 更新 b c 节点后 n2 中间节点已经全部更新，n1 中的 d e 节点必定需要卸载，无需再走下面查找相同节点逻辑
         */
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        // n1 中可能 vnode 不存在 key 属性
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 针对于 vnode 不存在 key 就需要双层 for 去查找相同节点
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 在 n2 中间节点的索引
          newIndexToOldIndexMap[newIndex - s2] = i + 1; // 统一进行 + 1 操作，因为 i 可能为 0，与初始化状态区分
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 步骤四：借助最长递增子序列，判断在n2中需要移动和创建的节点
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      // 倒序遍历，因为需要确认锚点，插入操作是在锚点前插入，如果正序无法确定每次插入的锚点正确位置
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        // map 数组更新后仍然处于初始状态 0 的元素说明是在 n2 中新增的，进行挂载
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
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

  function mountElement(vnode, container, parentComponent, anchor) {
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
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, null);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      hostRemove(el);
    }
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(vnode, container, parentComponent, anchor) {
    const instance = createComponentInstance(vnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container, anchor);
  }

  function setupRenderEffect(instance, vnode, container, anchor) {
    effect(() => {
      // 实例增加额外变量判断初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 将当前的 subTree 保存至实例上
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 💡：当前组件作为下一次 patch 的父组件
        patch(null, subTree, container, instance, anchor);
        // 💡：组件的 el 需要取到其 render 函数执行后的第一个节点创建的真实 DOM
        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        // 更新逻辑
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        // 及时更新实例上的 subTree
        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}

// 获取最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
