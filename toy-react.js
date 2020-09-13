const REDNER_TO_DOM = Symbol("render to dom");

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        if(name.match(/^on([\s\S]+)$/)){
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLowerCase()),value);
        }else{
            this.root.setAttribute(name, value)
        }
    }
    appendChild(component) {
        let range = document.createRange();
        range.setStart(this.root,this.root.childNodes.length);
        range.setEnd(this.root,this.root.childNodes.length);
        component[REDNER_TO_DOM](range);
    }
    [REDNER_TO_DOM](range){
        range.deleteContents();
        range.insertNode(this.root); 
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    [REDNER_TO_DOM](range){
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component {
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
    [REDNER_TO_DOM](range){
        this._range = range;
        this.render()[REDNER_TO_DOM](range);
    }

    rerender(){
        this._range.deleteContents();
        this[REDNER_TO_DOM](this._range);
    }
    
}

export function myCreateEle(tagName, attributes, ...children) {
    let e;
    if (typeof tagName === "string") {
        e = new ElementWrapper(tagName);
    } else {
        e = new tagName;
    }

    for (let p in attributes) {
        e.setAttribute(p, attributes[p]);
    }
    let insertChildren = (children) => {

        for (let child of children) {
            if (typeof child === "string") {
                child = new TextWrapper(child);
            }
            if (typeof child === "object" && child instanceof Array) {
                insertChildren(child);
            } else {
                e.appendChild(child);
            }

        }

    }
    insertChildren(children);
    return e;
}

export function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement,0);
    range.setEnd(parentElement,parentElement.childNodes.length);
    range.deleteContents();
    component.render()[REDNER_TO_DOM](range);
}