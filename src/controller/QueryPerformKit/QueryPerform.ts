import {InsightCourse, ResultTooLargeError} from "../IInsightFacade";
import Log from "../../Util";
import * as assert from "assert";
import {QueryUtils} from "../QueryUtils";
import {ApplyOperations} from "./ApplyOperations";
import {FilterUtils} from "./FilterUtils";

export interface SelectedFields {
    [key: string]: any;
}

export default class QueryPerform {
    // utilities
    private qu = new QueryUtils();
    private ao = new ApplyOperations();
    private fu = new FilterUtils(this.qu);

    private id: string;
    private colKeys = new Set<string>();
    private groupKeys: string[] = [];

    // datasets
    private res: SelectedFields[] = [];
    private validDataset: SelectedFields[] = [];
    private groupCorr = new Map();
    private groupedDataset: SelectedFields[][] = [];
    private dataset: { [key: string]: InsightCourse[] };

    constructor(dataset: { [key: string]: InsightCourse[] }) {
        this.dataset = dataset;
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

    // compress sets in a group into a single set
    private conversion(sets: SelectedFields[], aptk: string, key: string): void {
        let val: number;
        key = key.split("_")[1];
        if (aptk === "AVG") {
            val = this.ao.avgOperation(sets, key);
        } else if (aptk === "MAX") {
            val = this.ao.minMaxOperation(sets, key, 1);
        } else if (aptk === "MIN") {
            val = this.ao.minMaxOperation(sets, key, 0);
        } else if (aptk === "SUM") {
            val = this.ao.sumOperation(sets, key);
        } else {
            assert(aptk === "COUNT");
            val = this.ao.countOperation(sets, key);
        }
        Log.trace(aptk + " " + val);

        let obj: { [k: string]: any } = {};
        obj[key] = val;
        Log.trace(obj);
        this.res.push(obj);
    }

    private calculation(applyBody: any): void {
        let applyToken = Object.keys(applyBody)[0]; // MAX, MIN, AVG ...
        let key = applyBody[applyToken];
        // Log.trace(this.groupedDataset.length);
        for (let sets of this.groupedDataset) {
            this.conversion(sets, applyToken, key);
        }
    }

    private apply(query: any): void {
        const applyArray = query["TRANSFORMATIONS"]["APPLY"];
        for (let applyRule of applyArray) {
            let applyKey = Object.keys(applyRule)[0];
            if (this.colKeys.has(applyKey)) {
                this.calculation(applyRule[applyKey]);
            }
        }
    }

    private group(query: any): void {
        // Log.trace(this.validDataset.length);
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
        // Log.trace(this.groupedDataset.length);
    }

    private transform(query: any): void {
        this.group(query); // group datasets according to GROUP rules
        this.apply(query);
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


    // ** FilterUtils helper methods

    private filter(query: any): void {
        let body = query["WHERE"];
        // TODO: pass by ref? possible errors
        if (!Object.keys(body).length) {
            this.validDataset = this.dataset[this.id];
        }
        for (let section of this.dataset[this.id]) {
            if (this.fu.perform(body, section)) {
                this.validDataset.push(section);
            }
        }
    }


    // ** Running query operator
    public run(query: any): Promise<any[]> {
        this.qu.setup(query);
        this.id = this.qu.getCurID();

        this.filter(query);  // get valid sections and store in validDataset
        if (this.validDataset.length >= 5000 && !this.qu.getHasTrans()) {  // if no GROUP
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
