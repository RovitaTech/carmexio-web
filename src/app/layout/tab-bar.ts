import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../shared/ui/icon';

/** Phone navigation, mirroring the app's bottom bar. Hidden from 1024px. */
@Component({
  selector: 'cx-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav class="tabbar" i18n-aria-label="@@nav.mobile" aria-label="Navegación móvil">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <cx-icon name="home" /><span i18n="@@tab.home">Inicio</span>
      </a>
      <a routerLink="/autos" routerLinkActive="active">
        <cx-icon name="search" /><span i18n="@@tab.search">Buscar</span>
      </a>
      <a class="sell" routerLink="/vender" i18n-aria-label="@@tab.sell" aria-label="Vender">
        <cx-icon name="plus" [size]="26" />
      </a>
      <a routerLink="/mensajes" routerLinkActive="active">
        <cx-icon name="chat" /><span i18n="@@tab.chats">Chats</span>
      </a>
      <a routerLink="/cuenta" routerLinkActive="active">
        <cx-icon name="user" /><span i18n="@@tab.account">Cuenta</span>
      </a>
    </nav>
  `,
  styles: `
    .tabbar {
      position: fixed;
      inset: auto 0 0;
      z-index: 40;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: center;
      height: calc(68px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: var(--cx-surface);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -6px 24px rgb(0 0 0 / 10%);
    }
    @media (min-width: 1024px) {
      .tabbar {
        display: none;
      }
    }
    a {
      display: grid;
      justify-items: center;
      gap: 3px;
      color: var(--cx-text-2);
    }
    a span {
      font-size: 0.7rem;
      font-weight: 700;
    }
    a.active {
      color: var(--cx-primary-text);
    }
    .sell {
      place-items: center;
      width: 56px;
      height: 56px;
      margin: -30px auto 0;
      border: 4px solid var(--cx-surface);
      border-radius: 50%;
      background: var(--cx-gradient-primary);
      color: var(--cx-on-dark);
      box-shadow: 0 8px 18px rgb(0 133 254 / 40%);
    }
  `,
})
export class TabBar {}
