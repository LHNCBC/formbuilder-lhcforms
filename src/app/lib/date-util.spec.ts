import {DateUtil} from './date-util';

describe('Date time formatting', () => {
  it('should format and parse ISO representation', () => {
    expect(DateUtil.formatToISO(DateUtil.parseISOToDateTime('2021'))).toBe('2021');
    expect(DateUtil.formatToISO(DateUtil.parseISOToDateTime('2021-03'))).toBe('2021-03');
    expect(DateUtil.formatToISO(DateUtil.parseISOToDateTime('2021-03-02'))).toBe('2021-03-02');
    expect(DateUtil.formatToISO(DateUtil.parseISOToDateTime('2021-03-02T13:09:08Z'))).toBe('2021-03-02T13:09:08Z');
    expect(DateUtil.formatToISO(DateUtil.parseISOToDateTime('2021-03-02T13:09:08.012Z'))).toBe('2021-03-02T13:09:08.012Z');
  });

  it('should format and parse local representation', () => {
    expect(DateUtil.formatToLocal(DateUtil.parseLocalToDateTime('2021'))).toBe('2021');
    expect(DateUtil.formatToLocal(DateUtil.parseLocalToDateTime('2021-03'))).toBe('2021-03');
    expect(DateUtil.formatToLocal(DateUtil.parseLocalToDateTime('2021-03-02'))).toBe('2021-03-02');
    expect(DateUtil.formatToLocal(DateUtil.parseLocalToDateTime('2021-03-02 01:09:08 PM'))).toBe('2021-03-02 01:09:08 PM');
    expect(DateUtil.formatToLocal(DateUtil.parseLocalToDateTime('2021-03-02 01:09:08.012 AM'))).toBe('2021-03-02 01:09:08.012 AM');
  });
});
