import {ContextElement} from './context-element';
import './index';
import * as faker from 'faker';
import uuid from "./libs/uuid";

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
        //data["@state"] = 'one';
        contextElement.data = data;
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[1].name);
        contextElement.data = users[3];
        expect((contextElement.firstChild as HTMLDivElement).innerHTML).toBe(users[3].name);
        done();
    });
});

//
// test('It should perform remove', (done) => {
//     const arrayContextElement = createArrayContextElement(`<div watch="name"></div>`);
//     const users = generateRandomUser(10);
//     arrayContextElement.setDataKeyPicker((data) => data.userId);
//     arrayContextElement.setData(() => users);
//     arrayContextElement.onMounted(() => {
//         expect(arrayContextElement.childNodes.length).toBe(10);
//         arrayContextElement.setData(() => []);
//         expect(arrayContextElement.childNodes.length).toBe(0);
//         arrayContextElement.setData(() => generateRandomUser(4));
//         expect(arrayContextElement.childNodes.length).toBe(4);
//         done();
//     });
// });
//
// test('it should render `watch` according to the state', (done) => {
//     const arrayContextElement = createArrayContextElement(`<div content.watch="fullName"
//                                                       content.state-one.watch="firstName"
//                                                       content.state-two.watch="lastName"></div>`);
//     arrayContextElement.setDataKeyPicker((data) => data.userId);
//     const dataProvider = Array.from({length: 20}).map(() => {
//         const firstName = faker.name.firstName();
//         const lastName = faker.name.lastName();
//         return {
//             userId: uuid(),
//             fullName: `${firstName} ${lastName}`,
//             firstName: firstName,
//             lastName: lastName
//         }
//     });
//     arrayContextElement.setData(() => {
//         return dataProvider;
//     });
//     arrayContextElement.onMounted(() => {
//         const contentOnDefaultState = Array.from(arrayContextElement.childNodes).map(node => (node as HTMLElement).innerHTML);
//         const usersFullName = dataProvider.map(data => data.fullName);
//         expect(contentOnDefaultState).toEqual(usersFullName);
//         arrayContextElement.setData((old) => {
//             return old.map(data => ({...data, ['@state']: 'state-one'}));
//         });
//         const contentOnStateOne = Array.from(arrayContextElement.childNodes).map(node => (node as HTMLElement).innerHTML);
//         expect(contentOnStateOne).toEqual(dataProvider.map(data => data.firstName));
//         arrayContextElement.setData((old) => {
//             return old.map(data => ({...data, ['@state']: 'state-two'}));
//         });
//         const contentOnStateTwo = Array.from(arrayContextElement.childNodes).map(node => (node as HTMLElement).innerHTML);
//         expect(contentOnStateTwo).toEqual(dataProvider.map(data => data.lastName));
//         arrayContextElement.setData((old) => {
//             return old.map(data => ({...data, ['@state']: 'state-three'}));
//         });
//         const contentOnStateThree = Array.from(arrayContextElement.childNodes).map(node => (node as HTMLElement).innerHTML);
//         expect(contentOnStateThree).toEqual(dataProvider.map(data => data.fullName));
//
//         arrayContextElement.setData((old) => {
//             return old.map(data => {
//                 const newData = ({...data});
//                 delete newData['@state'];
//                 return data;
//             });
//         });
//         const contentOnStateNone = Array.from(arrayContextElement.childNodes).map(node => (node as HTMLElement).innerHTML);
//         expect(contentOnStateNone).toEqual(dataProvider.map(data => data.fullName));
//         done();
//     });
// });
//
// test('It should bind event against node', (done) => {
//     const arrayContextElement = createArrayContextElement('<input click.action="INPUT_CLICKED" >');
//     arrayContextElement.setAttribute('data-key', 'userId');
//     arrayContextElement.onMounted(() => {
//         arrayContextElement.data = generateRandomUser(5);
//         expect(arrayContextElement.childNodes.length).toEqual(5);
//         expect(arrayContextElement.firstChild instanceof HTMLInputElement).toBe(true);
//         expect(arrayContextElement.lastChild instanceof HTMLInputElement).toBe(true);
//         done();
//     });
// });
//
// test('It should update the data when click event triggered',(done) => {
//     const arrayContextElement = createArrayContextElement(`
// <div content.watch="name" content.simple.watch="city"></div>
// <button action="SET_SIMPLE" class="simple">Click</button>
// <button action="SET_COMPLETE" class="complete">Click</button>
// `);
//     arrayContextElement.setAttribute('data-key','userId');
//     const users = generateRandomUser(3);
//     arrayContextElement.data = users;
//     arrayContextElement.reducer = (context,action) => {
//         const data = action.data;
//         switch (action.type) {
//             case 'SET_SIMPLE' : {
//                 data['@state'] = 'simple';
//                 return [...context];
//
//             }
//             case 'SET_COMPLETE' : {
//                 data['@state'] = 'complete';
//                 return [...context];
//
//             }
//         }
//         return context;
//     };
//     arrayContextElement.onMounted(() =>{
//         expect(arrayContextElement.childNodes.length).toBe(3 * 3);
//         const button:HTMLButtonElement = arrayContextElement.querySelector('button.simple');
//         expect((arrayContextElement.firstChild as HTMLElement).innerHTML).toBe(users[0].name);
//         button.click();
//         expect((arrayContextElement.firstChild as HTMLElement).innerHTML).toBe(users[0].city);
//         done();
//     })
// });
//
// test('It should toggle when user change the data',(done)=>{
//     const arrayContextElement = createArrayContextElement(`
//         <div class="common"
//         class.one.toggle="one"
//         class.two.toggle="two"
//         >my data</div>
//         <button click.action="SET_ONE">Toggle ONE</button>
//         <button click.action="SET_TWO">Toggle TWO</button>
//         <button click.action="SET_NONE">Toggle Three</button>
//     `);
//     arrayContextElement.reducer = (context,action) => {
//         switch (action.type) {
//             case 'SET_ONE' : {
//                 action.data['@state'] = 'one';
//                 break;
//             }
//             case 'SET_TWO' : {
//                 action.data['@state'] = 'two';
//                 break;
//             }
//             case 'SET_NONE' : {
//                 delete action.data['@state'];
//                 break;
//             }
//         }
//         return context;
//     }
//     arrayContextElement.setAttribute('data-key','userId');
//     arrayContextElement.data = generateRandomUser(5);
//     arrayContextElement.onMounted(() => {
//         expect(arrayContextElement.childNodes.length).toBe(20);
//         const firstElement = arrayContextElement.firstChild as HTMLDivElement;
//         expect(firstElement.getAttribute('class')).toBe('common');
//         const setOne = arrayContextElement.childNodes.item(1) as HTMLButtonElement;
//         const setTwo = arrayContextElement.childNodes.item(2) as HTMLButtonElement;
//         const setThree = arrayContextElement.childNodes.item(3) as HTMLButtonElement;
//         setOne.click();
//         expect(firstElement.getAttribute('class')).toBe('common one');
//         setTwo.click();
//         expect(firstElement.getAttribute('class')).toBe('common two');
//         setThree.click();
//         expect(firstElement.getAttribute('class')).toBe('common');
//         done();
//     });
//
// })
