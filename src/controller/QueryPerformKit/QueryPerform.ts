import {InsightCourse, InsightRoom, ResultTooLargeError} from "../IInsightFacade";
import Log from "../../Util";
import * as assert from "assert";
import {QueryUtils} from "../QueryUtils";
import {ApplyOperations} from "./ApplyOperations";
import {FilterUtils} from "./FilterUtils";

export interface SelectedFields {
    [key: string]: any;
}

export default class QueryPerform {
    private id: string;

    // utilities
    private qu = new QueryUtils();
    private ao: ApplyOperations;
    private fu = new FilterUtils(this.qu);

    // datasets
    private res: SelectedFields[] = [];
    private validDataset: SelectedFields[] = [];
    private dataset: { [key: string]: InsightCourse[]| InsightRoom[] };


    constructor(dataset: { [key: string]: InsightCourse[]| InsightRoom[] }) {
        this.dataset = dataset;
    }

    private extract(query: any): void {
        let cols: string[] = query["OPTIONS"]["COLUMNS"];
        for (let section of this.validDataset) {
            let obj: { [k: string]: any } = {};
            for (let col of cols) {
                let bd = this.qu.trailID(col);
                let field = bd < col.length ? col.substring(bd + 1) : col;
                obj[col] = section[field];
            }
            this.res.push(obj);
        }
    }

    // sort by given key, order: 1-ascending, -1-descending
    private sort(key: string, order: number): void {
        this.res.sort((e1, e2) => {
            return order * (e1[key] < e2[key] ? -1 : 1);
        });
    }

    private sortAll(ord: any): void {
        let dir = ord["dir"];
        let keys = ord["keys"];
        let order = dir === "DOWN" ? -1 : 1;
        for (let i = keys.length - 1; i >= 0; i--) {
            Log.trace(keys[i]);
            this.sort(keys[i], order);
        }
    }

    private order(query: any): void {
        let opt = query["OPTIONS"];
        if (opt.hasOwnProperty("ORDER")) {
            let ord = opt["ORDER"];
            typeof (ord) === "string" ? this.sort(ord, 1) : this.sortAll(ord);
        }
    }

    private filter(query: any): void {
        let body = query["WHERE"];
        if (!Object.keys(body).length) {
            this.validDataset = this.dataset[this.id];
            return;
        }
        for (let section of this.dataset[this.id]) {
            if (this.fu.perform(body, section)) {
                this.validDataset.push(section);
                if (this.validDataset.length > 5000) {
                    return;
                }
            }
        }
        return;
    }

    // ** Running query operator
    public run(query: any): Promise<any[]> {
        this.qu.setup(query);
        this.id = this.qu.getCurID();
        // (1) filter
        this.filter(query);  // get valid sections and store in validDataset
        if (this.validDataset.length >= 5000 && !this.qu.getHasTrans()) {  // if no GROUP
            return Promise.reject(new ResultTooLargeError("More than 5000 results"));
        }
        // (2) transform (process validateDataset)
        if (this.qu.getHasTrans()) { // has transformation
            this.ao = new ApplyOperations(this.validDataset, query);
            if (!this.ao.transform(query)) {
                return Promise.reject(new ResultTooLargeError("More than 5000 results"));
            }
            this.validDataset = this.ao.getDS();
        }
        // (3) order
        this.extract(query);
        this.order(query);   // order required fields
        return Promise.resolve(this.res);
    }
}
