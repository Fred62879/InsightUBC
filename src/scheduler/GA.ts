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
    private mutationRate: number = 0;
    public timeLimit = 100000;
    public fitnessthreshold = 0.99;
    private enrollmentFitnessWeight = 0.7;
    private distanceFitnessWeight = 0.3;
    private minFitness = 0.01;
    private replaceWithBestIndividualRate = 1;
    private replaceWithrandomIndividualRate = 0.8;
    private numOfCrossOverPerGeneration = 1;
    public grading: number = 0;
    private scheduler: Scheduler;
    private percentageOfGreedyFirstGeneration = 0.1;
    private greedySkipRate = 0.5;
    private pickRandomChance = 0.1;
    private pickBestChance = 0.9;

    constructor(scheduler: Scheduler) {
        this.scheduler = scheduler;
    }

    public addNewRandomIndividual() {
        for (let i of this.population) {
            if (Math.random() < this.replaceWithrandomIndividualRate) {
                let order: number[] = Helper.newNumberList(
                    this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled);
                order = Helper.shuffle(order);
                let randomIndex = Math.floor(Math.random() * this.population.length);
                this.population[randomIndex] = order;
            }
        }
    }

    public crossover(order0: number[], order1: number[], numberOfSchedSection: number) {
        let order: number[] = new Array(order0.length).fill(Scheduler.TOBEFILLED);
        let order2 = order1.slice();
        let toBeFilled: number[] = [];
        let skippedSessions = [];
        for (let i = 0; i < order0.length; i++) {
            if (order0[i] === Scheduler.TOBEFILLED || Math.random() < 0.5) {
                order[i] = Scheduler.TOBEFILLED;
                toBeFilled.push(i);
            } else {
                let room = this.scheduler.getSchedRoom(order0[i]);
                if (room && this.scheduler.hasEnoughSeat(room, this.scheduler.sections[i])) {
                    order[i] = order0[i];
                }
            }
        }
        for (let i of toBeFilled) {
            if (order[i] === Scheduler.TOBEFILLED) {
                if (Math.random() < this.greedySkipRate) {
                    skippedSessions.push(i);
                    continue;
                }
                this.fillToBeFillMidifiesArguments(order, order2, i);
            }
        }
        for (let index of skippedSessions) {
            if (order2.length < 1) {
                break;
            }
            this.fillToBeFillMidifiesArguments(order, order2, index);
        }
        return order;
    }

    public fillToBeFillMidifiesArguments(order: number[], order2: number[], index: number) {
        for (let j = 0; j < order2.length; j++) {
            if (order2[j] === Scheduler.TOBEFILLED || order.includes(order2[j])) {
                order2.splice(j, 1);
                j--;
            } else {
                let room1 = this.scheduler.getSchedRoom(order2[j]);
                if (room1 && this.scheduler.hasEnoughSeat(room1,
                    this.scheduler.sections[index])) {
                    order[index] = order2.splice(j, 1)[0];
                    j--;
                    break;
                }
            }
        }
    }

    public calculateFitness(helper: Helper) {
        for (let i = 0; i < this.population.length; i++) {
            let order: number[] = this.population[i];
            let capacityFitness = this.getCapacityFitness(order);
            let distanceFitness: number = this.getDistanceFitness(order, helper);
            let enrollmentFitness: number = this.getEnrollmentFitness(order);
            let grading = this.enrollmentFitnessWeight * (1 - enrollmentFitness) +
                this.distanceFitnessWeight * (1 - distanceFitness);
            this.fitness[i] = grading / (1 + capacityFitness) + this.minFitness;
            if (grading > this.grading) {
                this.topFitnessScore = this.fitness[i];
                this.grading = grading;
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
        // Log.test(this.population);
        // Log.test(this.fitness);
        let newPopulation: number[][] = [];
        for (let i of this.population) {
            let order0: number[] = this.pickParentFromPopulation(false, true);
            let order1: number[] = this.pickParentFromPopulation(true, false);
            let order: number[] = this.crossover(order0, order1, this.scheduler.numberOfSchedSection);
            // order = this.mutate(order, this.mutationRate);
            // order = this.greedy(order, true);
            newPopulation.push(order);
        }
        this.population = newPopulation;
    }

    private greedy(order: number[], ascending: boolean = true): number[] {
        let result: number[] = order.slice();
        for (let i = 0; i < this.scheduler.numberOfSchedSection; i++) {
            let pushedToOrderAscending = false;
            for (let j = 0; j < result.length; j++) {
                let a = ascending ? 1 : -1;
                let b = ascending ? 0 : 1;
                let index = (this.scheduler.numberOfSchedSection - 1) * b + i * a;
                let room = this.scheduler.getSchedRoom(result[j]);
                if (room && this.scheduler.hasEnoughSeat(room,
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
                if (result[index1] === Scheduler.TOBEFILLED) {
                    let numList = Helper.newNumberList(result.length, this.scheduler.maxNumberOfSectionsCanBeScheduled);
                    numList = Helper.shuffle(numList);
                    for (let num of numList) {
                        if (!result.includes(num)) {
                            result[index1] = num;
                            break;
                        }
                    }
                }
                Helper.swap(result, index0, index1);
            }
        }
        return result;
    }

    public bringInTheFittest() {
        if (Math.random() < this.replaceWithBestIndividualRate) {
            let randomIndex;
            randomIndex = Math.floor(Math.random() * this.population.length);
            this.population[randomIndex] = this.bestPlan.slice();
        }
    }

    public generateFirstGeneration() {
        this.population.push(this.greedy(Helper.newNumberList(
            this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled), true));
        for (let i = 0; i < this.totalPopulationSize - 1; i++) {
            let order: number[] = Helper.newNumberList(
                this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled);
            order = Helper.shuffle(order);
            if (Math.random() < this.percentageOfGreedyFirstGeneration) {
                order = this.greedy(order, true);
            }
            this.population.push(order);
        }
    }

    private pickParentFromPopulation(pickRandom: boolean = false, pickBest: boolean = false) {

        if (pickRandom && Math.random() < this.pickRandomChance) {
            let order: number[] = Helper.newNumberList(
                this.scheduler.childrenLength, this.scheduler.maxNumberOfSectionsCanBeScheduled);
            order = Helper.shuffle(order);
            return order;
        } else if (pickBest && Math.random() < this.pickBestChance) {
            return this.bestPlan.slice();
        }
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
