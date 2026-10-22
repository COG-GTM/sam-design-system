import { TestBed } from '@angular/core/testing';
import { Options } from '@popperjs/core';
import { SdsPopoverConfig } from './popover-config';

describe('SdsPopoverConfig', () => {
  let config: SdsPopoverConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    config = TestBed.inject(SdsPopoverConfig);
  });

  it('exposes the documented default values', () => {
    expect(config.autoClose).toBe('inside');
    expect(config.placement).toBe('auto');
    expect(config.triggers).toBe('click');
    expect(config.disablePopover).toBe(false);
    expect(config.openDelay).toBe(0);
    expect(config.closeDelay).toBe(0);
    expect(config.container).toBeUndefined();
    expect(config.popoverClass).toBeUndefined();
  });

  it('passes popper options through unchanged by default', () => {
    const options: Partial<Options> = { placement: 'top', strategy: 'fixed' };
    expect(config.popperOptions(options)).toBe(options);
  });

  it('reports animation as disabled until it is explicitly set', () => {
    expect(config.animation).toBe(false);
    config.animation = true;
    expect(config.animation).toBe(true);
    config.animation = false;
    expect(config.animation).toBe(false);
  });
});
