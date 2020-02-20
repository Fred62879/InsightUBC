import {InsightCourse, InsightRoom, ResultTooLargeError} from "../IInsightFacade";
import Log from "../../Util";
import * as assert from "assert";
import {QueryUtils} from "../QueryUtils";

export interface SelectedFields {
    [key: string]: any;
}

export default class QueryPerform {
    private id: string;
    private qu = new QueryUtils();

    private colKeys = new Set<string>();
    private groupKeys: string[] = [];

    // datasets
    private res: SelectedFields[] = [];
    private validDataset: SelectedFields[] = [];
    // private validDataset: InsightCourse[] = [];
    private groupCorr = new Map();
    private groupedDataset: SelectedFields[][] = [];
    private dataset: { [key: string]: InsightCourse[] | InsightRoom[] };

    // for filter
    private logic = new Set();
    private mcomp = new Set();
    private scomp = new Set();
    private neg = new Set();

    constructor(dataset: { [key: string]: InsightCourse[] | InsightRoom[] }) {
        this.dataset = dataset;
        this.logic.add("AND"), this.logic.add("OR");
        this.mcomp.add("GT"), this.mcomp.add("LT"), this.mcomp.add("EQ");
        this.scomp.add("IS"), this.neg.add("NOT");
    }

    private getColKeys(query: any): void {
        let col = query["OPTIONS"]["COLUMNS"];
        for (let key of col) {
            this.colKeys.add(key);
        }
    }

    private getGroupKeys(query: any): void {
        let group = query["TRANSFORMATIONS"]["GROUP"];
        for (let key of group) {
            this.groupKeys.push(key.split("_")[1]);
        }
    }

    private order(query: any): void {
        let ordKey = query["OPTIONS"]["ORDER"];
        if (ordKey === undefined) {
            return;
        }
        this.res.sort((e1, e2) => e1[ordKey] - e2[ordKey]);
    }


    // ** TRANSFORMATIONS helper methods
    private group(query: any): void {
        Log.trace(this.validDataset.length);
        for (let unit of this.validDataset) {
            let curkey = "";
            for (let key of this.groupKeys) {
                curkey += unit[key] + " ";
            }
            if (!this.groupCorr.has(curkey)) {
                this.groupedDataset.push([unit]);
                this.groupCorr.set(curkey, this.groupedDataset.length - 1);
            } else {
                this.groupedDataset[this.groupCorr.get(curkey)].push(unit);
            }
        }
        Log.trace(this.groupedDataset.length);
    }

    private transform(query: any): void {
        this.group(query);
    }

    // private extract(query: any): void {
    //     let cols: string[] = query["OPTIONS"]["COLUMNS"];
    //     for (let section of this.validDataset) {
    //         let obj: { [k: string]: any } = {};
    //         for (let col of cols) {
    //             Log.trace(col);
    //             let bd = this.qu.trailID(col);
    //             let field = col.substring(bd + 1);
    //             obj[col] = section[field];
    //         }
    //         this.res.push(obj);
    //     }
    // }


    // ** Filter helper methods
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

    private filter(query: any): void {
        let body = query["WHERE"];
        // TODO: pass by ref? possible errors
        if (!Object.keys(body).length) {
            this.validDataset = this.dataset[this.id];
        }
        for (let section of this.dataset[this.id]) {
            if (this.perform(body, section)) {
                this.validDataset.push(section);
            }
        }
    }


    // ** Running query operator
    public run(query: any): Promise<any[]> {
        this.qu.setup(query);
        this.id = this.qu.getCurID();

        this.filter(query);  // get valid sections and store in validDataset
        if (this.validDataset.length >= 5000) {
            return Promise.reject(new ResultTooLargeError("More than 5000 results"));
        }

        this.getColKeys(query); // get all COLUMNS keys
        if (this.qu.getHasTrans()) {
            this.getGroupKeys(query);
        }

        // this.extract(query);    // leave only required fields for sections in validDataset
        if (this.qu.getHasTrans()) {
            this.transform(query);
        }
        this.order(query);   // order required fields
        return Promise.resolve(this.res);
    }
}
