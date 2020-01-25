import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightCourse,
    InsightCourseDataFromZip
} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import {InsightError, NotFoundError, FoundCacheError} from "./IInsightFacade";
import {JSZipObject} from "jszip";
import {rejects} from "assert";
import * as assert from "assert";
import Queryvalid from "./QueryValid";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataset: { [key: string]: InsightCourse[] } = {};
    private ids = new Set<string>();
    // private x = {a: 1, b: 2};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    private getResultArray(json: { [key: string]: any }): object[] {
        if (json.result instanceof Array && json.result.length > 0) {
            return json.result;
        } else if (!(json.result instanceof Array)) {
            throw new InsightError("getResultArray invalid result type");
        } else if (!(json.result.length > 0)) {
            throw new InsightError("getResultArray empty result array");
        }
        throw new InsightError("getResultArray err");
    }

    private courseResultArrayToInsightCourse(courses: any[]): InsightCourse[] {
        if (courses.length === 0) {
            throw new InsightError("courseResultArrayToInsightCourse empty result array");
        }
        let insightCourseDataFromZip: InsightCourseDataFromZip[];
        try {
            insightCourseDataFromZip = courses;
        } catch (e) {
            throw new InsightError("courseResultArrayToInsightCourse courseResultArrayToInsightCourse" +
                " datatype mismatch");
        }
        let result: InsightCourse[] = [];
        insightCourseDataFromZip.forEach((course: InsightCourseDataFromZip) => {
            result.push({
                courses_dept: course["Subject"],
                courses_id: course["Course"],
                courses_avg: course["Avg"],
                courses_instructor: course["Professor"],
                courses_title: course["Title"],
                courses_pass: course["Pass"],
                courses_fail: course["Fail"],
                courses_audit: course["Audit"],
                courses_uuid: "" + course["id"],
                courses_year: parseInt(course["Year"], 10)
            });
        });
        return result;
    }

    private isIDvalid(id: string): boolean {
        return true;
    }

    private readCache(id: string, content: string, kind: InsightDatasetKind):
        Promise<void | { [key: string]: InsightCourse[] }> {
        return fs.readFile("./src/data/" + id + ".json").then((file: Buffer) => {
            return file.toJSON().data;
        }).then((json: any) => {
            let result: { [key: string]: InsightCourse[] } = {};
            if (!this.dataset.hasOwnProperty(id)) {
                this.dataset[id] = json[id];
            }
            return Promise.resolve(json);
        }).catch((err: any) => {
            Log.trace(err);
            if (err instanceof FoundCacheError) {
                throw err;
            }
        });
    }

    private readFromZip(id: string, content: string, kind: InsightDatasetKind) {
        let hasAddedDataset: boolean = false;
        return new JSZip().loadAsync(content, {base64: true}).then((jszipfolder: JSZip) => {
            return jszipfolder.folder("courses");
        }).then((jszipFolder: JSZip) => {
            return Object.values(jszipFolder.files).reduce((promiseChain: Promise<void>, file: JSZipObject) => {
                return promiseChain.then(() => {
                    return new Promise((resolve) => {
                        if (file.dir) {
                            return resolve();
                        }
                        return file.async("text").then((jsonString: string) => {
                            let json: { [key: string]: any } = JSON.parse(jsonString);
                            let resultArray: object[];
                            // resultArray = this.getResultArray(json);
                            try {
                                resultArray = this.getResultArray(json);
                            } catch (e) {
                                // Log.error(e);
                                return resolve();
                                // throw e;
                            }

                            let courses: InsightCourse[];
                            try {
                                courses = this.courseResultArrayToInsightCourse(resultArray);
                            } catch (e) {
                                Log.error(e);
                                return resolve();
                            }
                            if (!this.dataset.hasOwnProperty(id)) {
                                if (!this.dataset[id]) {
                                    this.dataset[id] = [];
                                }
                                hasAddedDataset = true;
                            }
                            if (!hasAddedDataset) {
                                return resolve();
                            } else {
                                this.dataset[id] = this.dataset[id].concat(courses);
                                return resolve();
                            }


                        });
                    });
                });
            }, Promise.resolve());
        });
    }

    // TODO: Fail on large dataset and succeed in debug mode
    // TODO: factor addDataset
    // TODO: check addDataset against test
    // TODO: replace errorthrow hack
    // TODO: fix timeout issue
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let hasAddedDataset: boolean = false;

        if (!this.isIDvalid(id)) {
            throw new InsightError("addDataset Invalid ID");
        }

        this.ids.add(id); // ** added by Fred **I

        return this.readCache(id, content, kind).then(() => {
            return this.readFromZip(id, content, kind);
        }).then(() => {
            if (Object.keys(this.dataset).length > 0) {
                let jsonToWrite = JSON.stringify(this.dataset);
                fs.writeFile("./src/data/" + id + ".json", jsonToWrite).catch((e) => {
                    Log.error(e);
                });
                return Promise.resolve(Object.keys(this.dataset));
            } else {
                return Promise.reject("empty dataset");
            }

        }).catch((err: any) => {
            if (err instanceof FoundCacheError) {
                return Promise.resolve(Object.keys(this.dataset));
            }
            return Promise.reject(err);
        });


        // return new JSZip().loadAsync(content, {base64: true}).then((jszipfolder: JSZip) => {
        //     return jszipfolder.folder("courses");
        // }).then((jszipFolder: JSZip) => {
        //     return Object.values(jszipFolder.files).reduce((promiseChain, file) => {
        //         return promiseChain.then(() => {
        //             return new Promise((resolve) => {
        //                 if (file.dir) {
        //                     return resolve();
        //                 }
        //                 return file.async("text").then((jsonString: string) => {
        //                     let json: { [key: string]: any } = JSON.parse(jsonString);
        //                     let resultArray: object[];
        //                     // resultArray = this.getResultArray(json);
        //                     try {
        //                         resultArray = this.getResultArray(json);
        //                     } catch (e) {
        //                         // Log.error(e);
        //                         return resolve();
        //                         // throw e;
        //                     }
        //
        //                     let courses: InsightCourse[];
        //                     try {
        //                         courses = this.courseResultArrayToInsightCourse(resultArray);
        //                     } catch (e) {
        //                         Log.error(e);
        //                         return resolve();
        //                     }
        //                     if (!this.dataset.hasOwnProperty(id)) {
        //                         if (!this.dataset[id]) {
        //                             this.dataset[id] = [];
        //                         }
        //                         hasAddedDataset = true;
        //                     }
        //                     if (!hasAddedDataset) {
        //                         return resolve();
        //                     } else {
        //                         this.dataset[id] = this.dataset[id].concat(courses);
        //                         return resolve();
        //                     }
        //
        //
        //                 });
        //             });
        //         });
        //     }, Promise.resolve());
        // }).then(() => {
        //     if (!readFromJson) {
        //         let jsonToWrite = JSON.stringify(this.dataset);
        //         fs.writeFile("./data/" + id + ".json", jsonToWrite).catch((e) => {
        //             Log.error(e);
        //         });
        //     }
        //     return Promise.resolve(Object.keys(this.dataset));
        // }).catch((err: any) => {
        //     return Promise.reject(err);
        // });
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        const qv: Queryvalid = new Queryvalid(this.ids);
        const warning = qv.queryValid(query);
        if (warning !== "") {
            return Promise.reject(new InsightError(warning));
        }
        return Promise.reject();
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
