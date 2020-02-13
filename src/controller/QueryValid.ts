import Log from "../Util";
import * as assert from "assert";
import {QueryUtils} from "./QueryUtils";
import {QueryOptionsValid} from "./QueryOptionsValid";
import {QueryBodyValid} from "./QueryBodyValid";
import {QueryTransformValid} from "./QueryTransformValid";

export default class QueryValid {

    private keys = new Set();
    private skeys: string[] = ["WHERE", "OPTIONS"];

    private qu = new QueryUtils();
    private qbv: QueryBodyValid;
    private qov: QueryOptionsValid;
    private tfv: QueryTransformValid;

    private hasTrans: boolean;

    constructor(ids: Set<string>) {
        this.qu.setIDs(ids);
        this.keys.add("WHERE");
        this.keys.add("OPTIONS");
        this.keys.add("TRANSFORMATIONS");

        this.qbv = new QueryBodyValid(this.qu);
        this.qov = new QueryOptionsValid(this.qu);
        this.tfv = new QueryTransformValid(this.qu);
    }

    private checkKeys(query: any): string {
        // check whether keys other than specified are present
        if (!query) { return "Null query"; }
        for (let k in query) {
            if (k === "TRANSFORMATIONS") {
                this.hasTrans = true;
                this.qu.setHasTrans();
            }
            if (!this.keys.has(k)) { return "Irrelevant keys present!"; }
        }
        // check whether WHERE and OPTIONS are present and being an object
        for (let k of this.skeys) {
            let cur = query[k];
            if (cur === undefined) { return "Does not find keyword: " + k; }
            if (Array.isArray(cur) || typeof (cur) !== "object") {
                return k + " must be an object";
            }
        }
        return "";
    }

    private checkContents(query: any): string {
        let body = query.WHERE, opts = query.OPTIONS;
        let filterWarning: string = ""; // check filter
        if (Object.keys(body).length !== 0) { filterWarning = this.qbv.filterValid(body); }
        if (filterWarning !== "") { return filterWarning; }

        if (this.hasTrans) { // check transformations, if present (while updating applykey in queryUtils)
            let transWarning = this.tfv.transformValid(query["TRANSFORMATIONS"]);
            if (transWarning !== "") { return transWarning; }
        }
        return this.qov.optsValid(opts);
    }

    public queryValid(query: any): string {
        let error = this.qu.setup(query); // initialize queryUtils
        if (error !== "") { return error; }

        let keyInvalid = this.checkKeys(query);
        if (keyInvalid !== "") { return keyInvalid; }
        return this.checkContents(query);
    }

    /*
    // test whether qu is passed by reference
    public test(): void {
        this.qbv = new QueryBodyValid(this.qu);
        this.qov = new QueryOptionsValid(this.qu);
        this.tfv = new QueryTransformValid(this.qu);

        for (let i of this.tfv.get()) {
            Log.trace(i + " ");
        }
        this.qbv.set();
        for (let i of this.qov.get()) {
            Log.trace(i + " ");
        }

        Log.trace(2);
        Log.trace(this.qbv.getid());
        Log.trace(this.qbv.gettype());
        let error = this.qu.setup(query); // initialize queryUtils
        if (error !== "") { return error; }

        // let keyInvalid = this.checkKeys(query);
        // if (keyInvalid !== "") { return keyInvalid; }
        // return this.checkContents(query);
        Log.trace(this.qbv.getid());
        Log.trace(this.qbv.gettype());
    }
     */
}
