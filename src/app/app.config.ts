import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { AppTitleStrategy } from './core/title-strategy';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { ENVIRONMENT } from './core/tokens/environment.token';
import { environment } from '../environments/environment';

/** Custom preset: Aura dark with project's purple accent (#a78bfa). */
const RelayPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loadingInterceptor, // 1. show/hide global loader
        authInterceptor,    // 2. attach token
        cacheInterceptor,   // 3. serve/store cached GET responses
        errorInterceptor,   // 4. handle HTTP errors globally
      ]),
    ),
    MessageService,
    providePrimeNG({
      theme: {
        preset: RelayPreset,
        options: {
          darkModeSelector: 'html',
          cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, app-styles' },
        },
      },
    }),
    { provide: ENVIRONMENT, useValue: environment },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
