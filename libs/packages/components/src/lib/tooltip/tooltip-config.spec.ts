import { TestBed } from '@angular/core/testing';
import { Options } from '@popperjs/core';
import { SdsTooltipConfig } from './tooltip-config';

describe('SdsTooltipConfig', () => {
  let config: SdsTooltipConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    config = TestBed.inject(SdsTooltipConfig);
  });

  it('exposes the documented default values', () => {
    expect(config.autoClose).toBe(true);
    expect(config.placement).toBe('auto');
    expect(config.triggers).toBe('hover focus');
    expect(config.disableTooltip).toBe(false);
    expect(config.openDelay).toBe(0);
    expect(config.closeDelay).toBe(0);
    expect(config.container).toBeUndefined();
    expect(config.tooltipClass).toBeUndefined();
  });

  it('passes popper options through unchanged by default', () => {
    const options: Partial<Options> = { placement: 'bottom' };
    expect(config.popperOptions(options)).toBe(options);
  });

  it('reports animation as disabled until it is explicitly set', () => {
    expect(config.animation).toBe(false);
    config.animation = true;
    expect(config.animation).toBe(true);
  });
});
