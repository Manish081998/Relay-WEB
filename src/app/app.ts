import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { UiStore } from './store/ui/ui.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast
      position="top-right"
      [life]="5000"
      [breakpoints]="{ '640px': { width: '100%', right: '0', left: '0' } }"
      styleClass="relay-toast"
    />
    <router-outlet />

    @if (uiStore.isLoading()) {
      <div class="loading-overlay" role="status" aria-label="Loading">
        <div class="spinner"></div>
      </div>
    }
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly uiStore = inject(UiStore);
}
