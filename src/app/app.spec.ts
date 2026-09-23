import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { provideDummyData } from './data/providers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideDummyData({ latencyMs: 0 })],
    }).compileComponents();
  });

  it('renders the public shell: header, footer and tab bar', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header nav')?.textContent).toContain('Comprar');
    expect(el.querySelector('header .cta')?.textContent).toContain('Vende tu auto');
    expect(el.querySelector('footer')?.textContent).toContain('Carmexio');
    expect(el.querySelector('.tabbar')).toBeTruthy();
  });

  it('renders /admin without the public shell', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/admin/entrar');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('cx-site-header')).toBeNull();
    expect(el.textContent).toContain('Panel de administración');
  });
});
