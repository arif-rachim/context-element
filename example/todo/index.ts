import {Action, ArrayAction, Reducer} from "../../src/types";
import {ContextElement} from "../../src/context-element";
import uuid from "../../src/libs/uuid";


const todo = document.getElementById('myTodo') as ContextElement<Context>;

type Todo = {
    id: string,
    todo: string,
    done: boolean,
    _state?: string
};

type Context = {
    todo?: Todo,
    todoCollection: Todo[],
    todoReducer: Reducer<Todo[]>
}

const DEFAULT_STATE: Context = {
    todo: {
        done: false,
        todo: '',
        id: uuid()
    },
    todoCollection: [],
    todoReducer: (context: Todo[], action: ArrayAction<Todo>) => {
        debugger;
        switch (action.type) {
            case 'TOGGLE_CHECKBOX' : {
                return [...context.slice(0, action.index), {
                    ...action.data,
                    done: (action.event.target as HTMLInputElement).checked
                }, ...context.slice(action.index + 1, context.length)];
            }
        }
        return [...context];
    }
};

todo.reducer = (context: Context, action: ArrayAction<Todo>) => {
    switch (action.type) {
        case 'SET_TODO' : {
            const todo = {...context.todo};
            todo.todo = (action.event.target as HTMLInputElement).value;
            return {...context, todo};
        }
        case 'ADD_TODO' : {
            const newContext: Context = {...context, todoCollection: [...context.todoCollection, context.todo]};
            newContext.todo = {id: uuid(), todo: '', done: false};
            return newContext;
        }
    }
    return {...context};
};

todo.data = DEFAULT_STATE;
