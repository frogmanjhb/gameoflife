"use strict";
// @ts-nocheck
// Balancing values — extracted from game-of-resources-prototype.html
// Values marked ASSUMPTION were not available from the Our World brief at build time.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.CONFIG = {
    schema: 4,
    storageKey: 'ourworld.v4',
    maxCitizens: 120,
    apPerRound: 6,
    start: { coins: 100, food: 3, wood: 2, stone: 1, tools: 0, level: 1, xp: 0, treasury: 250 },
    env: { forest: 80, soil: 75, water: 80, pollution: 15, habitat: 80 }, // ASSUMPTION
    xpPerAction: 1, // ASSUMPTION
    xpPerLevel: 10, // ASSUMPTION
    treesPerTile: 6,
    quarryStep: 6, // stone mined per visible step of quarry depth (visual only)
    professions: {
        farmer: { name: 'Farmer', icon: 'i-wheat', colour: '#d9a425' },
        logger: { name: 'Logger', icon: 'i-axe', colour: '#8a5a2b' },
        miner: { name: 'Miner', icon: 'i-pick', colour: '#5f6f7d' },
        craftsperson: { name: 'Craftsperson', icon: 'i-craft', colour: '#9b5aa0' },
        builder: { name: 'Builder', icon: 'i-brick', colour: '#d0662f' },
        trader: { name: 'Trader', icon: 'i-scale', colour: '#2f7d9d' }
    },
    actions: {
        farm: { prof: 'farmer', ap: 1, food: 3, soil: -4, water: -1 },
        chop: { prof: 'logger', ap: 1, wood: 3, forest: -5, minForest: 20, treesFelled: 2 },
        mine: { prof: 'miner', ap: 1, stone: 2, pollution: 4, water: -3 },
        craft: { prof: 'craftsperson', ap: 1, cost: { wood: 2, stone: 1 }, tools: 1 },
        shift: { prof: 'builder', ap: 1, wage: 6 },
        deliver: { prof: 'trader', ap: 1, pay: 8 },
        plant: { prof: null, ap: 1, forest: 3 }, // ASSUMPTION: community action, not in the prompt
        clean: { prof: null, ap: 1, water: 3, pollution: -2 }, // ASSUMPTION: community action, not in the prompt
        donate: { prof: null, ap: 1, maxUnits: 3 },
        develop: { prof: null, ap: 1 }, // ASSUMPTION: develop wild land
        fish: { prof: null, ap: 1, food: 2, habitat: -1 }, // ASSUMPTION: any job can fish next to village land
        rest: { prof: 'farmer', ap: 2, soil: 3, condition: 20 }, // ASSUMPTION: skip a harvest to rest and compost a field
        restore: { prof: null, ap: 3, cost: { tools: 1, wood: 2 }, habitat: 2 }, // ASSUMPTION: turn developed land back into wild land
        giveWork: { prof: null, ap: 1, maxUnits: 3 } // ASSUMPTION: donate to land works
    },
    communityActions: true, // set to false to remove Plant trees and Clean the river
    waterBands: [
        { min: 75, key: 'clear', name: 'Clear blue', mult: 1, words: 'a full harvest', colour: '#3a8fc7' },
        { min: 50, key: 'cloudy', name: 'Slightly cloudy', mult: 0.75, words: 'three quarters', colour: '#6aa6b6' },
        { min: 25, key: 'murky', name: 'Murky green', mult: 0.5, words: 'half', colour: '#6c8a4c' },
        { min: 0, key: 'brown', name: 'Brown', mult: 0.25, words: 'a quarter', colour: '#8a6a45' }
    ],
    minFood: 1,
    store: {
        buy: { food: 4, wood: 5, stone: 6, tools: 15 },
        sell: { food: 2, wood: 2, stone: 3, tools: 7 }
    },
    taxRate: 0.05, // rounded down to whole coins
    maxListingPrice: 999,
    settlement: {
        foodPerCitizen: 1, hungryApPenalty: 1,
        forest: 3, soil: 2, water: 2, pollution: -3, treesRegrow: 1
    },
    completionBonus: 40, // ASSUMPTION
    habitat: {
        dev: { farm: -3, quarry: -3, houses: -3, forest: 2 }, // change when land is developed
        reclaim: -6, link: -2, // change when land works finish
        wildRecover: 1, wildMin: 15, // nightly recovery while this much wild land is left
        forestPer: 2, quarryPer: 2, // nightly: +1 per 2 planted forests, -1 per 2 new quarries
        pressure: { food: 1, forest: 1, fish: 1 }, // Under pressure: less food, slower forest, fewer fish
        critical: { food: 2, fish: 2, ap: 1 } // Critical: the forest stops recovering and everyone has 1 fewer AP
    },
    places: { farmWear: 20, quarryWear: 15, recover: 10, quarryRecover: 5, restBonus: 10, full: 60, low: 30 }, // ASSUMPTION: each workplace has its own condition
    // ---- the planet beyond the island (land works and development) ----
    terrain: {
        deep: { name: 'Deep ocean', col: 0x2f78ad, h: -0.14, water: true, sea: true },
        shallow: { name: 'Ocean', col: 0x4fa3cf, h: -0.1, water: true, sea: true },
        icewater: { name: 'Icy sea', col: 0xbfe3ef, h: -0.08, water: true, sea: true },
        bridge: { name: 'Island bridge', col: 0x4fa3cf, h: -0.1, water: true, sea: true },
        lake: { name: 'Lake', col: 0x7fd0e0, h: -0.07, water: true },
        river: { name: 'River', col: 0x86d3e6, h: -0.06, water: true },
        beach: { name: 'Beach', col: 0xe3cf98, h: -0.03 },
        grass: { name: 'Grassland', col: 0x9cc068, h: 0 },
        meadow: { name: 'Meadow', col: 0xa9bd6e, h: 0 },
        openland: { name: 'Open land', col: 0xa9bd6e, h: 0 },
        newland: { name: 'New land', col: 0xc9c27e, h: -0.02 },
        forest: { name: 'Forest', col: 0x6c9a4c, h: 0 },
        farm: { name: 'Farm', col: 0x9a6b3f, h: 0 },
        quarry: { name: 'Quarry', col: 0x9d9b94, h: -0.04 },
        houses: { name: 'Houses', col: 0xd8cdb0, h: 0 },
        desert: { name: 'Desert', col: 0xd8b878, h: -0.01 },
        mountain: { name: 'Mountains', col: 0x9a9488, h: 0.14 },
        ice: { name: 'Ice', col: 0xf2f6f8, h: 0.02 }
    },
    dev: {
        from: ['beach', 'grass', 'meadow', 'newland', 'openland'],
        to: {
            farm: { name: 'Farm', icon: 'i-wheat', cost: { wood: 2 }, effect: 'Farmers grow 1 extra food for every 2 new farms (up to +3).' },
            forest: { name: 'Forest', icon: 'i-tree', cost: {}, effect: 'The forest recovers 1 extra point each night for every 2 new forests (up to +3).' },
            quarry: { name: 'Quarry', icon: 'i-stone', cost: { tools: 1 }, effect: 'Miners dig 1 extra stone for every 2 new quarries (up to +2). Each new quarry adds 1 pollution every night.' },
            houses: { name: 'Houses', icon: 'i-town', cost: { wood: 2, stone: 2 }, effect: 'Each block of houses adds 2 coins to the treasury every night.' }
        },
        farmPer: 2, farmMax: 3, forestPer: 2, forestMax: 3, quarryPer: 2, quarryMax: 2, quarryPollution: 1, quarryPollutionMax: 4, housesCoins: 2
    },
    works: {
        reclaim: { name: 'Land reclamation', icon: 'i-land', mat: { wood: 2, stone: 6, tools: 0 }, water: -3,
            benefit: 'Turns this ocean tile into new land. Filling the sea harms sea life: Water -3 and Natural Habitat -6 when it is finished.' },
        link: { name: 'Island bridge', icon: 'i-bridge', mat: { wood: 6, stone: 8, tools: 2 },
            benefit: 'Crosses ocean, a river or a lake to reach new land. That land becomes yours to develop. The water flows on underneath. Natural Habitat -2 when it is finished.' }
    },
    projects: {
        market: { name: 'Community Market', icon: 'i-store', mat: { wood: 10, stone: 6, tools: 0 }, labour: 4,
            benefit: 'Village Store prices drop by 1 coin.', storeDiscount: 1 },
        school: { name: 'Village School', icon: 'i-school', mat: { wood: 14, stone: 10, tools: 3 }, labour: 8,
            benefit: 'Every action gives 1 extra XP.', xpBonus: 1 },
        bridge: { name: 'Stone Bridge', icon: 'i-bridge', mat: { wood: 6, stone: 14, tools: 2 }, labour: 6,
            benefit: 'Four new tiles rise from the sea across the river. Farmers grow 1 extra food.', farmBonus: 1 },
        wtp: { name: 'Water Treatment Plant', icon: 'i-plant', mat: { wood: 6, stone: 12, tools: 4 }, labour: 6,
            benefit: 'Every night: Water +5 and Pollution -3.', water: 5, pollution: -3 }
    },
    gaugeBands: { goodFrom: 60, warnFrom: 30, pollutionGoodTo: 30, pollutionWarnTo: 60 },
    // 8x8 island. F forest, A farm, Q quarry, R river, U open land, T town, M S B W project sites.
    map: [
        'FFFRUAAQ',
        'FFURUAAQ',
        'FFRRMUAQ',
        'FURTTUUU',
        'UURTTSUU',
        'AARRRUFF',
        'AAWURUFF',
        'UUUBRUFF'
    ],
    tileCodes: {
        F: { type: 'forest' }, A: { type: 'farm' }, Q: { type: 'quarry' }, R: { type: 'river' },
        U: { type: 'land' }, T: { type: 'town' },
        M: { type: 'site', project: 'market' }, S: { type: 'site', project: 'school' },
        B: { type: 'site', project: 'bridge' }, W: { type: 'site', project: 'wtp' }
    },
    bridgeTiles: [{ r: 8, c: 5, type: 'farm' }, { r: 8, c: 6, type: 'farm' }, { r: 8, c: 7, type: 'forest' }, { r: 7, c: 8, type: 'forest' }],
    reflectionPrompts: [
        'Which choice this round helped the river most? What is your evidence?',
        'Which job changed the environment the most this round? How do you know?',
        'Did anyone go hungry? What could the village do differently next time?',
        'How did trading help or hurt people in our village this round?',
        'Which project should the village build next? Give one reason.',
        'What is one choice you made that helped someone else?',
        'Look at the forest. Is it healthy? What should we do next round?',
        'If you could change one rule to help people and the land, what would it be and why?',
        'Was a new farm or quarry worth the loss of natural habitat? Explain your thinking.'
    ],
    reflectionMax: 280,
    logCap: 2000,
    inactiveRounds: 3,
    jobChange: {
        xpCost: 30,
        perRound: 1,
        xpSource: 'game',
    },
};
//# sourceMappingURL=config.js.map