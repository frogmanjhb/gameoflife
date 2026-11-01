export declare const CONFIG: {
    schema: number;
    storageKey: string;
    maxCitizens: number;
    apPerRound: number;
    start: {
        coins: number;
        food: number;
        wood: number;
        stone: number;
        tools: number;
        level: number;
        xp: number;
        treasury: number;
    };
    env: {
        forest: number;
        soil: number;
        water: number;
        pollution: number;
        habitat: number;
    };
    xpPerAction: number;
    xpPerLevel: number;
    treesPerTile: number;
    quarryStep: number;
    professions: {
        farmer: {
            name: string;
            icon: string;
            colour: string;
        };
        logger: {
            name: string;
            icon: string;
            colour: string;
        };
        miner: {
            name: string;
            icon: string;
            colour: string;
        };
        craftsperson: {
            name: string;
            icon: string;
            colour: string;
        };
        builder: {
            name: string;
            icon: string;
            colour: string;
        };
        trader: {
            name: string;
            icon: string;
            colour: string;
        };
    };
    actions: {
        farm: {
            prof: string;
            ap: number;
            food: number;
            soil: number;
            water: number;
        };
        chop: {
            prof: string;
            ap: number;
            wood: number;
            forest: number;
            minForest: number;
            treesFelled: number;
        };
        mine: {
            prof: string;
            ap: number;
            stone: number;
            pollution: number;
            water: number;
        };
        craft: {
            prof: string;
            ap: number;
            cost: {
                wood: number;
                stone: number;
            };
            tools: number;
        };
        shift: {
            prof: string;
            ap: number;
            wage: number;
        };
        deliver: {
            prof: string;
            ap: number;
            pay: number;
        };
        plant: {
            prof: null;
            ap: number;
            forest: number;
        };
        clean: {
            prof: null;
            ap: number;
            water: number;
            pollution: number;
        };
        donate: {
            prof: null;
            ap: number;
            maxUnits: number;
        };
        develop: {
            prof: null;
            ap: number;
        };
        fish: {
            prof: null;
            ap: number;
            food: number;
            habitat: number;
        };
        rest: {
            prof: string;
            ap: number;
            soil: number;
            condition: number;
        };
        restore: {
            prof: null;
            ap: number;
            cost: {
                tools: number;
                wood: number;
            };
            habitat: number;
        };
        giveWork: {
            prof: null;
            ap: number;
            maxUnits: number;
        };
    };
    communityActions: boolean;
    waterBands: {
        min: number;
        key: string;
        name: string;
        mult: number;
        words: string;
        colour: string;
    }[];
    minFood: number;
    store: {
        buy: {
            food: number;
            wood: number;
            stone: number;
            tools: number;
        };
        sell: {
            food: number;
            wood: number;
            stone: number;
            tools: number;
        };
    };
    taxRate: number;
    maxListingPrice: number;
    settlement: {
        foodPerCitizen: number;
        hungryApPenalty: number;
        forest: number;
        soil: number;
        water: number;
        pollution: number;
        treesRegrow: number;
    };
    completionBonus: number;
    habitat: {
        dev: {
            farm: number;
            quarry: number;
            houses: number;
            forest: number;
        };
        reclaim: number;
        link: number;
        wildRecover: number;
        wildMin: number;
        forestPer: number;
        quarryPer: number;
        pressure: {
            food: number;
            forest: number;
            fish: number;
        };
        critical: {
            food: number;
            fish: number;
            ap: number;
        };
    };
    places: {
        farmWear: number;
        quarryWear: number;
        recover: number;
        quarryRecover: number;
        restBonus: number;
        full: number;
        low: number;
    };
    terrain: {
        deep: {
            name: string;
            col: number;
            h: number;
            water: boolean;
            sea: boolean;
        };
        shallow: {
            name: string;
            col: number;
            h: number;
            water: boolean;
            sea: boolean;
        };
        icewater: {
            name: string;
            col: number;
            h: number;
            water: boolean;
            sea: boolean;
        };
        bridge: {
            name: string;
            col: number;
            h: number;
            water: boolean;
            sea: boolean;
        };
        lake: {
            name: string;
            col: number;
            h: number;
            water: boolean;
        };
        river: {
            name: string;
            col: number;
            h: number;
            water: boolean;
        };
        beach: {
            name: string;
            col: number;
            h: number;
        };
        grass: {
            name: string;
            col: number;
            h: number;
        };
        meadow: {
            name: string;
            col: number;
            h: number;
        };
        openland: {
            name: string;
            col: number;
            h: number;
        };
        newland: {
            name: string;
            col: number;
            h: number;
        };
        forest: {
            name: string;
            col: number;
            h: number;
        };
        farm: {
            name: string;
            col: number;
            h: number;
        };
        quarry: {
            name: string;
            col: number;
            h: number;
        };
        houses: {
            name: string;
            col: number;
            h: number;
        };
        desert: {
            name: string;
            col: number;
            h: number;
        };
        mountain: {
            name: string;
            col: number;
            h: number;
        };
        ice: {
            name: string;
            col: number;
            h: number;
        };
    };
    dev: {
        from: string[];
        to: {
            farm: {
                name: string;
                icon: string;
                cost: {
                    wood: number;
                };
                effect: string;
            };
            forest: {
                name: string;
                icon: string;
                cost: {};
                effect: string;
            };
            quarry: {
                name: string;
                icon: string;
                cost: {
                    tools: number;
                };
                effect: string;
            };
            houses: {
                name: string;
                icon: string;
                cost: {
                    wood: number;
                    stone: number;
                };
                effect: string;
            };
        };
        farmPer: number;
        farmMax: number;
        forestPer: number;
        forestMax: number;
        quarryPer: number;
        quarryMax: number;
        quarryPollution: number;
        quarryPollutionMax: number;
        housesCoins: number;
    };
    works: {
        reclaim: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            water: number;
            benefit: string;
        };
        link: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            benefit: string;
        };
    };
    projects: {
        market: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            labour: number;
            benefit: string;
            storeDiscount: number;
        };
        school: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            labour: number;
            benefit: string;
            xpBonus: number;
        };
        bridge: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            labour: number;
            benefit: string;
            farmBonus: number;
        };
        wtp: {
            name: string;
            icon: string;
            mat: {
                wood: number;
                stone: number;
                tools: number;
            };
            labour: number;
            benefit: string;
            water: number;
            pollution: number;
        };
    };
    gaugeBands: {
        goodFrom: number;
        warnFrom: number;
        pollutionGoodTo: number;
        pollutionWarnTo: number;
    };
    map: string[];
    tileCodes: {
        F: {
            type: string;
        };
        A: {
            type: string;
        };
        Q: {
            type: string;
        };
        R: {
            type: string;
        };
        U: {
            type: string;
        };
        T: {
            type: string;
        };
        M: {
            type: string;
            project: string;
        };
        S: {
            type: string;
            project: string;
        };
        B: {
            type: string;
            project: string;
        };
        W: {
            type: string;
            project: string;
        };
    };
    bridgeTiles: {
        r: number;
        c: number;
        type: string;
    }[];
    reflectionPrompts: string[];
    reflectionMax: number;
    logCap: number;
    inactiveRounds: number;
    jobChange: {
        xpCost: number;
        perRound: number;
        xpSource: "game" | "civiclab";
    };
};
//# sourceMappingURL=config.d.ts.map