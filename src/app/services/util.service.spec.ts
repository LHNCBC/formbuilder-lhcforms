import { TestBed } from '@angular/core/testing';

import { UtilService } from './util.service';

fdescribe('UtilService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  fit('should be created', () => {
    const service: UtilService = TestBed.get(UtilService);
    expect(service).toBeTruthy();
    const layout: any[] = [
      '*',
      {
        key: 'a',
        type: 'aType',
        condition: 'return true;'
      },
      {
        key: 'b',
        type: 'bType',
        condition: '2 > 1;'
      },
      {
        key: 'c',
        type: 'array',
        items: [
          {
            key: 'c1',
            type: 'c1Type',
            condition: 'true ? true : false'
          }
        ]
      },
      {
        key: 'd',
        type: 'dType',
        condition: '!true ? true : false'
      },



    ];
    expect(typeof layout[1].condition).toBe('string');
    expect(typeof layout[2].condition).toBe('string');

    service.processLayout(layout);

    expect(layout[1].condition()).toBeTruthy();
    expect(layout[2].condition()).toBeTruthy();
    expect(layout[3].items[0].condition()).toBeTruthy();
    expect(layout[4].condition()).toBeFalsy();
  });
});
