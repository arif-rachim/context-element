import {DataGroup} from './data-group';
import * as faker from 'faker';

test('It should create an element instance of Group', () => {
    document.body.innerHTML = `
    <data-group data-key="id" id="data-group">
        <div watch="name"></div>
    </data-group>
    `;
    const dataGroup = document.getElementById('data-group');
    expect(true).toBe(dataGroup instanceof DataGroup);
});

test('It should create children from dataProvider', (done) => {
    document.body.innerHTML = '';// we clean first
    document.body.innerHTML = `
    <data-group >
        <div watch="name"></div>
    </data-group>
    `;
    const totalChildren = 10;
    const dataProvider = Array.from({length:totalChildren}).map(() => ({
        name : `${faker.name.firstName()} ${faker.name.lastName()}`
    }));
    const dataGroup = document.getElementsByTagName('data-group')[0] as DataGroup;
    dataGroup.setDataProvider(dataProvider);
    dataGroup.addEventListener('mounted',(event) => {
        expect(dataGroup.childNodes.length).toBe(totalChildren);
        const innerHtml = Array.from(dataGroup.childNodes).map(node => (node as HTMLElement).innerHTML);
        expect(innerHtml[0]).toEqual(dataProvider[0].name);
        dataGroup.setDataProvider([]);
        expect(dataGroup.childNodes.length).toBe(0);
        done();
    });
});

