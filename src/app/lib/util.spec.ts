import {Util} from './util';

describe('Util', () => {
  it('should traverse to ancestors', () => {
    const e = 'x';
    const d: any = {e};
    const c: any = {d};
    const b: any = {c};
    const a: any = {b};
    b.parent = a;
    c.parent = b;
    d.parent = c;

    let reply = Util.traverseAncestors(d, (n) => {return true});
    expect(reply).toEqual([d, c, b, a]);
    reply = Util.traverseAncestors(d, (n) => {return n !== c});
    expect(reply).toEqual([d, c]);
    reply = Util.traverseAncestors(b, (n) => {return true});
    expect(reply).toEqual([b, a]);
  });

  it('should reject file names', () => {
    expect(Util.validateFile(<File>null)).toBeNull();
    expect(Util.validateFile(<File>{name: null})).toBeNull();
    expect(Util.validateFile(<File>{name: '  '})).toBeNull();
    expect(Util.validateFile(<File>{name: '~a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: '.a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: '/a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: 'a\\a'})).toBeNull();
  });

  it('should accept file names', () => {
    expect(Util.validateFile(<File>{name: 'a.a'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'aa'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'a a'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'A b.c'})).toBeDefined();
  });
});
