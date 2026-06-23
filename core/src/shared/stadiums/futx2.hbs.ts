export var stadiumText: string = `{

	"name" : "𝙵 𝚄 𝚃 𝚂 𝙰 𝙻 ⨯² 🏆 𝗚𝗟𝗛",

	"width" : 420,

	"height" : 230,

	"spawnDistance" : 180,

	"redSpawnPoints" : [
		[ -150, 0
		],
		[ -150, 0
		],
		[ -150, 0
		],
		[ -150, 0
		],
		[ -150, 0
		],
		[ -150, 0
		],
		[ -120, -205
		]

	],

	"blueSpawnPoints" : [
		[ 150, 0
		],
		[ 150, 0
		],
		[ 150, 0
		],
		[ 150, 0
		],
		[ 150, 0
		],
		[ 150, 0
		],
		[ 120, -205
		]

	],

	"bg" : { "type" : "", "height" : 0, "width" : 0, "color" : "2a3a40" },

	"vertexes" : [
		/* 0 */ { "x" : -368, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 1 */ { "x" : -368, "y" : 65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 2 */ { "x" : -368, "y" : -65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 3 */ { "x" : -368, "y" : -171, "trait" : "ballArea", "bCoef" : 1, "cMask" : ["ball" ], "color" : "b3b6b6" },
		/* 4 */ { "x" : 368, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 5 */ { "x" : 368, "y" : 65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 6 */ { "x" : 368, "y" : -65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		/* 7 */ { "x" : 368, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1, "color" : "b3b6b6" },
		
		/* 8 */ { "x" : 0, "y" : 65, "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		
		/* 9 */ { "x" : 0, "y" : -65, "trait" : "line", "color" : "b3b6b6" },
		
		/* 10 */ { "bCoef" : 1, "trait" : "ballArea", "x" : 368, "y" : 171, "color" : "b3b6b6" },
		/* 11 */ { "bCoef" : 1, "trait" : "ballArea", "x" : 368, "y" : -171, "color" : "b3b6b6" },
		
		/* 12 */ { "bCoef" : 0, "trait" : "line", "x" : 0, "y" : 171, "color" : "b3b6b6" },
		/* 13 */ { "bCoef" : 0, "trait" : "line", "x" : 0, "y" : -171, "color" : "b3b6b6" },
		
		/* 14 */ { "x" : 0, "y" : 65, "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 15 */ { "x" : 0, "y" : -65, "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		
		/* 16 */ { "x" : 377, "y" : -65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 17 */ { "x" : 377, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 18 */ { "x" : -377, "y" : -65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 19 */ { "x" : -377, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 20 */ { "x" : -377, "y" : 65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 21 */ { "x" : -377, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 22 */ { "x" : 377, "y" : 65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 23 */ { "x" : 377, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 24 */ { "x" : 0, "y" : 230, "trait" : "kickOffBarrier" },
		/* 25 */ { "x" : 0, "y" : 65, "trait" : "kickOffBarrier", "color" : "00ff00" },
		/* 26 */ { "x" : 0, "y" : -65, "trait" : "kickOffBarrier", "color" : "00ff00" },
		/* 27 */ { "x" : 0, "y" : -230, "trait" : "kickOffBarrier" },
		
		/* 28 */ { "x" : -368.53340356886, "y" : -62.053454903872, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 29 */ { "x" : -400.05760771891, "y" : -62.053454903872, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 30 */ { "x" : -400.05760771891, "y" : 64.043361696331, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		/* 31 */ { "x" : -368.53340356886, "y" : 64.043361696331, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		/* 32 */ { "x" : 368.09926357786, "y" : 63.94882446641, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 33 */ { "x" : 400, "y" : 64, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 34 */ { "x" : 400, "y" : -61.927767991658, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		/* 35 */ { "x" : 368.9681846993, "y" : -62.144998272018, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		
		/* 36 */ { "x" : -368, "y" : -142.37229643041, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : -90 },
		/* 37 */ { "x" : -260.90035258157, "y" : -50.168480548544, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 0 },
		/* 38 */ { "x" : -368, "y" : -160.81305960678, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 39 */ { "x" : -358.5379338963, "y" : -171, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 40 */ { "x" : -368, "y" : 141.33175243687, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 90 },
		/* 41 */ { "x" : -260.90035258157, "y" : 49.127936555002, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 0 },
		/* 42 */ { "x" : -368, "y" : 159.77251561324, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 43 */ { "x" : -358.5379338963, "y" : 171, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 44 */ { "x" : 368, "y" : 159.77251561324, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 45 */ { "x" : 358.36266315432, "y" : 171, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 46 */ { "x" : 368, "y" : -160.81305960678, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 47 */ { "x" : 358.36266315432, "y" : -171, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 48 */ { "x" : 368, "y" : -142.37229643041, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 90 },
		/* 49 */ { "x" : 260.72508183959, "y" : -50.168480548544, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 90 },
		/* 50 */ { "x" : 368, "y" : 141.33175243687, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : -90 },
		/* 51 */ { "x" : 260.72508183959, "y" : 49.127936555002, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : -90 },
		/* 52 */ { "x" : 260.72508183959, "y" : -50.168480548544, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 0 },
		/* 53 */ { "x" : 260.72508183959, "y" : 49.127936555002, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 0 },
		/* 54 */ { "x" : -250.86909422732, "y" : -1.2295321189394, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 55 */ { "x" : -250.86909422732, "y" : 0.18898812539692, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 56 */ { "x" : -250.86909422732, "y" : -2.6480523632758, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 57 */ { "x" : -250.86909422732, "y" : 1.6075083697333, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 58 */ { "x" : -250.86909422732, "y" : 0.89824824756514, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 59 */ { "x" : -250.86909422732, "y" : -1.9387922411076, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 60 */ { "x" : -250.86909422732, "y" : 1.9621384308174, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 61 */ { "x" : -250.86909422732, "y" : -3.0026824243599, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 62 */ { "x" : 250.69382348534, "y" : -1.2295321189394, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 63 */ { "x" : 250.69382348534, "y" : 0.18898812539692, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 64 */ { "x" : 250.69382348534, "y" : -2.6480523632758, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 65 */ { "x" : 250.69382348534, "y" : 1.6075083697333, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 66 */ { "x" : 250.69382348534, "y" : 0.89824824756514, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 67 */ { "x" : 250.69382348534, "y" : -1.9387922411076, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 68 */ { "x" : 250.69382348534, "y" : 1.9621384308174, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 69 */ { "x" : 250.69382348534, "y" : -3.0026824243599, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 70 */ { "x" : -185.66591492467, "y" : -1.2295321189394, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 71 */ { "x" : -185.66591492467, "y" : 0.18898812539692, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 72 */ { "x" : -185.66591492467, "y" : -2.6480523632758, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 73 */ { "x" : -185.66591492467, "y" : 1.6075083697333, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 74 */ { "x" : -185.66591492467, "y" : 0.89824824756514, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 75 */ { "x" : -185.66591492467, "y" : -1.9387922411076, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 76 */ { "x" : -185.66591492467, "y" : 1.9621384308174, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 77 */ { "x" : -185.66591492467, "y" : -3.0026824243599, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 78 */ { "x" : 185.49064418269, "y" : -1.2295321189394, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 79 */ { "x" : 185.49064418269, "y" : 0.18898812539692, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 80 */ { "x" : 185.49064418269, "y" : -2.6480523632758, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 81 */ { "x" : 185.49064418269, "y" : 1.6075083697333, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 82 */ { "x" : 185.49064418269, "y" : 0.89824824756514, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 83 */ { "x" : 185.49064418269, "y" : -1.9387922411076, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 84 */ { "x" : 185.49064418269, "y" : 1.9621384308174, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 85 */ { "x" : 185.49064418269, "y" : -3.0026824243599, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 86 */ { "x" : -160.58776903904, "y" : -159.39453936245, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 87 */ { "x" : -160.58776903904, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 88 */ { "x" : -80.337702205015, "y" : -159.39453936245, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 89 */ { "x" : -80.337702205015, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 90 */ { "x" : 160.41249829706, "y" : -159.39453936245, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 91 */ { "x" : 160.41249829706, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 92 */ { "x" : 80.162431463036, "y" : -159.39453936245, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 93 */ { "x" : 80.162431463036, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 94 */ { "x" : -254.88159756902, "y" : -171, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 95 */ { "x" : -254.88159756902, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 96 */ { "x" : -371.91294503531, "y" : -87.759267023458, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 97 */ { "x" : -384.61920561736, "y" : -87.759267023458, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 98 */ { "x" : 371.73767429333, "y" : -87.759267023458, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 99 */ { "x" : 384.44393487538, "y" : -87.759267023458, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 100 */ { "x" : -371.91294503531, "y" : 86.718723029916, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 101 */ { "x" : -384.61920561736, "y" : 86.718723029916, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 102 */ { "x" : 371.73767429333, "y" : 86.718723029916, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 103 */ { "x" : 384.44393487538, "y" : 86.718723029916, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 104 */ { "x" : -254.88159756902, "y" : 171, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 105 */ { "x" : -254.88159756902, "y" : 181.05031927829, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 106 */ { "x" : 254.70632682704, "y" : -171, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 107 */ { "x" : 254.70632682704, "y" : -182.09086327183, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 108 */ { "x" : 254.70632682704, "y" : 171, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 109 */ { "x" : 254.70632682704, "y" : 181.05031927829, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 110 */ { "x" : 377, "y" : -65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 111 */ { "x" : 377, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 112 */ { "x" : -377, "y" : -65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 113 */ { "x" : -377, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 114 */ { "x" : -377, "y" : 65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 115 */ { "x" : -377, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 116 */ { "x" : 377, "y" : 65, "trait" : "line", "cMask" : ["ball" ], "bCoef" : 1 },
		
		/* 117 */ { "x" : 377, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 1 },
		/* 118 */ { "x" : 371, "y" : -65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 119 */ { "x" : 371, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 120 */ { "x" : 371, "y" : 65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 121 */ { "x" : 371, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 122 */ { "x" : -371, "y" : 65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 123 */ { "x" : -371, "y" : 171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 124 */ { "x" : -371, "y" : -65, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 },
		/* 125 */ { "x" : -371, "y" : -171, "trait" : "ballArea", "cMask" : ["ball" ], "bCoef" : 0 }

	],

	"segments" : [
		{ "v0" : 0, "v1" : 1, "trait" : "ballArea", "color" : "b3b6b6" },
		{ "v0" : 2, "v1" : 3, "trait" : "ballArea", "color" : "b3b6b6" },
		{ "v0" : 4, "v1" : 5, "trait" : "ballArea", "color" : "00ff00" },
		{ "v0" : 6, "v1" : 7, "trait" : "ballArea", "color" : "b3b6b6" },
		
		{ "v0" : 8, "v1" : 9, "trait" : "kickOffBarrier", "curve" : 180, "cGroup" : ["blueKO" ], "color" : "b3b6b6" },
		{ "v0" : 8, "v1" : 9, "trait" : "kickOffBarrier", "curve" : -180, "cGroup" : ["redKO" ], "color" : "b3b6b6" },
		
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 1, "v1" : 0, "cMask" : ["ball" ], "x" : -368 },
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 5, "v1" : 4, "cMask" : ["ball" ], "x" : 368 },
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 2, "v1" : 3, "cMask" : ["ball" ], "x" : -368 },
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 6, "v1" : 7, "cMask" : ["ball" ], "x" : 368 },
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 0, "v1" : 10, "y" : 171 },
		{ "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "trait" : "ballArea", "v0" : 3, "v1" : 11, "y" : -171 },
		
		{ "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "trait" : "line", "v0" : 12, "v1" : 13 },
		{ "curve" : -180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "trait" : "line", "v0" : 9, "v1" : 8 },
		{ "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "trait" : "line", "v0" : 15, "v1" : 14 },
		{ "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "trait" : "line", "v0" : 2, "v1" : 1 },
		{ "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0, "trait" : "line", "v0" : 6, "v1" : 5 },
		
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 16, "v1" : 17, "cMask" : ["ball" ], "x" : 330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 18, "v1" : 19, "cMask" : ["ball" ], "x" : -330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 20, "v1" : 21, "cMask" : ["ball" ], "x" : -330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 22, "v1" : 23, "cMask" : ["ball" ], "x" : 330 },
		
		{ "v0" : 24, "v1" : 25, "trait" : "kickOffBarrier" },
		{ "v0" : 26, "v1" : 27, "trait" : "kickOffBarrier" },
		
		{ "v0" : 28, "v1" : 29, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,-80 ], "y" : -80 },
		{ "v0" : 29, "v1" : 30, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "x" : -590 },
		{ "v0" : 30, "v1" : 31, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,80 ], "y" : 80 },
		{ "v0" : 32, "v1" : 33, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,-80 ], "y" : -80 },
		{ "v0" : 33, "v1" : 34, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "x" : -590 },
		{ "v0" : 34, "v1" : 35, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,80 ], "y" : 80 },
		
		{ "v0" : 36, "v1" : 37, "curve" : 94.0263701017, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 39, "v1" : 38, "curve" : 86.632306418889, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 40, "v1" : 41, "curve" : -94.026370101699, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 37, "v1" : 41, "curve" : 0, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 43, "v1" : 42, "curve" : -86.632306418888, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 45, "v1" : 44, "curve" : 86.632306418884, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 47, "v1" : 46, "curve" : -86.632306418899, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 48, "v1" : 49, "curve" : -94.026370101699, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 50, "v1" : 51, "curve" : 94.026370101699, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 52, "v1" : 53, "curve" : 0, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line", "x" : 390 },
		{ "v0" : 55, "v1" : 54, "curve" : -180.00692920292, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 54, "v1" : 55, "curve" : -180.00218240614, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 57, "v1" : 56, "curve" : -179.64823645332, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 56, "v1" : 57, "curve" : -180.35758668147, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 59, "v1" : 58, "curve" : -180.02357323962, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 58, "v1" : 59, "curve" : -180.00924102399, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 61, "v1" : 60, "curve" : -180.06885755885, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 60, "v1" : 61, "curve" : -180.02948353257, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 63, "v1" : 62, "curve" : -179.99869069543, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 62, "v1" : 63, "curve" : -179.99939258776, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 65, "v1" : 64, "curve" : -180.08826047163, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 64, "v1" : 65, "curve" : -179.91186753664, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 67, "v1" : 66, "curve" : -179.99528711105, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 66, "v1" : 67, "curve" : -179.99743836358, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 69, "v1" : 68, "curve" : -179.98626041101, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 68, "v1" : 69, "curve" : -179.99175181595, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 71, "v1" : 70, "curve" : -180.04715562398, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 70, "v1" : 71, "curve" : -179.95294709391, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 73, "v1" : 72, "curve" : -179.95715750564, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 72, "v1" : 73, "curve" : -179.89943871875, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 75, "v1" : 74, "curve" : -179.94773754738, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 74, "v1" : 75, "curve" : -179.98221351296, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 77, "v1" : 76, "curve" : -180.4151727218, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 76, "v1" : 77, "curve" : -179.58764458796, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 79, "v1" : 78, "curve" : -180.00086646359, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 78, "v1" : 79, "curve" : -180.01965986376, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 81, "v1" : 80, "curve" : -180.03532601389, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 80, "v1" : 81, "curve" : -179.99380079, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 83, "v1" : 82, "curve" : -180.0044468452, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 82, "v1" : 83, "curve" : -180.01386779847, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 85, "v1" : 84, "curve" : -180.05158287563, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 84, "v1" : 85, "curve" : -180.01212223878, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 86, "v1" : 87, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240 },
		{ "v0" : 88, "v1" : 89, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -120 },
		{ "v0" : 90, "v1" : 91, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 240 },
		{ "v0" : 92, "v1" : 93, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 120 },
		{ "v0" : 94, "v1" : 95, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 96, "v1" : 97, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 123 },
		{ "v0" : 98, "v1" : 99, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 123 },
		{ "v0" : 100, "v1" : 101, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : -123 },
		{ "v0" : 102, "v1" : 103, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : -123 },
		{ "v0" : 104, "v1" : 105, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 106, "v1" : 107, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		{ "v0" : 108, "v1" : 109, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 110, "v1" : 111, "cMask" : ["ball" ], "x" : 330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 112, "v1" : 113, "cMask" : ["ball" ], "x" : -330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 114, "v1" : 115, "cMask" : ["ball" ], "x" : -330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 1, "trait" : "ballArea", "v0" : 116, "v1" : 117, "cMask" : ["ball" ], "x" : 330 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 0, "trait" : "ballArea", "v0" : 118, "v1" : 119, "cMask" : ["ball" ], "x" : 371 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 0, "trait" : "ballArea", "v0" : 120, "v1" : 121, "cMask" : ["ball" ], "x" : 371 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 0, "trait" : "ballArea", "v0" : 122, "v1" : 123, "cMask" : ["ball" ], "x" : -371 },
		{ "vis" : false, "color" : "FFFFFF", "bCoef" : 0, "trait" : "ballArea", "v0" : 124, "v1" : 125, "cMask" : ["ball" ], "x" : -371 }

	],

	"goals" : [
		{ "p0" : [-376.95,-62.053454903872 ], "p1" : [-376.95,64.043361696331 ], "team" : "red" },
		{ "p0" : [376.95,62 ], "p1" : [376.95,-62 ], "team" : "blue" }

	],


	"discs" : [
		{"radius":%BALL_RADIUS%,"color":"%BALL_COLOR%","bCoef":%BALL_BCOEFF%,"invMass":%BALL_INVMASS%,"damping":%BALL_DAMPING%,"cGroup":["ball","kick","score"]},
		{"pos":[-5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[0,-5],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[-3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"radius":1.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{ "radius" : 3.9405255187564, "pos" : [-368.53340356886,64.043361696331 ], "color" : "FFFF00", "trait" : "goalPost", "y" : 80 },
		{ "radius" : 3.9405255187564, "pos" : [-368.53340356886,-62.053454903872 ], "color" : "FFFF00", "trait" : "goalPost", "y" : -80, "x" : -560 },
		{ "radius" : 3.9405255187564, "pos" : [368.9681846993,-62.144998272018 ], "color" : "FFFF00", "trait" : "goalPost", "y" : 80 },
		{ "radius" : 3.9405255187564, "pos" : [368.09926357786,63.94882446641 ], "color" : "FFFF00", "trait" : "goalPost", "y" : -80, "x" : -560 },
		
		{ "radius" : 3, "invMass" : 0, "pos" : [-368,-171 ], "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [-368,171 ], "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [368,171 ], "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [368,-171 ], "color" : "4fbeff", "bCoef" : 0.1, "trait" : "line" }

	],

	"planes" : [
		{ "normal" : [0,1 ], "dist" : -171, "trait" : "ballArea" },
		{ "normal" : [0,-1 ], "dist" : -171, "trait" : "ballArea" },
		
		{ "normal" : [0,1 ], "dist" : -230, "bCoef" : 0.2, "cMask" : ["all" ] },
		{ "normal" : [0,-1 ], "dist" : -230, "bCoef" : 0.2, "cMask" : ["all" ] },
		{ "normal" : [1,0 ], "dist" : -420, "bCoef" : 0.2, "cMask" : ["all" ] },
		{ "normal" : [-1,0 ], "dist" : -420, "bCoef" : 0.2, "cMask" : ["all" ] }

	],

	"traits" : {
		"ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
		"goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 1 },
		"goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["all" ] },
		"kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] },
		"line" : { "vis" : true, "bCoef" : 0, "cMask" : ["" ] },
		"arco" : { "radius" : 2, "cMask" : ["n/d" ], "color" : "cccccc" }

	},

	"playerPhysics" : {
		"acceleration" : 0.11,
		"kickingAcceleration" : 0.083,
		"kickStrength" : 5,
		"bCoef" : 0

	},

"ballPhysics":"disc0",

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
