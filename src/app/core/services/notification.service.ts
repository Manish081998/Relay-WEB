import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly msg = inject(MessageService);

  success(message: string, title = 'Success'): void {
    this.msg.add({ severity: 'success', summary: title, detail: message, life: 4000, closable: true });
  }

  error(message: string, title = 'Error'): void {
    this.msg.add({ severity: 'error', summary: title, detail: message, life: 6000, closable: true });
  }

  warning(message: string, title = 'Warning'): void {
    this.msg.add({ severity: 'warn', summary: title, detail: message, life: 5000, closable: true });
  }

  info(message: string, title = 'Info'): void {
    this.msg.add({ severity: 'info', summary: title, detail: message, life: 4000, closable: true });
  }

  /** Dismisses all active toasts. */
  clear(): void {
    this.msg.clear();
  }
}
