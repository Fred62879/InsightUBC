import Helper from "./Helper";
import Scheduler from "./Scheduler";
import {SchedRoom} from "./IScheduler";
import Log from "../Util";

export default class GA {
    private population: number[][] = [];
    private fitness: number[] = [];
    private normalizedFitness: number[] = [];
    public topFitnessScore = 0;
    public bestPlan: number[] = [];
    private totalPopulationSize: number = 20;
    private mutationRate: number = 0.01;
    public timeLimit = 20000;
    public fitnessthreshold = 0.99;
    private enrollmentFitnessWeight = 0.7;
    private distanceFitnessWeight = 0.3;
    private minFitness = 0.01;
    private replaceWithBestIndividualRate = 0;
    private replaceWithrandomIndividualRate = 0.5;
    private numOfCrossOverPerGeneration = 1;
    public grading: number = 0;
    private scheduler: Scheduler;

    constructor(scheduler: Scheduler) {
        this.scheduler = scheduler;
    }

    public addNewRandomIndividual() {
        //
        if (Math.random() < this.replaceWithrandomIndividualRate) {
            let order: number[] = Helper.range(0, this.scheduler.childrenLength);
            order = Helper.shuffle(order);
            let randomIndex = Math.floor(Math.random() * this.population.length);
            this.population[randomIndex] = order;
        }
    }

    public crossover(order0: number[], order1: number[], numberOfSchedSection: number) {
        let order: number[] = new Array(order0.length).fill(Scheduler.TOBEFILLED);
        for (let i = 0; i < numberOfSchedSection * this.numOfCrossOverPerGeneration; i++) {
            order[i] = Math.random() > 0.5 ? order0[i] : Scheduler.TOBEFILLED;
        }
        let j = 0;
        for (let i = 0; i < order1.length; i++) {
            if (order[i] === Scheduler.TOBEFILLED) {
                while (order.includes(order1[j]) && j < order1.length) {
                    j++;
                }
                order[i] = order1[j];
            }
        }
        return order;
    }

    public calculateFitness(helper: Helper) {
        for (let i = 0; i < this.population.length; i++) {
            let order: number[] = this.population[i];
            let capacityFitness = this.getCapacityFitness(order);
            let distanceFitness: number = this.getDistanceFitness(order, helper);
            let enrollmentFitness: number = this.getEnrollmentFitness(order);
            this.fitness[i] = 1 / (1 + capacityFitness + distanceFitness * this.distanceFitnessWeight +
                enrollmentFitness * this.enrollmentFitnessWeight) + this.minFitness;
            if (this.fitness[i] > this.topFitnessScore) {
                this.topFitnessScore = this.fitness[i];
                this.grading = 0.7 * (1 - enrollmentFitness) + 0.3 * (1 - distanceFitness);
                // Log.test(this.topFitnessScore);
                this.bestPlan = order;
            }
        }
    }

    public getDistanceFitness(order: number[], helper: Helper) {
        let dBest: number = 0;
        let buildings = this.getUsedBuilding(order);
        if (buildings.length === 0) {
            dBest = Infinity;
        } else if (buildings.length > 1) {
            for (let i = 0; i < buildings.length - 1; i++) {
                for (let j = i + 1; j < buildings.length; j++) {
                    let d = helper.getDistance(buildings[i], buildings[j]);
                    if (d > dBest) {
                        dBest = d;
                    }
                }
            }
        } else if (buildings.length === 1) {
            dBest = 0;
        }
        return dBest;
    }

    private getCapacityFitness(order: number[]): number {
        let fitness = 0;
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let room: SchedRoom = this.scheduler.getSchedRoom(order[i]);
            if (this.scheduler.getSchedRoom(order[i])) {
                if (!this.scheduler.hasEnoughSeat(room, this.scheduler.sections[i])) {
                    fitness = Infinity;
                }
            }
        }
        return fitness;
    }

    public normalizeFitness() {
        let fitnessSum: number = this.fitness.reduce((sum, fitness) => {
            return sum + fitness;
        }, 0);
        for (let i = 0; i < this.fitness.length; i++) {
            this.normalizedFitness[i] = this.fitness[i] / fitnessSum;
        }
    }

    public nextGeneration() {
        let newPopulation: number[][] = [];
        for (let i of this.population) {
            let order0: number[] = this.pickParentFromPopulation();
            let order1: number[] = this.pickParentFromPopulation();
            let order: number[] = this.crossover(order0, order1, this.scheduler.numberOfSchedSection);
            order = this.mutate(order, this.mutationRate);
            order = this.greedy(order, true);
            newPopulation.push(order);
        }
        this.population = newPopulation;
        this.bringInTheFittest();
        this.addNewRandomIndividual();
        // Log.test(this.population);
        // Log.test(this.fitness);
    }

    private greedy(order: number[], ascending: boolean = true): number[] {
        let result: number[] = order.slice();
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let pushedToOrderAscending = false;
            for (let j = 0; j < result.length; j++) {
                let a = ascending ? 1 : -1;
                let b = ascending ? 0 : 1;
                let index = (this.scheduler.numberOfSchedSection - 1) * b + i * a;
                if (this.scheduler.hasEnoughSeat(this.scheduler.getSchedRoom(result[j]),
                    this.scheduler.sections[index])) {
                    // let temp = result[j];
                    if (index <= j) {
                        Helper.swap(result, index, j);
                        pushedToOrderAscending = true;
                        break;
                    }
                }
            }
            if (!pushedToOrderAscending) {
                result[i] = Scheduler.TOBEFILLED;
            }
        }
        return result;
    }

    private mutate(order: number[], mutationRate: number) {
        let result = order.slice();
        for (let i of result) {
            if (mutationRate >= Math.random()) {
                let index0 = Math.floor(Math.random() * this.scheduler.numberOfSchedSection);
                let index1 = Math.floor(Math.random() * result.length);
                Helper.swap(result, index0, index1);
            }
        }
        return result;
    }

    private bringInTheFittest() {
        if (Math.random() < this.replaceWithBestIndividualRate) {
            let randomIndex;
            randomIndex = Math.floor(Math.random() * this.population.length);
            this.population[randomIndex] = this.bestPlan.slice();
        }
    }

    public generateFirstGeneration() {
        this.population.push(this.greedy(Helper.range(0, this.scheduler.maxNumberOfSectionsCanBeScheduled), true));
        this.population.push(this.greedy(Helper.range(0, this.scheduler.maxNumberOfSectionsCanBeScheduled), false));
        for (let i = 0; i < this.totalPopulationSize - 2; i++) {
            let order: number[] = Helper.range(0, this.scheduler.childrenLength);
            order = Helper.shuffle(order);
            order = this.greedy(order, true);
            this.population.push(order);
        }
    }

    private pickParentFromPopulation() {
        let index = 0;
        let r = Math.random();

        while (r > 0) {
            r = r - this.normalizedFitness[index];
            index++;
        }
        index--;
        return this.population[index].slice();
    }

    public getEnrollmentFitness(order: number[]): number {
        let scheduledEnrollment: number = 0;
        let totalEnrollment: number = 0;
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            if (this.scheduler.getSchedRoom(order[i])) {
                scheduledEnrollment += this.scheduler.getNumberOfStudentsInASection(this.scheduler.sections[i]);
            }
            totalEnrollment += this.scheduler.getNumberOfStudentsInASection(this.scheduler.sections[i]);
        }
        return totalEnrollment ? (1 - scheduledEnrollment / totalEnrollment) : 0;
    }

    private getUsedBuilding(order: number[]): SchedRoom[] {
        let usedBuildings: SchedRoom[] = [];
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let room: SchedRoom = this.scheduler.getSchedRoom(order[i]);
            if (room) {
                let isInUsedBuildings: boolean = false;
                for (let building of usedBuildings) {
                    if (building.rooms_shortname === room.rooms_shortname) {
                        isInUsedBuildings = true;
                        break;
                    }
                }
                if (!isInUsedBuildings) {
                    usedBuildings.push(room);
                }
            }
        }
        return usedBuildings;
    }
}
