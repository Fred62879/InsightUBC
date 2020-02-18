import {
    InsightCourse,
    InsightCourseDataFromZip,
    InsightDatasetKind,
    InsightError,
    SelectorOptions
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import Log from "../Util";
import InsightValidator from "./InsightValidator";
import * as parse5 from "parse5";
import {rejects} from "assert";
import {Document, Element} from "parse5";

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
            if (InsightValidator.isNotAvalidCourseFilePath(file)) {
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

    private static hasClassName(node: Element, className: string) {
        return !className || true;
    }

    private static isTag(node: Element, tagName: string) {
        return "tagName" in node && node.tagName === tagName;
    }

    private static findNodeInChildNodes(nodes: Element[], options: SelectorOptions) {
        for (let node of nodes) {
            // if()
        }
    }

    private static parse5selector(node: Element, options: SelectorOptions = {
        tagName: "body",
        className: null,
        findAll: false
    }) {
        return (this.hasClassName(node, options.className) && this.isTag(node, options.className) ?
            node : this.findNodeInChildNodes("childNodes" in node ? node.childNodes : [], options));
    }

    private static readRoomJSZip(jszipRootDir: JSZip, id: string) {
        let dataset: { [key: string]: InsightCourse[] } = {};
        let indexHTML: JSZipObject = jszipRootDir.file("rooms/index.htm");
        if (indexHTML) {

            return indexHTML.async("text").then((htmlString: string) => {
                const document: Element = parse5.parse(htmlString, {scriptingEnabled: true});
                // const table = document.childNodes[1];
            }).then(() => {
                return dataset;
            });
        } else {
            return Promise.reject(new InsightError("Index not found"));
        }
    }

    // REQUIRE: kind === courses or kind === room
    public static readFromZip(id: string, content: string, kind: InsightDatasetKind):
        Promise<{ [key: string]: InsightCourse[] }> {
        return new JSZip().loadAsync(content, {base64: true}).then((jszipRootDir: JSZip) => {
            if (kind === InsightDatasetKind.Courses) {
                return this.readCourseJSZip(jszipRootDir, id);
            } else if (kind === InsightDatasetKind.Rooms) {
                return this.readRoomJSZip(jszipRootDir, id);
            } else {
                // unrreachble
                Promise.reject("Unreachable");
            }
        });
    }
}
