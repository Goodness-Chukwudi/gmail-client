
enum GENDER {
    MALE = "male",
    FEMALE = "female",
    OTHER = "others"
};

enum BIT {
    ON = 1,
    OFF = 0
};

enum SEQUENCE_COUNTER_TYPES {
    PRODUCT_CODE = "product"
};

enum PASSWORD_STATUS {
    ACTIVE = "active",
    DEACTIVATED = "deactivated",
    COMPROMISED = "compromised",
    BLACKLISTED = "blacklisted"
};

enum ITEM_STATUS {
    OPEN= 'open',
    CREATED= 'created',
    PENDING= 'pending',
    IN_REVIEW= 'in review',
    ACTIVE= 'active',
    DEACTIVATED= 'deactivated',
    DELETED= 'deleted',
    ARCHIVED= 'archived',
    SUSPENDED= 'suspended',
    HIDDEN= 'hidden',
    CLOSED= 'closed',
    APPROVED= 'approved',
    REJECTED= 'rejected',
    USED= 'used',
    SkIPPED= 'skipped',
};


export {
    GENDER,
    BIT,
    SEQUENCE_COUNTER_TYPES,
    PASSWORD_STATUS,
    ITEM_STATUS
}