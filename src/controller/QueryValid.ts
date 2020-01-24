import Log from "../Util";
import * as assert from "assert";

export default class QueryValid {

    private skeys: string[] = [ "WHERE", "OPTIONS" ];

    // for body
    private keys = new Set();
    private operator = new Set();
    private logic = new Set();
    private mcomp = new Set();
    private scomp = new Set();
    private neg = new Set();

    // for options
    private opts = new Set<string>();
    private sopts: string[] = [ "COLUMNS" ];
    private avaKeys = new Set<string>();

    // for keys and fields
    private mfields = new Set<string>(); // = [ "avg", "pass", "fail", "audit", "year" ];
    private sfields = new Set<string>(); // [ "dept", "id", "instructor", "title", "uuid"];
    private ids = new Set();
    private curid = "";

    constructor(ids: Set<string>) {
        this.keys.add("WHERE"), this.keys.add("OPTIONS");
        this.operator.add("GT"), this.operator.add("LT"), this.operator.add("EQ");
        this.operator.add("AND"), this.operator.add("OR");
        this.operator.add("IS"), this.operator.add("NOT");

        this.logic.add("AND"), this.logic.add("OR");
        this.mcomp.add("GT"), this.mcomp.add("LT"), this.mcomp.add("EQ");
        this.scomp.add("IS"), this.neg.add("NOT");

        this.mfields.add("avg"), this.mfields.add("pass"), this.mfields.add("fail");
        this.mfields.add("audit"), this.mfields.add("year");

        this.sfields.add("dept"), this.sfields.add("id"), this.sfields.add("instructor");
        this.sfields.add("title"), this.sfields.add("uuid");

        this.ids = ids;
        this.opts.add("COLUMNS"), this.opts.add("ORDER");
    }

    public queryValid(query: any): string {
        Log.trace(query);
        // check whether keys other than "WHERE" and "OPTIONS" are present
        for (let k in query) {
            if (!this.keys.has(k)) { return "Irrelevant keys present!"; }
        }
        // check whether WHERE and OPTIONS are present
        for (let k of this.skeys) {
            let cur = query[k];
            if (cur === undefined) { return "Does not find keyword: " + k; }
            if (Array.isArray(cur) || typeof(cur) !== "object") { return k + " must be an object"; }
            // if (Object.keys(cur).length > 1) { return k + " has more than one keys"; } -$
        }
        Log.trace(1);
        let body = query.WHERE, opts = query.OPTIONS;
        Log.trace(1);
        const filterWarning = this.filterValid(body);
        Log.trace(1);
        if (filterWarning !== "" && Object.keys(body).length > 0) { return filterWarning; }
        Log.trace(1);
        const optsWarning = this.optsValid(opts);
        if (optsWarning !== "") { return optsWarning; }
        return "";
    }

    private filterValid(body: any): string {
        let operator: string = "";
        for (let k in body) {
            if (!this.operator.has(k)) { return "Invalid filter key: " + k; }
            if (operator !== "") { return "Filter has more than one keys"; } // -$
            operator = k;
        }
        if (this.logic.has(operator)) {
            const logicWarning = this.logicValid(body[operator], operator);
            if (logicWarning !== "") { return logicWarning; }
        } else if (this.mcomp.has(operator)) {
            const mcompWarning = this.mcompValid(body[operator], operator);
            if (mcompWarning !== "") { return mcompWarning; }
        } else if (this.scomp.has(operator)) {
            const scompWarning = this.scompValid(body[operator], operator);
            if (scompWarning !== "") { return scompWarning; }
        } else if (operator === "NOT") {
            const negWarning = this.negValid(body[operator]);
            if (negWarning !== "") { return negWarning; }
        } else {
            return "Invalid!";
        }
        return "";
    }

    private logicValid(filter: any, logic: string): string {
        if (!Array.isArray(filter) || filter.length === 0) { return logic + " must be an non-MT Array"; }
        for (let subf of filter) {
            if (Array.isArray(subf) || typeof(subf) !== "object") { return logic + " array must contain objects"; }
            if (!Object.keys(subf).length) { return logic + " has zero key!"; }
            return this.filterValid(subf);
        }
        return "";
    }

    private mcompValid(mcontent: any, mcomp: string): string {
        if (Array.isArray(mcontent) || typeof(mcontent) !== "object") { return mcomp + " must be an object"; }
        // TODO: when two keys are the same, CAMPUS EXPLORER does not report error
        if (Object.keys(mcontent).length === 0) { return mcomp + " should have 1 key, has 0"; }
        if (Object.keys(mcontent).length > 1) { return mcomp + " has more than one key"; }

        let mkey = Object.keys(mcontent)[0];
        let mkeyWarning = this.keyValid(mkey, mcomp, this.mfields, 0); // mKeyValid(mkey, mcomp);
        if (mkeyWarning !== "") { return mkeyWarning; }
        if (typeof(mcontent[mkey]) !== "number") { return "Invalid value type in " + mcomp + ", should be number"; }
        return "";
    }

    private scompValid(scontent: any, scomp: string): string {
        if (Array.isArray(scontent) || typeof(scontent) !== "object") { return scomp + " must be an object"; }
        // TODO: when two keys are the same, CAMPUS EXPLORER does not report error
        if (Object.keys(scontent).length === 0) { return scomp + " should have 1 key, has 0"; }
        if (Object.keys(scontent).length > 1) { return scomp + " has more than one key"; }

        let skey = Object.keys(scontent)[0];
        let skeyWarning = this.keyValid(skey, scomp, this.sfields, 0); // sKeyValid(skey, scomp);
        if (skeyWarning !== "") { return skeyWarning; }
        return this.sInputStringValid(scontent[skey]);
    }

    // return index position of underscore in key, or n if no underscore
    private trailID(key: string): number {
        let a = 0;
        while (a < key.length && key[a] !== "_") { a++; }
        return a;
    }

    private sInputStringValid(input: any): string {
        if (typeof(input) !== "string") { return "Invalid value type in IS, should be string"; }
        for (let i = 0; i < input.length; i++) {
            if (input.charAt(i) === "*" && i !== 0 && i !== input.length - 1) {
                return "Asterisks (*) can only be the first or last characters of input strings";
            }
        }
        return "";
    }

    private negValid(filter: any): string {
        if (Array.isArray(filter) || typeof(filter) !== "object") { return "Not must be object"; }
        if (Object.keys(filter).length === 0) { return "NOT should have 1 key, has 0"; }
        if (Object.keys(filter).length > 1) { return "NOT has more than one key"; }
        return this.filterValid(filter);
    }

    private keyValid(key: any, subject: any, fields: Set<string>, record: number): string {
        // parse mkey into mfield and id
        let bd = this.trailID(key);
        if (bd === 0) { return "Referenced dataset cannot be empty string"; }
        if (bd === key.length) { return "Invalid key: " + key + " in " + subject; }

        let field = key.substring(bd + 1);
        let id = key.substring(0, bd);
        if (record === 1) {
            this.avaKeys.add(field);
        }

        // validate mfield and id
        if (this.curid !== "" && this.curid !== id) { return "Cannot query more than one dataset"; }
        this.curid = id;
        if (!this.ids.has(id)) { return "Referenced dataset " + id + " not added"; }
        if (!fields.has(field)) { return "Invalid key: " + key + " in " + subject; }
        return "";
    }


    private optsValid(option: any): string {
        for (let k in option) {
            if (!this.opts.has(k)) { return "Invalid key in OPTIONS"; }
        }
        Log.trace(option);
        Log.trace(option["COLUMNS"]);
        for (let k of this.sopts) {
            let cur = option[k];
            Log.trace(cur);
            if (cur === undefined) {
                return "Does not find keyword: " + k;
            }
        }
        let colWarning = this.colValid(option["COLUMNS"]);
        if (colWarning !== "") { return colWarning; }
        let ordWarning = this.orderValid(option["ORDER"]);
        if (ordWarning !== "") { return ordWarning; }
        return "";
    }

    private colValid(col: any): string {
        if (!Array.isArray(col) || col.length === 0) { return "COLUMNS must be a non-MT array"; }
        for (let key of col) {
            if (typeof(key) !== "string") { return "Invalid type of COLUMN key"; }
            let cur = this.keyValid(key, "COLUMNS", this.sfields, 1);
            if (cur !== "") {
                cur = this.keyValid(key, "COLUMNS", this.mfields, 1);
                if (cur !== "") { return cur; }
            }
        }
        return "";
    }

    private orderValid(ord: any): string {
        if (ord === undefined) { return ""; }
        if (typeof(ord) !== "string") { return "Invalid ORDER type"; }

        let okey = Object.keys(ord)[0];
        let cur = this.keyValid(okey, "OPTIONS", this.sfields, 0);
        if (cur !== "") {
            cur = this.keyValid(okey, "OPTIONS", this.mfields, 0);
            if (cur !== "") { return cur; }
        }

        if (!this.avaKeys.has(okey)) { return "ORDER key must be in COLUMNS"; }
        return "";
    }
}

