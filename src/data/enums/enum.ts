
const GENDER = Object.freeze({
    MALE: "male",
    FEMALE: "female",
    OTHER: "others"
});

const BIT = Object.freeze({
    ON: 1,
    OFF: 0
});

const SEQUENCE_COUNTER_TYPES = Object.freeze({
    PRODUCT_CODE: "product"
});

const PASSWORD_STATUS = Object.freeze({
    ACTIVE: "active",
    DEACTIVATED: "deactivated",
    COMPROMISED: "compromised",
    BLACKLISTED: "blacklisted"
});

const ITEM_STATUS = Object.freeze({
    OPEN: 'open',
    CREATED: 'created',
    PENDING: 'pending',
    IN_REVIEW: 'in review',
    ACTIVE: 'active',
    DEACTIVATED: 'deactivated',
    DELETED: 'deleted',
    ARCHIVED: 'archived',
    SUSPENDED: 'suspended',
    HIDDEN: 'hidden',
    CLOSED: 'closed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    USED: 'used',
    SkIPPED: 'skipped',
});


export {
    GENDER,
    BIT,
    SEQUENCE_COUNTER_TYPES,
    PASSWORD_STATUS,
    ITEM_STATUS
}