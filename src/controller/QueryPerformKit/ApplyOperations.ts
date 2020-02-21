import * as assert from "assert";
import Decimal from "decimal.js";
import Log from "../../Util";
import {SelectedFields} from "./QueryPerform";

export class ApplyOperations {
    private colKeys = new Set<string>();
    private groupKeys: string[] = [];

    private groupCorr = new Map();
    private validDataSet: SelectedFields[];
    private groupedDataset: SelectedFields[][] = [];
    private resultingDataSet: SelectedFields[] = [];


    constructor(validDataSet: SelectedFields[], query: any) {
        this.validDataSet = validDataSet;
        this.getGroupKeys(query);
        this.getColKeys(query);
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


    private tokenOperation(set: SelectedFields, aptk: string, key: string, acc: number): number {
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

    private avgOperation(sets: SelectedFields[], key: string): number {
        // let total = new Decimal(0);
        let total = 0;
        for (let set of sets) {
            // let cur = new Decimal(set[key]);
            // total.add(cur);
            total += set[key];
        }
        // let avg = (total.toNumber() / sets.length);
        let avg = total / sets.length;
        return  Number(avg.toFixed(2));
    }

    private sumOperation(sets: SelectedFields[], key: string): number {
        let sum = 0;
        for (let set of sets) {
            sum += set[key];
        }
        let res = Number(sum.toFixed(2));
        return res;
    }

    // flag 1-max, 0-min
    private minMaxOperation(sets: SelectedFields[], key: string, flag: number): number {
        let res = flag ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        for (let set of sets) {
            if (flag) {
                res = Math.max(res, set[key]);
            } else {
                res = Math.min(res, set[key]);
            }
        }
        return res;
    }

    private countOperation(sets: SelectedFields[], key: string): number {
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

    // perform specified calculation
    private calculate(sets: SelectedFields[], aptk: string, key: string): number {
        let val: number;
        key = key.split("_")[1];
        if (aptk === "AVG") {
            val = this.avgOperation(sets, key);
        } else if (aptk === "MAX") {
            val = this.minMaxOperation(sets, key, 1);
        } else if (aptk === "MIN") {
            val = this.minMaxOperation(sets, key, 0);
        } else if (aptk === "SUM") {
            val = this.sumOperation(sets, key);
        } else {
            assert(aptk === "COUNT");
            val = this.countOperation(sets, key);
        }
        // Log.trace(aptk + " " + val);
        return val;
    }

    // add new field (applyKey) to first entry of each set
    private perform(query: any): void {
        const applyArray = query["TRANSFORMATIONS"]["APPLY"];
        for (let applyRule of applyArray) {
            let applyKey = Object.keys(applyRule)[0];
            if (!this.colKeys.has(applyKey)) {
                continue;
            }
            let applyBody = applyRule[applyKey]; // { "MAX": "courses_avg" }
            let applyToken = Object.keys(applyBody)[0]; // MAX, MIN, AVG ...
            let key = applyBody[applyToken]; // courses_avg

            for (let set of this.groupedDataset) {
                // Log.trace(Object.keys(set[0]).length);
                // Log.trace(set[0]);
                let curval = this.calculate(set, applyToken, key);
                set[0][applyKey] = curval; // add applyKey field to first entry of current set
                // Log.trace(Object.keys(set[0]).length);
                // Log.trace(set[0]);
            }
        }
    }

    // generate groupedDataset from validateDataset
    private group(query: any): void {
        for (let unit of this.validDataSet) {
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
    }

    // validDataset ->res
    public transform(query: any): boolean {
        this.group(query); // group datasets according to GROUP rules
        if (this.groupedDataset.length > 5000) {
            return false;
        }
        this.perform(query); // apply applyRules on each of the grouped sets
        for (let set of this.groupedDataset) { // compress, only the first entry of each set remains
            this.resultingDataSet.push(set[0]);
        }
        return true;
    }

    public getDS(): SelectedFields[] {
        return this.resultingDataSet;
    }
}
