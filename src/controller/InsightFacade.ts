import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private keys: string[] = [ "WHERE", "OPTIONS" ];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        const warning = this.queryValid(query);
        if (warning !== "") {
            return Promise.reject(new InsightError(warning));
        }

        return Promise.reject();
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }

    // helper methods
    private queryValid(query: any): string {
        Log.trace(query);
        // TODO: which error to report first (irrelevant keys or one of W and O are missing)
        // check whether keys other than "WHERE" and "OPTIONS" are present
        for (let k in query) {
            if (this.keys.indexOf(k) === -1) {
                return "Irrelevant keys present!";
            }
        }
        // TODO: using string key ("WHERE"..) as key for query
        // validate WHERE and OPTIONS are present
        for (let k in query) {
            let cur = query.k;
            // const key = keyof typeof k;
            // Log.trace(query.WHERE);
            if (cur === undefined) {
                return "Does not find " + cur + " keyword";
            }
        }
        // validate WHERE valid
        let where = query.WHERE, opts = query.OPTIONS;
        const filterWarning = this.filterValid(where);
        if (filterWarning !== "") {
            return filterWarning;
        }
        // validate OPTIONS valid
        const optsWarning = this.optsValid(opts);
        if (optsWarning !== "") {
            return optsWarning;
        }
        return "";
    }

    private filterValid(body: any): string {
        return "";
    }

    private optsValid(option: any): string {
        return "";
    }
}
