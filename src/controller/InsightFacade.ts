import Log from "../Util";
import {
    FoundCacheError,
    IInsightFacade,
    InsightCourse,
    InsightCourseDataFromZip,
    InsightDataset,
    InsightDatasetKind,
    InsightError, InsightRoom,
    NotFoundError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import * as fs from "fs-extra";
import Queryvalid from "./QueryValid";
import QueryPerform from "./QueryPerform";
import InsightValidator from "./InsightValidator";
import InsightCacheManager from "./InsightCacheManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataset: { [key: string]: InsightCourse[]| InsightRoom[] } = {};
    // private dataPath: string = "./test/cache/";
    private dataPath = "./data/";
    private ids = new Set<string>();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    private hasID(id: string): boolean {
        if (this.ids.has(id) || this.dataset[id]) {
            return true;
        }
        return false;
    }

    private readCache(id: string, kind: InsightDatasetKind):
        Promise<void | { [key: string]: InsightCourse[] }> {
        return fs.readFile(this.dataPath + id + ".json").then((file: Buffer) => {
            return JSON.parse(file.toString());
        }).then((json: any) => {
            let result: { [key: string]: InsightCourse[] } = {};
            if (!this.dataset.hasOwnProperty(id)) {
                this.dataset[id] = json[id];
            }
            return Promise.resolve(json);
        }).catch((err: any) => {
            Log.trace(err);
            if (err instanceof FoundCacheError) {
                throw err;
            }
        });
    }


    private storeCacheIdsToIdset(): Promise<string[]> {
        return fs.readdir(this.dataPath).then((files: string[]) => {
            let ids: string[] = files.map((file) => {
                return file.replace(".json", "");
            });
            for (let id of ids) {
                this.ids.add(id);
            }
            return Promise.resolve(ids);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    private readAllCacheToMemory(): Promise<void[] | boolean> {
        return this.storeCacheIdsToIdset().then((ids: string[]) => {
            return Promise.all(ids.map((id: string) => {
                return new Promise((resolve, reject) => {
                    if (this.hasID(id)) {
                        return resolve(true);
                    }
                    return resolve(this.readCache(id, InsightDatasetKind.Courses));
                });
            }));
        }).then(() => {
            return Promise.resolve(true);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (!InsightValidator.isIDvalid(id)) {
            Log.trace(1);
            return Promise.reject(new InsightError("addDataset Invalid ID"));
        }
        if (this.hasID(id)) {
            // Log.trace(1);
            return Promise.reject(new InsightError("duplicate id"));
        }
        if (!InsightValidator.isValidDatasetKind(kind)) {
            Log.trace(2);
            return Promise.reject(new InsightError("addDataset Invalid kind"));
        }
        return this.storeCacheIdsToIdset().then(() => {
            if (this.hasID(id)) {
                return Promise.reject(new InsightError("addDataset found in memory or cache"));
            } else {
                return InsightCacheManager.readFromZip(id, content, kind);
            }
        }).then((dataset: { [key: string]: InsightCourse[] } | {[key: string]: InsightRoom[]}) => {
            let keys = Object.keys(dataset);
            if (keys.length === 1) {
                this.ids.add(keys[0]);
                Object.assign(this.dataset, dataset);
            }
            if (Object.keys(this.dataset).length > 0 && Object.values(this.dataset)[0].length > 0) {
                let jsonToWrite = JSON.stringify({[id]: this.dataset[id]});
                fs.writeFile(this.dataPath + id + ".json", jsonToWrite).catch((e) => {
                    Log.error(e);
                    // return Promise.reject(e);
                });
                return Promise.resolve(Array.from(this.ids));
            } else {
                return Promise.reject(new InsightError("empty dataset"));
            }
        }).catch((err: any) => {
            return Promise.reject(new InsightError(err));
        });
    }

    private deleteCacheFile(id: string): Promise<boolean> {
        return fs.unlink(this.dataPath + id + ".json").then(() => {
            this.ids.delete(id);
            delete this.dataset[id];
            return Promise.resolve(true);
        }).catch((err) => {
            return Promise.reject(err);
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!InsightValidator.isIDvalid(id)) {
            return Promise.reject(new InsightError("removeDataset Invalid ID"));
        }
        let hasDeletedFromMemory = false;
        if (this.dataset[id]) {
            delete this.dataset[id];
            this.ids.delete(id);
            hasDeletedFromMemory = true;
        }
        return this.deleteCacheFile(id).then((hasDeleted: boolean) => {
            if (hasDeleted) {
                return Promise.resolve(id);
            }
        }).catch((err) => {
            if (hasDeletedFromMemory) {
                return Promise.resolve(id);
            }
            return Promise.reject(new NotFoundError(err));
        });
    }// For testing only public clearMemory() {this.dataset = {};}

    public performQuery(query: any): Promise<any[]> {
        return this.readAllCacheToMemory().then(() => {
            const qv: Queryvalid = new Queryvalid(new Set(Object.keys(this.dataset)));
            const warning = qv.queryValid(query);
            if (warning !== "") {
                return Promise.reject(new InsightError(warning));
            }
            const qp: QueryPerform = new QueryPerform(this.dataset);
            return qp.run(query);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];
        return this.readAllCacheToMemory().then(() => {
            Object.keys(this.dataset).map((id: string) => {
                insightDatasets.push({
                    id: id,
                    kind: InsightDatasetKind.Courses,
                    numRows: this.dataset[id].length
                });
            });
            return Promise.resolve(insightDatasets);
        }).catch((err) => {
            return Promise.reject(new InsightError(err));
        });
    }
}
