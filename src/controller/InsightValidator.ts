import {InsightCourseDataFromZip, InsightDatasetKind, InsightError, InsightRoom, InsightCourse} from "./IInsightFacade";
import {JSZipObject} from "jszip";

export default class InsightValidator {
    public static arePositiveNumbers(...nums: any): boolean {
        return nums.reduce((accumulator: boolean, num: any) => {
            return (typeof num === "number") && num >= 0 && accumulator;
        }, true);
    }

    public static areNumbers(...nums: any): boolean {
        return nums.reduce((accumulator: boolean, num: any) => {
            return (typeof num === "number") && accumulator;
        }, true);
    }

    public static areStrings(...strs: any): boolean {
        return strs.reduce((accumulator: boolean, str: any) => {
            return (typeof str === "string") && accumulator;
        }, true);
    }

    // Validate whether course json file fits InsightCourse interface
    public static isInsightCourseDataFromZipValid(course: InsightCourseDataFromZip): boolean {
        let year: number = Number(course.Year);
        return year >= 1900 && year < new Date().getFullYear() && !isNaN(year) &&
            InsightValidator.arePositiveNumbers(course.Stddev, course.Avg, course.Pass, course.Fail, course.Audit,
                course.id) && InsightValidator.areStrings(course.Subject, course.Professor, course.Title, course.Course,
                course.Year, course.Section);
    }

    public static isIDvalid(id: string): boolean {
        let reUnderscore = /^.*_.*$/;
        let reOnlySpaces = /^\s*$/;
        if (reUnderscore.test(id) || reOnlySpaces.test(id) || typeof id !== "string") {
            return false;
        }
        return true;
    }

    public static isNotAvalidCourseFilePath(file: JSZipObject): boolean {
        return file.dir || !new RegExp(`^${InsightDatasetKind.Courses}\/.+`).test(file.name);
    }

    public static isValidDatasetKind(kind: InsightDatasetKind) {
        return Object.values(InsightDatasetKind).includes(kind);
    }

    public static isValidInsightRoom(insightRoom: InsightRoom): boolean {
        return insightRoom != null && InsightValidator.isInsightRoom(insightRoom) && InsightValidator.areStrings(
            insightRoom.address, insightRoom.fullname, insightRoom.shortname, insightRoom.number, insightRoom.name,
            insightRoom.type, insightRoom.furniture, insightRoom.href) && InsightValidator.areNumbers(insightRoom.lat,
            insightRoom.lon, insightRoom.seats);
    }

    public static isInsightCourse(insightCourse: InsightRoom| InsightCourse) {
        let insightCourseInterface: InsightCourse = {
            audit: 0,
            avg: 0,
            dept: "",
            fail: 0,
            id: "",
            instructor: "",
            pass: 0,
            title: "",
            uuid: "",
            year: 0
        };
        return Object.keys(insightCourseInterface).reduce((accumulator: boolean, key) => {
            return accumulator && key in insightCourse;
        }, true);
    }

    public static isInsightRoom(insightRoom: InsightRoom| InsightCourse) {
        let insightRoomInterface: InsightRoom = {
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
        return Object.keys(insightRoomInterface).reduce((accumulator: boolean, key) => {
            return accumulator && key in insightRoom;
        }, true);
    }
}
