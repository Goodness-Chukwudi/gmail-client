import { SortOrder } from "mongoose";

type DbSortQuery<T> = Record<keyof T, SortOrder> | null;
type DbPopulation<T> = [keyof T]|Record<keyof T, string>[];
type EmailLabels = "TRASH"|"STARRED"|"SENT"|"DRAFT"|"UNREAD"|"IMPORTANT"|"INBOX";

export {
    DbSortQuery,
    DbPopulation,
    EmailLabels
}