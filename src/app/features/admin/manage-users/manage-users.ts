import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { firstValueFrom } from 'rxjs';

import { NotificationService } from 'src/app/core/services/notification.service';
import { BrandDto, DocumentumUserDto } from '../../documentum/models/documentum-user.model';
import { invalidateCache } from 'src/app/core/interceptors/cache.interceptor';
import { NOTIFICATION_MESSAGES as NM } from 'src/app/core/constants/notification-messages';
import { ManageUserService } from '../services/manage-user-service';
import { AdUserDto, CreateUserRequest } from '../models/ad-user.model';
import { BrandQueueMappingDto, QueueUserMappingDto, RoleDto } from '../models/brand-mapping.model';
import { InitialsPipe } from 'src/app/shared/pipes/initials.pipe';
import { AuthStore } from 'src/app/core/auth/auth.store';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    Select,
    TableModule,
    InitialsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.scss',
})
export class ManageUsers implements OnInit {
  private readonly usersService = inject(ManageUserService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authStore = inject(AuthStore);

  readonly users = signal<DocumentumUserDto[]>([]);
  readonly brands = signal<BrandDto[]>([]);
  readonly queues = signal<BrandQueueMappingDto[]>([]);
  readonly userQueueMappings = signal<QueueUserMappingDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly globalIdValue = signal('');
  readonly searchedUser = signal<AdUserDto | null>(null);
  readonly searching = signal(false);
  readonly saveAttempted = signal(false);

  private readonly _brandOverride = signal<number | null>(null);
  private readonly _queueOverride = signal<number | null>(null);
  private readonly _roleOverride = signal<number | null>(null);

  readonly selectedBrandId = computed<number | null>(() => this._brandOverride());
  readonly selectedQueueId = computed<number | null>(() => this._queueOverride());
  readonly selectedRoleId = computed<number | null>(() => this._roleOverride());

  readonly filteredQueues = computed<BrandQueueMappingDto[]>(() => {
    const brandId = this.selectedBrandId();
    if (!brandId) return [];
    return this.queues().filter(q => q.brandId === brandId);
  });

  readonly canSave = computed(
    () =>
      this.selectedBrandId() !== null &&
      this.selectedQueueId() !== null &&
      this.selectedRoleId() !== null,
  );

  ngOnInit(): void {
    this.loadBrandAndQueuesAndMapping();
  }

  onGlobalIdChange(value: string): void {
    this.globalIdValue.set(value);
    this.searchedUser.set(null);
    this.saveAttempted.set(false);
  }

  async onSearch(): Promise<void> {
    this.searchedUser.set(null);
    this.saveAttempted.set(false);
    this._brandOverride.set(null);
    this._queueOverride.set(null);
    this._roleOverride.set(null);
    this.searching.set(true);
    try {
      const res = await firstValueFrom(this.usersService.GetUserByGlobalId(this.globalIdValue()));
      this.searchedUser.set(res);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.notify.warning(
          `No Active Directory account was found for Global ID "${this.globalIdValue()}". Please verify the ID and try again.`,
          'User Not Found',
        );
      } else {
        this.notify.error(NM.INTRANET.USER.LOAD_FAILED, 'Intranet');
      }
    } finally {
      this.searching.set(false);
    }
  }

  onSaveUser(): void {
    this.saveAttempted.set(true);
    if (!this.canSave()) return;

    const user = this.searchedUser();
    if (!user) return;

    const req: CreateUserRequest = {
      globalId: this.globalIdValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      brandId: this.selectedBrandId(),
      queueId: this.selectedQueueId(),
      roleId: this.selectedRoleId(),
      createdBy: this.authStore.currentUser()?.globalId ?? '',
    };

    this.saving.set(true);
    this.usersService
      .createUser(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notify.success(NM.INTRANET.USER.CREATE_SUCCESS, 'Intranet');
          this.searchedUser.set(null);
          this.globalIdValue.set('');
          this.saveAttempted.set(false);
          this._brandOverride.set(null);
          this._queueOverride.set(null);
          this._roleOverride.set(null);
          invalidateCache();
          this.loadBrandAndQueuesAndMapping();
        },
        error: () => {
          this.saving.set(false);
          this.notify.error(NM.INTRANET.USER.CREATE_FAILED, 'Intranet');
        },
      });
  }

  onBrandChange(id: number | null): void {
    this._brandOverride.set(id ?? null);
    this._queueOverride.set(null);
  }

  onQueueChange(id: number | null): void {
    this._queueOverride.set(id ?? null);
  }

  onRoleChange(id: number | null): void {
    this._roleOverride.set(id ?? null);
  }

  private async loadBrandAndQueuesAndMapping(): Promise<void> {
    try {
      const data = await firstValueFrom(this.usersService.GetBrandAndQueuesAndMapping());
      this.brands.set(data.brands ?? []);
      this.queues.set(data.brandQueueMappings ?? []);
      this.userQueueMappings.set(data.userQueueMappings ?? []);
      this.roles.set(data.roles ?? []);
    } catch {
      this.notify.error(NM.GENERAL.LOADING_FAILED, 'Intranet');
    }
  }

}
