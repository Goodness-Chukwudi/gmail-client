import moment from 'moment';

/**
 * Returns the month part of a date object
 * @param {Date} date A javascript date object
 * @returns {number} a number from 1 and 12
*/
const getMonth = (date: Date): number => {
    return date.getMonth()+1;
}

/**
 * Returns the name of the  month part of a date object
 * @param {Date} date A javascript date object
 * @returns {string} a month from January and December
*/
const getMonthName = (date: Date): string => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const month = date.getMonth();
    return monthNames[month];
}

/**
 * Returns the minutes part of a date object
 * @param {Date} date A javascript date object
 * @returns {number} a number from 1 and 60
*/
const getMinutes = (date: Date): number => {
    return date.getMinutes()+1;
}

/**
 * Returns the seconds part of a date object
 * @param {Date} date A javascript date object
 * @returns {number} a number from 1 and 60
*/
const getSeconds = (date: Date): number => {
    return date.getSeconds() +1;
}

/**
 * Returns the name of the  day part of a date object
 * @param {Date} date A javascript date object
 * @returns {string} a day from Sunday and Saturday
*/
const getDay = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

/**
 * Converts a numeric day value to it's equivalent name
 * @param {number} day number ranging from 1 to 7
 * @returns {string} a day from Sunday and Saturday
*/
const getDayByNumber = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day - 1];
}


/**
 * Returns the number of weeks in a date object
 * @param {Date} date A javascript date object
 * @returns {number} number of weeks as a string
*/
const getWeek =(date: Date): string => {
    return moment(date).format('w');
}

/**
 * Adds the specified duration/unit of time to a date object
 * @param {Date} date A javascript date object
 * @param {string} unit a string specifying the unit of time to be added - unit options are [seconds, minutes, hours, days, months]
 * @param {number} amount a number specifying the quantity of the specified unit to be added
 * @returns {Date} a javascript date object
*/
const addToDate = (date: Date, unit: string, amount: number) => {
    //@ts-ignore
    return moment(date).add(amount, unit).toDate();
}

/**
 * Subtracts the specified duration/unit of time from a date object
 * @param {Date} date A javascript date object
 * @param {string} unit a string specifying the unit of time to be subtracted - unit options are [seconds, minutes, hours, days, months]
 * @param {number} amount a number specifying the quantity of the specified unit to be subtracted
 * @returns {Date} a javascript date object
*/
const subtractFromDate = (date: Date, unit: string, amount: number) => {
    //@ts-ignore
    return moment(date).subtract(amount, unit).toDate();
}

/**
 * Formats the a date using the provided format
 * @param {Date} date A javascript date object
 * @param {string} format the expected date format. eg. YYYY-MM-DD
 * @returns {string} a date string in the specified format
*/
const formatDate = (date: Date, format: string) => {
    return moment(date, format).toString();
}

/**
 * Get the time difference between two dates
 * @param {Date} startDate A javascript date object. The date to start from.
 * @param {Date} endDate A javascript date object. The date to end at.
 * @param {string} unit a string specifying the unit of time in which to express the difference - unit options are [seconds, minutes, hours, days, months]
 * @returns {number} a number
*/
const getDateDifference = (startDate: Date, endDate: Date, unit: string) => {
    //@ts-ignore
    return moment(endDate).diff(moment(startDate), unit)
}

/**
 * Gets a date that it's equivalent to the beginning of the provided date object
 * @param {Date} date A javascript date object.
 * @returns {Date} a javascript date object
*/
const startOfDay = (date: Date) => {
    return moment(date).startOf("day").toDate();
}

/**
 * Gets a date that it's equivalent to the ending of the provided date object
 * @param {Date} date A javascript date object.
 * @returns {Date} a javascript date object
*/
const endOfDay = (date: Date) => {
    return moment(date).endOf("day").toDate();
}

/**
 * Adds timestamp properties to the provided object
 * - timestamp components are [day_created, week_created, month_created, year_created, week_day_created, hour_created, am_or_pm]
 * @param {Object} data An object on which the timestamp components are to be set.
 * @returns {Object} the provided modified data object
*/
const registerTimestamp = (data: Record<string,any>) => {
    try {
        const currentDate = new Date();
        data.day_created = currentDate.getDate();
        data.week_created = getWeek(currentDate);
        data.month_created = getMonth(currentDate);
        data.year_created = currentDate.getFullYear();
        data.week_day_created = getDay(currentDate);
        data.hour_created = currentDate.getHours();
        data.am_or_pm = moment().format('A');
    
        return data;
    } catch (error) {
        throw error;
    }
}

export {
    registerTimestamp,
    endOfDay,
    startOfDay,
    getDateDifference,
    formatDate,
    subtractFromDate,
    addToDate,
    getWeek,
    getDayByNumber,
    getDay,
    getSeconds,
    getMinutes,
    getMonthName
};