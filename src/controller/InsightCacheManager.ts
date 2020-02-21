import {InsightCourse, InsightCourseDataFromZip, InsightDatasetKind, InsightError, InsightRoom} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import Log from "../Util";
import InsightValidator from "./InsightValidator";
import * as parse5 from "parse5";
import {Element} from "parse5";
import InsightParse5Selector from "./InsightParse5Selector";
import * as http from "http";

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

    private static isBuildingTableOnFrontPage(node: Element): boolean {
        return InsightParse5Selector.isTag(node, "table") && InsightParse5Selector.hasTableHeader(node, "Building");
    }

    private static isRoomTableOnDetailPage(node: Element): boolean {
        return InsightParse5Selector.isTag(node, "table") && InsightParse5Selector.hasTableHeader(node, "Capacity");
    }

    private static getInsightRoomNumberDetailPage(htmlString: string, insightRoom: InsightRoom): InsightRoom[] {
        let insightRooms: InsightRoom[] = [];
        const document: Element = parse5.parse(htmlString);
        const tables: Element[] = InsightParse5Selector.parse5selector(document,
            InsightCacheManager.isRoomTableOnDetailPage);
        if (tables.length > 0) {
            let tBody: Element[] = InsightParse5Selector.parse5selector(tables[0], InsightParse5Selector.isTableBody);
            let tBodyRows: Element[] = InsightParse5Selector.parse5selector(tBody[0],
                InsightParse5Selector.isTableBodyRow);
            return tBodyRows.map((tr: Element) => {
                return InsightCacheManager.getInsightRoomDetailPage(tr, insightRoom);
            });
        } else {
            return [insightRoom];
        }
    }

    private static getInsightRoomIndexPage(tr: Element, jszipRootDir: JSZip): Promise<InsightRoom[]> {
        let insightRoom: InsightRoom = {
            address: "",
            fullname: "",
            furniture: "",
            href: "",
            lat: 0,
            lon: 0,
            name: "",
            number: "",
            seats: 0,
            shortname: "",
            type: ""
        };
        if ("childNodes" in tr) {
            for (let td of tr.childNodes) {
                if (InsightParse5Selector.hasClassName(td, "views-field-field-building-image")) {
                    continue;
                } else if (InsightParse5Selector.hasClassName(td, "views-field-field-building-code")) {
                    insightRoom.shortname = InsightParse5Selector.getTextFromFirstChildTextNode(td);
                } else if (InsightParse5Selector.hasClassName(td, "views-field-title")) {
                    insightRoom.fullname = InsightParse5Selector.getTextFromFirstATag(td);
                } else if (InsightParse5Selector.hasClassName(td, "views-field-field-building-address")) {
                    insightRoom.address = InsightParse5Selector.getTextFromFirstChildTextNode(td);
                } else if (InsightParse5Selector.hasClassName(td, "views-field-nothing")) {
                    let aTag: Element = InsightParse5Selector.parse5selector(td, (node: Element) => {
                        return InsightParse5Selector.isTag(node, "a");
                    })[0];
                    let link: string = InsightParse5Selector.getAttrValue(aTag, "href").replace(/^\./,
                        "rooms"
                    );
                    insightRoom.href = link.replace(/^rooms/, "http://students.ubc.ca");
                    let url: string =
                        `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team87/${insightRoom.address}`;
                    return InsightCacheManager.getGeoLocationAndRoomInfo(url, insightRoom).then(
                        (insightRoomWithGeo: InsightRoom) => {
                            return jszipRootDir.file(link).async("text").then((htmlString: string) => {
                                return InsightCacheManager.getInsightRoomNumberDetailPage(htmlString,
                                    insightRoomWithGeo);
                            });
                        });
                }
            }
        }
        return Promise.resolve(null);
    }

    private static getGeoLocationAndRoomInfo(url: string, insightRoom: InsightRoom):
        Promise<InsightRoom> {
        return new Promise((resolve, reject) => { // https://nodejs.org/api/http.html#http_http_get_url_options_callback
            return http.get(url, (res) => {
                const {statusCode} = res;
                const contentType = res.headers["content-type"];

                let error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error("Invalid content-type.\n" +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {// Consume response data to free up memory
                    res.resume();
                    return;
                }
                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", (chunk) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        if ("lat" in parsedData && "lon" in parsedData) {
                            insightRoom.lat = parsedData.lat;
                            insightRoom.lon = parsedData.lon;
                            resolve(insightRoom);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on("error", (e) => {
                reject(e);
            });
        });
    }

    private static getInsightRoomDetailPage(tr: Element, insightRoom: InsightRoom): InsightRoom {
        if ("childNodes" in tr) {
            for (let td of tr.childNodes) {
                if (InsightParse5Selector.hasClassName(td, "views-field-field-room-number")) {
                    insightRoom.number = InsightParse5Selector.getTextFromFirstATag(td);
                    insightRoom.name = `${insightRoom.shortname}_${insightRoom.number}`;
                } else if (InsightParse5Selector.hasClassName(td, "views-field-field-room-type")) {
                    insightRoom.type = InsightParse5Selector.getTextFromFirstChildTextNode(td);
                } else if (InsightParse5Selector.hasClassName(td, "views-field-field-room-capacity")) {
                    insightRoom.seats = Number(InsightParse5Selector.getTextFromFirstChildTextNode(td));
                } else if (InsightParse5Selector.hasClassName(td, "views-field-field-room-furniture")) {
                    insightRoom.furniture = InsightParse5Selector.getTextFromFirstChildTextNode(td);
                }
            }
            return insightRoom;
        }
        return insightRoom;
    }

    private static getAllInsightRooms(node: Element[], jszipRootDir: JSZip) {
        return Promise.all(node.map((tr: Element) => {
            return InsightCacheManager.getInsightRoomIndexPage(tr, jszipRootDir);
        }));
    }

    private static readRoomJSZip(jszipRootDir: JSZip, id: string): Promise<{ [key: string]: InsightRoom[] }> {
        let dataset: { [key: string]: InsightRoom[] } = {};
        let indexHTML: JSZipObject = jszipRootDir.file("rooms/index.htm");
        if (indexHTML) {
            return indexHTML.async("text").then((htmlString: string) => {
                const document: Element = parse5.parse(htmlString);
                let tables: Element[] = InsightParse5Selector.parse5selector(document,
                    InsightCacheManager.isBuildingTableOnFrontPage);
                let tBody: Element[] = InsightParse5Selector.parse5selector(tables[0],
                    InsightParse5Selector.isTableBody);
                let tBodyRows: Element[] = InsightParse5Selector.parse5selector(tBody[0],
                    InsightParse5Selector.isTableBodyRow);
                return InsightCacheManager.getAllInsightRooms(tBodyRows, jszipRootDir);
            }).then((roomsArray: [InsightRoom[]]) => {
                for (let rooms of roomsArray) {
                    if (rooms.length > 0) {
                        if (!dataset[id]) {
                            dataset[id] = rooms.filter((room: InsightRoom) => {
                                return InsightValidator.isValidInsightRoom(room);
                            });
                        } else {
                            dataset[id] = dataset[id].concat(rooms.filter((room: InsightRoom) => {
                                return InsightValidator.isValidInsightRoom(room);
                            }));
                        }
                    }
                }
                return dataset;
            });
        } else {
            return Promise.reject(new InsightError("Index not found"));
        }
    }

    // REQUIRE: kind === courses or kind === room
    public static readFromZip(id: string, content: string, kind: InsightDatasetKind):
        Promise<{ [key: string]: InsightCourse[] } | { [key: string]: InsightRoom[] }> {
        return new JSZip().loadAsync(content, {base64: true}).then((jszipRootDir: JSZip) => {
            return InsightCacheManager.readRoomOrCourseDataset(jszipRootDir, id, kind);
        });
    }


    private static readRoomOrCourseDataset(jszipRootDir: JSZip, id: string, kind: InsightDatasetKind):
        Promise<{ [key: string]: InsightCourse[] } | { [key: string]: InsightRoom[] }> {
        if (kind === InsightDatasetKind.Courses) {
            return InsightCacheManager.readCourseJSZip(jszipRootDir, id);
        } else if (kind === InsightDatasetKind.Rooms) {
            return InsightCacheManager.readRoomJSZip(jszipRootDir, id);
        } else {// unrreachble
            Promise.reject("Unreachable");
        }
    }
}
