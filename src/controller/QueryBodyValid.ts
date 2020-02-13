import {QueryUtils} from "./QueryUtils";

export class QueryBodyValid {

    private qu: QueryUtils;
    private operator = new Set();
    private logic = new Set();
    private mcomp = new Set();
    private scomp = new Set();
    private neg = new Set();

    constructor(qu: QueryUtils) {
        this.qu = qu;
        this.operator.add("GT"), this.operator.add("LT"), this.operator.add("EQ");
        this.operator.add("AND"), this.operator.add("OR");
        this.operator.add("IS"), this.operator.add("NOT");
        this.logic.add("AND"), this.logic.add("OR");
        this.mcomp.add("GT"), this.mcomp.add("LT"), this.mcomp.add("EQ");
        this.scomp.add("IS"), this.neg.add("NOT");
    }


    public filterValid(body: any): string {
        if (Object.keys(body).length !== 1) { return "Filter should have only one key"; }
        let operator = Object.keys(body)[0];

        // check filter validity
        if (this.logic.has(operator)) {
            const logicWarning = this.logicValid(body[operator], operator);
            if (logicWarning !== "") {
                return logicWarning;
            }
        } else if (this.mcomp.has(operator)) {
            const mcompWarning = this.mcompValid(body[operator], operator);
            if (mcompWarning !== "") {
                return mcompWarning;
            }
        } else if (this.scomp.has(operator)) {
            const scompWarning = this.scompValid(body[operator], operator);
            if (scompWarning !== "") {
                return scompWarning;
            }
        } else if (operator === "NOT") {
            const negWarning = this.negValid(body[operator]);
            if (negWarning !== "") {
                return negWarning;
            }
        } else {
            return "Filter key Invalid!";
        }
        return "";
    }

    public logicValid(filter: any, logic: string): string {
        if (!Array.isArray(filter) || filter.length === 0) {
            return logic + " must be a non-MT Array";
        }
        for (let subf of filter) {
            if (Array.isArray(subf) || typeof (subf) !== "object") {
                return logic + " array must contain objects";
            }
            // if (Object.keys(subf).length === 0) {
            //     return logic + " has zero key!";
            // }
            let isValid: string = this.filterValid(subf);
            if (isValid !== "") {
                return isValid;
            }
        }
        return "";
    }

    public mcompValid(mcontent: any, mcomp: string): string {
        // if (Array.isArray(mcontent) || typeof (mcontent) !== "object") {
        //     return mcomp + " must be an object";
        // }
        // if (Object.keys(mcontent).length === 0) {
        //     return mcomp + " should have 1 key, has 0";
        // }
        // if (Object.keys(mcontent).length > 1) {
        //     return mcomp + " has more than one key";
        // }
        //
        // let mkey = Object.keys(mcontent)[0];
        // let mkeyWarning = this.qu.keyValid(mkey, mcomp, 2, 0, 0); // mKeyValid(mkey, mcomp);
        // if (mkeyWarning !== "") {
        //     return mkeyWarning;
        // }
        // if (typeof (mcontent[mkey]) !== "number") {
        //     return "Invalid value type in " + mcomp + ", should be number";
        // }
        return "";
    }

    public scompValid(scontent: any, scomp: string): string {
        // if (Array.isArray(scontent) || typeof (scontent) !== "object") {
        //     return scomp + " must be an object";
        // }
        // if (Object.keys(scontent).length === 0) {
        //     return scomp + " should have 1 key, has 0";
        // }
        // if (Object.keys(scontent).length > 1) {
        //     return scomp + " has more than one key";
        // }
        //
        // let skey = Object.keys(scontent)[0];
        // let skeyWarning = this.qu.keyValid(skey, scomp, 1, 0, 0); // sKeyValid(skey, scomp);
        // if (skeyWarning !== "") {
        //     return skeyWarning;
        // }
        // return this.qu.sInputStringValid(scontent[skey]);
        return "";
    }

    public negValid(filter: any): string {
        if (Array.isArray(filter) || typeof (filter) !== "object") {
            return "Not must be object";
        }
        if (Object.keys(filter).length === 0) {
            return "NOT should have 1 key, has 0";
        }
        if (Object.keys(filter).length > 1) {
            return "NOT has more than one key";
        }
        return this.filterValid(filter);
    }

    /*
    public set(): void {
        this.qu.body = 1;
    }

    public get(): number[] {
        return [ this.qu.body, this.qu.options, this.qu.trans ];
    }

    public getid(): string {
        return this.qu.curid;
    }

    public gettype(): number {
        return this.qu.type;
    }
     */
}
