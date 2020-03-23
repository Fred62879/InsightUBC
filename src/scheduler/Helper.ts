import {SchedRoom} from "./IScheduler";
import Scheduler from "./Scheduler";

export default class Helper {
    private distancesHashTable: { [key: string]: number } = {};

    public static swap(array: number[], index0: number, index1: number) {
        let temp = array[index0];
        array[index0] = array[index1];
        array[index1] = temp;
    }

    public getDistance(room0: SchedRoom, room1: SchedRoom) {
        if (room0.rooms_shortname === room1.rooms_shortname) {
            return 0;
        }
        let key = room0.rooms_shortname > room1.rooms_shortname ? room0.rooms_shortname + room1.rooms_shortname :
            room1.rooms_shortname + room0.rooms_shortname;
        let distance = this.distancesHashTable[key];
        if (distance) {
            return distance;
        }
        let R = 6371e3; // metres
        let lat1: number = room0.rooms_lat;
        let lat2: number = room1.rooms_lat;
        let lon1: number = room0.rooms_lon;
        let lon2: number = room1.rooms_lon;
        let deltaLat = this.toRadians(lat2 - lat1);
        let deltaLon = this.toRadians(lon2 - lon1);
        lat1 = this.toRadians(lat1);
        lat2 = this.toRadians(lat2);
        let a = Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) ** 2;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        distance = d / 1372;
        this.distancesHashTable[key] = distance;
        return distance;
    }

    public static newNumberList(childrenLength: number, maxNumSectionCanBeScheduled: number): number[] {
        let result: number[] = Array(childrenLength).fill(Scheduler.TOBEFILLED);
        for (let i = 0; i < maxNumSectionCanBeScheduled; i++) {
            result[i] = i;
        }
        return result;
    }


    public static shuffle(array: number[]): number[] {
        let inputArray = array.slice();
        let result = [];
        while (inputArray.length) {
            let index = Math.floor(Math.random() * inputArray.length);
            result.push(inputArray.splice(index, 1)[0]);
        }
        return result;
    }

    private toRadians(angleIndegree: number) {
        return angleIndegree * (Math.PI / 180);
    }

}
