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
    expect(Util.isValidFileName('~a.a')).toBeFalsy();
    expect(Util.isValidFileName('.a.a')).toBeFalsy();
    expect(Util.isValidFileName('/a.a')).toBeFalsy();
    expect(Util.isValidFileName('a\\a')).toBeFalsy();
  });

  it('should accept file names', () => {
    expect(Util.isValidFileName('a.a')).toBeTruthy();
    expect(Util.isValidFileName('aa')).toBeTruthy();
    expect(Util.isValidFileName('a a')).toBeTruthy();
    expect(Util.isValidFileName('A b.c')).toBeTruthy();
  });
});
