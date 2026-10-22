import { ChangeDetectorRef, Component, Input } from '@angular/core';

@Component({
  selector: 'usa-icon',
  template: '',
  standalone: false,
})
class UsaIconStubComponent {
  @Input() icon = '';
  @Input() size = 'lg';
  @Input() rotate = 0;
  @Input() classes?: string[];
  @Input() skew?: any;
}
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SdsSearchComponent } from './search.component';
import { By } from '@angular/platform-browser';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ViewportRuler } from '@angular/cdk/overlay';

class TestComponent {
  inputState = {
    initial: { visible: undefined },
    visible: undefined,
  };
}

describe('SearchComponent', () => {
  let component: SdsSearchComponent;
  let fixture: ComponentFixture<SdsSearchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SdsSearchComponent, UsaIconStubComponent],

      providers: [FocusMonitor, ViewportRuler],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdsSearchComponent);
    component = fixture.componentInstance;
    component.searchSettings.size = 'large';
    // jsdom always reports 0 for layout geometry (no real rendering engine).
    // A real browser measures a rendered, visible input/button with nonzero
    // width; stub `getBoundingClientRect` so `isInputVisible()` /
    // `calculateInputWidth()` behave the way they do under Karma/Chrome.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 100,
      height: 20,
      top: 0,
      left: 0,
      bottom: 20,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be dropdown', () => {
    component.inputEl.nativeElement.value = 'test';
    component.searchSettings.dropdown.options = [
      { label: '30 Days', value: '30' },
      { label: '60 Days', value: '60' },
      { label: '90 Days', value: '90' },
    ];

    expect(component.inputEl.nativeElement.value).toBe('test');
  });

  it('should implement controlvalueaccessor with default values', () => {
    component.registerOnChange((_) => undefined);
    component.registerOnTouched(() => undefined);
    component.writeValue({ searchText: 'aaa', searchCategory: '30' });
    expect(component.model.searchText).toBe('aaa');
  });

  it('should implement controlvalueaccessor with empty', () => {
    component.model = {};
    component.registerOnChange((_) => undefined);
    component.registerOnTouched(() => undefined);
    component.writeValue(component.model);
    expect(component.model.searchText).toBe(undefined);
  });

  it('Should update the model value on input event', () => {
    const event = {
      preventDefault: () => {},
    };
    const input = fixture.debugElement.query(By.css('.usa-input'));
    input.nativeElement.value = 'test';
    input.triggerEventHandler('input', {});
    expect(component.model.searchText).toBe('test');
  });

  it('Should emit on submit output on click event', () => {
    const model = { searchText: 'abc' };
    component.model = model;
    vi.spyOn(component.submit, 'emit');
    component.handleClick({ preventDefault: () => {} });
    expect(component.submit.emit).toHaveBeenCalledWith(model);
  });

  it('Should check the Initial State Visible', () => {
    expect(component.inputState.visible).toBe(component.inputState.initial.visible);
  });

  it('should check for remove Input Visible', () => {
    component.removeInputVisibleStyles();
    expect(component.inputEl.nativeElement.style.display).toBe('');
    expect(component.inputEl.nativeElement.style.position).toBe('');
    expect(component.inputEl.nativeElement.style.left).toBe('');
    expect(component.inputEl.nativeElement.style.width).toBe('');
    expect(component.inputState.visible).toBeFalsy();
  });

  it('disables the input and submit button through setDisabledState', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(component.disabled).toBe(true);
    expect(fixture.debugElement.query(By.css('.usa-input')).nativeElement.disabled).toBe(true);
    expect(fixture.debugElement.query(By.css('button.usa-button')).nativeElement.disabled).toBe(true);

    component.setDisabledState(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.usa-input')).nativeElement.disabled).toBe(false);
  });

  it('reveals the input and focuses it on click when the input is collapsed', () => {
    const focusMonitor = TestBed.inject(FocusMonitor);
    const focusVia = vi.spyOn(focusMonitor, 'focusVia');
    const button = fixture.debugElement.query(By.css('button.usa-button')).nativeElement;
    (HTMLElement.prototype.getBoundingClientRect as any).mockImplementation(function (this: HTMLElement) {
      const left = this === button ? 300 : 0;
      return { width: 100, height: 20, top: 0, left, bottom: 20, right: left + 100, x: left, y: 0, toJSON: () => ({}) };
    });
    component.inputState.visible = false;
    vi.spyOn(component.submit, 'emit');

    const event = new Event('click', { cancelable: true });
    component.handleClick(event);

    expect(event.defaultPrevented).toBe(true);
    expect(component.submit.emit).not.toHaveBeenCalled();
    expect(focusVia).toHaveBeenCalledWith(component.inputEl, 'program');
    const inputStyle = component.inputEl.nativeElement.style;
    expect(inputStyle.getPropertyValue('display')).toBe('block');
    expect(inputStyle.getPropertyPriority('display')).toBe('important');
    expect(inputStyle.position).toBe('absolute');
    expect(inputStyle.left).toBe('-280px');
    expect(inputStyle.getPropertyValue('width')).toBe('280px');
    expect(component.inputState.visible).toBe(true);
  });

  it('measures the input width relative to the parent selector when one is configured', () => {
    const button = fixture.debugElement.query(By.css('button.usa-button')).nativeElement;
    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    (HTMLElement.prototype.getBoundingClientRect as any).mockImplementation(function (this: HTMLElement) {
      const left = this === button ? 300 : this === form ? 50 : 0;
      return { width: 100, height: 20, top: 0, left, bottom: 20, right: left + 100, x: left, y: 0, toJSON: () => ({}) };
    });
    component.searchSettings.parentSelector = 'form';

    expect(component.calculateInputWidth()).toBe(230);
  });

  it('collapses the input on blur only when it started out collapsed', () => {
    component.setInputVisibleStyles();
    expect(component.inputState.visible).toBe(true);

    component.inputState.initial.visible = false;
    fixture.debugElement.query(By.css('.usa-input')).triggerEventHandler('blur', {});
    expect(component.inputState.visible).toBe(false);
    expect(component.inputEl.nativeElement.style.position).toBe('');
  });

  it('re-measures input visibility when the viewport changes', () => {
    vi.spyOn(component, 'isInputVisible').mockReturnValue(false);

    window.dispatchEvent(new Event('resize'));

    expect(component.inputState.initial.visible).toBe(false);
    expect(component.inputState.visible).toBe(false);
  });

  it('clears the input, refocuses it and propagates the empty value from the clear control', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    component.model = { searchText: 'hello' };
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.debugElement.query(By.css('.usa-input')).nativeElement;
    expect(input.value).toBe('hello');

    const clearControl = fixture.debugElement.query(By.css('.close-icon'));
    expect(clearControl.nativeElement.getAttribute('role')).toBe('button');
    expect(clearControl.nativeElement.getAttribute('aria-label')).toBe('Clear input');
    clearControl.nativeElement.click();
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(component.model.searchText).toBe('');
    expect(document.activeElement).toBe(input);
    expect(onChange).toHaveBeenCalledWith({ searchText: '' });
    expect(fixture.debugElement.query(By.css('.close-icon'))).toBeNull();
  });

  it('renders the category dropdown and includes the selection in the model', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    component.searchSettings.dropdown.options = [
      { label: '30 Days', value: '30' },
      {
        label: 'Older',
        group: [
          { label: '60 Days', value: '60' },
          { label: '90 Days', value: '90', disabled: true },
        ],
      },
    ];
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    expect(component.hasDropdown()).toBe(true);
    const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
    expect(select.getAttribute('aria-label')).toBe('Search Options');
    expect(select.querySelectorAll('option').length).toBe(3);
    expect(select.querySelector('optgroup').getAttribute('label')).toBe('Older');
    expect((select.querySelectorAll('option')[2] as HTMLOptionElement).disabled).toBe(true);

    component.inputEl.nativeElement.value = 'query';
    select.value = '60';
    select.dispatchEvent(new Event('change'));

    expect(component.model).toEqual({ searchText: 'query', searchCategory: '60' });
    expect(onChange).toHaveBeenCalledWith({ searchText: 'query', searchCategory: '60' });
  });

  it('does not report a dropdown when no options are configured', () => {
    component.searchSettings.dropdown.options = [];
    expect(component.hasDropdown()).toBe(false);
    component.searchSettings.dropdown = undefined;
    expect(component.hasDropdown()).toBe(false);
  });

  it('builds the size and inverse classes from the search settings', () => {
    expect(component.getClass()).toBe('usa-search--big');

    component.searchSettings.size = 'small';
    expect(component.getClass()).toBe('usa-search--small');

    component.searchSettings.dropdown.inverse = true;
    expect(component.getClass()).toBe('usa-search--small sds-inverse');
  });

  it('renders the suffix search icon instead of the submit button when configured', () => {
    component.searchSettings.isSuffixSearchIcon = true;
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('button.usa-button'))).toBeNull();
    const suffix = fixture.debugElement.query(By.css('.postfix.right-0'));
    expect(suffix.nativeElement.getAttribute('aria-label')).toBe('search input');

    component.model = { searchText: 'abc' };
    vi.spyOn(component.submit, 'emit');
    suffix.triggerEventHandler('keyup.enter', { preventDefault: () => {} });
    expect(component.submit.emit).toHaveBeenCalledWith({ searchText: 'abc' });
  });

  it('Should trigger focus event', () => {
    const e = null;
    component.inputState.initial.visible = true;
    component.focusChange();
    fixture.detectChanges();
    expect(component.inputEl.nativeElement.style.display).toBe('');
    expect(component.inputEl.nativeElement.style.position).toBe('');
    expect(component.inputEl.nativeElement.style.left).toBe('');
    expect(component.inputEl.nativeElement.style.width).toBe('');
    expect(component.inputState.visible).toBeTruthy();
  });
});
