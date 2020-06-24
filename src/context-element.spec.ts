import {ContextElement} from './context-element';
import './index';
import * as faker from 'faker';
import uuid from "./libs/uuid";
import {Action} from "./types";

/**
 *
 * @param innerHTML
 */
const createContextElement = (innerHTML?: string) => {
    const randomId = uuid();
    const element = document.createElement('context-element');
    element.innerHTML = innerHTML;
    element.setAttribute('id', randomId);
    document.body.append(element);
    return document.body.querySelector(`#${randomId}`) as ContextElement<any,any>;
};

const generateRandomUser = (length: number) => {
    return Array.from({length}).map(() => ({
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        city: faker.address.city(),
        picture: faker.image.avatar(),
        userId: Math.random() * 1000000
    }));
};

test('It should create an element of ContextElement', () => {
    const group = createContextElement();
    expect(true).toBe(group instanceof ContextElement);
});

test('It should render the childNodes and validate based on data', (done) => {
    const contextElement = createContextElement(`<div watch="name"></div>`);
    const users = generateRandomUser(1);
    contextElement.data = users[0];
    contextElement.onMounted(() => {
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(contextElement.data.name);
        done();
    });
});

test('It should update the childNodes and validate based on data', (done) => {
    const contextElement = createContextElement(`<div watch="name"></div>`);
    const users = generateRandomUser(5);
    contextElement.data = users[2];
    contextElement.onMounted(() => {
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(contextElement.data.name);
        contextElement.data = users[1];
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[1].name);
        contextElement.data = users[3];
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[3].name);
        done();
    });
});

test('It should update the childNodes and validate based data state', (done) => {
    const contextElement = createContextElement(`
<div watch="name" 
content.one.watch="city"
content.two.watch="picture"></div>
`);
    const users = generateRandomUser(5);
    contextElement.data = users[2];
    contextElement.onMounted(() => {
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(contextElement.data.name);
        let data = users[1];
        contextElement.data = data;
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[1].name);
        contextElement.data = users[3];
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[3].name);
        done();
    });
});

test('It should perform update only against the node leaf',(done) => {
    const contextElement = createContextElement(`<div watch="name"></div>
        <context-element data.watch="address" reducer.watch="addressReducer" id="subElement">
            <div watch="city" id="cityDiv"></div>
            <input type="text" input.action="SET_CITY" id="input">
        </context-element>`);
    contextElement.data = {
        name : 'Example of how to change the node',
        address : {
            city : 'You can change this value'
        },
        addressReducer : (address:any,action:Action<any>) => {
            const type:string = action.type;
            const event:any = action.event;
            switch (type) {
                case 'SET_CITY' : {
                    const city = event.target.value;
                    return {...address,city}
                }
            }
            return {...address}
        }
    };
    contextElement.onMounted(() => {
        const subElement = document.getElementById('subElement') as ContextElement<any, any>;
        subElement.onMounted(() => {
            const input:HTMLInputElement = document.getElementById('input') as HTMLInputElement;
            input.value = 'Jakarta';
            input.dispatchEvent(new InputEvent('input',{bubbles:true,cancelable:true}));
            const cityDiv = document.getElementById('cityDiv');
            expect(cityDiv.innerHTML).toBe('Jakarta');
            done();
        });
    });

});
