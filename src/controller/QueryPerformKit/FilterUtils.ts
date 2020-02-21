import * as assert from "assert";
import {QueryUtils} from "../QueryUtils";

export class FilterUtils {
    private qu: QueryUtils;
    private logic = new Set();
    private mcomp = new Set();
    private scomp = new Set();
    private neg = new Set();

    constructor(qu: QueryUtils) {
        this.qu = qu;
        this.logic.add("AND");
        this.logic.add("OR");
        this.mcomp.add("GT");
        this.mcomp.add("LT");
        this.mcomp.add("EQ");
        this.scomp.add("IS");
        this.neg.add("NOT");
    }

    private nFilter(operator: string, body: any, section: any): boolean {
        return !this.perform(body[operator], section);
    }

    private sCompFilter(operator: string, body: any, section: any): boolean {
        let obj = body[operator];
        let key = Object.keys(obj)[0];
        let bd = this.qu.trailID(key);

        let sfield = key.substring(bd + 1);
        let str: string = obj[key];
        let regex = new RegExp(`^${str.replace(/\*/g, ".*")}$`);
        return regex.test(section[sfield]);
    }

    private mCompFilter(operator: string, body: any, section: any): boolean {
        let obj = body[operator];
        let key = Object.keys(obj)[0];
        let bd = this.qu.trailID(key);

        let mfield = key.substring(bd + 1);
        let num = obj[key];

        if (operator === "GT") {
            return section[mfield] > num;
        } else if (operator === "LT") {
            return section[mfield] < num;
        } else if (operator === "EQ") {
            return section[mfield] === num;
        }
        return false;
    }

    private logicFilter(operator: string, body: any, section: any): boolean {
        if (operator === "AND") {
            for (let obj of body["AND"]) {
                if (!this.perform(obj, section)) {
                    return false;
                }
            }
            return true;
        } else {
            assert(operator === "OR");
            for (let obj of body["OR"]) {
                if (this.perform(obj, section)) {
                    return true;
                }
            }
            return false;
        }
    }

    // helper methods for filter, perform query on each section
    public perform(body: any, section: any): boolean {
        let operator = Object.keys(body)[0];
        if (this.logic.has(operator)) {
            return this.logicFilter(operator, body, section);
        } else if (this.mcomp.has(operator)) {
            return this.mCompFilter(operator, body, section);
        } else if (this.scomp.has(operator)) {
            return this.sCompFilter(operator, body, section);
        } else {
            assert(operator === "NOT");
            return this.nFilter(operator, body, section);
        }
    }
}
