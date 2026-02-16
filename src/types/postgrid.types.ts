// PostGrid API response types

export interface PostGridListResponse<T> {
  object: "list";
  totalCount: number;
  skip: number;
  limit: number;
  data: T[];
}

export interface PostGridContact {
  id: string;
  object: "contact";
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  provinceOrState?: string;
  postalOrZip?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  metadata?: Record<string, string>;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostGridLetter {
  id: string;
  object: "letter";
  to: PostGridContact;
  from: PostGridContact;
  status: string;
  mailingClass?: string;
  sendDate?: string;
  color?: boolean;
  doubleSided?: boolean;
  size?: string;
  envelopeType?: string;
  trackingNumber?: string;
  description?: string;
  metadata?: Record<string, string>;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostGridCheque {
  id: string;
  object: "cheque";
  to: PostGridContact;
  from: PostGridContact;
  bankAccount: string;
  amount: number; // in cents
  memo?: string;
  number?: number;
  status: string;
  mailingClass?: string;
  sendDate?: string;
  trackingNumber?: string;
  description?: string;
  metadata?: Record<string, string>;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostGridBankAccount {
  id: string;
  object: "bank_account";
  bankName: string;
  bankCountryCode: string;
  accountNumberLast4?: string;
  routingNumberLast4?: string;
  transitNumberLast4?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostGridTemplate {
  id: string;
  object: "template";
  description?: string;
  html?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PostGridAddressVerification {
  status: "verified" | "corrected" | "failed";
  line1?: string;
  line2?: string;
  city?: string;
  provinceOrState?: string;
  postalOrZip?: string;
  countryCode?: string;
  errors?: string[];
}

export interface PostGridError {
  object: "error";
  error: {
    type: string;
    message: string;
  };
}
