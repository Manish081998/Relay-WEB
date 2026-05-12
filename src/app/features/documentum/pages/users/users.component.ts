import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DocumentumUsersService } from '../../services/documentum-users.service';
import { BrandDto, DocumentumUserDto, UpdateDocumentumUserRequest } from '../../models/documentum-user.model';
import { EditUserDialogComponent } from '../../components/edit-user-dialog/edit-user-dialog.component';
import { invalidateCache } from '../../../../core/interceptors/cache.interceptor';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-documentum-users',
  standalone: true,
  imports: [DatePipe, TableModule, EditUserDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class DocumentumUsersComponent implements OnInit {
  private readonly usersService = inject(DocumentumUsersService);
  private readonly notify       = inject(NotificationService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly users       = signal<DocumentumUserDto[]>([]);
  readonly brands      = signal<BrandDto[]>([]);
  readonly loading     = signal(false);
  readonly saving      = signal(false);
  readonly editVisible = signal(false);
  readonly editingUser = signal<DocumentumUserDto | null>(null);

  ngOnInit(): void {
    this.loadUsers();
    this.loadBrands();
  }

  openEdit(user: DocumentumUserDto): void {
    this.editingUser.set(user);
    this.editVisible.set(true);
  }

  onSave(req: UpdateDocumentumUserRequest): void {
    this.saving.set(true);
    this.usersService.update(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editVisible.set(false);
          this.notify.success(NM.DOCUMENTUM.USER.UPDATE_SUCCESS, 'Documentum');
          invalidateCache();
          this.loadUsers();
        },
        error: () => {
          this.saving.set(false);
          this.notify.error(NM.DOCUMENTUM.USER.UPDATE_FAILED, 'Documentum');
        },
      });
  }

  private loadBrands(): void {
    this.usersService.getAllBrands()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: data => this.brands.set(data ?? []) });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.usersService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.users.set(data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error(NM.DOCUMENTUM.USER.LOAD_FAILED, 'Documentum');
        },
      });
  }
}
