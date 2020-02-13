import {QueryUtils} from "./QueryUtils";
import Log from "../Util";

export class QueryTransformValid {

    private qu: QueryUtils;
    private tkeys = new Set<string>();
    private skeys = [ "GROUP", "APPLY" ];

    constructor(qu: QueryUtils) {
        this.qu = qu;
        this.tkeys.add("GROUP");
        this.tkeys.add("APPLY");
    }

    // "AVG", "courses_avg"
    // aTokenKey should be a valid key (id valid and field valid)
    // aTokenKey should fit aToken type
    public applyTokenKeyValid(aToken: string, aTokenKey: string): string {
        if (typeof (aTokenKey) !== "string") { return "Invalid apply rule target key"; }
        return this.qu.applyTokenKeyValid(aToken, aTokenKey);
    }


    // body: { "AVG": "courses_avg" }
    // apply body is an object with one apply token
    public applyBodyValid(abody: string): string {
        if (Array.isArray(abody) || typeof (abody) !== "object") { return "Apply body must be object"; }

        const len = Object.keys(abody).length;
        if (len !== 1) { return "Apply body should only have 1 key, has " + len; }

        const atoken = Object.keys(abody)[0]; // "AVG"
        const atokenErr = this.qu.applyTokenValid(atoken);
        if (atokenErr !== "") { return atokenErr; }

        const aTokenKey = abody[atoken]; // "courses_avg"
        return this.applyTokenKeyValid(atoken, aTokenKey);
    }

    // rule: {
    //        "aa": { AVG": "..." },
    //        "aa": { AVG": "..." }  # not allowed
    //       }
    // each rule is an object with only one apply body
    public applyRuleValid(rule: any): string {
        if (Array.isArray(rule) || typeof (rule) !== "object") { return "Apply rule must be object"; }
        const len = Object.keys(rule).length;
        if (len !== 1) { return "Apply rule should only have 1 key, has " + len; }

        const aKey = Object.keys(rule)[0]; // "aa"
        const akeyErr = this.qu.applyKeyValid(aKey);
        if (akeyErr !== "") { return akeyErr; }
        return this.applyBodyValid(rule[aKey]);
    }

    public applyValid(apply: any): string {
        if (!Array.isArray(apply)) { return "APPLY must be an array"; }
        for (let rule of apply) {
            let err = this.applyRuleValid(rule);
            if (err !== "") { return err; }
        }
        return "";
    }

    public groupValid(group: any): string {
        if (!Array.isArray(group) || !group.length) { return "GROUP must be a non-empty array"; }
        for (let key of group) {
            let err = this.qu.groupKeyValid(key);
            if (err !== "") { return err; }
        }
        return "";
    }

    public transformValid(trans: any): string {
        if (Array.isArray(trans) || typeof (trans) !== "object") {
            return "TRANSFORMATIONS must be an object";
        }
        for (let k in trans) {
            if (!this.tkeys.has(k)) {
                return "Invalid key in TRANSFORMATIONS";
            }
        }
        for (let k of this.skeys) {
            if (trans[k] === undefined) {
                return "Does not find keyword: " + k;
            }
        }
        let groupWarning = this.groupValid(trans["GROUP"]);
        if (groupWarning !== "") { return groupWarning; }
        return this.applyValid(trans["APPLY"]);
    }

    /*
    public set(): void {
        this.qu.trans = 1;
    }

    public get(): number[] {
        return [ this.qu.body, this.qu.options, this.qu.trans ];
    }
     */
}
