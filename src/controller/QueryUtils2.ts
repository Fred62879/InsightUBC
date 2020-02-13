import Log from "../Util";

export class  QueryUtils {

    private ids = new Set();  // ids of all currently added datasets
    private curid = "";       // id of current query
    private type: number;     // 0, courses; 1, rooms
    private hasTrans = false; // whether curret query has TRANSFORMATION
    private avaKeys = new Set<string>(); // keys presented in COLUMNS

    private mfields = new Set<string>(); // = [ "avg", "pass", "fail", "audit", "year" ];
    private sfields = new Set<string>(); // [ "dept", "id", "instructor", "title", "uuid"];

    private roomField = new Set<string>();
    private courseField = new Set<string>();

    constructor() {
        let mfieldsArray = [ "avg", "pass", "fail", "audit", "year" ];
        for (let mf in mfieldsArray) { this.mfields.add(mf); }
        let sfieldsArray = [ "dept", "id", "instructor", "title", "uuid" ];
        for (let sf in sfieldsArray) { this.sfields.add(sf); }

        let roomFieldArray = [ "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        for (let f in roomFieldArray) { this.roomField.add(f); }
        let courseFieldArray = [ "avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid" ];
        for (let f in courseFieldArray) { this.courseField.add(f); }
    }

    public setHasTrans(): void {
        this.hasTrans = true;
    }

    // determine whether rooms or courses being queried and setup current id
    // analyzing GROUP or COLUMNS
    public setup(query: any): string {
        let sample: any; // e.g. "rooms_seats" OR "courses_avg"
        try {
            sample = this.hasTrans ? query["TRANSFORMATIONS"]["GROUP"][0] : query["OPTIONS"]["COLUMNS"][0];
        } catch (err) {
            return "query invalid";
        }
        let bd = this.trailID(sample);
        if (bd === 0) { return "Dataset id cannot be empty"; }
        this.curid = sample.substr(0, bd);

        // determine type
        let field = sample.substr(bd + 1);
        if (this.roomField.has(field)) {
            this.type = 1;
        } else if (this.courseField.has(field)) {
            this.type = 0;
        } else {
            return "Invalid fields";
        }
        Log.trace(this.type);
        Log.trace(this.curid);
        return "";
    }

    public setIDs(ids: Set<string>) {
        this.ids = ids;
    }

    public trailID(key: string): number {
        let a = 0;
        while (a < key.length && key[a] !== "_") {
            a++;
        }
        return a;
    }

    public sInputStringValid(input: any): string {
        if (typeof (input) !== "string") {
            return "Invalid value type in IS, should be string";
        }
        for (let i = 0; i < input.length; i++) {
            if (input.charAt(i) === "*" && i !== 0 && i !== input.length - 1) {
                return "Asterisks (*) can only be the first or last characters of input strings";
            }
        }
        return "";
    }

    // when called in COLUMNS: validate keys and record keys
    // when called in ORDER: validate keys (and check presence in COLUMNS)
    public keyValid(key: any, subject: any, fopt: number, record: number, incol: number): string {
        // parse key into field and id
        let fields = fopt === 1 ? this.sfields : this.mfields;
        let bd = this.trailID(key);
        if (bd === 0) { return "Referenced dataset cannot be empty string"; }
        if (bd === key.length) { return "Invalid key: " + key + " in " + subject; }

        let field = key.substring(bd + 1);
        let id = key.substring(0, bd);
        if (record === 1) { this.avaKeys.add(field); }
        if (incol === 1) { return this.avaKeys.has(field) ? "" : "ALL ORDER key must be in COLUMNS"; }

        // validate mfield and id
        if (this.curid !== "" && this.curid !== id) { return "Cannot query more than one dataset"; }
        this.curid = id;
        if (!this.ids.has(id)) { return "Referenced dataset " + id + " not added"; }
        if (!fields.has(field)) { return "Invalid key: " + key + " in " + subject; }
        return "";
    }

    public sContains(key: string): boolean {
        return this.sfields.has(key);
    }

    public mContains(key: string): boolean {
        return this.mfields.has(key);
    }

    public anyKeyValid(): boolean {
        return false;
    }

    public applyKeyValid(akey: string): boolean {
        for (let c of akey) {
            if (c === "_") { return false; }
        }
        return false;
    }
}
