import { patchElementFocus } from './element-focus';

describe('patchElementFocus', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('button');
    document.body.appendChild(element);
    patchElementFocus(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('dispatches a synchronous focus event when focus() is called', () => {
    const focusListener = vi.fn();
    element.addEventListener('focus', focusListener);

    element.focus();

    expect(focusListener).toHaveBeenCalledTimes(1);
    expect(focusListener.mock.calls[0][0].type).toBe('focus');
  });

  it('dispatches a synchronous blur event when blur() is called', () => {
    const blurListener = vi.fn();
    element.addEventListener('blur', blurListener);

    element.blur();

    expect(blurListener).toHaveBeenCalledTimes(1);
    expect(blurListener.mock.calls[0][0].type).toBe('blur');
  });
});
