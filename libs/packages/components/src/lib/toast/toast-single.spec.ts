import { Component, Input } from '@angular/core';

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
import { SdsToastComponent } from './toast-single.component';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ToastPackage, ToastRef, ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('Component: SdsToastComponent', () => {
  let component: SdsToastComponent;
  let fixture: ComponentFixture<SdsToastComponent>;
  let toastPackageMock: {
    toastId: number;
    toastType: string;
    afterActivate: ReturnType<typeof vi.fn>;
    triggerAction: ReturnType<typeof vi.fn>;
    triggerTap: ReturnType<typeof vi.fn>;
    config: { toastClass: string; enableHtml?: boolean; closeButton?: boolean };
    message: string;
    title: string;
    toastRef: ToastRef<unknown>;
  };

  beforeEach(() => {
    initMockProviders();
    TestBed.configureTestingModule({
      declarations: [SdsToastComponent, UsaIconStubComponent],
      imports: [ToastrModule.forRoot(), BrowserAnimationsModule],
      providers: [{ provide: ToastPackage, useValue: toastPackageMock }],
    });

    fixture = TestBed.createComponent(SdsToastComponent);
    // /fixture.componentInstance.activateToast();
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });

  it('should get right icon class via method', () => {
    expect(component.getIcon(component.toastPackage.toastType)).toEqual('check2-circle');
  });

  it('should have the right message in the DOM', () => {
    const textWrapper = fixture.debugElement.query(By.css('.sds-toast__content__text')).nativeElement;
    expect(textWrapper.innerHTML).toContain('test message');
  });

  it('announces the toast type to screen readers and marks the content as an alert', () => {
    const content = fixture.debugElement.query(By.css('.sds-toast__content')).nativeElement;
    expect(content.getAttribute('role')).toBe('alert');
    expect(content.getAttribute('aria-live')).toBe('assertive');
    expect(fixture.debugElement.query(By.css('.usa-sr-only')).nativeElement.textContent.trim()).toBe('Success');
  });

  const toastTypeMappings: [string, string, string][] = [
    ['sds-toast--success', 'check2-circle', 'Success'],
    ['sds-toast--info', 'info-circle', 'Info'],
    ['sds-toast--warning', 'exclamation-triangle', 'Warning'],
    ['sds-toast--error', 'slash-circle', 'Error'],
    ['sds-toast--unknown', 'info-circle', 'Info'],
  ];
  for (const [toastType, icon, srText] of toastTypeMappings) {
    it(`maps toast type ${toastType} to icon ${icon} and screen reader text ${srText}`, () => {
      expect(component.getIcon(toastType)).toBe(icon);
      expect(component.getToastSr(toastType)).toBe(srText);
    });
  }

  it('triggers the toast action and stops the event from propagating', () => {
    const triggerAction = vi.fn();
    component.toastPackage.triggerAction = triggerAction;
    const event = new Event('click', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    const result = component.action(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(triggerAction).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it('renders the message as HTML when enableHtml is on', () => {
    component.options.enableHtml = true;
    component.message = '<strong>bold message</strong>';
    fixture.detectChanges();

    const textWrapper = fixture.debugElement.query(By.css('.sds-toast__content__text')).nativeElement;
    expect(textWrapper.querySelector('strong').textContent).toBe('bold message');
  });

  it('shows a close control only when closeButton is enabled and removes the toast on click', () => {
    expect(fixture.debugElement.query(By.css('.sds-toast__content__close'))).toBeNull();

    component.options.closeButton = true;
    fixture.detectChanges();
    const closeEl = fixture.debugElement.query(By.css('.sds-toast__content__close'));
    expect(closeEl).not.toBeNull();

    const remove = vi.spyOn(component, 'remove').mockImplementation(() => {});
    closeEl.nativeElement.click();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  function initMockProviders(): void {
    toastPackageMock = {
      toastId: 1,
      toastType: 'sds-toast--success',
      afterActivate: vi.fn(),
      triggerAction: vi.fn(),
      triggerTap: vi.fn(),
      config: { toastClass: 'custom-toast' },
      message: 'test message',
      title: 'test title',
      toastRef: new ToastRef(null),
    };
  }
});
