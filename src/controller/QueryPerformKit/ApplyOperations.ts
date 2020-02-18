import * as assert from "assert";
import Decimal from "decimal.js";
import Log from "../../Util";
import {SelectedFields} from "./QueryPerform";

export class ApplyOperations {
    public tokenOperation(set: SelectedFields, aptk: string, key: string, acc: number): number {
        key = key.split("_")[1];
        const val = set[key];
        if (aptk === "MAX") {
            return Math.max(acc, val);
        } else if (aptk === "MIN") {
            return Math.min(acc, val);
        } else if (aptk === "AVG" || aptk === "SUM") {
            return acc + val;
        } else {
            assert(aptk === "COUNT");
            return acc + 1;
        }
    }

    public avgOperation(sets: SelectedFields[], key: string): number {
        let total = new Decimal(0);
        for (let set of sets) {
            total.add(new Decimal(set[key]));
            Log.trace(total);
        }
        let avg = (total.toNumber() / sets.length);
        let res = Number(avg.toFixed(2));
        Log.trace(res);
        return res;
    }

    public sumOperation(sets: SelectedFields[], key: string): number {
        let sum = 0;
        for (let set of sets) {
            sum += set[key];
        }
        let res = Number(sum.toFixed(2));
        return res;
    }

    // flag 1-max, 0-min
    public minMaxOperation(sets: SelectedFields[], key: string, flag: number): number {
        let res = flag ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        for (let set of sets) {
            if (flag) {
                res = Math.max(res, set[key]);
            } else {
                res = Math.min(res, set[key]);
            }
        }
        Log.trace(res);
        return res;
    }

    public countOperation(sets: SelectedFields[], key: string): number {
        let res = 0;
        let mem = new Set();
        for (let set of sets) {
            if (!mem.has(set[key])) {
                res++;
                mem.add(set[key]);
            }
        }
        return res;
    }
}
