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
    return document.body.querySelector(`#${randomId}`) as ContextElement<any>;
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

test('It should perform update only against the node leaf', (done) => {
    const contextElement = createContextElement(`<div watch="name"></div>
        <context-element data.watch="address" reducer.watch="addressReducer" id="subElement">
            <div watch="city" id="cityDiv"></div>
            <input type="text" input.action="SET_CITY" id="input">
        </context-element>`);
    contextElement.data = {
        name: 'Example of how to change the node',
        address: {
            city: 'You can change this value'
        },
        addressReducer: (address: any, action: Action) => {
            const type: string = action.type;
            const event: any = action.event;
            if (type === 'SET_CITY') {
                {
                    const city = event.target.value;
                    return {...address, city}
                }
            }
            return {...address}
        }
    };
    contextElement.onMounted(() => {
        const subElement = document.getElementById('subElement') as ContextElement<any>;
        subElement.onMounted(() => {
            const input: HTMLInputElement = document.getElementById('input') as HTMLInputElement;
            input.value = 'Jakarta';
            input.dispatchEvent(new InputEvent('input', {bubbles: true, cancelable: true}));
            const cityDiv = document.getElementById('cityDiv');
            expect(cityDiv.innerHTML).toBe('Jakarta');
            done();
        });
    });

});

test('it should provide a default object if there is no object assigned to it', (done) => {
    const contextElement = createContextElement(`<div>
    <div watch="nama" content.enabled.watch="nama_panjang" content.disabled.watch="nama_pendek" id="divToWatch"></div>
    <button click.action="TOGGLE_STATE" id="myButton">Click</button>
</div>`);
    contextElement.reducer = (data) => {
        data.nama = 'Okay';
        data.nama_panjang = 'Okay Deh';
        data.nama_pendek = 'Deh';
        data._state = data?._state === 'enabled' ? 'disabled' : 'enabled';
        return {...data}
    };

    contextElement.onMounted(() => {
        const myButton = document.getElementById('myButton');
        const divToWatch = document.getElementById('divToWatch');
        myButton.click();
        expect(divToWatch.innerHTML).toBe('Okay Deh');
        myButton.click();
        expect(divToWatch.innerHTML).toBe('Deh');
        done();
    });
});

test('it should get the assets from the context element', (done) => {
    const contextElement = createContextElement(`
        <div watch="hello"></div>
        <context-element>
            <div>
                <context-element id="child">
                
                </context-element>
            </div>
        </context-element>
    `);
    const myReducer = (state: any) => {
        return {...state}
    };
    contextElement.assets = {
        myReducer,
        name: 'sedap'
    };
    contextElement.onMounted(() => {
        const childContextElement = document.getElementById('child') as ContextElement<any>;

        expect(childContextElement.getAsset('myReducer')).toBe(myReducer);
        expect(childContextElement.getAsset('name')).toBe('sedap');
        childContextElement.assets = {
            name: 'kuncup'
        };
        expect(childContextElement.getAsset('name')).toBe('kuncup');
        done();
    });

});

test('It should assign the value from assets', (done) => {
    const contextElement = createContextElement(`
<div>
    <div asset="kambing" id="kambingId"></div>
    <context-element reducer.asset="helloWorld">
        <div watch="content" id="contentDiv"></div>
        <button click.action="SET_CONTENT" id="buttonGila"></button>
    </context-element>
</div>
    `);
    contextElement.assets = {
        kambing: 'kambing',
        helloWorld: (data: any, action: any) => {
            const {type} = action;
            if (type === 'SET_CONTENT') {
                {
                    return {...data, content: 'Hello World'}
                }
            }
            return {...data}
        }
    };
    setTimeout(() => {
        const myButton = document.getElementById('buttonGila');
        const contentDiv = document.getElementById('contentDiv');
        const kambingDiv = document.getElementById('kambingId');
        expect(kambingDiv.innerHTML).toBe("kambing");
        expect(contentDiv.innerHTML).toBe("undefined");
        myButton.click();
        expect(contentDiv.innerHTML).toBe('Hello World');
        done();
    }, 100);

});

