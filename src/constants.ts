import { PuppeteerLaunchOptions } from 'puppeteer';

// enum
export enum OPTION_NODE_ENV {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  STAGING = 'staging',
}

export enum ROLE {
  admin = 'admin',
  user = 'user',
}

export enum TYPE_JOB {
  AUTO = 'AUTO',
  NORMAL = 'NORMAL',
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

export enum GOOOGLE_VERIFY {
  VERIFY = 'Verified',
  UN_VERIFY = 'UnVerified',
}

export enum STRING_BOOLEAN {
  TRUE = 'true',
  FALSE = 'false',
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
  NOT_ACCEPT = 1,
  ACCEPT = 2,
  PROCESSING = 3,
  CUSTOMER = 4,
  CANCEL = 5,
}

export enum STATUS_WEBSITE {
  UN_VERIFY = 1,
  VERIFY = 2,
  FAILD = 3,
}

export enum METHOD {
  GET = 'GET',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum PERMISSION_SUBJECTS {
  Business = 'Business',
  Category = 'Category',
  Search = 'Search',
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
  Search = 'Search',
  Setting = 'Setting',
}

export enum FILE_TYPE {
  image = 'image',
  excel = 'excel',
  json = 'json',
  rar = 'rar',
}

export enum SOURCE_SCRATCH {
  YELP = 'yelp',
  YELLOW_PAGES = 'yellow',
  MENUFY = 'menufy',
}

export enum GOOGLE_API_INPUT_TYPE {
  PHONE_NUMBER = 'phonenumber',
  TEXT_QUERY = 'textquery',
}

export enum EXPORT_MODE {
  all = 'all',
  filter = 'filter',
  selected = 'selected',
}

//env
export const NODE_ENV = 'NODE_ENV';
export const JWT_SECRET = 'JWT_SECRET';
export const REDIS_URL = 'REDIS_URL';
export const REDIS_HOST = 'REDIS_HOST';
export const REDIS_POST = 'REDIS_POST';
export const ASSETS_CSV_DIR = 'ASSETS_CSV_DIR';
export const ASSETS_THUMNAIL_DIR = 'ASSETS_THUMNAIL_DIR';
export const API_HOST = 'API_HOST';
export const EXPORT_CHUNK_LENGTH = 'EXPORT_CHUNK_LENGTH';
export const EXPORT_ALL_LIMIT = 'EXPORT_ALL_LIMIT';
export const BROWSER_USER_DATA_DIR = 'BROWSER_USER_DATA_DIR';
export const PROMISE_WEBSITE_LIMIT = 'PROMISE_WEBSITE_LIMIT';
export const BROWSER_HEADLESS = 'BROWSER_HEADLESS';
export const SECONDS_OF_DAY = 86400000;

export const DOMAIN_LINK = {
  facebook: 'facebook.com',
};

export const FILE_EXTENTSION = {
  image: '.png',
  excel: '.csv',
  json: '.json',
  rar: '.rar',
};

export const THUMBNAIL_DEFAULT = {
  YELLOW: 'ypcdn.com/ypu/images/default-thumbnails',
  YELP: 'assets/img/default_avatars/business_medium_square.png',
};
export const WEBSITE = {
  GOOGLE: {
    URL: 'https://www.google.com',
    MAP_URL: 'https://maps.google.com/maps/place/?q=place_id',
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
  YELP: {
    URL: 'https://www.yelp.com/',
    NEXT_PAGE:
      '.navigation-button-container__09f24__SvcBh span a[aria-label="Next"]',
    ITEM_LIST: '[data-testid="serp-ia-card"]',
    DETAIL_CATEGORIES:
      '.arrange-unit__09f24__rqHTg .css-1xfc281 .css-1fdy0l5 a',
    DETAIL_ADDRESS: 'address .css-r9996t a .raw__09f24__T4Ezm',
    DETAIL_FORMAT_ADDRESS: 'address  .css-qgunke span',
    DETAIL_WEB_PHONE:
      'aside section .arrange-unit-fill__09f24__CUubG .css-1p9ibgf',
  },
  YELLOW_PAGES: {
    URL: 'https://www.yellowpages.com',
    CONTAINER: '[class="search-results organic"] .result',
    SEARCH_WHAT: 'input[name="search_terms"]',
    SEARCH_WHERE: 'input[name="geo_location_terms"]',
    NEXT_PAGE: '.pagination ul li a[class="next ajax-page"]',
  },
  MENUFY: {
    URL: 'https://www.menufy.com',
  },
};

export const DEFAULT_OPTION_HEADER_FETCH = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
};

export const MAPPING_CATEGORIES = {
  'American (New)': 'American (New) Restaurants',
  'American (Traditional)': 'American Restaurants',
  American: 'American Restaurants',
  Seafood: 'Seafood Restaurants',
  Italian: 'Italian Restaurants',
  Vietnamese: 'Vietnamese Restaurants',
  French: 'French Restaurants',
  Chinese: 'Chinese Restaurants',
  Japanese: 'Japanese Restaurants',
  Indian: 'Indian Restaurants',
  Mexican: 'Mexican Restaurants',
  Thai: 'Thai Restaurants',
  Greek: 'Greek Restaurants',
  Korean: 'Korean Restaurants',
  Spanish: 'Spanish Restaurants',
  Sushi: 'Sushi Restaurants',
  'Fast Food': 'Fast Food Restaurants',
  Asian: 'Asian Restaurants',
  Barbecue: 'Barbecue Restaurants',
  'Latin American': 'Latin American Restaurants',
  Mediterranean: 'Mediterranean Restaurants',
  Chicken: 'Chicken Restaurants',
  Hawaiian: 'Hawaiian Restaurants',
  Russian: 'Russian Restaurants',
  'Soul Food': 'Soul Food Restaurants',
  African: 'African Restaurants',
  Filipino: 'Filipino Restaurants',
  Brazilian: 'Brazilian Restaurants',
  Vegetarian: 'Vegetarian Restaurants',
  Irish: 'Irish Restaurants',
  'Health Food': 'Health Food Restaurants',
  Buffet: 'Buffet Restaurants',
  Dessert: 'Dessert Restaurants',
  German: 'German Restaurants',
  Cuban: 'Cuban Restaurants',
  Kosher: 'Kosher Restaurants',
  Vegan: 'Vegan Restaurants',
  Peruvian: 'Peruvian Restaurants',
  Fondue: 'Fondue Restaurants',
  'Pop-Up': 'Pop-Up Restaurants',
  'Home Cooking': 'Home Cooking Restaurants',
  'Middle Eastern': 'Middle Eastern Restaurants',
  BBQ: 'BBQ Restaurants',
  Cafeteria: 'Cafeterias',
};

export const PRISMA_ERROR_CODE = {
  DUPLICATE: 'P2002',
  CONSTRAINT_NOT_FOUND: 'P2025',
};

export const OPTION_BROWSER: PuppeteerLaunchOptions = {
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--deterministic-fetch',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
  ],
  ignoreDefaultArgs: ['--disable-extensions'],
};

export const MESSAGE_ERROR = {
  //Server
  NOT_FUND_DATA: 'Not fund data!',
  //Login
  INCORRECT_USERNAME_OR_PASSWORD: 'Incorrect username or password!',
  HAS_EXPIRED: 'Login session has expired!',
  //User
  USER_NOT_EXIST: 'User does not exist!',
  USER_ALREADY_EXISTS: 'User already exists!',
  USERNAME_EXISTS: 'Username already exists!',
  EMAIL_EXISTS: 'Email already exists!',
  PHONE_EXISTS: 'Phone already exists!',
  //category
  CATEGORY_EXISTS: 'Category already exists!',
};

export const SORT_DIRECTION = ['asc', 'desc'];
export const CATEGORY_SORT_BY = ['name', 'isActive', 'createdAt'];

//regex
export const REG_FORMAT_ADDRESS = /([^,]+),\s([A-Z]{2})\s(\d{5})/;
export const REG_IS_WEBSITE =
  /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
export const REG_IS_EMAIL =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const REG_IS_STRESS = /^[0-9]+ [a-zA-Z0-9\s,.'-]+$/;
export const REG_IS_STATE = /^\d+$/;
export const REGEX_PHONE_NUMBER =
  /(?:\+\d{1,2}\s*)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?[xX]\d+)?/g;
export const REGEX_ADDRESS =
  /(?:Location|Address)?:?\s*(\d+[^,\n]+,\s*[^,\n]+,\s*[^,\n]+(?:,\s*\w{2}\s*\d{5})?)/gi;
