import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DocumentumUsersService } from '../../services/documentum-users.service';
import { BrandDto, DocumentumUserDto, UpdateDocumentumUserRequest } from '../../models/documentum-user.model';
import { EditUserDialogComponent } from '../../components/edit-user-dialog/edit-user-dialog.component';
import { PrimeTableComponent, PrimeCellDefDirective, PrimeTableColumn } from '../../../../shared';
import { invalidateCache } from '../../../../core/interceptors/cache.interceptor';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-documentum-users',
  standalone: true,
  imports: [DatePipe, PrimeTableComponent, PrimeCellDefDirective, EditUserDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class DocumentumUsersComponent implements OnInit {
  private readonly usersService = inject(DocumentumUsersService);
  private readonly notify       = inject(NotificationService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly columns: PrimeTableColumn[] = [
    { field: 'firstName',   header: 'Full Name',    width: '155px' },
    { field: 'emailId',     header: 'Email',        width: '180px', cellClass: 'pt-cell-trunc' },
    { field: 'brandName',   header: 'Brand',        width: '110px' },
    { field: 'globalId',    header: 'Global ID',    width: '120px', cellClass: 'pt-cell-mono'  },
    { field: 'isActive',    header: 'Status',       width: '85px'  },
    { field: 'createdBy',   header: 'Created By',   width: '130px', cellClass: 'pt-cell-trunc' },
    { field: 'createdDate', header: 'Created Date', width: '110px' },
    { field: 'actions',     header: 'Actions',      width: '72px',  sortable: false, headerAlign: 'center', cellClass: 'pt-col-actions' },
  ];

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
