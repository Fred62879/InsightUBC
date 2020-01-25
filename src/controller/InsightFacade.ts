import Log from "../Util";
import {
    FoundCacheError,
    IInsightFacade,
    InsightCourse,
    InsightCourseDataFromZip,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    InvalidStddevError,
    InvalidYearError,
    NotFoundError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import * as fs from "fs-extra";
import Queryvalid from "./QueryValid";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataset: { [key: string]: InsightCourse[] } = {};
    private dataPath = "./src/data/";
    // private x = {a: 1, b: 2};
    private ids = new Set<string>();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    // Validate whether course json file fits InsightCourse interface
    private isInsightCourseDataFromZipValid(course: InsightCourseDataFromZip): boolean {
        let year: number;
        try {
            year = Number(course.Year);
        } catch (e) {
            Log.trace(e);
            throw new InvalidYearError();
        }
        if (year < 1900 || year > new Date().getFullYear()) {
            throw new InvalidYearError(`Year ${year} is not a valid year`);
        }

        let stddev: number;
        if (!(typeof course.Stddev === "number") || course.Stddev < 0) {
            throw new InvalidStddevError();
        }


        return true;
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

    private readCache(id: string, content: string, kind: InsightDatasetKind):
        Promise<void | { [key: string]: InsightCourse[] }> {
        let test;
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
            // return new Promise(((resolve) => resolve()));
            return Promise.all(Object.values(jszipFolder.files).map((file: JSZipObject) => {
                return new Promise(((resolve0, reject) => {

                    if (file.dir) {
                        return resolve0();
                    }
                    return file.async("text").then((jsonString: string) => {
                        let json: { [key: string]: any };
                        try {
                            json = JSON.parse(jsonString);
                        } catch (e) {
                            Log.trace(e);
                            resolve0(e);
                        }
                        let resultArray: object[];
                        // resultArray = this.getResultArray(json);
                        try {
                            resultArray = this.getResultArray(json);
                        } catch (e) {
                            // Log.error(e);
                            return resolve0(e);
                            // throw e;
                        }

                        let courses: InsightCourse[];
                        try {
                            courses = this.courseResultArrayToInsightCourse(resultArray);
                        } catch (e) {
                            Log.error(e);
                            return resolve0();
                        }
                        if (!this.dataset.hasOwnProperty(id)) {
                            if (!this.dataset[id]) {
                                this.dataset[id] = [];
                            }
                            hasAddedDataset = true;
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

    // TODO: check addDataset against test
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let hasReadFromCache: boolean = false;

        if (!this.isIDvalid(id)) {
            return Promise.reject(new InsightError("addDataset Invalid ID"));
        }
        if (kind !== "courses") {

            return Promise.reject(new InsightError("addDataset Invalid kind"));
        }

        this.ids.add(id); // ** added by Fred **I

        return this.readCache(id, content, kind).then(() => {
            if (this.dataset[id]) {
                hasReadFromCache = true;
                return;
            }
            return this.readFromZip(id, content, kind);
        }).then(() => {
            if (Object.keys(this.dataset).length > 0 && Object.values(this.dataset)[0].length > 0) {
                if (!hasReadFromCache) {
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
            if (err instanceof FoundCacheError) {
                return Promise.resolve(Object.keys(this.dataset));
            }
            Log.trace(err);
            return Promise.reject(err);
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.isIDvalid(id)) {
            return Promise.reject(new InsightError("addDataset Invalid ID"));
        }
        if (this.dataset[id]) {
            delete this.dataset[id];
            return Promise.resolve(id);
        }
        return Promise.reject(new NotFoundError("dataset not found"));
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
        let insightDatasets: InsightDataset[] = [];
        Object.keys(this.dataset).map((id: string) => {
            insightDatasets.push({
                id: id,
                kind: InsightDatasetKind.Courses,
                numRows: this.dataset[id].length
            });
        });
        return Promise.resolve(insightDatasets);
    }
}
