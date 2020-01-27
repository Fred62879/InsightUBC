import {InsightCourse, ResultTooLargeError} from "./IInsightFacade";
import Log from "../Util";
import * as assert from "assert";

export interface SelectedFields {
    [key: string]: any;
}

export default class QueryPerform {

    private id: string;
    private res: SelectedFields[] = [];
    private validDataset: SelectedFields[]  = [];
    private dataset: { [key: string]: InsightCourse[] };

    // for filter
    private logic = new Set();
    private mcomp = new Set();
    private scomp = new Set();
    private neg = new Set();

    constructor(dataset: { [key: string]: InsightCourse[] }) {
        this.dataset = dataset;
        this.logic.add("AND"), this.logic.add("OR");
        this.mcomp.add("GT"), this.mcomp.add("LT"), this.mcomp.add("EQ");
        this.scomp.add("IS"), this.neg.add("NOT");
    }

    // return index position of underscore in key, or n if no underscore
    private trailID(key: string): number {
        let a = 0;
        while (a < key.length && key[a] !== "_") { a++; }
        return a;
    }

    // get dataset id of current query
    private getID(query: any): void {
        let key = query["OPTIONS"]["COLUMNS"][0];
        let bd = this.trailID(key);
        this.id = key.substring(0, bd);
        assert(this.dataset.hasOwnProperty(this.id));
    }

    private logicFilter(operator: string, body: any, section: any): boolean {
        if (operator === "AND") {
            for (let obj of body["AND"]) {
                if (!this.perform(obj, section)) { return false; }
            }
        } else {
            assert(operator === "OR");
            for (let obj of body["OR"]) {
                if (this.perform(obj, section)) { return true; }
            }
        }
    }

    private mCompFilter(operator: string, body: any, section: any): boolean {
        let obj = body[operator];
        let key = Object.keys(obj)[0];
        let bd = this.trailID(key);

        let mfield = key.substring(bd + 1);
        let num = obj[key];

        if (operator === "GT") {
            return section[mfield] > num;
        } else if (operator === "LT") {
            return section[mfield] < num;
        } else if (operator === "") {
            return section[mfield] === num;
        }
        return false;
    }

    private sCompFilter(operator: string, body: any, section: any): boolean {
        let obj = body[operator];
        let key = Object.keys(obj)[0];
        let bd = this.trailID(key);

        let sfield = key.substring(bd + 1);
        let str = obj[key];
        return section[sfield] === str;
    }

    private nFilter(operator: string, body: any, section: any): boolean {
        return !this.perform(body[operator], section);
    }

    // helper methods for filter, perform query on each section
    private perform(body: any, section: any): boolean {
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

    //
    private filter(query: any): void {
        let body = query["WHERE"];
        Log.trace(body);
        for (let section of this.dataset[this.id]) {
            if (this.perform(body, section)) {
                this.validDataset.push(section);
            }
        }

        for (let section of this.validDataset) {
            Log.trace(section);
        }
    }

    private extract(query: any): void {
        let cols: string[] = query["OPTIONS"]["COLUMNS"];
        for (let section of this.validDataset) {
            let obj: {[k: string]: any} = {};
            for (let col of cols) {
                let bd = this.trailID(col);
                let field = col.substring(bd + 1);
                obj[col] = section[field];
            }
            this.res.push(obj);
        }
    }

    private order(query: any): void {
        let ordKey = query["OPTIONS"]["ORDER"];
        if (ordKey === undefined) { return; }
        this.res.sort((e1, e2) => e1[ordKey] - e2[ordKey]);
    }

    // Operate query and return promise result
    public run(query: any): Promise<any[]> {
        this.getID(query);   // get current dataset id
        this.filter(query);  // get valid sections and store in validDataset
        this.extract(query); // leave on required fields for sections in validDataset

        if (this.res.length >= 5000) { return Promise.reject(new ResultTooLargeError("More than 5000 results")); }
        this.order(query);   // order required fields
        return Promise.resolve(this.res);
    }
}
