import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SdsSearchResultListComponent } from './search-result-list.component';

import { CommonModule } from '@angular/common';
import { Component, DebugElement, Input } from '@angular/core';
import { SpyLocation } from '@angular/common/testing';
import { Location } from '@angular/common';
import { SdsSearchResultListModule } from './search-result-list.module';
import { IconModule, StackedIconModule } from '@gsa-sam/ngx-uswds-icons';
import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';

@Component({ selector: 'usa-icon', template: '', standalone: false })
class UsaIconStubComponent {
  @Input() icon: unknown = '';
  @Input() size = 'lg';
}

@Component({ selector: 'usa-stacked-icon', template: '<ng-content></ng-content>', standalone: false })
class UsaStackedIconStubComponent {
  @Input() size = 'lg';
}
describe('SdsSearchResultListComponent', () => {
  let component: SdsSearchResultListComponent;
  let fixture: ComponentFixture<SdsSearchResultListComponent>;
  let el: DebugElement;
  let location: SpyLocation;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SdsSearchResultListModule, CommonModule],
      providers: [{ provide: Location, useClass: SpyLocation }],
    });
    TestBed.overrideModule(SdsSearchResultListModule, {
      remove: { imports: [IconModule, StackedIconModule, NgxBootstrapIconsModule] },
      add: {
        declarations: [UsaIconStubComponent, UsaStackedIconStubComponent],
        exports: [UsaIconStubComponent, UsaStackedIconStubComponent],
      },
    });
    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdsSearchResultListComponent);
    component = fixture.componentInstance;
    location = TestBed.inject(Location) as unknown as SpyLocation;
    el = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should display list of items', waitForAsync(() => {
    component.model = {
      results: [
        { title: 'First', id: 1 },
        { title: 'Second', id: 2 },
        { title: 'Third', id: 3 },
        { title: 'Fourth', id: 4 },
        { title: 'Fifth', id: 5 },
      ],
    };
    fixture.detectChanges();
    const testResult = component.updateModel.results[0];
    const testResults = component.updateModel.results;
    expect(testResult).toBeTruthy();
    expect(testResults.length).toBeGreaterThan(0);
    expect(testResult.title).toEqual('First');
  }));

  it('should convert model array to searchModel object', waitForAsync(() => {
    const items = [
      { title: 'First', id: 1 },
      { title: 'Second', id: 2 },
      { title: 'Third', id: 3 },
      { title: 'Fourth', id: 4 },
      { title: 'Fifth', id: 5, hasNewerData: true },
    ];
    component.model = items;
    fixture.detectChanges();

    expect(component.updateModel.results.length).toBe(items.length);
  }));

  it('should render the default initial card with an h2 title and plain-language copy', () => {
    component.isDefaultModel = true;
    component.model = [];
    fixture.detectChanges();
    const card = el.nativeElement.querySelector('.sds-card--initial');
    expect(card).toBeTruthy();
    expect(card.querySelector('h1')).toBeNull();
    expect(card.querySelector('h2.sds-card--initial__title').textContent.trim()).toBe('Start your search');
    expect(card.querySelector('.sds-card--initial__text').textContent).toContain('Choose your filters');
    expect(card.querySelector('.sds-card--initial__icon').getAttribute('aria-hidden')).toBe('true');
    expect(card.querySelector('.sds-card--initial__buttons')).toBeNull();
  });

  it('should render an initial message through the initial card with its buttons and classes', () => {
    const action = vi.fn();
    component.model = {
      results: [],
      metadata: {
        messages: [
          {
            type: 'initial',
            title: 'Pick a filter',
            message: 'Then run the search.',
            classes: 'custom-class',
            buttons: [{ id: 'go', text: 'Run search', classes: 'usa-button--secondary', action, ariaLabel: 'Run' }],
          },
        ],
      },
    };
    fixture.detectChanges();
    const card = el.nativeElement.querySelector('.sds-card--initial');
    expect(card).toBeTruthy();
    expect(card.classList).toContain('custom-class');
    expect(card.querySelector('.sds-card--vertical')).toBeNull();
    expect(card.querySelector('h2').textContent.trim()).toBe('Pick a filter');
    expect(card.querySelector('.sds-card--initial__text').textContent).toContain('Then run the search.');
    const button = card.querySelector('button');
    expect(button.textContent.trim()).toBe('Run search');
    expect(button.classList).toContain('usa-button--secondary');
    expect(button.getAttribute('aria-label')).toBe('Run');
    button.click();
    expect(action).toHaveBeenCalled();
  });

  it('should keep the standard card for non-initial messages', () => {
    component.model = {
      results: [],
      metadata: { messages: [{ type: 'error', title: 'Something failed', message: 'Try again.', buttons: [] }] },
    };
    fixture.detectChanges();
    expect(el.nativeElement.querySelector('.sds-card--initial')).toBeNull();
    const card = el.nativeElement.querySelector('.sds-card.sds-card--vertical');
    expect(card).toBeTruthy();
    expect(card.querySelector('h1.sds-card__title').textContent.trim()).toBe('Something failed');
  });

  it('should go back to previous page on go back button click', () => {
    component.model = [];
    vi.spyOn(location, 'back');
    component.goBack();
    expect(location.back).toHaveBeenCalled();
  });
});
