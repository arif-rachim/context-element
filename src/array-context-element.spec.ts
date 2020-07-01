import {ArrayContextElement} from './array-context-element';
import './index';
import * as faker from 'faker';
import uuid from "./libs/uuid";
import {ChildAction, DATA_KEY_ATTRIBUTE} from "./types";

const createArrayContextElement = (innerHTML?: string) => {
    document.body.innerHTML = '';
    const randomId = uuid();
    const element = document.createElement('context-array');
    element.innerHTML = innerHTML;
    element.setAttribute('id', randomId);
    document.body.append(element);
    return document.body.querySelector(`#${randomId}`) as ArrayContextElement<any>;
};

const generateRandomUser = (length: number) => {
    return Array.from({length}).map(() => ({
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        city: faker.address.city(),
        picture: faker.image.avatar(),
        userId: Math.random() * 1000000
    }));
};

test('It should create an element of ArrayContextElement', () => {
    const group = createArrayContextElement();
    expect(true).toBe(group instanceof ArrayContextElement);
});


test('It should throw error when setting dataSource without keySelector', (done) => {
    const arrayContextElement = createArrayContextElement(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    arrayContextElement.onMounted(() => {
        expect(() => {
            arrayContextElement.setData(() => users);
        }).toThrow();
        done();
    });

});

// rendering child noe
test('It should render the childNodes and validate the length based on dataSource', (done) => {
    const arrayContextElement = createArrayContextElement(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    arrayContextElement.setDataKeyPicker((data) => data.userId);
    arrayContextElement.setData(() => users);
    arrayContextElement.onMounted(() => {
        expect(arrayContextElement.childNodes.length).toBe(10);
        done();
    });
});

test('It should perform remove', (done) => {
    const arrayContextElement = createArrayContextElement(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    arrayContextElement.setDataKeyPicker((data) => data.userId);
    arrayContextElement.setData(() => users);
    arrayContextElement.onMounted(() => {
        expect(arrayContextElement.childNodes.length).toBe(10);
        arrayContextElement.setData(() => []);
        expect(arrayContextElement.childNodes.length).toBe(0);
        arrayContextElement.setData(() => generateRandomUser(4));
        expect(arrayContextElement.childNodes.length).toBe(4);
        done();
    });
});


test('It should bind event against node', (done) => {
    const arrayContextElement = createArrayContextElement('<input click.action="INPUT_CLICKED" >');
    arrayContextElement.setAttribute(DATA_KEY_ATTRIBUTE, 'userId');
    arrayContextElement.onMounted(() => {
        arrayContextElement.data = generateRandomUser(5);
        expect(arrayContextElement.childNodes.length).toEqual(5);
        expect(arrayContextElement.firstChild instanceof HTMLInputElement).toBe(true);
        expect(arrayContextElement.lastChild instanceof HTMLInputElement).toBe(true);
        done();
    });
});


test('It should assign the value from assets', (done) => {
    const contextElement = createArrayContextElement(`
<div>
    <div asset="kambing" class="kambing"></div>
    <context-element reducer.asset="helloWorld">
        <div watch="content" id="contend"></div>
        <button click.action="SET_CONTENT" class="button-gila"></button>
    </context-element>
</div>
    `);
    contextElement.data = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
    contextElement.setAttribute('data.key', 'id');
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
        const buttons = contextElement.querySelectorAll('.button-gila');
        const contents = contextElement.querySelectorAll('.contend');
        const kambings = contextElement.querySelectorAll('.kambing');
        expect(buttons.length).toBe(contextElement.data.length);
        kambings.forEach(kambing => {
            expect(kambing.innerHTML).toBe("kambing");
        });
        contents.forEach(content => {
            expect(content.innerHTML).toBe("undefined");
        });
        buttons.forEach((button: any) => {
            button.click()
        });
        contents.forEach(content => {
            expect(content.innerHTML).toBe("Hello World");
        });
        done();
    }, 100);

});

test(`Context Array should bubble the action child`,(done) => {
    const ce = createArrayContextElement(`<div>
    <context-array data.watch="persons" data.key="id">
        <context-array data.watch="addresses" data.key="id">
            <button click.action="SET_NAME" id="buttonContext">Hello</button>
            <div watch="city" id="city"></div>
        </context-array>
    </context-array>
</div>`);
    ce.setDataKeyPicker((data) => data.id);
    ce.data =  [{
        id : 'dictionary',
        persons : [
            {
                id: 'person',
                addresses : [{
                    id : 'dubai',
                    city : 'DUBAI'
                }]
            }
        ]
    }];

    ce.reducer = (data,action) => {
        const [firstPath,secondPath] = (action as ChildAction).childActions;
        secondPath.data.city = 'TOKYO';
        return [...data];
    };

    setTimeout(() => {
        const button = document.getElementById('buttonContext');
        const cityDiv = document.getElementById('city');
        expect(cityDiv.innerHTML).toBe('DUBAI');
        button.click();
        setTimeout(() => {
            expect(cityDiv.innerHTML).toBe('TOKYO');
            done();
        },100);
    },100);

});
