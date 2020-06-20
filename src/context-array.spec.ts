import {ContextArray} from './context-array';
import './index';
import * as faker from 'faker';
import uuid from "./libs/uuid";

const createContextArray = (innerHTML?: string) => {
    const randomId = uuid();
    const element = document.createElement('context-array');
    element.innerHTML = innerHTML;
    element.setAttribute('id', randomId);
    document.body.append(element);
    return document.body.querySelector(`#${randomId}`) as ContextArray<any>;
};

const generateRandomUser = (length: number) => {
    return Array.from({length}).map(() => ({
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        city: faker.address.city(),
        picture: faker.image.avatar(),
        userId: Math.random() * 1000000
    }));
};
//
test('It should create an element of ContextArray', () => {
    const group = createContextArray();
    expect(true).toBe(group instanceof ContextArray);
});


test('It should throw error when setting dataSource without keySelector', (done) => {
    const contextArray = createContextArray(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    contextArray.onMounted(() => {
        expect(() => {
            contextArray.setData(() => users);
        }).toThrow();
        done();
    });

});

test('It should render the childNodes and validate the length based on dataSource', (done) => {
    const contextArray = createContextArray(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    contextArray.setDataKeyPicker((data) => data.userId);
    contextArray.setData(() => users);
    contextArray.onMounted(() => {
        expect(contextArray.childNodes.length).toBe(10);
        done();
    });
});

test('It should perform remove', (done) => {
    const contextArray = createContextArray(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    contextArray.setDataKeyPicker((data) => data.userId);
    contextArray.setData(() => users);
    contextArray.onMounted(() => {
        expect(contextArray.childNodes.length).toBe(10);
        contextArray.setData(() => []);
        expect(contextArray.childNodes.length).toBe(0);
        contextArray.setData(() => generateRandomUser(4));
        expect(contextArray.childNodes.length).toBe(4);
        done();
    });
});

test('it should render `watch` according to the state', (done) => {
    const contextArray = createContextArray(`<div content.watch="fullName" 
                                                      content.state-one.watch="firstName"
                                                      content.state-two.watch="lastName"></div>`);
    contextArray.setDataKeyPicker((data) => data.userId);
    const dataProvider = Array.from({length: 20}).map(() => {
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();
        return {
            userId: uuid(),
            fullName: `${firstName} ${lastName}`,
            firstName: firstName,
            lastName: lastName
        }
    });
    contextArray.setData(() => {
        return dataProvider;
    });
    contextArray.onMounted(() => {
        const contentOnDefaultState = Array.from(contextArray.childNodes).map(node => (node as HTMLElement).innerHTML);
        const usersFullName = dataProvider.map(data => data.fullName);
        expect(contentOnDefaultState).toEqual(usersFullName);
        contextArray.setData((old) => {
            return old.map(data => ({...data, ['@state']: 'state-one'}));
        });
        const contentOnStateOne = Array.from(contextArray.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateOne).toEqual(dataProvider.map(data => data.firstName));
        contextArray.setData((old) => {
            return old.map(data => ({...data, ['@state']: 'state-two'}));
        });
        const contentOnStateTwo = Array.from(contextArray.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateTwo).toEqual(dataProvider.map(data => data.lastName));
        contextArray.setData((old) => {
            return old.map(data => ({...data, ['@state']: 'state-three'}));
        });
        const contentOnStateThree = Array.from(contextArray.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateThree).toEqual(dataProvider.map(data => data.fullName));

        contextArray.setData((old) => {
            return old.map(data => {
                const newData = ({...data});
                delete newData['@state'];
                return data;
            });
        });
        const contentOnStateNone = Array.from(contextArray.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateNone).toEqual(dataProvider.map(data => data.fullName));
        done();
    });
});

test('It should bind event against node', (done) => {
    const contextArray = createContextArray('<input click.action="INPUT_CLICKED" >');
    contextArray.setAttribute('data-key', 'userId');
    contextArray.onMounted(() => {
        contextArray.data = generateRandomUser(5);
        expect(contextArray.childNodes.length).toEqual(5);
        expect(contextArray.firstChild instanceof HTMLInputElement).toBe(true);
        expect(contextArray.lastChild instanceof HTMLInputElement).toBe(true);
        done();
    });
});
