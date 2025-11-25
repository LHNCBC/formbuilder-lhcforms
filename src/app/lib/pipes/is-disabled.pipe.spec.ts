import { IsDisabledPipe } from './is-disabled.pipe';

describe('IsDisabledPipe', () => {
  it('create an instance', () => {
    const pipe = new IsDisabledPipe();
    expect(pipe).toBeTruthy();
  });
});
