import {ContextElement} from "../context-element";
import {withKnobs} from "@storybook/addon-knobs";
import {useJavascript} from "./useJavascript";
import uuid from "../libs/uuid";

export default {title: 'Todo App', decorators: [withKnobs]};

export const todo = () => {
    useJavascript(javascript);
    return useHtml();
};


const useHtml = () => `
<style>
.vertical{
    display: flex;
    flex-direction: column;
}
.horizontal{
    display: flex;
}
.horizontal.align-bottom{
    align-items: flex-end;
}
.todo-item{
    font-size: 2rem;
}
.todo-item > input[type="checkbox"]{
    margin-bottom: 12px;
    margin-right : 1rem;
}
.strike{
    text-decoration: line-through ;
    color: rgba(0,0,0,0.5);
}
.icon{
    font-size: 2rem;
    margin-bottom: 5px;
    padding-left: 5px;
    color: rgba(0,0,0,0.5);
    cursor: pointer;
}
.full-width{
    width: 100%;
}
</style>
<context-element id="app" class="vertical" style="padding: 2rem;">
    <form submit.action="ADD_TODO" class="vertical">
         <input type="text" placeholder="What needs to be done ?" autofocus input.action="SET_TODO" value.watch="todo.todo">
    </form>
    <context-array reducer.watch="todoItemReducer" data.key="id" data.watch="todos">
        <div class="horizontal align-bottom">
        <label class="horizontal align-bottom todo-item full-width" class.done.toggle="strike">
            <input type="checkbox" checked.watch="isDone" input.action="SET_DONE">
            <div watch="todo" class="full-width"></div>
        </label>
        <i class="material-icons icon" click.action="DELETE_TODO">highlight_off</i>
        </div>
        
    </context-array>
</context-element>
`;


const todoItemReducer = (array: any, action: any) => {
    const {data, type, event, index} = action;

    switch (type) {
        case 'SET_DONE' : {
            const isDone = (event.target as HTMLInputElement).checked;
            const newData = {...data, isDone, _state: isDone ? 'done' : ''};
            return [...array.slice(0, index), newData, ...array.slice(index + 1, array.length)];
        }
        case 'DELETE_TODO' : {
            return [...array.filter((item: any, itemIndex: number) => index !== itemIndex)];
        }
    }
    return [...array]
};

const mainReducer = (data: any, action: any) => {
    const {type, event} = action;
    switch (type) {
        case 'SET_TODO' : {
            const newTodo = {...data.todo, todo: event.target.value};
            return {...data, todo: newTodo}
        }
        case 'ADD_TODO' : {
            const todo = data.todo;
            const newTodo = {id: uuid(), todo: '', done: false};
            return {...data, todo: newTodo, todos: [...data.todos, todo]}
        }
    }
    return {...data};
};

const javascript = () => {
    const app = document.getElementById('app') as ContextElement<any>;
    let DEFAULT_CONTEXT = {
        todo: {
            id: uuid(),
            todo: '',
            done: false
        },
        todos: Array.from([]),
        todoItemReducer
    };
    app.data = DEFAULT_CONTEXT;
    app.reducer = mainReducer;
};