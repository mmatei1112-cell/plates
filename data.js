/* Plates — built-in data: exercises, foods, coach tips */
'use strict';

const MUSCLES = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs'
};

/* id, name, primary muscle, secondary muscles, equipment, rep range */
const EXERCISES = [
  ['bench', 'Barbell bench press', 'chest', ['triceps', 'shoulders'], 'barbell', [6, 10]],
  ['incline_bb', 'Incline barbell press', 'chest', ['shoulders', 'triceps'], 'barbell', [6, 10]],
  ['db_bench', 'Dumbbell bench press', 'chest', ['triceps', 'shoulders'], 'dumbbell', [8, 12]],
  ['incline_db', 'Incline dumbbell press', 'chest', ['shoulders', 'triceps'], 'dumbbell', [8, 12]],
  ['machine_press', 'Machine chest press', 'chest', ['triceps'], 'machine', [8, 12]],
  ['cable_fly', 'Cable fly', 'chest', [], 'cable', [10, 15]],
  ['pec_deck', 'Pec deck', 'chest', [], 'machine', [10, 15]],
  ['dips', 'Dips', 'chest', ['triceps'], 'bodyweight', [6, 12]],
  ['pushup', 'Push-up', 'chest', ['triceps'], 'bodyweight', [8, 20]],

  ['deadlift', 'Deadlift', 'back', ['hamstrings', 'glutes'], 'barbell', [3, 6]],
  ['pullup', 'Pull-up', 'back', ['biceps'], 'bodyweight', [5, 10]],
  ['chinup', 'Chin-up', 'back', ['biceps'], 'bodyweight', [5, 10]],
  ['lat_pd', 'Lat pulldown', 'back', ['biceps'], 'cable', [8, 12]],
  ['bb_row', 'Barbell row', 'back', ['biceps'], 'barbell', [6, 10]],
  ['db_row', 'One-arm dumbbell row', 'back', ['biceps'], 'dumbbell', [8, 12]],
  ['cable_row', 'Seated cable row', 'back', ['biceps'], 'cable', [8, 12]],
  ['tbar', 'T-bar row', 'back', ['biceps'], 'machine', [6, 10]],
  ['straight_pd', 'Straight-arm pulldown', 'back', [], 'cable', [10, 15]],

  ['ohp', 'Overhead press', 'shoulders', ['triceps'], 'barbell', [5, 8]],
  ['db_ohp', 'Seated dumbbell press', 'shoulders', ['triceps'], 'dumbbell', [8, 12]],
  ['arnold', 'Arnold press', 'shoulders', ['triceps'], 'dumbbell', [8, 12]],
  ['lat_raise', 'Lateral raise', 'shoulders', [], 'dumbbell', [12, 20]],
  ['cable_lat', 'Cable lateral raise', 'shoulders', [], 'cable', [12, 20]],
  ['rear_fly', 'Rear delt fly', 'shoulders', ['back'], 'dumbbell', [12, 20]],
  ['face_pull', 'Face pull', 'shoulders', ['back'], 'cable', [12, 20]],

  ['bb_curl', 'Barbell curl', 'biceps', [], 'barbell', [8, 12]],
  ['db_curl', 'Dumbbell curl', 'biceps', [], 'dumbbell', [8, 12]],
  ['hammer', 'Hammer curl', 'biceps', [], 'dumbbell', [8, 12]],
  ['incline_curl', 'Incline dumbbell curl', 'biceps', [], 'dumbbell', [10, 15]],
  ['preacher', 'Preacher curl', 'biceps', [], 'machine', [10, 15]],
  ['cable_curl', 'Cable curl', 'biceps', [], 'cable', [10, 15]],

  ['pushdown', 'Triceps pushdown', 'triceps', [], 'cable', [10, 15]],
  ['oh_ext', 'Overhead triceps extension', 'triceps', [], 'cable', [10, 15]],
  ['skull', 'Skull crusher', 'triceps', [], 'barbell', [8, 12]],
  ['cgbp', 'Close-grip bench press', 'triceps', ['chest'], 'barbell', [6, 10]],

  ['squat', 'Back squat', 'quads', ['glutes'], 'barbell', [5, 8]],
  ['front_squat', 'Front squat', 'quads', ['glutes'], 'barbell', [5, 8]],
  ['leg_press', 'Leg press', 'quads', ['glutes'], 'machine', [8, 12]],
  ['hack', 'Hack squat', 'quads', ['glutes'], 'machine', [8, 12]],
  ['goblet', 'Goblet squat', 'quads', ['glutes'], 'dumbbell', [8, 12]],
  ['bss', 'Bulgarian split squat', 'quads', ['glutes'], 'dumbbell', [8, 12]],
  ['lunge', 'Walking lunge', 'quads', ['glutes'], 'dumbbell', [10, 14]],
  ['leg_ext', 'Leg extension', 'quads', [], 'machine', [10, 15]],

  ['rdl', 'Romanian deadlift', 'hamstrings', ['glutes', 'back'], 'barbell', [6, 10]],
  ['leg_curl', 'Lying leg curl', 'hamstrings', [], 'machine', [10, 15]],
  ['seated_curl', 'Seated leg curl', 'hamstrings', [], 'machine', [10, 15]],
  ['good_morning', 'Good morning', 'hamstrings', ['glutes'], 'barbell', [8, 12]],
  ['nordic', 'Nordic curl', 'hamstrings', [], 'bodyweight', [4, 8]],

  ['hip_thrust', 'Hip thrust', 'glutes', ['hamstrings'], 'barbell', [8, 12]],
  ['glute_bridge', 'Glute bridge', 'glutes', ['hamstrings'], 'bodyweight', [10, 15]],
  ['kickback', 'Cable kickback', 'glutes', [], 'cable', [12, 15]],
  ['abduction', 'Hip abduction machine', 'glutes', [], 'machine', [12, 20]],

  ['calf_stand', 'Standing calf raise', 'calves', [], 'machine', [10, 15]],
  ['calf_seat', 'Seated calf raise', 'calves', [], 'machine', [12, 20]],

  ['cable_crunch', 'Cable crunch', 'abs', [], 'cable', [10, 15]],
  ['hlr', 'Hanging leg raise', 'abs', [], 'bodyweight', [8, 15]],
  ['ab_wheel', 'Ab wheel rollout', 'abs', [], 'bodyweight', [8, 12]],
  ['plank', 'Plank (seconds)', 'abs', [], 'bodyweight', [30, 60]]
].map(([id, n, m, s, eq, rr]) => ({ id, n, m, s, eq, rr }));

const PRESET_TEMPLATES = [
  { id: 't_push', name: 'Push', ex: ['bench', 'ohp', 'incline_db', 'lat_raise', 'pushdown'] },
  { id: 't_pull', name: 'Pull', ex: ['pullup', 'bb_row', 'lat_pd', 'face_pull', 'db_curl'] },
  { id: 't_legs', name: 'Legs', ex: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_stand'] },
  { id: 't_upper', name: 'Upper', ex: ['bench', 'bb_row', 'db_ohp', 'lat_pd', 'hammer', 'pushdown'] },
  { id: 't_lower', name: 'Lower', ex: ['squat', 'rdl', 'bss', 'leg_curl', 'calf_stand', 'hlr'] },
  { id: 't_full', name: 'Full body', ex: ['squat', 'bench', 'cable_row', 'db_ohp', 'leg_curl', 'db_curl'] }
];

/* Foods: values per 100 g. sv = common servings [label, grams] */
const FOODS = [
  // Meat & fish
  ['Chicken breast, cooked', 165, 31, 0, 3.6, [['1 breast', 170]]],
  ['Chicken breast, raw', 120, 22.5, 0, 2.6, [['1 breast', 200]]],
  ['Chicken thigh, cooked', 209, 26, 0, 10.9, [['1 thigh', 110]]],
  ['Turkey breast, cooked', 135, 30, 0, 1, []],
  ['Lean beef mince, cooked', 170, 26, 0, 7, []],
  ['Beef steak, cooked', 217, 26, 0, 12, [['1 steak', 200]]],
  ['Pork tenderloin, cooked', 143, 26, 0, 3.5, []],
  ['Ham (șuncă)', 145, 21, 1.5, 6, [['1 slice', 20]]],
  ['Salmon, cooked', 206, 22, 0, 12, [['1 fillet', 150]]],
  ['Tuna, canned in water', 116, 26, 0, 1, [['1 can (drained)', 120]]],
  ['Cod, cooked', 105, 23, 0, 0.9, [['1 fillet', 150]]],
  ['Shrimp, cooked', 99, 24, 0.2, 0.3, []],
  // Eggs & dairy
  ['Egg, whole', 143, 12.6, 0.7, 9.5, [['1 egg', 55]]],
  ['Egg whites', 52, 11, 0.7, 0.2, [['1 white', 33]]],
  ['Greek yogurt 2%', 73, 9.9, 3.9, 2, [['1 tub', 150]]],
  ['Skyr', 63, 11, 4, 0.2, [['1 tub', 140]]],
  ['Brânză de vaci (cottage cheese)', 120, 15, 3, 5, [['1 tub', 250]]],
  ['Telemea', 265, 17, 1, 21, [['1 slice', 30]]],
  ['Cașcaval', 360, 25, 1, 28, [['1 slice', 20]]],
  ['Mozzarella', 280, 22, 2, 20, [['1 ball', 125]]],
  ['Milk 1.5%', 46, 3.3, 4.8, 1.5, [['1 glass', 250]]],
  ['Milk 3.5%', 64, 3.3, 4.7, 3.6, [['1 glass', 250]]],
  ['Kefir / sana', 52, 3.4, 4.5, 2, [['1 bottle', 330]]],
  ['Whey protein', 380, 78, 8, 6, [['1 scoop', 30]]],
  // Carbs
  ['White rice, cooked', 130, 2.7, 28, 0.3, [['1 portion', 160]]],
  ['Brown rice, cooked', 123, 2.7, 25.6, 1, [['1 portion', 160]]],
  ['Pasta, cooked', 158, 5.8, 31, 0.9, [['1 plate', 250]]],
  ['Oats', 389, 16.9, 66, 6.9, [['1 bowl', 50]]],
  ['White bread', 265, 9, 49, 3.2, [['1 slice', 30]]],
  ['Wholemeal bread', 247, 13, 41, 3.4, [['1 slice', 35]]],
  ['Potatoes, boiled', 87, 1.9, 20, 0.1, [['1 medium', 170]]],
  ['Sweet potato, baked', 90, 2, 20.7, 0.2, [['1 medium', 150]]],
  ['Mămăligă (polenta)', 75, 1.7, 16, 0.4, [['1 portion', 250]]],
  ['Quinoa, cooked', 120, 4.4, 21.3, 1.9, [['1 portion', 185]]],
  ['Tortilla wrap', 310, 8, 52, 7.5, [['1 wrap', 60]]],
  ['Covrig', 310, 9, 60, 3, [['1 covrig', 90]]],
  ['Corn flakes', 357, 7.5, 84, 0.4, [['1 bowl', 40]]],
  ['Granola', 471, 10, 64, 20, [['1 bowl', 50]]],
  ['Rice cakes', 387, 8, 81, 2.8, [['1 cake', 9]]],
  // Fruit & veg
  ['Banana', 89, 1.1, 22.8, 0.3, [['1 banana', 120]]],
  ['Apple', 52, 0.3, 13.8, 0.2, [['1 apple', 180]]],
  ['Orange', 47, 0.9, 11.8, 0.1, [['1 orange', 150]]],
  ['Strawberries', 32, 0.7, 7.7, 0.3, [['1 bowl', 150]]],
  ['Blueberries', 57, 0.7, 14.5, 0.3, [['1 handful', 80]]],
  ['Grapes', 69, 0.7, 18, 0.2, [['1 bunch', 150]]],
  ['Avocado', 160, 2, 8.5, 14.7, [['½ avocado', 70]]],
  ['Broccoli', 34, 2.8, 6.6, 0.4, [['1 portion', 90]]],
  ['Spinach', 23, 2.9, 3.6, 0.4, []],
  ['Tomato', 18, 0.9, 3.9, 0.2, [['1 tomato', 120]]],
  ['Cucumber', 15, 0.7, 3.6, 0.1, [['1 cucumber', 200]]],
  ['Bell pepper', 31, 1, 6, 0.3, [['1 pepper', 150]]],
  ['Carrots', 41, 0.9, 9.6, 0.2, [['1 carrot', 70]]],
  ['Mixed salad', 17, 1.2, 3.3, 0.2, [['1 bowl', 100]]],
  // Legumes & plant protein
  ['Beans, cooked (fasole)', 127, 8.7, 22.8, 0.5, [['1 portion', 180]]],
  ['Lentils, cooked', 116, 9, 20, 0.4, [['1 portion', 200]]],
  ['Chickpeas, cooked', 164, 8.9, 27.4, 2.6, [['1 portion', 160]]],
  ['Tofu, firm', 144, 15.7, 3.9, 8.7, []],
  ['Hummus', 166, 7.9, 14.3, 9.6, [['2 spoons', 30]]],
  // Fats & extras
  ['Olive oil', 884, 0, 0, 100, [['1 spoon', 13]]],
  ['Butter', 717, 0.9, 0.1, 81, [['1 teaspoon', 5]]],
  ['Peanut butter', 588, 25, 20, 50, [['1 spoon', 16]]],
  ['Almonds', 579, 21, 21.6, 49.9, [['1 handful', 30]]],
  ['Walnuts', 654, 15, 13.7, 65, [['1 handful', 30]]],
  ['Dark chocolate 70%', 598, 7.8, 46, 43, [['1 square', 10]]],
  ['Honey', 304, 0.3, 82, 0, [['1 spoon', 21]]],
  ['Protein bar', 360, 33, 35, 12, [['1 bar', 60]]],
  // Romanian dishes
  ['Mici', 270, 15, 2, 22, [['1 mic', 55]]],
  ['Sarmale', 170, 8, 9, 11, [['1 sarma', 80]]],
  ['Ciorbă de perișoare', 60, 4, 5, 2.5, [['1 bowl', 350]]],
  ['Ciorbă de burtă', 85, 5, 3, 6, [['1 bowl', 350]]],
  ['Ciorbă de legume', 35, 1.2, 5, 1, [['1 bowl', 350]]],
  ['Șnițel de pui', 250, 18, 13, 14, [['1 piece', 150]]],
  ['Plăcintă cu brânză', 300, 9, 33, 15, [['1 piece', 150]]],
  ['Papanași', 300, 9, 40, 12, [['1 portion', 200]]],
  ['Zacuscă', 120, 1.8, 10, 8, [['2 spoons', 40]]],
  // Eating out
  ['Pizza', 266, 11, 33, 10, [['1 slice', 110]]],
  ['Burger', 254, 13, 25, 11, [['1 burger', 200]]],
  ['Shaorma', 215, 10, 20, 10, [['1 shaorma', 450]]],
  ['French fries', 312, 3.4, 41, 15, [['1 portion', 150]]],
  // Drinks
  ['Orange juice', 45, 0.7, 10.4, 0.2, [['1 glass', 250]]],
  ['Coca-Cola', 42, 0, 10.6, 0, [['1 can', 330]]],
  ['Beer', 43, 0.5, 3.6, 0, [['1 bottle', 500]]],
  ['Wine', 83, 0.1, 2.6, 0, [['1 glass', 150]]],
  ['Cappuccino', 40, 2.2, 3.5, 2, [['1 cappuccino', 200]]]
].map(([n, k, p, c, f, sv], i) => ({ id: 'f' + i, n, k, p, c, f, sv }));

/* Coach library. cat: train | food | recover. g: goals it applies to (empty = all) */
const TIPS = [
  // Training
  { id: 'g_overload', cat: 'train', t: 'Beat last time', b: 'Muscle grows when the work gets harder over time. Each session, try to add one rep or a little weight to at least one lift. Plates shows your last numbers next to every set for this reason.' },
  { id: 'g_rir', cat: 'train', t: 'Train close to failure', b: 'Finish most working sets with 1–3 reps still in the tank. Sets that stop far from failure do much less for growth, even if they feel productive.' },
  { id: 'g_volume', cat: 'train', t: '10–20 hard sets per muscle a week', b: 'For most people, 10–20 challenging sets per muscle per week is the sweet spot. Start near 10 and add sets only if you are recovering well and progress stalls.' },
  { id: 'g_freq', cat: 'train', t: 'Hit each muscle twice a week', b: 'Splitting the same weekly sets over two sessions usually works better than one big session. Upper/lower or push/pull/legs both make this easy.' },
  { id: 'g_reps', cat: 'train', t: 'Any rep range from 5 to 30 works', b: 'Heavy and light sets both build muscle when taken close to failure. Use lower reps on big compound lifts and higher reps on isolation and machine work.' },
  { id: 'g_rest', cat: 'train', t: 'Rest longer on big lifts', b: 'Two to three minutes between sets of squats, presses and rows lets you keep your reps up, which means more total work. One to two minutes is fine for isolation moves.' },
  { id: 'g_stretch', cat: 'train', t: 'Use the full range', b: 'Lowering into a deep stretch, like the bottom of a squat, RDL or incline curl, is one of the strongest growth signals. Don\'t cut reps short to move more weight.' },
  { id: 'g_tempo', cat: 'train', t: 'Control the way down', b: 'Take about two seconds to lower the weight. You don\'t need slow-motion reps, just no dropping or bouncing.' },
  { id: 'g_order', cat: 'train', t: 'Big lifts first', b: 'Put compound lifts at the start of a session while you\'re fresh. Save isolation work like curls and lateral raises for the end.' },
  { id: 'g_warmup', cat: 'train', t: 'Warm up with ramp sets', b: 'Before your first heavy set, do 2–3 lighter sets with fewer reps, building up to your working weight. It primes technique without tiring you out.' },
  { id: 'g_deload', cat: 'train', t: 'Plan a lighter week', b: 'Every 6–8 weeks, or when joints ache and weights stall, cut your sets in half for a week. You usually come back stronger.' },
  { id: 'g_consist', cat: 'train', t: 'Consistency beats the perfect plan', b: 'A good program done for a year beats a perfect one done for a month. Pick a schedule you can actually keep, even if it\'s only three days.' },
  { id: 'g_log', cat: 'train', t: 'Log every set', b: 'Writing down weight and reps is how you know you\'re progressing. Without it, most people repeat the same workout for months.' },
  { id: 'g_weak', cat: 'train', t: 'Lagging muscle? Train it first', b: 'Put the muscle you want to bring up at the start of the session and give it a few extra sets a week.' },
  { id: 'g_cardio', cat: 'train', t: 'Cardio and muscle can coexist', b: 'Moderate cardio and walking don\'t kill gains. Keep hard cardio away from leg days if you can, and favour cycling or walking over running when bulking.' },
  { id: 'g_cut_heavy', cat: 'train', g: ['cut'], t: 'Keep lifting heavy on a cut', b: 'In a deficit, the job of training is to tell your body to keep its muscle. Keep the weights heavy; you can trim a few sets, but not the intensity.' },

  // Food
  { id: 'n_protein', cat: 'food', t: 'Protein: 1.6–2.2 g per kg', b: 'Aim for roughly 1.6–2.2 g of protein per kg of bodyweight a day. Going higher is mostly useful when dieting. Your daily target is set in Settings.' },
  { id: 'n_spread', cat: 'food', t: 'Spread protein across meals', b: 'Three to five meals with 25–40 g of protein each works better than one huge protein meal. Think eggs or skyr at breakfast, meat or fish at lunch and dinner.' },
  { id: 'n_bulk', cat: 'food', g: ['build'], t: 'Lean bulk: a small surplus', b: 'Eat about 200–300 kcal above maintenance and aim to gain 0.25–0.5% of bodyweight a week. Faster than that is mostly fat.' },
  { id: 'n_cut', cat: 'food', g: ['cut'], t: 'Cut at a steady pace', b: 'Losing 0.5–1% of bodyweight a week keeps most of your muscle. Faster cuts cost strength and make you hungrier.' },
  { id: 'n_recomp', cat: 'food', g: ['recomp', 'maintain'], t: 'Recomp needs patience', b: 'Eating near maintenance with high protein can build muscle and lose fat at the same time, especially for beginners. Judge it by strength and the mirror, not the scale.' },
  { id: 'n_carbs', cat: 'food', t: 'Carbs fuel hard training', b: 'Carbs refill the energy your muscles use when lifting. A meal with carbs and protein 1–3 hours before training helps you push harder.' },
  { id: 'n_post', cat: 'food', t: 'After training: protein + carbs', b: 'A meal with 25–40 g of protein and some carbs within a few hours of training supports recovery. No need to rush a shake into the locker room.' },
  { id: 'n_fat', cat: 'food', t: 'Don\'t drop fat too low', b: 'Keep fat at least around 0.6 g per kg of bodyweight. Olive oil, nuts, eggs and fish are easy sources.' },
  { id: 'n_fibre', cat: 'food', t: 'Eat your vegetables', b: 'Vegetables and fruit bring fibre and micronutrients that help digestion and recovery. Aim for something green with at least two meals a day.' },
  { id: 'n_creatine', cat: 'food', t: 'Creatine is well studied', b: 'Creatine monohydrate is one of the most researched supplements for strength and muscle. A common dose is 3–5 g a day, every day; timing doesn\'t matter. Check with a doctor if you have kidney problems.' },
  { id: 'n_water', cat: 'food', t: 'Drink enough water', b: 'Around 35 ml per kg of bodyweight a day is a good baseline, plus extra on training days. Pale yellow urine is a simple check.' },
  { id: 'n_avg', cat: 'food', t: 'It\'s the weekly average that counts', b: 'One day over or under your target barely matters. Look at your 7-day average on the Progress tab instead of stressing about single days.' },
  { id: 'n_weigh', cat: 'food', t: 'Weigh food the same way every time', b: 'Rice and meat change weight a lot when cooked. Pick raw or cooked and stick to it, so your numbers stay consistent.' },
  { id: 'n_ro', cat: 'food', t: 'Cheap Romanian protein', b: 'Brânză de vaci, eggs, chicken, kefir and canned tuna are among the cheapest protein per gram you can buy here. A 250 g tub of brânză de vaci has about 35 g of protein.' },
  { id: 'n_alcohol', cat: 'food', t: 'Go easy on alcohol', b: 'Alcohol slows muscle repair and adds calories that don\'t fill you up. If you drink, keep it moderate and away from training days.' },
  { id: 'n_bulk_easy', cat: 'food', g: ['build'], t: 'Struggling to eat enough?', b: 'Add calorie-dense foods that don\'t fill you up: oats cooked in milk, peanut butter, nuts, olive oil on salads, and a glass of milk with meals.' },
  { id: 'n_cut_full', cat: 'food', g: ['cut'], t: 'Stay full on a cut', b: 'Build meals around lean protein and vegetables, then add carbs. Soups, potatoes and fruit are filling for their calories.' },
  { id: 'n_casein', cat: 'food', t: 'Protein before bed', b: 'A slow-digesting protein before sleep, like brânză de vaci, skyr or Greek yogurt, is an easy way to hit your target.' },

  // Recovery
  { id: 'r_sleep', cat: 'recover', t: 'Sleep is part of training', b: 'Seven to nine hours a night helps strength, recovery and appetite control. Poor sleep makes the same workout feel harder.' },
  { id: 'r_rest', cat: 'recover', t: 'Rest days build muscle too', b: 'Muscle grows between sessions, not during them. One or two full rest days a week is normal and useful.' },
  { id: 'r_steps', cat: 'recover', t: 'Keep walking', b: 'A daily walk helps recovery, heart health and appetite control without eating into your gym energy. 7,000–10,000 steps is a good range.' },
  { id: 'r_stress', cat: 'recover', t: 'Stress adds up', b: 'Work and life stress share the same recovery budget as training. On rough weeks, it\'s fine to do fewer sets and keep the weights.' },
  { id: 'r_sore', cat: 'recover', t: 'Soreness isn\'t the goal', b: 'Being sore doesn\'t mean a workout was good, and not being sore doesn\'t mean it wasn\'t. Progress in the logbook is the better sign.' },
  { id: 'r_pain', cat: 'recover', t: 'Pain is a stop sign', b: 'Muscle burn is fine; sharp or joint pain isn\'t. Swap the exercise for one that doesn\'t hurt and see a professional if it keeps happening.' }
];
