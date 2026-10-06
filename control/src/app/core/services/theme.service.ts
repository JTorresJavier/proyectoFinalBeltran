import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'storehub-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly isDark = signal(this.readPreference());

  constructor() {
    this.applyTheme(this.isDark());
    this.document.defaultView?.addEventListener('storage', (event) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

      const dark = event.newValue === 'dark';
      this.isDark.set(dark);
      this.applyTheme(dark);
    });
  }

  toggle(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    this.applyTheme(dark);

    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee el almacenamiento local.
    }
  }

  private readPreference(): boolean {
    try {
      return this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  }

  private applyTheme(dark: boolean): void {
    this.document.documentElement.classList.toggle('theme-dark', dark);
    this.document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    this.document.body?.classList.toggle('theme-dark', dark);
  }
}
