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
}

// Query parameters sent to the API — remain PascalCase per backend contract
export interface EdgeOrderSearchParams {
  EmailId?:       string;
  ReleaseNumber?: string;
  RepPO?:         string;
  PcUserName?:    string;
  RecordedDate?:  string;
  ReleaseName?:   string;
}

export interface EdgeOrderColDef {
  field:       keyof EdgeOrderDto;
  header:      string;
  isXml?:      boolean;
  dateFormat?: string;  // when set, cell renders via DatePipe with this format
}
