import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DOWN_ARROW, END, ENTER, HOME, SPACE, UP_ARROW } from '@angular/cdk/keycodes';
import { SdsAccordionModule } from './accordion.module';
import { SdsAccordionDirective } from './accordion.directive';
import { SdsAccordionItemComponent } from './accordion-item.component';
import { SdsAccordionItemHeaderComponent } from './accordion-item-header.component';
import { dispatchEvent, dispatchKeyboardEvent } from '../testing/dispatch-events';
import { createKeyboardEvent } from '../testing/event-objects';
import { SdsAccordionDisplayMode } from './accordion-base';

@Component({
  template: `
    <sds-accordion [multi]="multi" [displayMode]="displayMode">
      <sds-accordion-item *ngFor="let item of items; let i = index" [disabled]="i === disabledIndex">
        <sds-accordion-item-header>{{ item }}</sds-accordion-item-header>
        <p class="eager-content">Body for {{ item }}</p>
        <ng-template sdsAccordionItemContent>
          <button class="lazy-button">Lazy for {{ item }}</button>
        </ng-template>
      </sds-accordion-item>
    </sds-accordion>
  `,
  standalone: false,
})
class AccordionHost {
  items = ['First', 'Second', 'Third'];
  multi = false;
  displayMode: SdsAccordionDisplayMode = 'default';
  disabledIndex = -1;
  @ViewChild(SdsAccordionDirective) accordion: SdsAccordionDirective;
  @ViewChildren(SdsAccordionItemComponent) accordionItems: QueryList<SdsAccordionItemComponent>;
  @ViewChildren(SdsAccordionItemHeaderComponent) headers: QueryList<SdsAccordionItemHeaderComponent>;
}

describe('SdsAccordionDirective', () => {
  let fixture: ComponentFixture<AccordionHost>;
  let host: AccordionHost;
  let headerEls: HTMLElement[];
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(waitForAsync(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.configureTestingModule({
      imports: [SdsAccordionModule, NoopAnimationsModule],
      declarations: [AccordionHost],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccordionHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    headerEls = Array.from(fixture.nativeElement.querySelectorAll('.sds-accordion__trigger'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function expandedStates(): boolean[] {
    return host.accordionItems.map((item) => item.expanded);
  }

  it('applies the sds-accordion host class and toggles the basic modifier with displayMode', () => {
    const accordionEl: HTMLElement = fixture.nativeElement.querySelector('sds-accordion');
    expect(accordionEl.classList).toContain('sds-accordion');
    expect(accordionEl.classList).not.toContain('sds-accordion--basic');

    host.displayMode = 'basic';
    fixture.detectChanges();
    expect(accordionEl.classList).toContain('sds-accordion--basic');
  });

  it('registers every header with the accordion and exposes button semantics', () => {
    expect(host.accordion._headers.length).toBe(3);
    headerEls.forEach((header, index) => {
      expect(header.getAttribute('role')).toBe('button');
      expect(header.getAttribute('tabindex')).toBe('0');
      expect(header.getAttribute('aria-expanded')).toBe('false');
      expect(header.getAttribute('aria-controls')).toBe(host.accordionItems.get(index).id);
      expect(header.id).toBe(host.accordionItems.get(index)._headerId);
    });
  });

  it('toggles an item when its header is clicked', () => {
    headerEls[1].click();
    fixture.detectChanges();

    expect(expandedStates()).toEqual([false, true, false]);
    expect(headerEls[1].getAttribute('aria-expanded')).toBe('true');

    headerEls[1].click();
    fixture.detectChanges();
    expect(expandedStates()).toEqual([false, false, false]);
    expect(headerEls[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the previously opened item when multi is false', () => {
    headerEls[0].click();
    fixture.detectChanges();
    headerEls[2].click();
    fixture.detectChanges();

    expect(expandedStates()).toEqual([false, false, true]);
  });

  it('keeps multiple items open when multi is true', () => {
    host.multi = true;
    fixture.detectChanges();

    headerEls[0].click();
    headerEls[2].click();
    fixture.detectChanges();

    expect(expandedStates()).toEqual([true, false, true]);
  });

  it('toggles with SPACE and ENTER but ignores them when a modifier key is held', () => {
    dispatchKeyboardEvent(headerEls[0], 'keydown', SPACE);
    fixture.detectChanges();
    expect(expandedStates()).toEqual([true, false, false]);

    const enter = dispatchKeyboardEvent(headerEls[0], 'keydown', ENTER);
    fixture.detectChanges();
    expect(enter.defaultPrevented).toBe(true);
    expect(expandedStates()).toEqual([false, false, false]);

    const shiftedEnter = createKeyboardEvent('keydown', ENTER);
    Object.defineProperty(shiftedEnter, 'shiftKey', { get: () => true });
    dispatchEvent(headerEls[0], shiftedEnter);
    fixture.detectChanges();
    expect(shiftedEnter.defaultPrevented).toBe(false);
    expect(expandedStates()).toEqual([false, false, false]);
  });

  it('moves focus to the first and last headers with HOME and END', () => {
    headerEls[1].focus();
    const endEvent = dispatchKeyboardEvent(headerEls[1], 'keydown', END);
    expect(document.activeElement).toBe(headerEls[2]);
    expect(endEvent.defaultPrevented).toBe(true);

    const homeEvent = dispatchKeyboardEvent(headerEls[2], 'keydown', HOME);
    expect(document.activeElement).toBe(headerEls[0]);
    expect(homeEvent.defaultPrevented).toBe(true);
  });

  it('moves focus between headers with the arrow keys and wraps around', () => {
    headerEls[0].focus();
    fixture.detectChanges();

    dispatchKeyboardEvent(headerEls[0], 'keydown', DOWN_ARROW);
    expect(document.activeElement).toBe(headerEls[1]);

    dispatchKeyboardEvent(headerEls[1], 'keydown', DOWN_ARROW);
    expect(document.activeElement).toBe(headerEls[2]);

    dispatchKeyboardEvent(headerEls[2], 'keydown', DOWN_ARROW);
    expect(document.activeElement).toBe(headerEls[0]);

    dispatchKeyboardEvent(headerEls[0], 'keydown', UP_ARROW);
    expect(document.activeElement).toBe(headerEls[2]);
  });

  it('tracks the header the user focused directly so arrow navigation starts from it', () => {
    headerEls[2].focus();
    fixture.detectChanges();

    dispatchKeyboardEvent(headerEls[2], 'keydown', UP_ARROW);
    expect(document.activeElement).toBe(headerEls[1]);
  });

  it('skips disabled items during keyboard navigation and blocks toggling them', () => {
    host.disabledIndex = 1;
    fixture.detectChanges();

    expect(headerEls[1].getAttribute('tabindex')).toBe('-1');
    expect(headerEls[1].getAttribute('aria-disabled')).toBe('true');

    headerEls[1].click();
    fixture.detectChanges();
    expect(expandedStates()).toEqual([false, false, false]);

    headerEls[0].focus();
    dispatchKeyboardEvent(headerEls[0], 'keydown', DOWN_ARROW);
    expect(document.activeElement).toBe(headerEls[2]);
  });

  it('renders lazy content only after the item is first opened and keeps it afterwards', () => {
    const itemEls: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sds-accordion-item'));
    expect(itemEls[0].querySelector('.lazy-button')).toBeNull();
    expect(itemEls[0].querySelector('.eager-content')).not.toBeNull();

    headerEls[0].click();
    fixture.detectChanges();
    expect(itemEls[0].querySelector('.lazy-button')).not.toBeNull();

    headerEls[0].click();
    fixture.detectChanges();
    expect(host.accordionItems.first.expanded).toBe(false);
    expect(itemEls[0].querySelector('.lazy-button')).not.toBeNull();
  });

  it('reports whether focus is inside the item body', () => {
    const item = host.accordionItems.first;
    headerEls[0].click();
    fixture.detectChanges();

    const lazyButton: HTMLButtonElement = fixture.nativeElement.querySelector('.lazy-button');
    lazyButton.focus();
    expect(item._containsFocus()).toBe(true);

    headerEls[0].focus();
    expect(item._containsFocus()).toBe(false);
  });

  it('focuses a header programmatically through its FocusableOption implementation', () => {
    host.headers.get(1).focus('keyboard');
    expect(document.activeElement).toBe(headerEls[1]);

    host.headers.get(2).focus();
    expect(document.activeElement).toBe(headerEls[2]);
  });

  it('stops monitoring header focus when a header is destroyed', () => {
    host.items = ['First'];
    fixture.detectChanges();

    expect(host.accordion._headers.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.sds-accordion__trigger').length).toBe(1);
  });
});
