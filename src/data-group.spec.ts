import {DataGroup} from './data-group';
import * as faker from 'faker';
import uuid from "./libs/uuid";

const createDataGroup = (innerHTML?: string) => {
    const randomId = uuid();
    const element = document.createElement('data-group');
    element.innerHTML = innerHTML;
    element.setAttribute('id', randomId);
    document.body.append(element);
    return document.body.querySelector(`#${randomId}`) as DataGroup;
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
test('It should create an element of DataGroup', () => {
    const group = createDataGroup();
    expect(true).toBe(group instanceof DataGroup);
});


test('It should throw error when setting dataProvider without keySelector', (done) => {
    const dataGroup = createDataGroup(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    dataGroup.onMounted(() => {
        expect(() => {
            dataGroup.setDataProvider(users);
        }).toThrow();
        done();
    });

});

test('It should render the childNodes and validate the length based on dataProvider', (done) => {
    const dataGroup = createDataGroup(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    dataGroup.setDataKeySelector((data) => data.userId);
    dataGroup.setDataProvider(users);
    dataGroup.onMounted(() => {
        expect(dataGroup.childNodes.length).toBe(10);
        done();
    });
});

test('It should perform remove', (done) => {
    const dataGroup = createDataGroup(`<div watch="name"></div>`);
    const users = generateRandomUser(10);
    dataGroup.setDataKeySelector((data) => data.userId);
    dataGroup.setDataProvider(users);
    dataGroup.onMounted(() => {
        expect(dataGroup.childNodes.length).toBe(10);
        dataGroup.setDataProvider([]);
        expect(dataGroup.childNodes.length).toBe(0);
        dataGroup.setDataProvider(generateRandomUser(4));
        expect(dataGroup.childNodes.length).toBe(4);
        done();
    });
});

test('it should render `watch` according to the state', (done) => {
    const dataGroup = createDataGroup(`<div content.watch="fullName" 
                                                      content.state-one.watch="firstName"
                                                      content.state-two.watch="lastName"></div>`);
    dataGroup.setDataKeySelector((data) => data.userId);
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
    dataGroup.setDataProvider(() => {
        return dataProvider;
    });
    dataGroup.onMounted(() => {
        const contentOnDefaultState = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        const usersFullName = dataProvider.map(data => data.fullName);
        expect(contentOnDefaultState).toEqual(usersFullName);
        dataGroup.setDataProvider((old) => {
            return old.map(data => ({...data, ['@state']: 'state-one'}));
        });
        const contentOnStateOne = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateOne).toEqual(dataProvider.map(data => data.firstName));
        dataGroup.setDataProvider((old) => {
            return old.map(data => ({...data, ['@state']: 'state-two'}));
        });
        const contentOnStateTwo = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateTwo).toEqual(dataProvider.map(data => data.lastName));
        dataGroup.setDataProvider((old) => {
            return old.map(data => ({...data, ['@state']: 'state-three'}));
        });
        const contentOnStateThree = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateThree).toEqual(dataProvider.map(data => data.fullName));

        dataGroup.setDataProvider((old) => {
            return old.map(data => {
                const newData = ({...data});
                delete newData['@state'];
                return data;
            });
        });
        const contentOnStateNone = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(contentOnStateNone).toEqual(dataProvider.map(data => data.fullName));
        done();
    });
});


