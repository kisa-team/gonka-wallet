import { v4 as uuidv4 } from "uuid";

export const Randomize = {
    getUuid(): string {
        return uuidv4();
    },

    getShortUuid(): string {
        const parts = uuidv4().split("-");
        return parts[parts.length - 1];
    },

    getRandomInt(min = 0, max = 1): number {
        max++;
        return Math.floor(Randomize.getRandomFloat(min, max));
    },

    getRandomFloat(min = 0, max = 1): number {
        max--;
        return Math.random() * (max - min + 1) + min;
    },

    shuffleArray<T extends any[]>(array: T): T {
        let currentIndex = array.length;
        let temporaryValue: any;
        let randomIndex: any;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },
};
