import {Model, ClientSession, UpdateQuery, FilterQuery, InsertManyResult, UpdateWriteOpResult} from "mongoose";
import { PaginationCustomLabels } from "../common/config/app_config";
import { ITEM_STATUS } from "../data/enums/enum";
import { DbPopulation, DbSortQuery } from "../data/interfaces/types";
import { DeleteResult, PaginatedDocument } from "../data/interfaces/interfaces";

/**
 * An abstract class that provides methods for performing DB queries.
 * Classes(entity service classes mostly) that extends this class:
 * - provide the interface of the mongoose document schema
 * - provide the mongoose model in the constructor
 * - inherit it's database access methods
 * @param {Model<T>} Model A mongoose model on which the query is performed
 * @param {T} interface of the model schema
 * @param {TCreate} interface of the payload to create the  document
 * @param {TDocument} interface of the document schema
*/
abstract class DBQuery<T, TCreate, TDocument> {

    private readonly Model:Model<Required<T>>;

    constructor(Model:Model<Required<T>>) {
        this.Model = Model;
    }

    /**
     * Saves one or more documents using mongoose's insertMany api.
     * @param {TCreate[]} data List of documents to be saved
     * @param {ClientSession} session An optional mongoose client session, required to commit a running database transaction if any
     * @returns {Promise<InsertManyResult<T>>} A promise resolving to an Object containing:
     * - An acknowledged boolean, set to true if the operation ran with write concern or false if write concern was disabled
     * - An insertedIds array, containing _id values for each successfully inserted document
    */
    public saveMany(data: TCreate[], session: ClientSession|null = null): Promise<InsertManyResult<T>> {
        try {
            const response = this.Model.insertMany(data, {session: session});
            return response as unknown as Promise<InsertManyResult<T>>;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Saves document using mongoose's save api.
     * @param {TCreate} data Document to be saved
     * @param {ClientSession} session An optional mongoose client session, required to commit a running database transaction if any
     * @returns {TDocument} A promise resolving to the saved document
    */
    public save(data: TCreate, session: ClientSession|null = null): Promise<TDocument> {
        try {
            const model = new this.Model(data);
            return model.save({session: session}) as Promise<TDocument>;
        } catch (error) {
            throw error;
        }
    }
        
    /**
     * Updates an existing document matching the provided query, creates a new one if no matching document was found.
     * @param {FilterQuery<T>} query A mongoose query to match a document
     * @param {UpdateQuery<T>} update The update to be made
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to the updated or upserted document
    */
    public updateOrCreateNew(query: FilterQuery<T>, update: UpdateQuery<T>, session: ClientSession|null = null, selectedFields:string[] = []): Promise<TDocument> {
        try {
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            const response = this.Model.findOneAndUpdate(finalQuery, update, {new: true, upsert: true})
                .session(session)
                .select(selectedFields)
                .exec();

            return response as Promise<TDocument>;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Counts the number of documents that matches the provided filter
     * @param {FilterQuery<T>} query A mongoose query to match a document
     * @returns {Promise<number>} A promise resolving to the number of matches found
    */
    public count(query: FilterQuery<T> = {}): Promise<number> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.countDocuments(finalQuery)
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches all documents that matches the provided query
     * @param {FilterQuery<T>} query An optional mongo query to fetch documents that matched the filter. Returns all documents if query isn't provided
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbSortQuery<T>} sort An optional mongoose sort object specifying the field and order to sort the list with
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument[]>} A promise resolving to a a list of documents that match filter
    */
    public find(query:FilterQuery<T> = {}, limit?:number,  selectedFields?:string[], sort?:DbSortQuery<T>, session?:ClientSession): Promise<TDocument[]> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.find(finalQuery)
                .session(session || null)
                .sort(sort || {created_at: -1})
                .limit(limit || 10)
                .select(selectedFields || [])
                .then((data) => {
                    resolve(data as TDocument[]);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches all deleted documents that matches the provided query
     * @param {FilterQuery<T>} query An optional mongo query to fetch a list of documents that matched the filter
     * @param {DbSortQuery<T>} sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns {Promise<TDocument[]>} A promise resolving to a list of documents that match filter
    */
    public findDeleted(query:FilterQuery<T> = {}, sort?:DbSortQuery<T>): Promise<TDocument[]> {
        const finalQuery = Object.assign(query, {status: ITEM_STATUS.DELETED});
        return new Promise((resolve, reject) => {
            this.Model.find(finalQuery)
                .sort(sort || {created_at: -1})
                .then((data) => {
                    resolve(data as TDocument[]);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches all documents that matches the provided filter. The specified ref paths are populated
     * @param {FilterQuery<T>} query An optional mongo query to fetch a list of documents that matched the filter
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbPopulation<T>} populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param {DbSortQuery<T>} sort An optional mongoose sort object specifying the field and order to sort the list with
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument[]>} A promise resolving to a list of documents that match filter
    */
    public findAndPopulate(query:FilterQuery<T> = {}, populatedFields?:DbPopulation<T>, selectedFields?:string[], sort?:DbSortQuery<T>, session?:ClientSession): Promise<TDocument[]> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {

            this.Model.find(finalQuery)
                .session(session || null)
                //@ts-ignore
                .populate(populatedFields || [])
                .sort(sort || {created_at: -1})
                .select(selectedFields || [])
                .then((data) => {
                    resolve(data as TDocument[]);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches a paginated list of documents that matches the provided filter.
     * @param {FilterQuery<T>} query An optional mongo query to fetch a list of documents that matched the filter
     * @param {number} limit Sets the number of documents per page. Default is 10
     * @param {number} page Sets the page to fetch. Default is 1
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbSortQuery<T>} sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns {Promise<PaginatedDocument<T>>} A promise resolving to a paginated list of documents that match filter
    */
    public paginate(query:FilterQuery<T> = {}, limit?:number, page?:number, sort?:DbSortQuery<T>, selectedFields?:string[]): Promise<PaginatedDocument<T>> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});

        const options = {
            select: selectedFields || [],
            page: page || 1,
            limit: limit || 10,
            sort: sort || {created_at: -1},
            customLabels: PaginationCustomLabels
        };

        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.Model.paginate(finalQuery, options)
                .then((data: any) => {
                    resolve(data as PaginatedDocument<T>);
                })
                .catch((e:Error) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches a paginated list of documents that matches the provided filter. The specified ref paths are populated
     * @param {FilterQuery<T>} query An optional mongo query to fetch a list of documents that matched the filter
     * @param {number} limit Sets the number of documents per page. Default is 10
     * @param {number} page Sets the page to fetch. Default is 1
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbPopulation<T>} populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param {DbSortQuery<T>} sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns {Promise<PaginatedDocument<T>>} A promise resolving to a paginated list of documents that match filter. The ref paths are populated with it's parent documents
    */
    public paginateAndPopulate(query:FilterQuery<T> = {}, limit?:number, page?:number, populatedFields?:DbPopulation<T>, selectedFields?:string[], sort?:DbSortQuery<T>): Promise<PaginatedDocument<T>> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        const options = {
            select: selectedFields || [],
            page: page || 1,
            limit: limit || 10,
            sort: sort || {created_at: -1},
            customLabels: PaginationCustomLabels,
            populate: populatedFields || []
        };

        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.Model.paginate(finalQuery, options)
                .then((data: any) => {
                    resolve(data as PaginatedDocument<T>);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document with the provided id.
     * @param {string} id The object id of the document to be fetched
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to a mongodb document.
    */
   public findById(id: string, selectedFields?:string[], session?:ClientSession): Promise<TDocument> {
        return new Promise((resolve, reject) => {
            this.Model.findById(id)
                .session(session || null)
                .select(selectedFields || [])
                .then((data) => {
                    resolve(data as TDocument);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document with the provided id. The specified ref paths are populated
     * @param {string} id The object id of the document to be fetched
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbPopulation<T>} populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public findByIdAndPopulate(id:string, populatedFields?:DbPopulation<T>, selectedFields?:string[], session?:ClientSession): Promise<TDocument> {
        return new Promise((resolve, reject) => {
            this.Model.findById(id)
            //@ts-ignore
                .populate(populatedFields || [])
                .session(session || null)
                .select(selectedFields || [])
                .then((data) => {
                    resolve(data as TDocument);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document that matched the provided filter.
     * @param {FilterQuery<T>} query An mongo query to fetch a document that matches the filter
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to a mongodb document.
    */
    public findOne(query:FilterQuery<T> = {}, selectedFields?:string[], session?:ClientSession): Promise<TDocument> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.findOne(finalQuery)
                .session(session || null)
                .select(selectedFields || [])
                .then((data) => {
                    resolve(data as TDocument);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document that matched the provided filter. The specified ref paths are populated
     * @param {FilterQuery<T>} query An optional mongo query to fetch a list of documents that match filter
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param {DbPopulation<T>} populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public findOneAndPopulate(query:FilterQuery<T> = {},  populatedFields?:DbPopulation<T>, selectedFields?:string[], session?:ClientSession): Promise<TDocument> {
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.findOne(finalQuery)
            //@ts-ignore
                .populate(populatedFields)
                .session(session || null)
                .select(selectedFields || [])
                .then((data:any) => {
                    resolve(data as TDocument);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Updates a document that matches the provided object id
     * @param {string} id The object id of the document to be updated
     * @param {UpdateQuery<T>} data The update to be made
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns {Promise<TDocument>} A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public updateById(id:string, data:UpdateQuery<T>, session?:ClientSession, selectedFields?:string[]): Promise<TDocument> {
        return new Promise((resolve, reject) => {
            this.Model.findByIdAndUpdate(id, data, {new: true})
            .session(session || null)
            .select(selectedFields || [])
            .then((data) => {
                resolve(data as TDocument);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Updates a document that matches the provided object filter
     * @param {FilterQuery<T>} query An optional mongo query to match the document that's to be updated
     * @param {UpdateQuery<T>} data The update to be made
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns {Promise<TDocument>} A promise resolving to the updated mongodb document.
    */
    public updateOne(query:FilterQuery<T>, data:UpdateQuery<T>, session?:ClientSession, selectedFields?:string[]): Promise<TDocument> {
        return new Promise((resolve, reject) => {
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            this.Model.findOneAndUpdate(finalQuery, data, {new: true})
            .session(session || null)
            .select(selectedFields || [])
            .then((data) => {
                resolve(data as TDocument);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Updates a document that matches the provided object filter
     * @param {FilterQuery<T>} query An optional mongo query to match the document that's to be updated
     * @param {UpdateQuery<T>} data The update to be made
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @param {string[]} selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns {Promise<UpdateWriteOpResult>} A promise resolving to an object that contains:
     * - acknowledged, a boolean, that's set to true, if a successful update was made
     * - matchedCount, the number of documents that matched the provided query
     * - modifiedCount, the number of documents that were updated
     * - upsertedCount, the number of documents that were upserted
     * - upsertedId, the id of the upserted document
    */
    public updateMany(query:FilterQuery<T>, data:UpdateQuery<T>, session?:ClientSession, selectedFields?:string[]): Promise<UpdateWriteOpResult> {
        return new Promise((resolve, reject) => {
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            this.Model.updateMany(finalQuery, data, {new: true})
            .session(session || null)
            .select(selectedFields || [])
            .then((data) => {
                resolve(data);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Deletes all documents that match the provided filter
     * @param {FilterQuery<T>} query An optional mongo query to match the documents that are to be deleted
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<DeleteResult>} A promise resolving to DeleteResult.
    */
    public deleteMany(query:FilterQuery<T>, session?:ClientSession): Promise<DeleteResult> {
        try {
            return this.Model.deleteMany(query).session(session || null).exec() as Promise<DeleteResult>
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes the first document that matches the provided filter
     * @param {FilterQuery<T>} query An optional mongo query to match the document to be deleted
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to the deleted document.
    */
    public deleteOne(query:FilterQuery<T>, session?:ClientSession): Promise<TDocument> {
        try {
            return this.Model.findOneAndDelete(query).session(session || null).exec() as Promise<TDocument>;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes the document with the id
     * @param {FilterQuery<T>} query An optional mongo query to match the document to be deleted
     * @param {ClientSession} session An optional mongoose client session, required if the operation is in a transaction
     * @returns {Promise<TDocument>} A promise resolving to the deleted document.
    */
    public deleteById(query:FilterQuery<T>, session?:ClientSession): Promise<TDocument> {
        try {
            return this.Model.findByIdAndDelete(query).session(session || null).exec() as Promise<TDocument>;
            
        } catch (error) {
            throw error;
        }
    }
}

export default DBQuery;