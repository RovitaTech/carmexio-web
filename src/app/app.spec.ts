import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { DummyDb } from './data/dummy/dummy-db';
import { provideDummyData } from './data/providers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideDummyData(new DummyDb(0))],
    }).compileComponents();
  });

  it('renders the shell with navigation and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header nav')?.textContent).toContain('Vender');
    expect(el.querySelector('footer')?.textContent).toContain('Carmexio');
    expect(el.querySelector('.tabbar')).toBeTruthy();
  });
});
