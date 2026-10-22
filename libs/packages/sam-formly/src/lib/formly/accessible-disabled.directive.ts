import {
  AfterViewChecked,
  Directive,
  ElementRef,
  HostListener,
  Inject,
  InjectionToken,
  Input,
  Optional,
  Renderer2,
} from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

/**
 * Default for whether disabled formly fields use the accessible disabled pattern
 * (`aria-disabled="true"`, kept in the Tab order, edits blocked) instead of the native
 * `disabled` attribute, which removes the field from the Tab order so screen readers never
 * announce it. Not provided by default, so behavior outside a stepper is unchanged;
 * `sds-step` provides `true`. A field may override either way with `props.accessibleDisabled`.
 */
export const SDS_ACCESSIBLE_DISABLED = new InjectionToken<boolean>('SDS_ACCESSIBLE_DISABLED');

const CHECKABLE_INPUT_TYPES = ['checkbox', 'radio'];

/**
 * Applied to the native control of a formly field. When the field is disabled and the
 * accessible pattern is enabled, the control is announced as disabled (`aria-disabled`),
 * stays focusable (`tabindex="0"`), and rejects user edits. The `FormControl` itself stays
 * disabled, so the value is still excluded from the form value on submit.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Match the `sds` prefix used by the other formly directives.
  selector: '[sdsAccessibleDisabled]',
  standalone: false,
})
export class SdsAccessibleDisabledDirective implements AfterViewChecked {
  @Input('sdsAccessibleDisabled') field: FormlyFieldConfig;

  private applied = false;
  private ownsTabindex = false;
  private ownsReadonly = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2,
    @Optional() @Inject(SDS_ACCESSIBLE_DISABLED) private defaultEnabled: boolean | null,
  ) {}

  get enabled(): boolean {
    return !!(this.field?.props?.accessibleDisabled ?? this.defaultEnabled);
  }

  get fieldDisabled(): boolean {
    return !!(this.field?.props?.disabled || this.field?.formControl?.disabled);
  }

  get isCheckable(): boolean {
    return CHECKABLE_INPUT_TYPES.includes(this.el.nativeElement.type);
  }

  /**
   * Runs after the reactive forms directive and `formlyAttributes` have had their turn,
   * so a native `disabled` they set can be swapped for the accessible attributes.
   */
  ngAfterViewChecked() {
    const el = this.el.nativeElement;
    if (this.enabled && this.fieldDisabled) {
      if (el.disabled) {
        this.renderer.removeAttribute(el, 'disabled');
      }
      if (!this.applied) {
        this.applied = true;
        this.renderer.setAttribute(el, 'aria-disabled', 'true');
        this.ownsTabindex = !el.hasAttribute('tabindex');
        if (this.ownsTabindex) {
          this.renderer.setAttribute(el, 'tabindex', '0');
        }
        this.ownsReadonly = !this.isCheckable && !el.readOnly;
      }
      if (this.ownsReadonly && !el.readOnly) {
        this.renderer.setAttribute(el, 'readonly', 'readonly');
      }
    } else if (this.applied) {
      this.applied = false;
      this.renderer.removeAttribute(el, 'aria-disabled');
      if (this.ownsTabindex) {
        this.renderer.removeAttribute(el, 'tabindex');
      }
      if (this.ownsReadonly) {
        this.renderer.removeAttribute(el, 'readonly');
      }
      if (this.fieldDisabled) {
        this.renderer.setAttribute(el, 'disabled', 'disabled');
      }
    }
  }

  @HostListener('beforeinput', ['$event'])
  @HostListener('paste', ['$event'])
  @HostListener('cut', ['$event'])
  @HostListener('drop', ['$event'])
  onEditAttempt(event: Event) {
    if (this.applied) {
      event.preventDefault();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.applied && this.isCheckable) {
      event.preventDefault();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.applied && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
    }
  }
}
