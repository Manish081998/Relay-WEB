import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { LineItem, OrderByGuidData } from '../../models/edge-orders.model';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, Select, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-order.html',
  styleUrl: './edit-order.scss',
})
export class EditOrder implements OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr   = inject(ChangeDetectorRef);

  readonly lineItems = signal<LineItem[]>([]);

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
    shipping: this.fb.nonNullable.group({
      shipVia:                '',
      terms:                  '',
      noPartial:              '',
      shipTerms:              '',
      callBeforeDelivery:     '',
      markOrder:              '',
      shippingInstructions:   '',
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

  readonly shipTermsOptions = [
    '', 'No Charge', 'Prepaid', 'Collect', 'Third Party', 'FOB Destination', 'FOB Origin',
  ];

  ngOnInit(): void {
    const key = this.route.snapshot.queryParamMap.get('key');
    if (!key) return;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw) as OrderByGuidData;
    this.patchFromApiResponse(data);
    this.cdr.markForCheck();
  }

  private patchFromApiResponse(data: OrderByGuidData): void {
    const allItems = (data.lineItemFamilies ?? []).flatMap(f => f.items ?? []);
    this.lineItems.set(allItems);

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
      },
      shipping: {
        shipVia:                shipMeth?.shipVia                ?? '',
        noPartial:              shipMeth?.noPartial              ?? '',
        shipTerms:              shipMeth?.shipTerms              ?? '',
        commentsToFactory:      shipChrg?.commentsToFactory      ?? '',
        customerServiceRequest: shipChrg?.customerServiceRequest ?? '',
      },
      pricingTotals: {
        baseOrderCost:   pt['BaseOrderCost']   ?? '',
        setupCharge:     pt['SetupCharge']     ?? '',
        freight:         pt['Freight']         ?? '',
        totalOrderCost:  pt['TotalOrderCost']  ?? '',
        totalListPrice:  pt['TotalListPrice']  ?? '',
        netMinusFreight: pt['NetMinusFreight'] ?? '',
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
    });
  }
}
