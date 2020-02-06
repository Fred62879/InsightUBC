import Log from "../Util";
import {
    FoundCacheError,
    IInsightFacade,
    InsightCourse,
    InsightCourseDataFromZip,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import * as fs from "fs-extra";
import Queryvalid from "./QueryValid";
import QueryPerform from "./QueryPerform";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataset: { [key: string]: InsightCourse[] } = {};
    private dataPath = "./data/";
    private ids = new Set<string>();

    constructor() {

        Log.trace("InsightFacadeImpl::init()");
    }

    // helper methods
    // Validate whether course json file fits InsightCourse interface
    private isInsightCourseDataFromZipValid(course: InsightCourseDataFromZip): boolean {
        let year: number = Number(course.Year);
        if (year > 1900 && year < new Date().getFullYear() && !isNaN(year) &&
            this.isPositiveNumber([course.Stddev, course.Avg, course.Pass, course.Fail, course.Audit, course.id]) &&
            this.isString([course.Subject, course.Professor, course.Title, course.Course])) {
            return true;
        }
        return false;
    }

    private isPositiveNumber(nums: any[]): boolean {
        return nums.reduce((accumulator, num: any) => {
            return (typeof num === "number") && num >= 0 && accumulator;
        }, true);
    }

    private isString(strs: any[]): boolean {
        return strs.reduce((accumulator, str: any) => {
            return (typeof str === "string") && accumulator;
        }, true);
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
            if (this.isInsightCourseDataFromZipValid(course)) {
                result.push({
                    dept: course["Subject"],
                    id: course["Course"],
                    avg: course["Avg"],
                    instructor: course["Professor"],
                    title: course["Title"],
                    pass: course["Pass"],
                    fail: course["Fail"],
                    audit: course["Audit"],
                    uuid: "" + course["id"],
                    year: parseInt(course["Year"], 10)
                });
            }
        });
        return result;
    }

    private isIDvalid(id: string): boolean {
        let reUnderscore = /^.*_.*$/;
        let reOnlySpaces = /^\s*$/;
        if (reUnderscore.test(id) || reOnlySpaces.test(id)) {
            return false;
        }
        return true;
    }

    private hasID(id: string): boolean {
        if (this.dataset[id]) {
            return true;
        }
        return false;
    }

    private readCache(id: string, kind: InsightDatasetKind):
        Promise<void | { [key: string]: InsightCourse[] }> {
        return fs.readFile(this.dataPath + id + ".json").then((file: Buffer) => {
            return JSON.parse(file.toString());
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
            return Promise.all(Object.values(jszipFolder.files).map((file: JSZipObject) => {
                return new Promise(((resolve0, reject) => {
                    if (file.dir || !(file.name.indexOf("courses") > -1)) {
                        return resolve0();
                    }
                    return file.async("text").then((jsonString: string) => {
                        let json: { [key: string]: any };
                        try {
                            json = JSON.parse(jsonString);
                        } catch (e) {// Log.trace(e);// resolve0(e);
                        }
                        let resultArray: object[];
                        try {
                            resultArray = this.getResultArray(json);
                        } catch (e) {
                            return resolve0(e);
                        }
                        let courses: InsightCourse[];
                        try {
                            courses = this.courseResultArrayToInsightCourse(resultArray);
                        } catch (e) {
                            Log.error(e);
                            return resolve0();
                        }
                        if (!this.dataset.hasOwnProperty(id)) {
                            if (!this.dataset[id] && courses.length > 0) {
                                this.dataset[id] = [];
                                hasAddedDataset = true;
                            }
                        }
                        if (!hasAddedDataset) {
                            return resolve0();
                        } else {
                            this.dataset[id] = this.dataset[id].concat(courses);
                            return resolve0();
                        }
                    });
                }));
            }));
        });
    }

    private getListofCache(): Promise<string[]> {
        return fs.readdir(this.dataPath).then((files: string[]) => {
            return Promise.resolve(files);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    private readAllCacheToMemory(): Promise<void[] | boolean> {
        return this.getListofCache().then((filePath: string[]) => {
            return Promise.all(filePath.map((file: string) => {
                return new Promise((resolve, reject) => {
                    let id = file.replace(".json", "");
                    if (this.hasID(id)) {
                        return resolve(true);
                    }
                    return resolve(this.readCache(id, InsightDatasetKind.Courses));
                });
            }));
        }).then(() => {
            return Promise.resolve(true);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    private deleteCacheFile(id: string): Promise<boolean> {
        return fs.unlink(this.dataPath + id + ".json").then(() => {
            return Promise.resolve(true);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let hasReadFromCache: boolean = false;
        if (!this.isIDvalid(id) || this.hasID(id)) {
            Log.trace(1);
            return Promise.reject(new InsightError("addDataset Invalid ID"));
        }
        if (kind !== "courses") {
            Log.trace(2);
            return Promise.reject(new InsightError("addDataset Invalid kind"));
        }
        return this.readAllCacheToMemory().then(() => {
            if (this.dataset[id]) {
                return Promise.resolve(Object.keys(this.dataset));
            } else {
                return this.readFromZip(id, content, kind);
            }
        }).then(() => {
            if (Object.keys(this.dataset).length > 0 && Object.values(this.dataset)[0].length > 0) {
                if (!hasReadFromCache) {
                    this.ids.add(id);
                    let jsonToWrite = JSON.stringify(this.dataset);
                    fs.writeFile(this.dataPath + id + ".json", jsonToWrite).catch((e) => {
                        Log.error(e);
                    });
                }
                return Promise.resolve(Object.keys(this.dataset));
            } else {
                return Promise.reject(new InsightError("empty dataset"));
            }
        }).catch((err: any) => {
            return Promise.reject(new InsightError(err));
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.isIDvalid(id)) {
            return Promise.reject(new InsightError("removeDataset Invalid ID"));
        }
        let hasDeletedFromMemory = false;
        if (this.dataset[id]) {
            delete this.dataset[id];
            hasDeletedFromMemory = true;
        }
        return this.deleteCacheFile(id).then((hasDeleted: boolean) => {
            return Promise.resolve(id);
        }).catch((err) => {
            if (hasDeletedFromMemory) {
                return Promise.resolve(id);
            }
            return Promise.reject(new NotFoundError(err));
        });
    }

    // For testing only
    public clearMemory() { this.dataset = {}; }

    public performQuery(query: any): Promise<any[]> {
        return this.readAllCacheToMemory().then(() => {
            const qv: Queryvalid = new Queryvalid(new Set(Object.keys(this.dataset)));
            const warning = qv.queryValid(query);
            if (warning !== "") {
                return Promise.reject(new InsightError(warning));
            }
            const qp: QueryPerform = new QueryPerform(this.dataset);
            return qp.run(query);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];
        return this.readAllCacheToMemory().then(() => {
            Object.keys(this.dataset).map((id: string) => {
                insightDatasets.push({
                    id: id,
                    kind: InsightDatasetKind.Courses,
                    numRows: this.dataset[id].length
                });
            });
            return Promise.resolve(insightDatasets);
        }).catch((err) => {
            return Promise.reject(new InsightError(err));
        });

    }
}
