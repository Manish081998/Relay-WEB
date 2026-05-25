import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
export class EditOrder {
  private readonly fb = inject(FormBuilder);

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
}
