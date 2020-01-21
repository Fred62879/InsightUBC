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
import {InsightError, NotFoundError} from "./IInsightFacade";
import {JSZipObject} from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataset: { [key: string]: InsightCourse[] } = {};

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

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let readFromJson: boolean = false;
        let promiseSequence: Promise<any> = Promise.resolve();
        if (!this.isIDvalid(id)) {
            throw new InsightError("addDataset Invalid ID");
        }
        new JSZip().loadAsync(content, {base64: true}).then((jszipfolder: JSZip) => {
            return jszipfolder.folder("courses");
        }).then((jszipFolder: JSZip) => {
            return jszipFolder.forEach((path: string, file: JSZipObject) => {
                // promiseSequence = promiseSequence.then(() => {
                //     return file.async("text").then((jsonString: string) => {
                //         let json: { [key: string]: any } = JSON.parse(jsonString);
                //         let resultArray: object[];
                //         // resultArray = this.getResultArray(json);
                //         try {
                //             resultArray = this.getResultArray(json);
                //         } catch (e) {
                //             Log.error(e);
                //             return;
                //             // throw e;
                //         }
                //         if (!this.dataset.hasOwnProperty(id)) {
                //             let courses: InsightCourse[];
                //             try {
                //                 courses = this.courseResultArrayToInsightCourse(resultArray);
                //             } catch (e) {
                //                 Log.error(e);
                //                 return;
                //             }
                //             if (!this.dataset[id]) {
                //                 this.dataset[id] = [];
                //             }
                //             return this.dataset[id] = this.dataset[id].concat(courses);
                //         }
                //     });
                // });
                return file.async("text").then((jsonString: string) => {
                    let json: { [key: string]: any } = JSON.parse(jsonString);
                    let resultArray: object[];
                    // resultArray = this.getResultArray(json);
                    try {
                        resultArray = this.getResultArray(json);
                    } catch (e) {
                        Log.error(e);
                        return;
                        // throw e;
                    }
                    if (!this.dataset.hasOwnProperty(id)) {
                        let courses: InsightCourse[];
                        try {
                            courses = this.courseResultArrayToInsightCourse(resultArray);
                        } catch (e) {
                            Log.error(e);
                            return;
                        }
                        if (!this.dataset[id]) {
                            this.dataset[id] = [];
                        }
                        return this.dataset[id] = this.dataset[id].concat(courses);
                    }
                });
            });
        }).catch((err: any) => {
            return Promise.reject(err);
        });
        setTimeout(() => {
            // TODO store data cache at the end
            if (!readFromJson) {
                let jsonToWrite = JSON.stringify(this.dataset);
                fs.writeFile("./data/" + id + ".json", jsonToWrite).catch((e) => {
                    Log.error(e);
                });
            }
        }, 5000);

        // TODO debug the promised is resolved before any error thrown.
        return Promise.resolve(Object.keys(this.dataset));
    }


    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
