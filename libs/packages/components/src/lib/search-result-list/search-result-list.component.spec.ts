import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SdsSearchResultListComponent } from './search-result-list.component';

import { CommonModule } from '@angular/common';
import { Component, DebugElement, Input, TemplateRef, ViewChild } from '@angular/core';
import { SpyLocation } from '@angular/common/testing';
import { Location } from '@angular/common';

@Component({ selector: 'usa-icon', template: '', standalone: false })
class UsaIconStubComponent {
  @Input() icon: unknown;
  @Input() size = 'lg';
}

@Component({ selector: 'usa-stacked-icon', template: '<ng-content></ng-content>', standalone: false })
class UsaStackedIconStubComponent {
  @Input() size: string;
}

@Component({
  template: `<ng-template #messageTemplate><span class="custom-message-template">Custom message</span></ng-template>`,
  standalone: false,
})
class MessageTemplateHost {
  @ViewChild('messageTemplate', { static: true }) messageTemplate: TemplateRef<any>;
}

describe('SdsSearchResultListComponent', () => {
  let component: SdsSearchResultListComponent;
  let fixture: ComponentFixture<SdsSearchResultListComponent>;
  let el: DebugElement;
  let location: SpyLocation;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SdsSearchResultListComponent,
        MessageTemplateHost,
        UsaIconStubComponent,
        UsaStackedIconStubComponent,
      ],
      imports: [CommonModule],
      providers: [{ provide: Location, useClass: SpyLocation }],
    }).compileComponents();
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

  it('renders message cards when metadata.messages is an array of messages', () => {
    const action = vi.fn();
    component.model = {
      results: [],
      metadata: {
        messages: [
          {
            type: 'error',
            title: 'Something went wrong',
            message: 'Please <em>retry</em>',
            classes: 'custom-msg',
            buttons: [{ text: 'Retry', ariaLabel: 'Retry search', action }],
          },
          { type: 'loading', title: '', message: '', classes: '', buttons: [] },
        ],
      },
    };
    fixture.detectChanges();

    expect(component.isTemplate()).toBe(true);
    const cards = fixture.nativeElement.querySelectorAll('.sds-card');
    expect(cards.length).toBe(2);
    expect(cards[0].classList).toContain('custom-msg');
    expect(cards[0].classList).toContain('sds-card--vertical');
    expect(cards[0].querySelector('.sds-card__title').textContent).toBe('Something went wrong');
    expect(cards[0].querySelector('p em').textContent).toBe('retry');
    expect(cards[1].classList).not.toContain('sds-card--vertical');
    expect(cards[1].querySelector('.sds-load')).not.toBeNull();

    const retryButton: HTMLButtonElement = cards[0].querySelector('button');
    expect(retryButton.getAttribute('aria-label')).toBe('Retry search');
    expect(retryButton.classList).toContain('usa-button--outline');
    retryButton.click();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('reports a non-template model when metadata.messages is a TemplateRef', () => {
    const templateFixture = TestBed.createComponent(MessageTemplateHost);
    templateFixture.detectChanges();

    component.model = { results: [], metadata: { messages: templateFixture.componentInstance.messageTemplate } };
    fixture.detectChanges();

    expect(component.isTemplate()).toBe(false);
    expect(fixture.nativeElement.querySelector('.custom-message-template').textContent).toBe('Custom message');
  });

  it('returns undefined from isTemplate when the model carries no metadata', () => {
    component.model = [];
    expect(component.isTemplate()).toBeUndefined();
  });

  it('shows the no-results card with a working go back button when there are no results', () => {
    component.model = [];
    vi.spyOn(location, 'back');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sds-card__title').textContent).toBe('No matches found');
    fixture.nativeElement.querySelector('.margin-top-3 button').click();
    expect(location.back).toHaveBeenCalled();
  });

  it('shows the select criteria card instead when isDefaultModel is set', () => {
    component.model = [];
    component.isDefaultModel = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sds-card__title').textContent).toBe('Select Criteria');
  });

  it('should go back to previous page on go back button click', () => {
    component.model = [];
    vi.spyOn(location, 'back');
    component.goBack();
    expect(location.back).toHaveBeenCalled();
  });
});
