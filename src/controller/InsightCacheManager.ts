import {InsightCourse, InsightCourseDataFromZip, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import Log from "../Util";
import InsightValidator from "./InsightValidator";
import {rejects} from "assert";

export default class InsightCacheManager {

    private static getResultArray(json: { [key: string]: any }): object[] {
        if (json.result instanceof Array && json.result.length > 0) {
            return json.result;
        } else if (!(json.result instanceof Array)) {
            throw new InsightError("getResultArray invalid result type");
        } else if (!(json.result.length > 0)) {
            throw new InsightError("getResultArray empty result array");
        }
        throw new InsightError("getResultArray err");
    }

    private static courseResultArrayToInsightCourse(courses: any[]): InsightCourse[] {
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
            if (course.Section === "overall") {
                course.Year = "1900";
            }
            if (InsightValidator.isInsightCourseDataFromZipValid(course)) {
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

    private static readCourseJSZip(jszipRootDir: JSZip, id: string): Promise<{ [key: string]: InsightCourse[] }> {
        let dataset: { [key: string]: InsightCourse[] } = {};
        let hasAddedDataset: boolean = false;
        let jszipFolder = jszipRootDir.folder(InsightDatasetKind.Courses);
        return Promise.all(Object.values(jszipFolder.files).map((file: JSZipObject) => {
            if (file.dir || !new RegExp(`^${InsightDatasetKind.Courses}\/.+`).test(file.name)) {
                return Promise.resolve("Not a valid valid path");
            } else {
                return file.async("text");
            }
        })).then((courseDataStringArray: string[]) => {
            return Promise.all(courseDataStringArray.map((courseDataString: string) => {
                let json: { [key: string]: any };
                try {
                    json = JSON.parse(courseDataString);
                } catch (e) {// Log.trace(e);// resolve0(e);
                }
                let resultArray: object[];
                try {
                    resultArray = this.getResultArray(json);
                } catch (e) {
                    return Promise.resolve(e);
                }
                let courses: InsightCourse[];
                try {
                    courses = this.courseResultArrayToInsightCourse(resultArray);
                } catch (e) {
                    Log.error(e);
                    return Promise.resolve();
                }
                if (!dataset.hasOwnProperty(id)) {
                    if (!dataset[id] && courses.length > 0) {
                        dataset[id] = [];
                        hasAddedDataset = true;
                    }
                }
                if (!hasAddedDataset) {
                    return Promise.resolve();
                } else {
                    dataset[id] = dataset[id].concat(courses);
                    return Promise.resolve();
                }
            }));
        }).then(() => {
            return dataset;
        });
    }

    private static readRoomJSZip() {
        let dataset: { [key: string]: InsightCourse[] } = {};
        return dataset;
    }

    // REQUIRE: kind === courses or kind === room
    public static readFromZip(id: string, content: string, kind: InsightDatasetKind):
        Promise<{ [key: string]: InsightCourse[] }> {
        return new JSZip().loadAsync(content, {base64: true}).then((jszipRootDir: JSZip) => {
            if (kind === InsightDatasetKind.Courses) {
                return this.readCourseJSZip(jszipRootDir, id);
            } else if (kind === InsightDatasetKind.Rooms) {
                return this.readRoomJSZip();
            } else {
                // unrreachble
                Promise.reject("Unreachable");
            }
        });
    }
}
