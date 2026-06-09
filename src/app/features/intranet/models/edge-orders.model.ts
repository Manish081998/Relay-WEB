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

export interface PlantCode {
  code:        string;
  description: string;
}

export interface ShipTerm {
  code:        string;
  description: string;
}

export interface OrderByGuidData {
  orderGuid:    string;
  repPoNumber:  string;
  brand:        string;
  fileName:     string;
  plantCodes:   PlantCode[];
  shipTerms:    ShipTerm[];
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
      shipVia:              string;
      noPartial:            string;
      shipTerms:            string;
      callBeforeDelivery:   string;
      terms:                string;
      markOrder:            string;
      shippingInstructions: string;
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
  specialItems:     Record<string, string>;
  statusText:       string;
  marshalFileLabel: string;
  isFastTrack:      boolean;
  isLocked:         boolean;
}

export interface OrderUpdateSectionRequest {
  section: string;
  fields:  Record<string, string>;
}

export interface SubmitOrderResponse {
  success: boolean;
  data:    boolean;
  message: string;
  errors:  string[];
}

export interface PlantCodeUpdateDto {
  lineNumber:      string;
  newPlantCode:    string;
  isSecondaryPlant: boolean;
}

export interface UpdatePlantCodeResponse {
  success: boolean;
  data:    boolean;
  message: string;
  errors:  string[];
}

export interface EdiStatusItem {
  poNumber:  string;
  status:    string;
  user:      string;
  timeStamp: string;
}

export interface EdiStatusResponse {
  success: boolean;
  data:    EdiStatusItem[];
  message: string | null;
  errors:  string[];
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
