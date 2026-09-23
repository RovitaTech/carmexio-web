import { TestBed } from '@angular/core/testing';
import { BodyDiagram } from './body-diagram';

describe('BodyDiagram', () => {
  it('draws 15 panels, shows codes and emits the tapped panel', async () => {
    const fixture = TestBed.createComponent(BodyDiagram);
    fixture.componentRef.setInput('defects', [
      { panel: 'hood', code: 'A2' },
      { panel: 'roof', code: '•' },
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('g.panel')).toHaveLength(15);
    expect(el.textContent).toContain('A2');

    let tapped: string | undefined;
    fixture.componentInstance.panelSelected.subscribe((p) => (tapped = p));
    (el.querySelector('g.panel[aria-label^="Cofre"]') as SVGElement).dispatchEvent(
      new Event('click'),
    );
    expect(tapped).toBe('hood');
  });

  it('hides minor marks when showMinor is off', async () => {
    const fixture = TestBed.createComponent(BodyDiagram);
    fixture.componentRef.setInput('defects', [{ panel: 'roof', code: '•' }]);
    fixture.componentRef.setInput('showMinor', false);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('text')).toBeNull();
  });
});
