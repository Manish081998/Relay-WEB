export interface EdgeOrderDto {
  releaseNumber:    string;
  releaseName:      string;
  accountNumber:    string;
  name:             string;
  repPO:            string;
  lineItems:        string | number;
  totalNet:         string | number;
  emailId:          string;
  marketingProgram: string;
  orderRecdDate:    string;
  xmlMacPacOrder:   string;
  brand:            string;
  orderSource:      string;
  orderGuid:        string;
}

export interface LineItem {
  line:                 string;
  model:                string;
  plantCode:            string;
  secondaryPlantCode:   string;
  quantity:             string;
  individualPrice:      string;
  totalCost:            string;
  comment:              string | null;
  tag:                  string | null;
  multiplier:           string;
  groupId:              string;
  madeInUsa:            boolean;
  extraFields:          Record<string, string>;
}

export interface LineItemFamily {
  familyTag: string;
  items:     LineItem[];
}

export interface GetOrderByGuidResponse {
  success: boolean;
  data:    OrderByGuidData;
  message: string;
  errors:  string[];
}

export interface OrderByGuidData {
  orderGuid:    string;
  repPoNumber:  string;
  brand:        string;
  fileName:     string;
  trackType:    string;
  info: {
    repPoNo:   string;
    orderDate: string;
    faxEmail:  string;
  };
  orderInfo: {
    orderDate:     string;
    repPoNo:       string;
    customerPoNo:  string | null;
    custAccountNo: string;
    jobName:       string;
    salesPerson:   string;
    jobGuid:       string;
  };
  address: {
    soldTo: {
      name:     string;
      address1: string;
      address2: string;
      city:     string;
      state:    string;
      zip:      string;
      country:  string;
    };
    shipTo: {
      name:     string;
      address1: string;
      address2: string;
      city:     string;
      state:    string;
      zip:      string;
      country:  string;
      phone:    string;
    };
  };
  brandAccount: {
    repAccountNo:     string;
    phone:            string;
    fax:              string;
    sellingWarehouse: string;
    brandCode:        string;
  };
  shipping: {
    method: {
      shipVia:   string;
      noPartial: string;
      shipTerms: string;
    };
    charges: {
      madeInUsa:              boolean;
      commentsToFactory:      string;
      customerServiceRequest: string;
    };
  };
  marketingProgram: {
    programCode: string;
    program:     string;
    secureSda:   string;
  };
  lineItemFamilies: LineItemFamily[];
  pricingTotals:    Record<string, string>;
  quantityInfo:     Record<string, string>;
  specialInfo:      Record<string, string>;
  statusText:       string;
  marshalFileLabel: string;
  isFastTrack:      boolean;
  isLocked:         boolean;
}

export interface EdgeOrderSearchParams {
  EmailId?:       string;
  ReleaseNumber?: string;
  RepPO?:         string;
  PcUserName?:    string;
  RecordedDate?:  string;
  ReleaseName?:   string;
  PageNumber?:    number;
  PageSize?:      number;
}

export interface EdgeOrdersPagedResponse {
  items:      EdgeOrderDto[];
  totalCount: number;
  pageNumber: number;
  pageSize:   number;
}
