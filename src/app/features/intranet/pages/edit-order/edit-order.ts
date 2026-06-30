import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concat } from 'rxjs';
import { switchMap, toArray } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AuthStore } from '../../../../core/auth/auth.store';
import { NotificationService } from '../../../../core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { EdgeOrdersService } from '../../services/edge-orders.service';
import { LineItem, LineItemFamily, OrderByGuidData, PlantCode, PlantCodeUpdateDto, ShipTerm } from '../../models/edge-orders.model';
import { getConfigByFamilyTag, HeaderCell, OrderTypeConfig } from '../../models/order-config.model';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, Select, Dialog, ConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-order.html',
  styleUrl: './edit-order.scss',
})
export class EditOrder implements OnInit {
  private readonly fb              = inject(FormBuilder);
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly cdr             = inject(ChangeDetectorRef);
  private readonly destroyRef      = inject(DestroyRef);
  private readonly authStore       = inject(AuthStore);
  private readonly edgeOrdersSvc   = inject(EdgeOrdersService);
  private readonly notify          = inject(NotificationService);

  readonly lineItemFamilies       = signal<LineItemFamily[]>([]);
  readonly isFastTrack            = signal(false);
  readonly marshalFileLabel       = signal('');
  readonly plantCodes             = signal<PlantCode[]>([]);
  readonly plantCodeOptions       = computed(() =>
    this.plantCodes().map(pc => ({ label: `${pc.code} - ${pc.description}`, value: pc.code })),
  );
  readonly plantCodePopupVisible  = signal(false);
  readonly plantCodeControl       = this.fb.control<string>('');

  private _popupLineItem: LineItem | null = null;
  private _orderData: OrderByGuidData | null = null;
  private _returnUrl = '/intranet/Edge-Orders-Search';

  private readonly _editedSections = signal<Set<string>>(new Set());
  private readonly _submitting      = signal(false);

  readonly editedSections    = this._editedSections.asReadonly();
  readonly isSubmitting      = this._submitting.asReadonly();
  readonly hasEdits          = computed(() => this._editedSections().size > 0);
  readonly showSubmitConfirm = signal(false);

  isEdited(section: string): boolean {
    return this.editedSections().has(section);
  }

  cfgFor(familyTag: string): OrderTypeConfig {
    return getConfigByFamilyTag(familyTag, this._orderData?.brand ?? '');
  }

  headersFor(cfg: OrderTypeConfig): HeaderCell[][] {
    return cfg.headerRows.length > 0
      ? cfg.headerRows
      : [cfg.columns.map((c) => ({ label: c.label }))];
  }

  toRecord(item: LineItem, cfg: OrderTypeConfig): Record<string, string> {
    const rec: Record<string, string> = {
      line:       item.line,
      qty:        item.quantity,
      model:      item.model,
      priceEach:  item.individualPrice,
      totalPrice: item.totalCost,
      tag:        item.tag        ?? '',
      comment:    item.comment    ?? '',
      multiplier: item.multiplier ?? '',
    };
    const ef = item.extraFields ?? {};
    for (const col of cfg.columns) {
      if (rec[col.key] !== undefined) continue;
      let val: string | null | undefined = ef[col.key];
      if (!val) {
        for (const tag of col.xmlTags) {
          val = ef[tag] ?? ef[tag.toLowerCase()] ?? ef[tag.toUpperCase()];
          if (val) break;
        }
      }
      rec[col.key] = val ?? '';
    }
    return rec;
  }

  cancelChanges(): void {
    this.router.navigate([this._returnUrl]);
  }

  openPlantCodePopup(item: LineItem): void {
    this._popupLineItem = item;
    this.plantCodeControl.setValue(item.plantCode ?? '');
    this.plantCodePopupVisible.set(true);
  }

  closePlantCodePopup(): void {
    this.plantCodePopupVisible.set(false);
    this._popupLineItem = null;
  }

  savePlantCode(): void {
    const data   = this._orderData;
    const item   = this._popupLineItem;
    const newCode = this.plantCodeControl.value;
    if (!data || !item || !newCode) return;

    const dto: PlantCodeUpdateDto = {
      lineNumber:       item.line,
      newPlantCode:     newCode,
      isSecondaryPlant: true,
    };

    const orderGuid = data.orderGuid;
    const po        = data.orderInfo.repPoNo;
    const userId    = this.authStore.currentUser()?.globalId ?? '';

    this.edgeOrdersSvc.updatePlantCode(orderGuid, po, userId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.notify.success(NM.INTRANET.EDGE_ORDER.PLANT_CODE_UPDATE_SUCCESS, 'Edge Orders');
            this.closePlantCodePopup();
          } else {
            this.notify.error(NM.INTRANET.EDGE_ORDER.PLANT_CODE_UPDATE_FAILED, 'Edge Orders');
          }
        },
        error: () => {
          this.notify.error(NM.INTRANET.EDGE_ORDER.PLANT_CODE_UPDATE_FAILED, 'Edge Orders');
        },
      });
  }

  submitChanges(): void {
    this.showSubmitConfirm.set(true);
  }

  onSubmitConfirmed(): void {
    this.showSubmitConfirm.set(false);
    const data = this._orderData;
    if (!data || this._submitting()) return;

    const sections  = [...this._editedSections()];
    const orderGuid = data.orderGuid;
    const fileName  = data.fileName;
    const po        = data.orderInfo.repPoNo;
    const brand     = data.brand ?? '';
    const globalId  = this.authStore.currentUser()?.globalId ?? '';

    this._submitting.set(true);

    const calls = sections.map(sectionName => {
      const apiName = EditOrder.SECTION_API_NAMES[sectionName] ?? sectionName;
      return this.edgeOrdersSvc.updateSection(
        orderGuid,
        apiName,
        globalId,
        fileName,
        po,
        brand,
        { section: apiName, fields: this.sectionFields(sectionName) },
      );
    });

    concat(...calls)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        toArray(),
        switchMap(() => this.edgeOrdersSvc.submitOrder(orderGuid, po, brand, globalId)),
      )
      .subscribe({
        next: (res) => {
          this._submitting.set(false);
          this._editedSections.set(new Set());
          if (res.success && res.data) {
            this.notify.success(NM.INTRANET.EDGE_ORDER.SUBMIT_SUCCESS, 'Edge Orders');
            this.router.navigate([this._returnUrl]);
          } else {
            this.notify.error(NM.INTRANET.EDGE_ORDER.SUBMIT_FAILED, 'Edge Orders');
          }
        },
        error: () => {
          this._submitting.set(false);
        },
      });
  }

  private static readonly SECTION_API_NAMES: Record<string, string> = {
    shippingMethod:  'ShippingMethod',
    shippingCharges: 'ShippingCharges',
  };

  // Maps form control names → exact XML element tag names per section.
  // Keys not listed fall back to their form control name as-is.
  private static readonly XML_TAG_MAP: Record<string, Record<string, string>> = {
    soldTo: {
      name1:     'Name1',
      street1:   'Street1',
      street2:   'Street2',
      city:      'City',
      state:     'State',
      zip:       'Zip',
      careof:    'careof',    // lowercase in SoldTo XML
      attention: 'attention', // lowercase in SoldTo XML
      country:   'country',   // lowercase in SoldTo XML
    },
    shipTo: {
      name1:     'Name1',
      street1:   'Street1',
      street2:   'Street2',
      city:      'City',
      state:     'State',
      zip:       'Zip',
      careof:    'careof',
      attention: 'Attention', // capitalised in ShipTo XML
      country:   'Country',   // capitalised in ShipTo XML
    },
    brandAccount: {
      repAccountNo: 'RepAccountNo',
      phone:        'Phone',
      fax:          'Fax',
    },
    marketingProgram: {
      programCode: 'ProgramCode',
      program:     'Program',
      secureSda:   'SecureSDA',
    },
    orderInfo: {
      orderDate:     'OrderDate',
      repPoNo:       'RepPONo',
      customerPoNo:  'CustomerPONo',
      custAccountNo: 'CustAccountNo',
      jobName:       'JobName',
      salesPerson:   'SalesPerson',
      jobGuid:       'JobGuid',
    },
    quantityInfo: {
      jobNumber:        'JobNumber',
      modelCount:       'ModelCount',
      versionNumber:    'VersionNumber',
      lineCount:        'LineCount',
      brandlogo:        'brandlogo',        // lowercase in XML
      jobInitiatedDate: 'JobInitiatedDate',
      email:            'email',            // lowercase in XML
      productVersion:   'productVersion',
    },
    specialInfo: {
      sdaNo: 'SDANo',
      fma:   'FMA',
    },
    specialItems: {
      isSpecial:  'IsSpecial',
      xLines:     'XLines',
      commLines:  'CommLines',
      ctrlQty:    'CtrlQty',
      fmaLines:   'FMALines',
    },
    pricingTotals: {
      baseOrderCost:      'BaseOrderCost',
      setupCharge:        'SetupCharge',
      freight:            'Freight',
      totalOrderCost:     'TotalOrderCost',
      totalListPrice:     'TotalListPrice',
      netMinusFreight:    'NetMinusFreight',
      freightQuoteNumber: 'FreightQuoteNumber',
    },
    shippingMethod: {
      shipVia:              'ShipVia',
      callBeforeDelivery:   'CallBeforeDelivery',
      terms:                'Terms',
      markOrder:            'MarkOrder',
      noPartial:            'NoPartial',
      shippingInstructions: 'ShippingInstructions',
      shipTerms:            'ShipTerms',
    },
    shippingCharges: {
      commentsToFactory:      'CommentsToFactory',
      customerServiceRequest: 'CustomerServiceRequest',
    },
  };

  private sectionFields(sectionKey: string): Record<string, string> {
    const raw    = (this.form.get(sectionKey) as FormGroup).getRawValue() as Record<string, unknown>;
    const tagMap = EditOrder.XML_TAG_MAP[sectionKey] ?? {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [tagMap[k] ?? k, v == null ? '' : String(v)]),
    );
  }

  readonly countries = [
    'UNITED STATES OF AMERICA',
    'CANADA',
    'MEXICO',
    'UNITED KINGDOM',
    'AUSTRALIA',
    'GERMANY',
    'FRANCE',
    'JAPAN',
  ];

  readonly form = this.fb.nonNullable.group({
    orderInfo: this.fb.nonNullable.group({
      orderDate:      '',
      repPoNo:        '',
      customerPoNo:   '',
      custAccountNo:  '',
      jobName:        '',
      salesPerson:    '',
      jobGuid:        '',
    }),
    soldTo: this.fb.nonNullable.group({
      name1:     '',
      street1:   '',
      street2:   '',
      careof:    '',
      city:      '',
      state:     '',
      zip:       '',
      attention: '',
      country:   'UNITED STATES OF AMERICA',
    }),
    shipTo: this.fb.nonNullable.group({
      name1:     '',
      street1:   '',
      street2:   '',
      careof:    '',
      city:      '',
      state:     '',
      zip:       '',
      attention: '',
      country:   'UNITED STATES OF AMERICA',
    }),
    brandAccount: this.fb.nonNullable.group({
      repAccountNo: '',
      phone:        '',
      fax:          '',
    }),
    marketingProgram: this.fb.nonNullable.group({
      programCode: '',
      program:     '',
      secureSda:   this.fb.nonNullable.control(false),
    }),
    shippingMethod: this.fb.nonNullable.group({
      shipVia:              '',
      callBeforeDelivery:   '',
      terms:                '',
      markOrder:            '',
      noPartial:            '',
      shippingInstructions: '',
      shipTerms:            '',
    }),
    shippingCharges: this.fb.nonNullable.group({
      commentsToFactory:      '',
      customerServiceRequest: '',
    }),
    quantityInfo: this.fb.nonNullable.group({
      jobNumber:        '',
      versionNumber:    '',
      lineCount:        '',
      jobInitiatedDate: '',
      modelCount:       '',
      productVersion:   '',
      brandlogo:        '',
      email:            '',
    }),
    pricingTotals: this.fb.nonNullable.group({
      baseOrderCost:       '',
      setupCharge:         '',
      freight:             '',
      totalOrderCost:      '',
      totalListPrice:      '',
      netMinusFreight:     '',
      freightQuoteNumber:  '',
    }),
    specialInfo: this.fb.nonNullable.group({
      sdaNo: '',
      fma:   '',
    }),
    specialItems: this.fb.nonNullable.group({
      isSpecial:  'no',
      xLines:     '',
      commLines:  '',
      ctrlQty:    '',
      fmaLines:   '',
    }),
  });

  readonly isSpecialOptions = ['no', 'yes'];

  readonly shipTermsData    = signal<ShipTerm[]>([]);
  readonly shipTermsOptions = computed(() =>
    this.shipTermsData().map(st => ({ label: `${st.code} - ${st.description}`, value: st.code })),
  );

  ngOnInit(): void {
    const key       = this.route.snapshot.queryParamMap.get('key');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) this._returnUrl = returnUrl;
    if (!key) return;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw) as OrderByGuidData;
    this._orderData = data;
    this.patchFromApiResponse(data);
    this.form.get('orderInfo.jobGuid')!.disable({ emitEvent: false });
    this.form.get('quantityInfo.lineCount')!.disable({ emitEvent: false });
    this.form.get('quantityInfo.jobInitiatedDate')!.disable({ emitEvent: false });
    this.trackSectionChanges();
    this.cdr.markForCheck();
  }

  private trackSectionChanges(): void {
    const sections = [
      'orderInfo', 'soldTo', 'shipTo', 'brandAccount',
      'marketingProgram', 'shippingMethod', 'shippingCharges', 'quantityInfo',
      'pricingTotals', 'specialInfo', 'specialItems',
    ] as const;

    for (const key of sections) {
      this.form.get(key)!.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this._editedSections.update(s => new Set([...s, key]));
        });
    }
  }

  private patchFromApiResponse(data: OrderByGuidData): void {
    this.lineItemFamilies.set(data.lineItemFamilies ?? []);
    this.plantCodes.set(data.plantCodes ?? []);
    this.shipTermsData.set(data.shipTerms ?? []);
    this.isFastTrack.set(data.isFastTrack ?? false);
    this.marshalFileLabel.set(data.marshalFileLabel ?? '');

    const oi       = data.orderInfo;
    const soldTo   = data.address?.soldTo;
    const shipTo   = data.address?.shipTo;
    const account  = data.brandAccount;
    const mp       = data.marketingProgram;
    const shipMeth = data.shipping?.method;
    const shipChrg = data.shipping?.charges;
    const pt       = data.pricingTotals  ?? {};
    const qi       = data.quantityInfo   ?? {};
    const si       = data.specialInfo    ?? {};
    const spi      = data.specialItems   ?? {};

    this.form.patchValue({
      orderInfo: {
        orderDate:     oi?.orderDate     ?? '',
        repPoNo:       oi?.repPoNo       ?? '',
        customerPoNo:  oi?.customerPoNo  ?? '',
        custAccountNo: oi?.custAccountNo ?? '',
        jobName:       oi?.jobName       ?? '',
        salesPerson:   oi?.salesPerson   ?? '',
        jobGuid:       oi?.jobGuid       ?? '',
      },
      soldTo: {
        name1:   soldTo?.name     ?? '',
        street1: soldTo?.address1 ?? '',
        street2: soldTo?.address2 ?? '',
        city:    soldTo?.city     ?? '',
        state:   soldTo?.state    ?? '',
        zip:     soldTo?.zip      ?? '',
        country: soldTo?.country  || 'UNITED STATES OF AMERICA',
      },
      shipTo: {
        name1:   shipTo?.name     ?? '',
        street1: shipTo?.address1 ?? '',
        street2: shipTo?.address2 ?? '',
        city:    shipTo?.city     ?? '',
        state:   shipTo?.state    ?? '',
        zip:     shipTo?.zip      ?? '',
        country: shipTo?.country  || 'UNITED STATES OF AMERICA',
      },
      brandAccount: {
        repAccountNo: account?.repAccountNo ?? '',
        phone:        account?.phone        ?? '',
        fax:          account?.fax          ?? '',
      },
      marketingProgram: {
        programCode: mp?.programCode ?? '',
        program:     mp?.program     ?? '',
        secureSda:   mp?.secureSda?.toLowerCase() === 'true',
      },
      shippingMethod: {
        shipVia:              shipMeth?.shipVia              ?? '',
        callBeforeDelivery:   shipMeth?.callBeforeDelivery   ?? '',
        terms:                shipMeth?.terms                ?? '',
        markOrder:            shipMeth?.markOrder            ?? '',
        noPartial:            shipMeth?.noPartial            ?? '',
        shippingInstructions: shipMeth?.shippingInstructions ?? '',
        shipTerms:            shipMeth?.shipTerms            ?? '',
      },
      shippingCharges: {
        commentsToFactory:      shipChrg?.commentsToFactory      ?? '',
        customerServiceRequest: shipChrg?.customerServiceRequest ?? '',
      },
      pricingTotals: {
        baseOrderCost:      pt['BaseOrderCost']      ?? '',
        setupCharge:        pt['SetupCharge']        ?? '',
        freight:            pt['Freight']            ?? '',
        totalOrderCost:     pt['TotalOrderCost']     ?? '',
        totalListPrice:     pt['TotalListPrice']     ?? '',
        netMinusFreight:    pt['NetMinusFreight']    ?? '',
        freightQuoteNumber: pt['FreightQuoteNumber'] ?? '',
      },
      quantityInfo: {
        jobNumber:        qi['JobNumber']        ?? '',
        versionNumber:    qi['VersionNumber']    ?? '',
        lineCount:        qi['LineCount']        ?? '',
        modelCount:       qi['ModelCount']       ?? '',
        brandlogo:        qi['brandlogo']        ?? '',
        jobInitiatedDate: qi['JobInitiatedDate'] ?? '',
        email:            qi['email']            ?? '',
      },
      specialInfo: {
        sdaNo: si['SDANo'] ?? '',
        fma:   si['FMA']   ?? '',
      },
      specialItems: {
        isSpecial: spi['isSpecial'] ?? '',
        xLines:    spi['xLines']    ?? '',
        commLines: spi['commLines'] ?? '',
        ctrlQty:   spi['ctrlQty']   ?? '',
        fmaLines:  spi['fmaLines']  ?? '',
      },
    });
  }
}
