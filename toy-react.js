const RENDER_TO_DOM = Symbol('render to dom');

class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }

    setAttribute(name, value) {
        this.props[name] = value;
    }

    appendChild(component) {
        this.children.push(component);
    }

    get vdom() {
        return this.render().vdom;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }

    // diff 更新
    update() {
        // 先判断是否需要更新
        let isSameNode = (oldNode, newNode) => {
            if (oldNode.type !== newNode.type) {
                return false;
            }
            for (let name in newNode.props) {
                if (oldNode.props[name] !== newNode.props[name]) {
                    return false;
                }
            }
            if (
                Object.keys(oldNode.props).length >
                Object.keys(newNode.props).length
            ) {
                return false;
            }
            if (newNode.type === '#text') {
                if (newNode.content !== oldNode.content) {
                    return false;
                }
            }
            return true;
        };
        let update = (oldNode, newNode) => {
            // type，props，children
            // #text content
            if (!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range);
                return;
            }
            newNode._range = oldNode._range;

            let oldChildren = oldNode.vchildren;
            let newChildren = newNode.vchildren;

            if (!newChildren || !newChildren.length) {
                return;
            }

            let tailRange = oldChildren[oldChildren.length - 1]._range;

            for (let i = 0; i < newChildren.length; i++) {
                let oldChild = oldChildren[i];
                let newChild = newChildren[i];
                if (i < oldChildren.length) {
                    update(oldChild, newChild);
                } else {
                    let range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range);
                    tailRange = range;
                }
            }
        };
        let vdom = this.vdom;
        update(this._vdom, vdom);
        this._vdom = vdom;
    }

    // 深拷贝合并
    setState(newState) {
        if (this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            this.reRender();
            return;
        }
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (oldState[p] === null || typeof oldState[p] !== 'object') {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]);
                }
            }
        };
        merge(this.state, newState);
        this.update();
    }
}

// 一般节点
class ElementWrapper extends Component {
    constructor(type) {
        super(type);
        this.type = type;
    }

    get vdom() {
        this.vchildren = this.children.map((child) => child.vdom);
        return this;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        let root = document.createElement(this.type);

        for (let name in this.props) {
            let value = this.props[name];
            if (name.match(/^on([\s\S]+)$/)) {
                root.addEventListener(
                    RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
                    value
                );
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value);
                } else {
                    root.setAttribute(name, value);
                }
            }
        }

        if (!this.vchildren) {
            this.vchildren = this.children.map((child) => child.vdom);
        }

        for (let child of this.vchildren) {
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }

        replaceContent(range, root);
    }
}

// 文本节点
class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.type = '#text';
        this.content = content;
    }

    get vdom() {
        return this;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        let root = document.createTextNode(this.content);
        replaceContent(range, root);
    }
}

function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
}

// 创建节点
function createElement(type, attributes, ...children) {
    let e = null;

    if (typeof type === 'string') {
        e = new ElementWrapper(type);
    } else {
        e = new type();
    }

    // 设置属性
    for (let p in attributes) {
        e.setAttribute(p, attributes[p]);
    }

    // 添加文本节点
    let insertChildren = (children) => {
        for (let child of children) {
            // 有文本内容，则改变为文本节点
            if (typeof child === 'string') {
                child = new TextWrapper(child);
            }

            // null 不做处理
            if (child === null) {
                continue;
            }

            if (typeof child === 'object' && child instanceof Array) {
                insertChildren(child);
            } else {
                e.appendChild(child);
            }
        }
    };

    insertChildren(children);

    return e;
}

// 渲染或重新渲染
function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
}

export { Component, createElement, render };