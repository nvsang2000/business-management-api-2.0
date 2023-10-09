export enum OPTION_NODE_ENV {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  STAGING = 'staging',
}

export enum ROLE {
  admin = 'admin',
  user = 'user',
}

export enum STATE_JOB {
  active = 'active',
  completed = 'completed',
  delayed = 'delayed',
  failed = 'failed',
  paused = 'paused',
  waiting = 'waiting',
}

export enum JOB_STATUS {
  WAITING = 1,
  COMPLETE = 2,
  COMPLETE_WITH_ERROR = 3,
  COMPLETE_WITH_WARNING = 4,
}

export enum BUSINESS_STATUS {
  NEW = 'NEW',
  VERIFY = 'VERIFY',
  PHONE_VERIFY = 'PHONE_VERIFY',
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  ADDRESS_VERIFY = 'ADDRESS_VERIFY',
  WEBSITE_VERFIFY = 'WEBSITE_VERFIFY',
  NAME_VERIFY = 'NAME_VERIFY',
  MAP_VERIFY = 'MAP_VERIFY',
}

export enum STATUS_MARKETING {
  NOT_ACCEPT = 'NOT_ACCEPT',
  ACCEPT = 'ACCEPT',
  PROCESSING = 'PROCESSING',
  CUSTOMER = 'CUSTOMER',
  CANCEL = 'CUSTOMER',
}

export enum METHOD {
  GET = 'GET',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
//env
export const NODE_ENV = 'NODE_ENV';
export const BUSINESS_LIST = 'BUSINESS_LIST';
export const GOOGLE_EMAIL = 'GOOGLE_EMAIL';
export const GOOGLE_PASSWORD = 'GOOGLE_PASSWORD';
export const JWT_SECRET = 'JWT_SECRET';
export const REDIS_URL = 'REDIS_URL';
export const REDIS_HOST = 'REDIS_HOST';
export const REDIS_POST = 'REDIS_POST';
export const BROWSER_USER_DATA_DIR = 'BROWSER_USER_DATA_DIR';
export const ASSETS_CSV_DIR = 'ASSETS_CSV_DIR';
export const GOOGLE_MAP_URL = 'GOOGLE_MAP_URL';
export const GOOGLE_MAP_KEY = 'GOOGLE_MAP_KEY';
export const SECONDS_OF_DAY = 86400000;

//class for website
export const WEBSITE = {
  GOOGLE: {
    URL: 'https://www.google.com',
    MAP_URL: 'https://maps.google.com',
    BUTTON_ACCEPT: '.GzLjMd #L2AGLb',
    INPUT_EMAIL: "*[type='email']",
    INPUT_PASSWORD: "*[type='password']",
    INPUT_SEARCH: "*[name='q']",
    PLACE: '.osrp-blk',
    PLACE_IS_ACTIVE: '#Shyhc',
    PLACESE: 'div[jsmodel="QPRQHf"]',
    PLACESE_ITEM: '.cXedhc a[data-cid][tabindex="0"]',
    PLACESE_ITEM_CID: '.immersive-container [data-cid]',
    PLACESE_ITEM_CONTAINER:
      'g-sticky-content-container block-component .xpdopen .ifM9O',
  },
  YELLOW_PAGES: {
    URL: 'https://www.yellowpages.com',
    CONTAINER: '[class="search-results organic"] .result',
    SEARCH_WHAT: 'input[name="search_terms"]',
    SEARCH_WHERE: 'input[name="geo_location_terms"]',
    NEXT_PAGE: '.pagination ul li a[class="next ajax-page"]',
  },
};

export const DEFAULT_OPTION_HEADER_FETCH = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
};

export const LINK_PROFILE = {
  google: 'https://www.google.com',
  googleMap: 'https://maps.google.com',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  twitter: 'https://twitter.com/',
  linkedin: 'https://www.linkedin.com/',
  yelp: 'https://www.yelp.com/',
  yellowbot: 'https://www.yellowbot.com',
  golocal247: 'https://www.golocal247.com',
  findOpen: 'https://find-open.com',
};

export const SCRATCH_STATUS = {
  CREATE_SCRATCH: 'CREATE_SCRATCH',
  GET_KEYWORD_BUSINESS: 'GET_KEYWORD_BUSINESS',
  SEARCH_KEYWORD_GOOGLE: 'SEARCH_KEYWORD_GOOGLE',
  GET_PLACE_LIST: 'GET_PLACE_LIST',
};

export const PRISMA_ERROR_CODE = {
  DUPLICATE: 'P2002',
  CONSTRAINT_NOT_FOUND: 'P2025',
};

export const MESSAGE_ERROR = {
  INCORRECT_USERNAME_OR_PASSWORD: 'Incorrect username or password!',
  USER_NOT_EXIST: 'User does not exist!',
  USER_ALREADY_EXISTS: 'User already exists!',
  USERNAME_EXISTS: 'Username already exists!',
  EMAIL_EXISTS: 'Email already exists!',
  PHONE_EXISTS: 'Phone already exists!',
  SIC_EXISTS: 'SIC already exists!',
  NOT_FUND_DATA: 'Not fund data!',
  CATEGORY_EXISTS: 'Category already exists!',
  HAS_EXPIRED: 'Login session has expired!',
  BUSINESS_EXIST: 'Business already exists!',
  PHONE_EXIST: 'Phone number already exists!',
  ADDRESS_EXITS: 'Address already exists!',
};

export const SORT_DIRECTION = ['asc', 'desc'];
export const CATEGORY_SORT_BY = ['name', 'isActive', 'createdAt'];

export enum PERMISSION_SUBJECTS {
  Business = 'Business',
  Category = 'Category',
  Scratch = 'Scratch',
}

export enum ACTION {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Import = 'import',
}

export enum TABLES {
  Policy = 'Policy',
  User = 'User',
  Business = 'Business',
  Category = 'Category',
  Scratch = 'Scratch',
  Setting = 'Setting',
}

export const HEADER_ROW_BUSINESS = [
  'Id',
  'Name',
  'Phone',
  'Website',
  'Address',
  'City',
  'State',
  'Zip Code',
  'Categories',
];

//fields request google map
export const FIELDS_BASIC_PLACE =
  'formatted_address%2Cname%2Cpermanently_closed%2Ctypes%2Cplace_id';
//regex
export const REG_IS_STATE = /^\d+$/;
export const LETTER_AZ = 'abcdefghijklmnopqrstuvwxyz';
export const REGEX_PHONE_NUMBER =
  /(?:\+\d{1,2}\s*)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?[xX]\d+)?/g;
export const REGEX_ADDRESS =
  /(?:Location|Address)?:?\s*(\d+[^,\n]+,\s*[^,\n]+,\s*[^,\n]+(?:,\s*\w{2}\s*\d{5})?)/gi;
