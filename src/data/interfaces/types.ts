import { SortOrder } from "mongoose";

type DbSortQuery<T> = Record<keyof T, SortOrder> | null;

type DbPopulation<T> = [keyof T]|Record<keyof T, string>[]

export {
    DbSortQuery,
    DbPopulation
}