
export class QueryUtils {
    private curid = "";       // id of current query
    private type: number;     // 0, courses; 1, rooms
    private ids = new Set();  // ids of all currently added datasets
    private hasTrans = false; // whether curret query has TRANSFORMATION

    private columnKeys = new Set<string>(); // keys presented in COLUMNS
    private groupKeys = new Set<string>();  // keys presented in GROUP
    private applyKeys = new Set<string>();  // keys presented in APPLYRULE

    // fields
    private roomFields = new Set<string>();
    private courseFields = new Set<string>();

    private courseMFields = new Set<string>(); // = [ "avg", "pass", "fail", "audit", "year" ];
    private courseSFields = new Set<string>(); // [ "dept", "id", "instructor", "title", "uuid"];

    private roomMFields = new Set<string>();
    private roomSFields = new Set<string>();

    private applyTokens = new Set<string>();
    private fieldsOfType: Set<string>;


    constructor() {
        let roomFieldArray = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href",
            "lat", "lon", "seats"];
        for (let f of roomFieldArray) {
            this.roomFields.add(f);
        }
        let courseFieldArray = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
        for (let f of courseFieldArray) {
            this.courseFields.add(f);
        }

        let roomMFieldArray = ["lat", "lon", "seats"];
        for (let f of roomMFieldArray) {
            this.roomMFields.add(f);
        }
        let roomSFieldArray = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        for (let f of roomSFieldArray) {
            this.roomSFields.add(f);
        }

        let courseMFieldsArray = ["avg", "pass", "fail", "audit", "year"];
        for (let mf of courseMFieldsArray) {
            this.courseMFields.add(mf);
        }
        let courseSFieldsArray = ["dept", "id", "instructor", "title", "uuid"];
        for (let sf of courseSFieldsArray) {
            this.courseSFields.add(sf);
        }

        let applyTokenArray = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        for (let at of applyTokenArray) {
            this.applyTokens.add(at);
        }
    }

    public getHasTrans() {
        return this.hasTrans;
    }

    public getCurID() {
        return this.curid;
    }

    // ** Setup methods **
    // Determine whether rooms or courses being queried and
    // setup current id analyzing GROUP or COLUMNS
    // public setup(query: any, dataset: { [key: string]: InsightCourse[]| InsightRoom[] }): string {
    public setup(query: any): string {
        if (!query) {
            return "Query Invalid Null";
        }
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            this.hasTrans = true;
        }
        let sample: any; // e.g. "rooms_seats" OR "courses_avg"
        try {
            sample = this.hasTrans ? query["TRANSFORMATIONS"]["GROUP"][0] : query["OPTIONS"]["COLUMNS"][0];
        } catch (err) {
            return "query invalid";
        }
        if (sample === undefined) {
            return "Query Invalid";
        } // may not be array

        let bd = this.trailID(sample);
        if (bd === 0) {
            return "Dataset id cannot be empty";
        }
        this.curid = sample.substr(0, bd);
        if (!this.ids.has(this.curid)) {
            return "Referenced dataset " + this.curid + " not added";
        }

        // determine type
        let field = sample.substr(bd + 1);
        if (this.roomFields.has(field)) {
            this.type = 1;
            // assert(InsightValidator.isInsightCourse(dataset[this.curid]));
        } else if (this.courseFields.has(field)) {
            this.type = 0;
        } else {
            return "Invalid fields";
        }
        this.fieldsOfType = this.type ? this.roomFields : this.courseFields;
        return "";
    }

    public setIDs(ids: Set<string>) {
        this.ids = ids;
    }

    // ** Key and field validating methods **
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

    public keyValid(key: any, subject: any, fields: Set<string>): string {
        // let fields = this.type ? this.roomFields : this.courseFields;
        let bd = this.trailID(key);
        if (bd === 0) {
            return "Referenced dataset cannot be empty string";
        }
        if (bd === key.length) {
            return "Invalid key: " + key + " in " + subject;
        }

        let field = key.substring(bd + 1);
        let id = key.substring(0, bd);
        if (this.curid !== id) {
            return "Cannot query more than one dataset";
        }
        if (!fields.has(field)) {
            return "Invalid key: " + key + " in " + subject;
        }
        return "";
    }

    // ** Validators for COLUMNS and OPTIONS **
    public bodySValid(skey: string, object: string): string {
        return this.keyValid(skey, object, !this.type ? this.courseSFields : this.roomSFields);
    }

    public bodyMValid(mkey: string, object: string): string {
        return this.keyValid(mkey, object, !this.type ? this.courseMFields : this.roomMFields);
    }

    // validate column keys and record
    public columnKeyValid(key: string) {
        if (!this.hasTrans) {
            let keyErr = this.keyValid(key, "COLUMNS", this.fieldsOfType);
            if (keyErr !== "") {
                return keyErr;
            }
        } else if (!this.groupKeys.has(key) && !this.applyKeys.has(key)) {
            return "Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present";
        }
        this.columnKeys.add(key);
        return "";
    }

    public orderKeyValid(key: string) {
        if (!this.columnKeys.has(key)) {
            return "ORDER key must be in COLUMNS";
        }
        if (!this.applyKeys.has(key)) {
            return this.keyValid(key, "OPTIONS", this.fieldsOfType);
        }
        return "";
    }

    // ** Validators for TRANSFORMATIONS **
    public groupKeyValid(key: string) {
        this.groupKeys.add(key);
        return this.keyValid(key, "GROUP", this.fieldsOfType);
    }

    public applyKeyValid(akey: string): string {
        if (akey.length === 0) {
            return "Apply key cannot be empty string";
        }
        if (this.applyKeys.has(akey)) {
            return "Duplicate APPLY key " + akey;
        }
        if (akey.toString().indexOf("_") !== -1) {
            return "Cannot have underscore in applyKey";
        }
        this.applyKeys.add(akey);
        return "";
    }

    public applyTokenValid(atoken: string): string {
        if (!this.applyTokens.has(atoken)) {
            return "Invalid apply rule target key";
        }
        return "";
    }

    // atk: "AVG"; atkk: "courses_avg"
    public applyTokenKeyValid(atk: string, atkk: string): string {
        let mfields = this.type ? this.roomMFields : this.courseMFields;
        let atkkErr = this.keyValid(atkk, "APPLY", this.fieldsOfType);
        if (atkkErr !== "") {
            return atkkErr;
        }

        if (atk === "MAX" || atk === "MIN" || atk === "AVG" || atk === "SUM") {
            let keyWithoutTypeName = atkk.split("_")[1];
            if (!mfields.has(keyWithoutTypeName)) {
                return "Invalid key type in " + atk;
            }
        }
        return "";
    }
}
