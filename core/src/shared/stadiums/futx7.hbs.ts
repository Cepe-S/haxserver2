export var stadiumText: string = `{

	"name" : "𝙵 𝚄 𝚃 𝚂 𝙰 𝙻 ⨯⁷ 🏆 𝗚𝗟𝗛",

	"width" : 1275,

	"height" : 675,

	"spawnDistance" : 350,

	"redSpawnPoints" : [
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -500, 0
		],
		[ -396, 635
		]

	],

	"blueSpawnPoints" : [
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 500, 0
		],
		[ 396, 635
		]

	],

	"bg" : { "type" : "grass", "width" : 0, "height" : 0, "kickOffRadius" : 180, "cornerRadius" : 0, "color" : "2a3a40" },

	"vertexes" : [
		/* 0 */ { "x" : -1200, "y" : -600, "trait" : "ballArea" },
		
		/* 1 */ { "x" : 0, "y" : 600, "trait" : "kickOffBarrier" },
		/* 2 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 3 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 4 */ { "x" : 0, "y" : -600, "trait" : "kickOffBarrier" },
		
		/* 5 */ { "x" : -1200, "y" : -110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 6 */ { "x" : -1250, "y" : -110, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 7 */ { "x" : -1250, "y" : 110, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "ffffff", "radius" : 7 },
		/* 8 */ { "x" : -1200, "y" : 110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 9 */ { "x" : 1200, "y" : -110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 10 */ { "x" : 1250, "y" : -110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 11 */ { "x" : 1250, "y" : 110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		/* 12 */ { "x" : 1200, "y" : 110, "trait" : "goalNet", "curve" : 0, "color" : "ffffff" },
		
		/* 13 */ { "x" : -1200, "y" : 110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 14 */ { "x" : -1200, "y" : 600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 15 */ { "x" : -1200, "y" : -110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 16 */ { "x" : -1200, "y" : -600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 17 */ { "x" : -1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 18 */ { "x" : 1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 19 */ { "x" : 1200, "y" : 110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 20 */ { "x" : 1200, "y" : 600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 21 */ { "x" : 1200, "y" : -600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 22 */ { "x" : 1200, "y" : -110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 23 */ { "x" : -1200, "y" : -600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		/* 24 */ { "x" : 1200, "y" : -600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		
		/* 25 */ { "x" : 0, "y" : -600, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 26 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 27 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 28 */ { "x" : 0, "y" : 600, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 29 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 30 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 31 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 32 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 33 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 34 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		/* 35 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		
		/* 36 */ { "x" : -1200, "y" : 110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 37 */ { "x" : -1200, "y" : 600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 38 */ { "x" : -1200, "y" : -600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 39 */ { "x" : -1200, "y" : -110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 40 */ { "x" : 1200, "y" : -600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 41 */ { "x" : 1200, "y" : -110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 42 */ { "x" : 1200, "y" : 110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 43 */ { "x" : 1200, "y" : 600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 44 */ { "x" : -1200, "y" : 600, "trait" : "ballArea" },
		/* 45 */ { "x" : -1200, "y" : -600, "trait" : "ballArea" },
		
		/* 46 */ { "x" : 0, "y" : 600, "trait" : "kickOffBarrier" },
		/* 47 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 48 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 49 */ { "x" : 0, "y" : -600, "trait" : "kickOffBarrier" },
		
		/* 50 */ { "x" : -1200, "y" : 110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 51 */ { "x" : -1200, "y" : 600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 52 */ { "x" : -1200, "y" : -110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 53 */ { "x" : -1200, "y" : -600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 54 */ { "x" : -1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 55 */ { "x" : 1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 56 */ { "x" : 1200, "y" : 110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 57 */ { "x" : 1200, "y" : 600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 58 */ { "x" : 1200, "y" : -600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 59 */ { "x" : 1200, "y" : -110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 60 */ { "x" : -1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 61 */ { "x" : 1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		
		/* 62 */ { "x" : 0, "y" : -600, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 63 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 64 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 65 */ { "x" : 0, "y" : 600, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 66 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 67 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 68 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 69 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 70 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 71 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		/* 72 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		
		/* 73 */ { "x" : -1200, "y" : 600, "trait" : "ballArea" },
		/* 74 */ { "x" : -1200, "y" : -600, "trait" : "ballArea" },
		
		/* 75 */ { "x" : 0, "y" : 600, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true },
		/* 76 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 77 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 78 */ { "x" : 0, "y" : -600, "trait" : "kickOffBarrier" },
		
		/* 79 */ { "x" : -1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 80 */ { "x" : 1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 81 */ { "x" : 1200, "y" : 110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 82 */ { "x" : 1200, "y" : 600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 83 */ { "x" : 1200, "y" : -600, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 84 */ { "x" : 1200, "y" : -110, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 85 */ { "x" : -1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 86 */ { "x" : 1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		
		/* 87 */ { "x" : 0, "y" : -600, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 88 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 89 */ { "x" : 0, "y" : -180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 90 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 91 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 92 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 93 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 94 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		/* 95 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		
		/* 96 */ { "x" : -1200, "y" : 600, "trait" : "ballArea" },
		/* 97 */ { "x" : -1200, "y" : -600, "trait" : "ballArea" },
		
		/* 98 */ { "x" : 0, "y" : 600, "trait" : "kickOffBarrier", "vis" : false },
		/* 99 */ { "x" : 0, "y" : 180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 100 */ { "x" : 0, "y" : -180, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 101 */ { "x" : 0, "y" : -600, "trait" : "kickOffBarrier", "vis" : false, "color" : "b3b6b6" },
		
		/* 102 */ { "x" : -1200, "y" : 110, "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 103 */ { "x" : -1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 104 */ { "x" : -1200, "y" : -110, "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 105 */ { "x" : -1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "curve" : 0 },
		/* 106 */ { "x" : -1200, "y" : 600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		/* 107 */ { "x" : 1200, "y" : 600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		/* 108 */ { "x" : 1200, "y" : 110, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 109 */ { "x" : 1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 110 */ { "x" : 1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 111 */ { "x" : 1200, "y" : -110, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 112 */ { "x" : -1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 113 */ { "x" : 1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
		
		/* 114 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 115 */ { "x" : 0, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		/* 116 */ { "x" : -1, "y" : 180, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		
		/* 117 */ { "x" : -1200, "y" : 110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 118 */ { "x" : -1200, "y" : 600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 119 */ { "x" : -1200, "y" : 110, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 120 */ { "x" : -1200, "y" : 600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 121 */ { "x" : -1200, "y" : -600, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 122 */ { "x" : -1200, "y" : -600, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 123 */ { "x" : 1200, "y" : -110, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 124 */ { "x" : 1200, "y" : -110, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 125 */ { "x" : -1207, "y" : 110, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 126 */ { "x" : -1207, "y" : 600, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 127 */ { "x" : -1207, "y" : -600, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 128 */ { "x" : -1207, "y" : -110, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 129 */ { "x" : 1207, "y" : -600, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 130 */ { "x" : 1207, "y" : -110, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 131 */ { "x" : 1207, "y" : 110, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		/* 132 */ { "x" : 1207, "y" : 600, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		
		/* 133 */ { "x" : 1200, "y" : -110, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "ffffff" },
		/* 134 */ { "x" : 1200, "y" : 110, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "ffffff" },
		/* 135 */ { "x" : 0, "y" : -180, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "b3b6b6" },
		/* 136 */ { "x" : 0, "y" : 180, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "b3b6b6" },
		/* 137 */ { "x" : 0, "y" : -11, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 138 */ { "x" : 0, "y" : 11, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 139 */ { "x" : 0, "y" : -11, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -180, "color" : "b3b6b6" },
		/* 140 */ { "x" : 0, "y" : 11, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -180, "color" : "b3b6b6" },
		/* 141 */ { "x" : -525.1982581967213, "y" : 584, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 142 */ { "x" : -525.1982581967213, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 143 */ { "x" : -267.4933401639344, "y" : 584, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 144 */ { "x" : -267.4933401639344, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 145 */ { "x" : 505.62141393442624, "y" : 584, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 146 */ { "x" : 505.62141393442624, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 147 */ { "x" : 247.91649590163934, "y" : 584, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 148 */ { "x" : 247.91649590163934, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 149 */ { "x" : -828.0015368852459, "y" : 600, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 150 */ { "x" : -828.0015368852459, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 151 */ { "x" : 1220.33349609375, "y" : 251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 152 */ { "x" : 1201.33349609375, "y" : 251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 153 */ { "x" : 1219.33349609375, "y" : -251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 154 */ { "x" : 1200.33349609375, "y" : -251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 155 */ { "x" : -841.1245088945966, "y" : -601, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 156 */ { "x" : -841.1245088945966, "y" : -617, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 157 */ { "x" : 808.4246926229508, "y" : 600, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 158 */ { "x" : 808.4246926229508, "y" : 616, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 159 */ { "x" : 837.7690984113394, "y" : -601, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 160 */ { "x" : 837.7690984113394, "y" : -617, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 161 */ { "x" : -1220.0747488827305, "y" : -251.82895884262769, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 162 */ { "x" : -1201.0752587242073, "y" : -251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 163 */ { "x" : -1218.9226063416277, "y" : 251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 164 */ { "x" : -1199.9231161831044, "y" : 251.9681483400014, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 165 */ { "x" : -1200, "y" : 570.456511053482, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 166 */ { "x" : -1171.6369452864983, "y" : 600, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 167 */ { "x" : -1200, "y" : -569.6420271253103, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 168 */ { "x" : -1170.6369452864983, "y" : -600, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 169 */ { "x" : 1200, "y" : -571.0124590189979, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 170 */ { "x" : 1170.319141439366, "y" : -600, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 171 */ { "x" : 1200, "y" : 569.9997004222528, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 172 */ { "x" : 1171.319141439366, "y" : 600, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 173 */ { "x" : -787, "y" : 205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "ff6363" },
		/* 174 */ { "x" : -787, "y" : -205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 44.33638217658901, "color" : "ff6363" },
		/* 175 */ { "x" : -787, "y" : -205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -90, "color" : "ff6363" },
		/* 176 */ { "x" : -1075, "y" : -470, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -90, "color" : "ff6363" },
		/* 177 */ { "x" : -787, "y" : 205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 90, "color" : "ff6363" },
		/* 178 */ { "x" : -787, "y" : -5, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 179 */ { "x" : -787, "y" : 0.1561968168675687, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 180 */ { "x" : -787, "y" : -5, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 181 */ { "x" : -787, "y" : 4.614580423494619, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 182 */ { "x" : -787, "y" : 2.3853886201811116, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 183 */ { "x" : -787, "y" : -5, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 184 */ { "x" : -787, "y" : 5, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 185 */ { "x" : -787, "y" : -5, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "ff6363" },
		/* 186 */ { "x" : -610, "y" : -1.1475001518364962, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 187 */ { "x" : -610, "y" : 2.077131467790089, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 188 */ { "x" : -610, "y" : -4.372131771463081, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 189 */ { "x" : -610, "y" : 5.301763087416674, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 190 */ { "x" : -610, "y" : 3.6894472776033993, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 191 */ { "x" : -610, "y" : -2.759815961649778, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 192 */ { "x" : -610, "y" : 6.107920992323329, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 193 */ { "x" : -610, "y" : -5.178289676369722, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		
		/* 194 */ { "x" : 0, "y" : -675, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "vis" : false },
		/* 195 */ { "x" : 0, "y" : 675, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "vis" : false },
		
		/* 196 */ { "x" : -610, "y" : -299, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 197 */ { "x" : -610, "y" : -296, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 198 */ { "x" : -610, "y" : 296, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 199 */ { "x" : -610, "y" : 299, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		
		/* 200 */ { "x" : -1252, "y" : -110, "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "vis" : false, "curve" : 0, "color" : "e0d5d6" },
		/* 201 */ { "x" : -1252, "y" : 110, "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "vis" : false, "curve" : 0, "color" : "e0d5d6" },
		/* 202 */ { "x" : 1252, "y" : -110, "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "vis" : false, "curve" : 0, "color" : "ffffff" },
		/* 203 */ { "x" : 1252, "y" : 110, "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "vis" : false, "curve" : 0, "color" : "ffffff" },
		
		/* 204 */ { "x" : -1200, "y" : 110, "bCoef" : 0, "trait" : "line", "color" : "ff3030" },
		/* 205 */ { "x" : -1200, "y" : -110, "bCoef" : 0, "trait" : "line", "color" : "ff3030" },
		/* 206 */ { "x" : -1200, "y" : 110, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 207 */ { "x" : -1200, "y" : 75, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 208 */ { "x" : -1200, "y" : 39, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 209 */ { "x" : -1200, "y" : 12, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 210 */ { "x" : -1200, "y" : -75, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 211 */ { "x" : -1200, "y" : -110, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 212 */ { "x" : -1200, "y" : -15, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 213 */ { "x" : -1200, "y" : -42, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 214 */ { "x" : 1200, "y" : 110, "bCoef" : 0, "trait" : "line", "color" : "33b4ff" },
		/* 215 */ { "x" : 1200, "y" : -110, "bCoef" : 0, "trait" : "line", "color" : "33b4ff" },
		/* 216 */ { "x" : 1200, "y" : 110, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 217 */ { "x" : 1200, "y" : 76, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 218 */ { "x" : 1200, "y" : 39, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 219 */ { "x" : 1200, "y" : 12, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 220 */ { "x" : 1200, "y" : -75, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 221 */ { "x" : 1200, "y" : -110, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 222 */ { "x" : 1200, "y" : -15, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 223 */ { "x" : 1200, "y" : -42, "bCoef" : 0, "trait" : "line", "color" : "ffffff" },
		/* 224 */ { "x" : -1200, "y" : -470, "bCoef" : 0, "trait" : "line", "curve" : 0, "color" : "ff6363" },
		/* 225 */ { "x" : -1075, "y" : 470, "bCoef" : 0, "trait" : "line", "curve" : 90, "color" : "ff6363" },
		/* 226 */ { "x" : -1200, "y" : 470, "bCoef" : 0, "trait" : "line", "color" : "ff6363" },
		/* 227 */ { "x" : 787, "y" : -205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 0, "color" : "4fbeff" },
		/* 228 */ { "x" : 787, "y" : 205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 44.33638217658901, "color" : "4fbeff" },
		/* 229 */ { "x" : 787, "y" : 205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -90, "color" : "4fbeff" },
		/* 230 */ { "x" : 1075, "y" : 470, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : -90, "color" : "4fbeff" },
		/* 231 */ { "x" : 787, "y" : -205, "bCoef" : 0, "cMask" : ["" ], "trait" : "line", "curve" : 90, "color" : "4fbeff" },
		/* 232 */ { "x" : 787, "y" : 5.145341211815264, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 233 */ { "x" : 787, "y" : -0.010663810350735048, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 234 */ { "x" : 787, "y" : 5.145207323606769, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 235 */ { "x" : 787, "y" : -4.468863459043746, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 236 */ { "x" : 787, "y" : -2.2397636346972547, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 237 */ { "x" : 787, "y" : 5.145274267711017, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 238 */ { "x" : 787, "y" : -4.854245235055558, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 239 */ { "x" : 787, "y" : 5.145173851554631, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "4fbeff" },
		/* 240 */ { "x" : 1200, "y" : 470, "bCoef" : 0, "trait" : "line", "curve" : 0, "color" : "4fbeff" },
		/* 241 */ { "x" : 1075, "y" : -470, "bCoef" : 0, "trait" : "line", "curve" : 90, "color" : "4fbeff" },
		/* 242 */ { "x" : 1200, "y" : -470, "bCoef" : 0, "trait" : "line", "color" : "4fbeff" },
		/* 243 */ { "x" : 610, "y" : -1.1475001518364962, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 244 */ { "x" : 610, "y" : 2.077131467790089, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 245 */ { "x" : 610, "y" : -4.372131771463081, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 246 */ { "x" : 610, "y" : 5.301763087416674, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 247 */ { "x" : 610, "y" : 3.6894472776033993, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 248 */ { "x" : 610, "y" : -2.759815961649778, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 249 */ { "x" : 610, "y" : 6.107920992323329, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 250 */ { "x" : 610, "y" : -5.178289676369722, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 251 */ { "x" : 610, "y" : -299, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 252 */ { "x" : 610, "y" : -296, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 253 */ { "x" : 610, "y" : 296, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" },
		/* 254 */ { "x" : 610, "y" : 299, "bCoef" : 0.1, "trait" : "line", "curve" : 200, "color" : "b3b6b6" }

	],

	"segments" : [
		{ "v0" : 5, "v1" : 6, "curve" : 0, "color" : "ffffff", "trait" : "goalNet", "y" : -110 },
		{ "v0" : 7, "v1" : 8, "curve" : 0, "color" : "ffffff", "trait" : "goalNet", "y" : 110 },
		{ "v0" : 9, "v1" : 10, "curve" : 0, "color" : "ffffff", "trait" : "goalNet", "y" : -110 },
		{ "v0" : 11, "v1" : 12, "curve" : 0, "color" : "ffffff", "trait" : "goalNet", "y" : 110 },
		
		{ "v0" : 1, "v1" : 2, "trait" : "kickOffBarrier" },
		{ "v0" : 3, "v1" : 4, "trait" : "kickOffBarrier" },
		
		{ "v0" : 13, "v1" : 14, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		{ "v0" : 15, "v1" : 16, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -1200 },
		{ "v0" : 19, "v1" : 20, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 21, "v1" : 22, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 23, "v1" : 24, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : -600 },
		
		{ "v0" : 25, "v1" : 26, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 27, "v1" : 28, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		
		{ "v0" : 36, "v1" : 37, "curve" : 0, "vis" : false, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -700 },
		{ "v0" : 38, "v1" : 39, "curve" : 0, "vis" : false, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -1200 },
		{ "v0" : 40, "v1" : 41, "curve" : 0, "vis" : false, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 42, "v1" : 43, "curve" : 2.50208708167, "vis" : false, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		
		{ "v0" : 46, "v1" : 47, "trait" : "kickOffBarrier" },
		{ "v0" : 48, "v1" : 49, "trait" : "kickOffBarrier" },
		
		{ "v0" : 50, "v1" : 51, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
		{ "v0" : 52, "v1" : 53, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -1200 },
		{ "v0" : 56, "v1" : 57, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 58, "v1" : 59, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		
		{ "v0" : 62, "v1" : 63, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 75, "v1" : 76, "vis" : true, "color" : "b3b6b6", "trait" : "kickOffBarrier" },
		{ "v0" : 77, "v1" : 78, "trait" : "kickOffBarrier" },
		
		{ "v0" : 81, "v1" : 82, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 83, "v1" : 84, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		
		{ "v0" : 87, "v1" : 88, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 99, "v1" : 100, "curve" : 180, "vis" : true, "color" : "b3b6b6", "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 99, "v1" : 100, "curve" : -180, "vis" : true, "color" : "b3b6b6", "cGroup" : ["redKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 100, "v1" : 101, "vis" : true, "color" : "b3b6b6", "trait" : "kickOffBarrier" },
		
		{ "v0" : 102, "v1" : 103, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea" },
		{ "v0" : 104, "v1" : 105, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 2, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "x" : -1200 },
		{ "v0" : 106, "v1" : 107, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : 600 },
		{ "v0" : 108, "v1" : 109, "vis" : true, "color" : "b3b6b6", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 110, "v1" : 111, "vis" : true, "color" : "b3b6b6", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 1200 },
		{ "v0" : 125, "v1" : 126, "vis" : false, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "x" : -707 },
		{ "v0" : 127, "v1" : 128, "vis" : false, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "x" : -1207 },
		{ "v0" : 129, "v1" : 130, "vis" : false, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "x" : 1207 },
		{ "v0" : 131, "v1" : 132, "vis" : false, "bCoef" : 1.5, "cMask" : ["ball" ], "cGroup" : ["ball" ], "trait" : "ballArea", "x" : 1207 },
		
		{ "v0" : 133, "v1" : 134, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 135, "v1" : 136, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 137, "v1" : 138, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 139, "v1" : 140, "curve" : -180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 141, "v1" : 142, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240 },
		{ "v0" : 143, "v1" : 144, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -120 },
		{ "v0" : 145, "v1" : 146, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 240 },
		{ "v0" : 147, "v1" : 148, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 120 },
		{ "v0" : 149, "v1" : 150, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 151, "v1" : 152, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 251.9681483400014 },
		{ "v0" : 153, "v1" : 154, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : -251.9681483400014 },
		{ "v0" : 155, "v1" : 156, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 157, "v1" : 158, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		{ "v0" : 159, "v1" : 160, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		{ "v0" : 161, "v1" : 162, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 123 },
		{ "v0" : 163, "v1" : 164, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 251.9681483400014 },
		{ "v0" : 166, "v1" : 165, "curve" : -90, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 168, "v1" : 167, "curve" : 90, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 170, "v1" : 169, "curve" : -90, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 172, "v1" : 171, "curve" : 90, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 173, "v1" : 174, "curve" : 0, "vis" : true, "color" : "ff6363", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 175, "v1" : 176, "curve" : -90, "vis" : true, "color" : "ff6363", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 179, "v1" : 178, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 178, "v1" : 179, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 181, "v1" : 180, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 180, "v1" : 181, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 183, "v1" : 182, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 182, "v1" : 183, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 185, "v1" : 184, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 184, "v1" : 185, "curve" : 180, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line", "x" : -787 },
		{ "v0" : 187, "v1" : 186, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 186, "v1" : 187, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 189, "v1" : 188, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 188, "v1" : 189, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 191, "v1" : 190, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 190, "v1" : 191, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 193, "v1" : 192, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 192, "v1" : 193, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		
		{ "v0" : 101, "v1" : 194, "vis" : false, "color" : "ffffff", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 98, "v1" : 195, "vis" : false, "color" : "ffffff", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		
		{ "v0" : 196, "v1" : 197, "curve" : -197.38121949057748, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 197, "v1" : 196, "curve" : -213.29219661707097, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 198, "v1" : 199, "curve" : -197.38121949057748, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		{ "v0" : 199, "v1" : 198, "curve" : -213.29219661707097, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -610 },
		
		{ "v0" : 7, "v1" : 6, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "goalNet" },
		{ "v0" : 11, "v1" : 10, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "goalNet" },
		{ "v0" : 200, "v1" : 201, "curve" : 0, "vis" : false, "color" : "e0d5d6", "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "x" : -1252 },
		{ "v0" : 202, "v1" : 203, "curve" : 0, "vis" : false, "color" : "ffffff", "bCoef" : 0.1, "cGroup" : ["wall" ], "trait" : "goalNet", "x" : 1252 },
		
		{ "v0" : 204, "v1" : 205, "curve" : 0, "vis" : true, "color" : "ff3030", "bCoef" : 0, "trait" : "line", "x" : -1200 },
		{ "v0" : 206, "v1" : 207, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : -1200 },
		{ "v0" : 208, "v1" : 209, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : -1200 },
		{ "v0" : 210, "v1" : 211, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : -1200 },
		{ "v0" : 212, "v1" : 213, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : -1200 },
		{ "v0" : 214, "v1" : 215, "curve" : 0, "vis" : true, "color" : "33b4ff", "bCoef" : 0, "trait" : "line", "x" : 1200 },
		{ "v0" : 216, "v1" : 217, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : 1200 },
		{ "v0" : 218, "v1" : 219, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : 1200 },
		{ "v0" : 220, "v1" : 221, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : 1200 },
		{ "v0" : 222, "v1" : 223, "curve" : 0, "vis" : true, "color" : "ffffff", "bCoef" : 0, "trait" : "line", "x" : 1200 },
		{ "v0" : 176, "v1" : 224, "curve" : 0, "vis" : true, "color" : "ff6363", "bCoef" : 0, "trait" : "line", "y" : -470 },
		{ "v0" : 177, "v1" : 225, "curve" : 90, "vis" : true, "color" : "ff6363", "bCoef" : 0, "trait" : "line" },
		{ "v0" : 225, "v1" : 226, "curve" : 0, "vis" : true, "color" : "ff6363", "bCoef" : 0, "trait" : "line", "y" : 470 },
		{ "v0" : 227, "v1" : 228, "curve" : 0, "vis" : true, "color" : "4fbeff", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 229, "v1" : 230, "curve" : -90, "vis" : true, "color" : "4fbeff", "bCoef" : 0, "cMask" : ["" ], "trait" : "line" },
		{ "v0" : 233, "v1" : 232, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 232, "v1" : 233, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 235, "v1" : 234, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 234, "v1" : 235, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 237, "v1" : 236, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 236, "v1" : 237, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 239, "v1" : 238, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 238, "v1" : 239, "curve" : 180, "vis" : true, "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line", "x" : 787 },
		{ "v0" : 230, "v1" : 240, "curve" : 0, "vis" : true, "color" : "4fbeff", "bCoef" : 0, "trait" : "line", "y" : -470 },
		{ "v0" : 231, "v1" : 241, "curve" : 90, "vis" : true, "color" : "4fbeff", "bCoef" : 0, "trait" : "line" },
		{ "v0" : 241, "v1" : 242, "curve" : 0, "vis" : true, "color" : "4fbeff", "bCoef" : 0, "trait" : "line", "y" : 470 },
		{ "v0" : 244, "v1" : 243, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 243, "v1" : 244, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 246, "v1" : 245, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 245, "v1" : 246, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 248, "v1" : 247, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 247, "v1" : 248, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 250, "v1" : 249, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 249, "v1" : 250, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 251, "v1" : 252, "curve" : -197.38121949057748, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 252, "v1" : 251, "curve" : -213.29219661707097, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 253, "v1" : 254, "curve" : -197.38121949057748, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 },
		{ "v0" : 254, "v1" : 253, "curve" : -213.29219661707097, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 610 }

	],

	"goals" : [
		{ "p0" : [1208.95,109 ], "p1" : [1208.95,-109 ], "team" : "blue" },
		{ "p0" : [-1208.95,109 ], "p1" : [-1208.95,-109 ], "team" : "red" }

	],

	"discs" : [
		{"radius":%BALL_RADIUS%,"color":"%BALL_COLOR%","bCoef":%BALL_BCOEFF%,"invMass":%BALL_INVMASS%,"damping":%BALL_DAMPING%,"cGroup":["ball","kick","score"]},
		{"pos":[-5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[0,-5],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[-3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"radius":1.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{ "radius" : 6, "pos" : [1200,110 ], "color" : "33b4ff", "trait" : "goalPost" },
		{ "radius" : 6, "pos" : [1200,-110 ], "color" : "33b4ff", "trait" : "goalPost" },
		{ "radius" : 6, "pos" : [-1200,110 ], "color" : "ff3030", "trait" : "goalPost" },
		{ "radius" : 6, "pos" : [-1200,-110 ], "color" : "ff3030", "trait" : "goalPost" },
		
		{ "radius" : 3, "invMass" : 0, "pos" : [-1200,600 ], "color" : "ffff00", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [-1200,-600 ], "color" : "ffff00", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 4, "invMass" : 0, "pos" : [1200,-600 ], "color" : "ffff00", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 4, "invMass" : 0, "pos" : [1200,600 ], "color" : "ffff00", "bCoef" : 0.1, "trait" : "line" }

	],

	"planes" : [
		{ "normal" : [0,-1 ], "dist" : -600, "bCoef" : 1, "trait" : "ballArea", "curve" : 0 },
		{ "normal" : [0,1 ], "dist" : -600, "bCoef" : 1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
		
		{ "normal" : [1,0 ], "dist" : -1275, "bCoef" : 0.1 },
		{ "normal" : [0,1 ], "dist" : -675, "bCoef" : 0.1 },
		{ "normal" : [0,-1 ], "dist" : -675, "bCoef" : 0.1 },
		{ "normal" : [-1,0 ], "dist" : -1275, "bCoef" : 0.1 },
		
		{ "normal" : [1,0 ], "dist" : -1250, "bCoef" : 0.1, "trait" : "ballArea" },
		{ "normal" : [-1,0 ], "dist" : -1250, "bCoef" : 0.1, "trait" : "ballArea" }

	],

	"traits" : {
		"ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
		"goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
		"goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },
		"line" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["" ] },
		"kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] }

	},

	"playerPhysics" : {
		"bCoef" : 0,
		"acceleration" : 0.11,
		"kickingAcceleration" : 0.083,
		"kickStrength" : 5.2

	},

	"ballPhysics" : "disc0",

"joints":[{"d0":0,"d1":1,"length":5.0990195135927845,"color":"transparent"},
{"d0":0,"d1":2,"length":5.0990195135927845,"color":"transparent"},
{"d0":0,"d1":3,"length":5,"color":"transparent"},
{"d0":0,"d1":4,"length":5,"color":"transparent"},
{"d0":0,"d1":5,"length":5,"color":"transparent"},
{"d0":0,"d1":6,"length":0,"color":"transparent"},
{"d0":1,"d1":2,"length":10,"color":"transparent"},
{"d0":1,"d1":3,"length":6.4031242374328485,"color":"transparent"},
{"d0":1,"d1":4,"length":5.385164807134504,"color":"transparent"},
{"d0":1,"d1":5,"length":9.433981132056603,"color":"transparent"},
{"d0":1,"d1":6,"length":5.0990195135927845,"color":"transparent"},
{"d0":2,"d1":3,"length":6.4031242374328485,"color":"transparent"},
{"d0":2,"d1":4,"length":9.433981132056603,"color":"transparent"},
{"d0":2,"d1":5,"length":5.385164807134504,"color":"transparent"},
{"d0":2,"d1":6,"length":5.0990195135927845,"color":"transparent"},
{"d0":3,"d1":4,"length":9.486832980505138,"color":"transparent"},
{"d0":3,"d1":5,"length":9.486832980505138,"color":"transparent"},
{"d0":3,"d1":6,"length":5,"color":"transparent"},
{"d0":4,"d1":5,"length":6,"color":"transparent"},
{"d0":4,"d1":6,"length":5,"color":"transparent"},
{"d0":5,"d1":6,"length":5,"color":"transparent"}]
}`;
