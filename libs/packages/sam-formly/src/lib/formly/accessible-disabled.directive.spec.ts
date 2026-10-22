import { Component, Input } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { SdsStepper } from '../formly-stepper/sds-stepper';
import { SdsStepperModule } from '../formly-stepper/sds-stepper.module';
import { SdsAccessibleDisabledDirective, SDS_ACCESSIBLE_DISABLED } from './accessible-disabled.directive';
import { FormlyFieldCheckboxComponent } from './types/checkbox';
import { FormlyFieldInputComponent } from './types/input';

@Component({
  selector: 'usa-icon',
  template: '<i class="bi bi-{{icon}}"></i>',
  standalone: false,
})
class UsaIconStubComponent {
  @Input() icon = '';
  @Input() size = 'lg';
}

@Component({
  selector: 'form-test',
  template: `
    <form [formGroup]="form">
      <formly-form [form]="form" [fields]="fields" [model]="model" [options]="options"></formly-form>
    </form>
  `,
  standalone: false,
})
class FormTestComponent {
  form = new UntypedFormGroup({});
  fields: FormlyFieldConfig[] = [];
  model: any = {};
  options = {};
}

@Component({
  selector: 'min-stepper',
  template: '<div [ngTemplateOutlet]="selectedStep ? selectedStep.content : null"></div>',
  providers: [{ provide: SdsStepper, useExisting: MinStepperComponent }],
  standalone: false,
})
class MinStepperComponent extends SdsStepper {}

@Component({
  selector: 'stepper-host',
  template: `
    <min-stepper [model]="model">
      <sds-step id="step1" text="Step 1" [fieldConfig]="fieldConfig"></sds-step>
    </min-stepper>
  `,
  standalone: false,
})
class StepperHostComponent {
  model: any = {};
  fieldConfig: FormlyFieldConfig = {
    key: 'step1',
    fieldGroup: [
      inputField(),
      checkboxField(),
      { ...inputField({ accessibleDisabled: false }), key: 'nativeDisabled' },
      { key: 'editable', type: 'input', props: { label: 'Editable' } },
    ],
  };
}

function inputField(props: Record<string, unknown> = {}): FormlyFieldConfig {
  return { key: 'name', type: 'input', defaultValue: 'Acme', props: { label: 'Name', disabled: true, ...props } };
}

function checkboxField(props: Record<string, unknown> = {}): FormlyFieldConfig {
  return { key: 'agree', type: 'checkbox', defaultValue: true, props: { label: 'Agree', disabled: true, ...props } };
}

function configure(providers: unknown[] = []) {
  TestBed.configureTestingModule({
    declarations: [
      FormTestComponent,
      UsaIconStubComponent,
      FormlyFieldInputComponent,
      FormlyFieldCheckboxComponent,
      SdsAccessibleDisabledDirective,
    ],
    imports: [
      NoopAnimationsModule,
      ReactiveFormsModule,
      FormlyModule.forRoot({
        types: [
          { name: 'input', component: FormlyFieldInputComponent },
          { name: 'checkbox', component: FormlyFieldCheckboxComponent },
        ],
      }),
    ],
    providers,
  });
}

function createForm(fields: FormlyFieldConfig[]): ComponentFixture<FormTestComponent> {
  const fixture = TestBed.createComponent(FormTestComponent);
  fixture.componentInstance.fields = fields;
  fixture.detectChanges();
  return fixture;
}

function query<T extends HTMLElement>(fixture: ComponentFixture<unknown>, selector: string): T {
  return fixture.nativeElement.querySelector(selector) as T;
}

describe('SdsAccessibleDisabledDirective', () => {
  describe('outside a stepper without opt-in', () => {
    beforeEach(() => configure());

    it('keeps the native disabled attribute (unchanged behavior)', () => {
      const fixture = createForm([inputField(), checkboxField()]);
      const input = query<HTMLInputElement>(fixture, 'input.usa-input');
      const checkbox = query<HTMLInputElement>(fixture, 'input[type="checkbox"]');

      expect(input.disabled).toBe(true);
      expect(input.getAttribute('aria-disabled')).toBeNull();
      expect(input.hasAttribute('readonly')).toBe(false);
      expect(checkbox.disabled).toBe(true);
      expect(checkbox.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('with props.accessibleDisabled on an input', () => {
    let fixture: ComponentFixture<FormTestComponent>;
    let input: HTMLInputElement;

    beforeEach(() => {
      configure();
      fixture = createForm([inputField({ accessibleDisabled: true })]);
      input = query<HTMLInputElement>(fixture, 'input.usa-input');
    });

    it('is announced as disabled and stays in the tab order', () => {
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBe('true');
      expect(input.getAttribute('tabindex')).toBe('0');
      expect(input.classList.contains('usa-input--disabled')).toBe(true);

      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('rejects edits while keeping the value readable', () => {
      expect(input.value).toBe('Acme');
      expect(input.readOnly).toBe(true);

      const beforeInput = new InputEvent('beforeinput', { cancelable: true, data: 'x' });
      expect(input.dispatchEvent(beforeInput)).toBe(false);
      expect(beforeInput.defaultPrevented).toBe(true);

      const paste = new Event('paste', { cancelable: true });
      expect(input.dispatchEvent(paste)).toBe(false);

      const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      expect(input.dispatchEvent(enter)).toBe(false);

      const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
      expect(input.dispatchEvent(tab)).toBe(true);
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        const caretMove = new KeyboardEvent('keydown', { key, cancelable: true });
        expect(input.dispatchEvent(caretMove), key).toBe(true);
      }

      expect(fixture.componentInstance.fields[0].formControl.value).toBe('Acme');
    });

    it('keeps the control disabled so the value is excluded from submission', () => {
      fixture = createForm([
        inputField({ accessibleDisabled: true }),
        { key: 'other', type: 'input', defaultValue: 'x' },
      ]);
      const control = fixture.componentInstance.fields[0].formControl;
      expect(control.disabled).toBe(true);
      expect(fixture.componentInstance.form.getRawValue()).toEqual({ name: 'Acme', other: 'x' });
      expect(fixture.componentInstance.form.value).toEqual({ other: 'x' });
    });

    it('restores a regular editable input when the field is enabled again', () => {
      fixture.componentInstance.fields[0].props.disabled = false;
      fixture.detectChanges();

      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBeNull();
      expect(input.hasAttribute('tabindex')).toBe(false);
      expect(input.readOnly).toBe(false);

      const beforeInput = new InputEvent('beforeinput', { cancelable: true, data: 'x' });
      expect(input.dispatchEvent(beforeInput)).toBe(true);

      fixture.componentInstance.fields[0].props.disabled = true;
      fixture.detectChanges();

      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBe('true');
      expect(input.readOnly).toBe(true);
    });

    it('replaces a negative tabindex while active and restores it afterwards', () => {
      fixture = createForm([inputField({ accessibleDisabled: true, tabindex: -1 })]);
      const input = query<HTMLInputElement>(fixture, 'input');
      expect(input.getAttribute('tabindex')).toBe('0');

      fixture.componentInstance.fields[0].props.disabled = false;
      fixture.detectChanges();
      expect(input.getAttribute('tabindex')).toBe('-1');
      expect(input.getAttribute('aria-disabled')).toBeNull();
    });

    it('blocks arrow keys and pointer changes on a range input, which ignores readonly', () => {
      fixture = createForm([inputField({ accessibleDisabled: true, inputType: 'range' })]);
      const input = query<HTMLInputElement>(fixture, 'input');
      expect(input.type).toBe('range');
      expect(input.readOnly).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBe('true');
      expect(input.getAttribute('tabindex')).toBe('0');

      for (const key of ['ArrowRight', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown']) {
        const keydown = new KeyboardEvent('keydown', { key, cancelable: true });
        input.dispatchEvent(keydown);
        expect(keydown.defaultPrevented, key).toBe(true);
      }
      const mousedown = new MouseEvent('mousedown', { cancelable: true });
      input.dispatchEvent(mousedown);
      expect(mousedown.defaultPrevented).toBe(true);

      const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
      input.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
    });

    it('falls back to the native disabled attribute when the pattern is switched off', () => {
      fixture.componentInstance.fields[0].props.accessibleDisabled = false;
      fixture.detectChanges();

      expect(input.disabled).toBe(true);
      expect(input.getAttribute('aria-disabled')).toBeNull();
      expect(input.readOnly).toBe(false);
    });
  });

  describe('with SDS_ACCESSIBLE_DISABLED provided', () => {
    beforeEach(() => configure([{ provide: SDS_ACCESSIBLE_DISABLED, useValue: true }]));

    it('keeps a disabled checkbox focusable, announced, and not toggleable', () => {
      const fixture = createForm([checkboxField()]);
      const checkbox = query<HTMLInputElement>(fixture, 'input[type="checkbox"]');

      expect(checkbox.disabled).toBe(false);
      expect(checkbox.getAttribute('aria-disabled')).toBe('true');
      expect(checkbox.getAttribute('tabindex')).toBe('0');
      expect(checkbox.hasAttribute('readonly')).toBe(false);
      expect(checkbox.checked).toBe(true);

      checkbox.focus();
      expect(document.activeElement).toBe(checkbox);

      checkbox.click();
      fixture.detectChanges();
      expect(checkbox.checked).toBe(true);
      expect(fixture.componentInstance.fields[0].formControl.value).toBe(true);

      const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      expect(checkbox.dispatchEvent(space)).toBe(false);
    });

    it('lets a field opt out with props.accessibleDisabled = false', () => {
      const fixture = createForm([inputField({ accessibleDisabled: false })]);
      const input = query<HTMLInputElement>(fixture, 'input.usa-input');

      expect(input.disabled).toBe(true);
      expect(input.getAttribute('aria-disabled')).toBeNull();
    });

    it('does nothing for enabled fields', () => {
      const fixture = createForm([{ ...inputField({ disabled: false }) }]);
      const input = query<HTMLInputElement>(fixture, 'input.usa-input');

      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBeNull();
      expect(input.hasAttribute('tabindex')).toBe(false);
      expect(input.readOnly).toBe(false);
    });
  });

  describe('inside sds-step', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [MinStepperComponent, StepperHostComponent],
        imports: [NoopAnimationsModule, RouterTestingModule, SdsStepperModule],
      });
    });

    it('defaults disabled fields to the accessible pattern', fakeAsync(() => {
      const fixture = TestBed.createComponent(StepperHostComponent);
      fixture.detectChanges();
      tick(20);
      fixture.detectChanges();

      const [input, nativeDisabled, editable] = Array.from(
        fixture.nativeElement.querySelectorAll('input.usa-input') as NodeListOf<HTMLInputElement>,
      );
      const checkbox = query<HTMLInputElement>(fixture, 'input[type="checkbox"]');

      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-disabled')).toBe('true');
      expect(input.getAttribute('tabindex')).toBe('0');
      expect(input.readOnly).toBe(true);

      expect(checkbox.disabled).toBe(false);
      expect(checkbox.getAttribute('aria-disabled')).toBe('true');

      expect(nativeDisabled.disabled).toBe(true);
      expect(nativeDisabled.getAttribute('aria-disabled')).toBeNull();

      expect(editable.disabled).toBe(false);
      expect(editable.getAttribute('aria-disabled')).toBeNull();
      expect(editable.readOnly).toBe(false);
    }));
  });
});
