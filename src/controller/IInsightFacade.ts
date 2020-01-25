/*
 * This is the primary high-level API for the project. In this folder there should be:
 * A class called InsightFacade, this should be in a file called InsightFacade.ts.
 * You should not change this interface at all or the test suite will not work.
 */

export interface InsightCourseDataFromZip {
    "tier_eighty_five": number;
    "tier_ninety": number;
    "Title": string;
    "Section": string;
    "Detail": string;
    "tier_seventy_two": number;
    "Other": number;
    "Low": number;
    "tier_sixty_four": number;
    "id": number;
    "tier_sixty_eight": number;
    "tier_zero": number;
    "tier_seventy_six": number;
    "tier_thirty": number;
    "tier_fifty": number;
    "Professor": string;
    "Audit": number;
    "tier_g_fifty": number;
    "tier_forty": number;
    "Withdrew": number;
    "Year": string;
    "tier_twenty": number;
    "Stddev": number;
    "Enrolled": number;
    "tier_fifty_five": number;
    "tier_eighty": number;
    "tier_sixty": number;
    "tier_ten": number;
    "High": number;
    "Course": string;
    "Session": string;
    "Pass": number;
    "Fail": number;
    "Avg": number;
    "Campus": string;
    "Subject": string;
}

export interface InsightCourse {
    courses_dept: string;
    courses_id: string;
    courses_avg: number;
    courses_instructor: string;
    courses_title: string;
    courses_pass: number;
    courses_fail: number;
    courses_audit: number;
    courses_uuid: string;
    courses_year: number;
}

export enum InsightDatasetKind {
    Courses = "courses",
    Rooms = "rooms",
}

export interface InsightDataset {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
}

export class InsightError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, InsightError);
    }
}

export class InvalidYearError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, InvalidYearError);
    }
}

export class InvalidStddevError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, InvalidStddevError);
    }
}

export class FoundCacheError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, FoundCacheError);
    }
}

export class NotFoundError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, NotFoundError);
    }
}

export class ResultTooLargeError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, ResultTooLargeError);
    }
}

export interface IInsightFacade {
    /**
     * Add a dataset to insightUBC.
     *
     * @param id  The id of the dataset being added. Follows the format /^[^_]+$/
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     * @param kind  The kind of the dataset
     *
     * @return Promise <string[]>
     *
     * The promise should fulfill on a successful add, reject for any failures.
     * The promise should fulfill with a string array,
     * containing the ids of all currently added datasets upon a successful add.
     * The promise should reject with an InsightError describing the error.
     *
     * An id is invalid if it contains an underscore, or is only whitespace characters.
     * If id is the same as the id of an already added dataset, the dataset should be rejected and not saved.
     *
     * After receiving the dataset, it should be processed into a data structure of
     * your design. The processed data structure should be persisted to disk; your
     * system should be able to load this persisted value into memory for answering
     * queries.
     *
     * Ultimately, a dataset must be added or loaded from disk before queries can
     * be successfully answered.
     */
    addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]>;

    /**
     * Remove a dataset from insightUBC.
     *
     * @param id  The id of the dataset to remove. Follows the format /^[^_]+$/
     *
     * @return Promise <string>
     *
     * The promise should fulfill upon a successful removal, reject on any error.
     * Attempting to remove a dataset that hasn't been added yet counts as an error.
     *
     * An id is invalid if it contains an underscore, or is only whitespace characters.
     *
     * The promise should fulfill the id of the dataset that was removed.
     * The promise should reject with a NotFoundError (if a valid id was not yet added)
     * or an InsightError (invalid id or any other source of failure) describing the error.
     *
     * This will delete both disk and memory caches for the dataset for the id meaning
     * that subsequent queries for that id should fail unless a new addDataset happens first.
     */
    removeDataset(id: string): Promise<string>;

    /**
     * Perform a query on insightUBC.
     *
     * @param query  The query to be performed.
     *
     * If a query is incorrectly formatted, references a dataset not added (in memory or on disk),
     * or references multiple datasets, it should be rejected.
     *
     * @return Promise <any[]>
     *
     * The promise should fulfill with an array of results.
     * The promise should reject with an InsightError describing the error.
     */
    performQuery(query: any): Promise<any[]>;

    /**
     * List all currently added datasets, their types, and number of rows.
     *
     * @return Promise <InsightDataset[]>
     * The promise should fulfill an array of currently added InsightDatasets, and will only fulfill.
     */
    listDatasets(): Promise<InsightDataset[]>;
}
