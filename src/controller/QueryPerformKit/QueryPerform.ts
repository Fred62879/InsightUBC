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
    private id: string;

    // utilities
    private qu = new QueryUtils();
    private ao: ApplyOperations;
    private fu = new FilterUtils(this.qu);

    // datasets
    private res: SelectedFields[] = [];
    private validDataset: SelectedFields[] = [];
    private dataset: { [key: string]: InsightCourse[] };


    constructor(dataset: { [key: string]: InsightCourse[] }) {
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

    private order(query: any): void {
        let ordKey = query["OPTIONS"]["ORDER"];
        if (ordKey === undefined) {
            return;
        }
        this.res.sort((e1, e2) => e1[ordKey] - e2[ordKey]);
    }

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
