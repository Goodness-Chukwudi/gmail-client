const JoiValidatorOptions = {
    errors: {
      wrap: {
        label: ""
      }
    },
    stripUnknown: true,
    abortEarly: false,
    allowUnknown: false
};

const PaginationCustomLabels = {
  totalDocs: 'items_count',
  docs: 'data',
  limit: 'items_per_page',
  page: 'current_page',
  nextPage: 'next_page',
  prevPage: 'previous_page',
  totalPages: 'total_pages',
  pagingCounter: 'serial_number',
  hasPrevPage: "has_previous_page",
  hasNextPage: "has_next_page",
  meta: 'paginator'
};

const DbConfig = {
  dbName: "mainstack-test",
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  maxPoolSize: 100
};

const ENVIRONMENTS = Object.freeze({
  PROD: "production",
  DEV: "development",
  UAT: "user acceptance testing",
  STAGING: "staging"
});

const GmailAuthorizationScopes = [
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.modify",
];

export {
  JoiValidatorOptions,
  PaginationCustomLabels,
  DbConfig,
  ENVIRONMENTS,
  GmailAuthorizationScopes
}