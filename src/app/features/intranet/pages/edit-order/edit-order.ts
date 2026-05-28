import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';

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
    try {
      const payload = JSON.parse(raw) as { xml?: string; releaseNumber?: string };
      if (payload.xml) this.patchOrderInfoFromXml(payload.xml);
    } catch { /* invalid payload */ }
  }

  private patchOrderInfoFromXml(xml: string): void {
    const doc     = new DOMParser().parseFromString(xml, 'text/xml');
    const getText = (parent: Element | null, tag: string): string =>
      parent?.querySelector(tag)?.textContent?.trim() ?? '';

    const orderInfo        = doc.querySelector('OrderInfo') ?? null;
    const address          = doc.querySelector('Address');
    const soldTo           = address?.querySelector('SoldTo') ?? null;
    const shipTo           = address?.querySelector('ShipTo') ?? null;
    const accountInfo      = doc.querySelector('Brand > AccountInfo') ?? null;
    const marketingProgram = doc.querySelector('MarketingProgram') ?? null;
    const shippingMethod   = doc.querySelector('Shipping > ShippingMethod') ?? null;
    const shippingCharges  = doc.querySelector('Shipping > ShippingCharges') ?? null;
    const specialInfo      = doc.querySelector('SpecialInfo') ?? null;
    const quantityInfo     = doc.querySelector('QuantityInfo') ?? null;
    const pricingTotals    = doc.querySelector('PricingTotals') ?? null;
    const specialItems     = doc.querySelector('SpecialItems') ?? null;

    this.form.patchValue({
      orderInfo: {
        orderDate:     getText(orderInfo, 'OrderDate'),
        repPoNo:       getText(orderInfo, 'RepPONo'),
        customerPoNo:  getText(orderInfo, 'CustomerPONo'),
        custAccountNo: getText(orderInfo, 'CustAccountNo'),
        jobName:       getText(orderInfo, 'JobName'),
        salesPerson:   getText(orderInfo, 'SalesPerson'),
        jobGuid:       getText(orderInfo, 'JobGuid'),
      },
      soldTo: {
        name1:     getText(soldTo, 'Name1'),
        street1:   getText(soldTo, 'Street1'),
        street2:   getText(soldTo, 'Street2'),
        careof:    getText(soldTo, 'CareOf'),
        city:      getText(soldTo, 'City'),
        state:     getText(soldTo, 'State'),
        zip:       getText(soldTo, 'Zip'),
        attention: getText(soldTo, 'Attention'),
        country:   getText(soldTo, 'Country') || 'UNITED STATES OF AMERICA',
      },
      shipTo: {
        name1:     getText(shipTo, 'Name1'),
        street1:   getText(shipTo, 'Street1'),
        street2:   getText(shipTo, 'Street2'),
        careof:    getText(shipTo, 'CareOf'),
        city:      getText(shipTo, 'City'),
        state:     getText(shipTo, 'State'),
        zip:       getText(shipTo, 'Zip'),
        attention: getText(shipTo, 'Attention'),
        country:   getText(shipTo, 'Country') || 'UNITED STATES OF AMERICA',
      },
      brandAccount: {
        repAccountNo: getText(accountInfo, 'RepAccountNo'),
        phone:        getText(accountInfo, 'Phone'),
        fax:          getText(accountInfo, 'Fax'),
      },
      marketingProgram: {
        programCode: getText(marketingProgram, 'ProgramCode'),
        program:     getText(marketingProgram, 'Program'),
      },
      shipping: {
        shipVia:                getText(shippingMethod, 'ShipVia'),
        terms:                  getText(shippingMethod, 'Terms'),
        noPartial:              getText(shippingMethod, 'NoPartial'),
        callBeforeDelivery:     getText(shippingMethod, 'CallBeforeDelivery'),
        markOrder:              getText(shippingMethod, 'MarkOrder'),
        shippingInstructions:   getText(shippingMethod, 'ShippingInstructions'),
        commentsToFactory:      getText(shippingCharges, 'CommentsToFactory'),
        customerServiceRequest: getText(shippingCharges, 'CustomerServiceRequest'),
      },
      specialInfo: {
        sdaNo: getText(specialInfo, 'SDANo'),
        fma:   getText(specialInfo, 'FMA'),
      },
      quantityInfo: {
        jobNumber:        getText(quantityInfo, 'JobNumber'),
        versionNumber:    getText(quantityInfo, 'VersionNumber'),
        lineCount:        getText(quantityInfo, 'LineCount'),
        modelCount:       getText(quantityInfo, 'ModelCount'),
        brandlogo:        getText(quantityInfo, 'brandlogo'),
        jobInitiatedDate: getText(quantityInfo, 'JobInitiatedDate'),
        email:            getText(quantityInfo, 'email'),
      },
      pricingTotals: {
        baseOrderCost:   getText(pricingTotals, 'BaseOrderCost'),
        setupCharge:     getText(pricingTotals, 'SetupCharge'),
        freight:         getText(pricingTotals, 'Freight'),
        totalOrderCost:  getText(pricingTotals, 'TotalOrderCost'),
        totalListPrice:  getText(pricingTotals, 'TotalListPrice'),
        netMinusFreight: getText(pricingTotals, 'NetMinusFreight'),
      },
      specialItems: {
        isSpecial: getText(specialItems, 'IsSpecial').toLowerCase() || 'no',
        xLines:    getText(specialItems, 'XLines'),
        commLines: getText(specialItems, 'CommLines'),
        ctrlQty:   getText(specialItems, 'CtrlQty'),
      },
    });
  }
}
