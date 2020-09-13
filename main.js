import {myCreateEle,Component,render} from "./toy-react.js"

class MyComponent extends Component{
    constructor(){
        super();
        this.state ={
            a:1,
            b:2
        }
    }
    render(){
        return <div>
            <h1>my component </h1>
            <button onclick={()=>{this.state.a++;this.rerender();}}>add</button>
            <span>{this.state.a.toString()}</span>
            {this.children}
            </div>
    }
}

render(<MyComponent id="name" class="person">
    <div name="wang">abc</div>
    <div name="li"></div>
    </MyComponent>,document.body);