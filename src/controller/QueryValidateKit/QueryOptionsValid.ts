import {QueryUtils} from "../QueryUtils";
import Log from "../../Util";

export class QueryOptionsValid {

    private qu: QueryUtils;
    private opts = new Set<string>();
    private sopts: string[] = ["COLUMNS"];

    // order validity
    private orderObjKey = new Set();
    private orderObjKeyArray = ["dir", "keys"];

    constructor(qu: QueryUtils) {
        this.qu = qu;
        this.opts.add("COLUMNS");
        this.opts.add("ORDER");
        this.orderObjKey.add("dir");
        this.orderObjKey.add("keys");
    }

    private keysValid(keys: any): string {
        if (!Array.isArray(keys) || !keys.length) {
            return "ORDER keys must be a non-empty array";
        }
        for (let key of keys) {
            let err = this.qu.orderKeyValid(key);
            if (err !== "") {
                return err;
            }
        }
        return "";
    }

    private dirValid(dir: any): string {
        if (typeof (dir) !== "string" || (dir !== "UP" && dir !== "DOWN")) {
            return "Invalid ORDER direction";
        }
        return "";
    }

    private orderObjValid(okey: any): string {
        for (let k in okey) {
            if (!this.orderObjKey.has(k)) {
                return "Invalid key in OPTIONS";
            }
        }
        for (let k of this.orderObjKeyArray) {
            if (okey[k] === undefined) {
                return "ORDER missing " + k + " key";
            }
        }
        let dirWarning = this.dirValid(okey["dir"]);
        if (dirWarning !== "") {
            return dirWarning;
        }
        return this.keysValid(okey["keys"]);
    }

    private orderValid(okey: any): string {
        if (okey === undefined) {
            return "";
        }
        if (typeof (okey) === "string") { // sort by one key
            return this.qu.orderKeyValid(okey);
        }
        if (!Array.isArray(okey) || typeof (okey) === "object") {
            return this.orderObjValid(okey);
        }
        return "Invalid ORDER type";
    }

    private colValid(col: any): string {
        if (!Array.isArray(col) || col.length === 0) {
            return "COLUMNS must be a non-MT array";
        }
        for (let key of col) {
            if (typeof (key) !== "string") {
                return "Invalid type of COLUMN key";
            }
            let err = this.qu.columnKeyValid(key);
            if (err !== "") {
                return err;
            }
        }
        return "";
    }

    public optsValid(option: any): string {
        for (let k in option) {
            if (!this.opts.has(k)) {
                return "Invalid key in OPTIONS";
            }
        }
        for (let k of this.sopts) {
            let cur = option[k];
            if (cur === undefined) {
                return "Does not find keyword: " + k;
            }
        }
        let colWarning = this.colValid(option["COLUMNS"]);
        if (colWarning !== "") {
            return colWarning;
        }
        return this.orderValid(option["ORDER"]);
    }

    /*
    public set(): void {
        this.qu.options = 1;
    }

    public get(): number[] {
        return [ this.qu.body, this.qu.options, this.qu.trans ];
    }
     */
}
