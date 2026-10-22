import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdsTopBannerComponent } from './top-banner.component';

describe('SdsTopBannerComponent', () => {
  let component: SdsTopBannerComponent;
  let fixture: ComponentFixture<SdsTopBannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SdsTopBannerComponent],
      imports: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdsTopBannerComponent);
    component = fixture.componentInstance;
  });

  function toggleButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.usa-banner__button')).nativeElement;
  }

  function content(): HTMLElement {
    return fixture.debugElement.query(By.css('#gov-banner')).nativeElement;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders collapsed by default with the accordion button wired to the content region', () => {
    fixture.detectChanges();

    expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
    expect(toggleButton().getAttribute('aria-controls')).toBe('gov-banner');
    expect(content().hidden).toBe(true);
    expect(fixture.nativeElement.querySelector('.usa-banner__header').classList).not.toContain(
      'sam-banner__header--expanded',
    );
  });

  it('expands and collapses the details when the button is clicked', () => {
    fixture.detectChanges();

    toggleButton().click();
    fixture.detectChanges();
    expect(component.showDetail).toBe(true);
    expect(toggleButton().getAttribute('aria-expanded')).toBe('true');
    expect(content().hidden).toBe(false);
    expect(fixture.nativeElement.querySelector('.usa-banner__header').classList).toContain(
      'sam-banner__header--expanded',
    );

    toggleButton().click();
    fixture.detectChanges();
    expect(component.showDetail).toBe(false);
    expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
    expect(content().hidden).toBe(true);
  });

  it('closes the details when the button loses focus while expanded', () => {
    fixture.detectChanges();
    toggleButton().click();
    fixture.detectChanges();
    expect(component.showDetail).toBe(true);

    toggleButton().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.showDetail).toBe(false);
    expect(content().hidden).toBe(true);
  });

  it('leaves the banner collapsed when the button blurs while already collapsed', () => {
    fixture.detectChanges();

    toggleButton().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.showDetail).toBe(false);
  });

  it('renders the description text in the header', () => {
    component.description = 'Official site description';
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelector('.usa-banner__header-description em');
    expect(description.textContent).toBe('Official site description');
  });

  it('uses a custom flag image path when one is provided', () => {
    component.flagPath = 'custom/flag.png';
    fixture.detectChanges();

    const flag: HTMLImageElement = fixture.nativeElement.querySelector('.usa-banner__header-flag');
    expect(flag.getAttribute('src')).toBe('custom/flag.png');
    expect(flag.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to the default flag image when flagPath is cleared', () => {
    component.flagPath = '';
    fixture.detectChanges();

    expect(component.flagPath).toBe('assets/uswds/img/us_flag_small.png');
    const flag: HTMLImageElement = fixture.nativeElement.querySelector('.usa-banner__header-flag');
    expect(flag.getAttribute('src')).toBe('assets/uswds/img/us_flag_small.png');
  });
});
