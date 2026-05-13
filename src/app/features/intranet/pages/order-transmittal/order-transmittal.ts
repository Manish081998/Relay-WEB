import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderData } from 'src/app/models/orderData.model';

@Component({
  selector: 'app-order-transmittal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-transmittal.html',
  styleUrl: './order-transmittal.scss',
})
export class OrderTransmittal implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<OrderData | null>(null);
  readonly parseError = signal('');
  readonly releaseNumber = signal('');
  readonly printDate = signal('');

  ngOnInit(): void {
    this.printDate.set(new Date().toLocaleDateString('en-US'));

    const key = this.route.snapshot.queryParamMap.get('key');
    if (key) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored) as { xml?: string; releaseNumber?: string };
        this.releaseNumber.set(data.releaseNumber ?? '');
        if (data.xml) {
          this.parseXml(data.xml);
          return;
        }
      }
    }

    // fallback: same-tab navigation via history.state
    const state = history.state as { xml?: string; releaseNumber?: string };
    this.releaseNumber.set(state?.releaseNumber ?? '');
    if (state?.xml) {
      this.parseXml(state.xml);
    } else {
      this.parseError.set('No XML content received. Please go back and click a release number.');
    }
  }

  goBack(): void {
    this.router.navigate(['/intranet/Edge-Orders-Search']);
  }

  print(): void {
    window.print();
  }

  private q(el: Element | Document, selector: string): string {
    return el.querySelector(selector)?.textContent?.trim() ?? '';
  }

  private parseXml(raw: string): void {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'application/xml');
      if (doc.querySelector('parsererror')) {
        this.parseError.set('Invalid XML content.');
        return;
      }

      const tts = doc.querySelector('TTS');
      if (!tts) {
        this.parseError.set('Unexpected XML structure: missing TTS element.');
        return;
      }

      // The actual API XML uses <LineItems> with uppercase field names.
      // Fall back to <TitusGRD> for the legacy sample format.
      const groupSelector = tts.querySelector('LineItems > Group')
        ? 'LineItems > Group'
        : 'TitusGRD > Group';

      const lineItems: LineItem[] = Array.from(tts.querySelectorAll(groupSelector)).map((group) => {
        const mc = group.querySelector('ModelConfig')!;
        const isNew = !!mc.querySelector('WIDTH');
        return {
          line: this.q(mc, 'Line'),
          qty: this.q(mc, 'Qty'),
          model: this.q(mc, 'Model'),
          dimOne: isNew ? this.q(mc, 'WIDTH') : this.q(mc, 'DimOne'),
          dimTwo: isNew ? this.q(mc, 'HEIGHT') : this.q(mc, 'DimTwo'),
          modSizeBorderPlen: isNew ? this.q(mc, 'MODULE') : this.q(mc, 'ModSize_Border_Plen'),
          frameBorder: isNew ? this.q(mc, 'BORDER') : this.q(mc, 'FrameBorder'),
          finish: isNew ? this.q(mc, 'FINISH') : this.q(mc, 'Finish'),
          fastenPattern: isNew ? this.q(mc, 'MOUNTING') : this.q(mc, 'FastenPattern'),
          damper: isNew ? this.q(mc, 'DAMPER') : this.q(mc, 'Damper'),
          accOne: isNew ? this.q(mc, 'ACC1') : this.q(mc, 'AccOne'),
          accTwo: isNew ? this.q(mc, 'ACC2') : this.q(mc, 'AccTwo'),
          accThree: isNew ? this.q(mc, 'ACC3') : this.q(mc, 'AccThree'),
          individualPrice: this.q(mc, 'IndividualPrice'),
          totalCost: this.q(mc, 'TotalCost'),
          tag: this.q(mc, 'Tag'),
          comment: this.q(mc, 'Comment'),
          multiplier: this.q(mc, 'Multiplier'),
        };
      });

      this.order.set({
        repAccountNo: this.q(tts, 'Brand AccountInfo RepAccountNo'),
        repPhone: this.q(tts, 'Brand AccountInfo Phone'),
        repFax: this.q(tts, 'Brand AccountInfo Fax'),
        program: this.q(tts, 'MarketingProgram Program'),
        programCode: this.q(tts, 'MarketingProgram ProgramCode'),
        totalNetWoFrt: this.q(tts, 'PricingTotals NetMinusFreight'),
        soldToName: this.q(tts, 'Address SoldTo Name1'),
        soldToAddress: this.q(tts, 'Address SoldTo Street1'),
        soldToCity: this.q(tts, 'Address SoldTo City'),
        soldToState: this.q(tts, 'Address SoldTo State'),
        soldToZip: this.q(tts, 'Address SoldTo Zip'),
        shipToName: this.q(tts, 'Address ShipTo Name1'),
        shipToCareOf: this.q(tts, 'Address ShipTo careof'),
        shipToAddress: this.q(tts, 'Address ShipTo Street1'),
        shipToAddress2: this.q(tts, 'Address ShipTo Street2'),
        shipToCity: this.q(tts, 'Address ShipTo City'),
        shipToState: this.q(tts, 'Address ShipTo State'),
        shipToZip: this.q(tts, 'Address ShipTo Zip'),
        repPONo: this.q(tts, 'OrderInfo RepPONo'),
        jobName: this.q(tts, 'OrderInfo JobName'),
        custAccountNo: this.q(tts, 'OrderInfo CustAccountNo'),
        custPO: this.q(tts, 'OrderInfo CustomerPONo'),
        salesperson: this.q(tts, 'OrderInfo SalesPerson'),
        jobGuid: this.q(tts, 'OrderInfo JobGuid'),
        fma: this.q(tts, 'SpecialInfo FMA'),
        specialItems: this.q(tts, 'SpecialItems IsSpecial'),
        xLines: this.q(tts, 'SpecialItems XLines'),
        commLines: this.q(tts, 'SpecialItems CommLines'),
        markOrder: this.q(tts, 'Shipping ShippingMethod MarkOrder'),
        callBefore: this.q(tts, 'Shipping ShippingMethod CallBeforeDelivery'),
        shippingInstructions: this.q(tts, 'Shipping ShippingMethod ShippingInstructions'),
        terms: this.q(tts, 'Shipping ShippingMethod Terms'),
        shipVia: this.q(tts, 'Shipping ShippingMethod ShipVia'),
        noPartial: this.q(tts, 'Shipping ShippingMethod NoPartial'),
        releaseComments: this.q(tts, 'Shipping ShippingCharges CommentsToFactory'),
        modelCount: this.q(tts, 'QuantityInfo ModelCount'),
        jobNumber: this.q(tts, 'QuantityInfo JobNumber'),
        jobCreated: this.q(tts, 'QuantityInfo JobInitiatedDate'),
        lineCount: this.q(tts, 'QuantityInfo LineCount'),
        edgeVersion: this.q(tts, 'QuantityInfo VersionNumber'),
        email: this.q(tts, 'QuantityInfo email'),
        ctrlQty: this.q(tts, 'SpecialItems CtrlQty'),
        lineItems,
        baseOrderCost: this.q(tts, 'PricingTotals BaseOrderCost'),
        setupCharge: this.q(tts, 'PricingTotals SetupCharge'),
        freight: this.q(tts, 'PricingTotals Freight'),
        totalOrderCost: this.q(tts, 'PricingTotals TotalOrderCost'),
        totalListPrice: this.q(tts, 'PricingTotals TotalListPrice'),
      });
    } catch (e) {
      this.parseError.set('Failed to parse XML: ' + String(e));
    }
  }
}
