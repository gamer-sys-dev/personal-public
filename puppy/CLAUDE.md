# Puppy tracker

Logs toilet trips, training sessions and care reminders for a puppy. Version one, single device.

- Everything the user enters is saved in localStorage on the phone. The only thing that ever leaves the phone is live sync, if the user turns it on, and that goes to their own Firebase project. The repo never holds config, keys or data.
- Schedules are typical UK timings and are labelled as such. The vet's plan always wins and the user can edit or add items.
- Reminders go out as .ics calendar files so they land in Google Calendar or Apple Calendar.
- Two phones share by sending an update file and opening it on the other phone, which merges rather than replaces (see sync below). Live sync (below) keeps them up to date by themselves.
- Advice links: UK sources first (PDSA, RSPCA, Dogs Trust, Kennel Club, BVA). US sources only for training method, never for legal or health rules.

## Version two (25 October 2026)

- Health tab: vaccinations are logged as real doses with a type (DHP, Lepto, kennel cough), any date, editable. Each type has its own next due: DHP second puppy dose about 2 weeks on, first booster at 12 months then every 3 years. Lepto (L4) two puppy doses 4 weeks apart then yearly. Kennel cough yearly. A vet date overrides all of it.
- Treatments: one entry per product with what it covers (fleas, ticks, mites, each worm type, lungworm, heartworm), a repeat interval, an optional weight band and a dose log. All in one chews are logged once. Shows what is covered now and the gaps, and warns when the latest weight is outside the product band. Older worm and flea data migrates in.
- Weight log with a simple chart and weekly gain.
- Settings: kind of dog (pedigree, type bred to type such as Lurcher, first cross, mixed), breed or type from a drop down (Other lets you type one in), and free text ancestry (e.g. 7/8 Lurcher, 1/8 Collie). Sighthound types get a lean build and anaesthetic note.
- Food tab: see food, toilet and nights below.
- Food ratings: link out to All About Dog Food rather than building a ratings database.

## Version three (25 October 2026)

- Every live log (toilet, training, poo, feed, behaviour) has a "Log an earlier one" tick box that shows a date and time picker. Lists stay sorted by time.
- Feeding guide on the Food tab: food type (dry, wet, raw, mixed dry and wet), feeds a day, kcal per 100g from the packet (typical figures if blank). Uses resting energy 70 x kg^0.75 times 3 under 16 weeks, 2 while growing, 1.6 to 1.8 as an adult. Always shown as a range with a "follow the packet and your vet" disclaimer. Sighthounds get a bloat note.
- Feed log with amount and how much was eaten, a day by day view (feeds and poos) and a 7 day trend.
- Weight guide: rough adult weight range per breed or type (ADULT_KG), when that size usually stops growing, and an optional 1 to 9 body score with each weigh in.
- Behaviour tab: what happened, how strong, what was going on, what you did and how he responded. Shows weekly counts, what's working per behaviour (last 4 weeks) and short tips.
- Socialisation checklist on the Training tab: 47 items in six areas plus the user's own, each logged as happy, unsure then OK, or scared. Shows the socialisation window by age (closes around 12 to 16 weeks). Scared items are flagged to retry from further away.
- Sleep log (now on the Sleep tab): fell asleep and woke up buttons, last 24 hours and daily average against 18 to 20 hours. Behaviour trends show how long he'd been awake beforehand when the sleep log covers it.

## Food, toilet and nights (26 October 2026)

- Food is a list of his foods (name, type, optional short name) plus a record of what was in his bowl by day: kibble or main food as % of the bowl, and wet pouches a day. A day with no record carries on from the last one set. Nothing starts or stops by itself.
- "Switching food gradually" fills in the bowl mix for each day of a switch (5 to 14 days) and keeps the wet as it was. Any day can be edited after.
- Food and poos table: last 14 days of bowl mix against poo count, average score and wee count, plus comparisons (wet days against none, mid switch against not, each food at 100%) once there are 3 or more days of each.
- Poos are scored on the Toilet tab right after logging them, so there's one log for poos. Older separate poo scores still count. The Toilet tab shows the last 24 hours (wee and poo counts, poo times and scores) against his usual, with gentle flags for few wees, hard poos or repeated soft ones.
- Sleep tab: night time buttons (bedtime, let out, back to bed, up for the day). Let out records what woke him (planned, cried, quiet), wee, poo and any accident first. These also write to the sleep and toilet logs.
- Night plan is rule based: bed and up times, trips a night, longest stretch, age in months plus one hours as a rough hold guide, trips grouped by time of night with advice for each (accidents bring it forward, often nothing means later or drop, the last trip before morning is the one to stretch by 15 minutes after 3 dry nights), a catch him or wait for him verdict, mornings, last meal and night poos, and keep water down.
- Each day's bowl can also have kibble grams a day, carried forward like the mix and split by the mix %. "Use packet guide" fills it (see packet guides).
- His usual meals (time and kibble, wet or both) turn a day's bowl into meal entries, eaten in full. Kibble is split evenly over kibble meals, wet pouches over wet meals. Each filled meal's amount and how much he ate can be changed, and the foods in it scale.
- Fill in past days: a date range can set kibble grams and wet pouches (each day keeps its own mix) and fill usual meals. Days with meals logged by hand are left alone.
- Summary for the vet: per day what he ate by food (from meals, or "planned" from the bowl when no meals are logged), poos with scores and wees, totals, weights, and day notes. Copies as plain text.

## Packet guides (26 October 2026)

- Each food can hold its packet feeding table as rows: age band (months), expected adult weight (a band or a single size) and grams a day, plus optional kcal per 100g and pouch weight for wet.
- Reading a row: find rows for his age (nearest if none). A row spanning both ages and adult sizes moves with both: position = average of how far through the ages and how far up the sizes he is, from low grams to high. Single size rows (a grid) are interpolated by expected adult weight.
- Expected adult weight is set on the Health tab. Blank uses the middle of the breed range.
- A food without a packet guide falls back to calories: 70 x kg^0.75 times 3 under 16 weeks, 2 while growing, 1.7 as an adult, using the weight nearest that day, divided by its kcal.
- A bowl: with kibble in it, each wet pouch's share of the day is its calories (pouch g x wet kcal/100g) against the kibble guide's calories for the day. Only an all wet bowl uses a wet table directly. A wet table can be marked "for feeding wet with kibble", which is then shown for information only (how much wet the maker suggests alongside kibble). Kibble fills the rest, split by the mix using each food's own guide (harmonic, so energy adds up).
- "Use packet guide" on a day, the switch helper and fill in past days can all set kibble grams from this. The switch helper does kibble to kibble, wet to wet or wet to none, in quarter pouches.
- "How much to feed" (shown by default) is laid out like working it by hand: what it's going on (age, weight, expected adult, where he sits in each packet row, the 3x or 2x resting energy formula as the top of the range), no wet food (range a day and per meal), adding wet (each pouch replaces its own calories in kibble), treats (kibble used plus extras as kibble), what's actually happening (grams set, his poo average at each amount over 4 weeks, weekly gain, body score) and what to do. When he's below the textbook range with firm poos it says to go with him.

## Sync between phones (26 October 2026)

- Every entry in the lists (toilet, sessions, custom, vax, treatments, weights, foodList, stools, feeds, nights, behaviours, sleep, social) gets an id and u (last changed). Diet days use the id diet:YYYY-MM-DD. save() compares each entry with its last saved version to stamp u, and records deleted ids in S.gone.
- Opening an update merges: union by id, newer u wins, anything in either phone's S.gone is dropped. Settings (name, dob, breed, kind, breed2, commands, vaxDue, adultKg, meals, socialOwn, feedPlan) go as one block, newest wins. A phone with no puppy details never wins.
- Send an update shares a .txt file (Android refuses .json). If the share sheet fails or is missing, it shows Copy the update (paste into a message, then "Got the update as a message?" on the other phone) and Save it as a file. Pasted text can have chat text around it. "Replace this phone with a file" and "Save a backup file" sit under Other options.

## Live sync (28 October 2026)

- Optional, in More. Uses the user's own free Firebase project (Firestore). The first phone pastes the firebaseConfig block, which is parsed and stored on the phone with a new random 24 character household id. "Send the household code" shares PUPPY1.<base64 of config and household id> for the other phone to paste and join. Nothing about the project is in the repo.
- Data lives at households/{household}/items/{list~id}, one document per entry with k (list), v (entry JSON), u (last changed) and at (server time). Diet days are diet~date, settings are settings~s, and deletions are gone~id documents. puppy/firestore.rules is what goes in the Firebase console: read and write only under a household id of 24 or more characters.
- save() pushes anything whose u differs from what was last synced (debounced 0.8 s). Each phone listens for documents with at >= the last one it saw and applies them with the same rules as update files. Offline changes go when it reconnects.
- Firebase SDK 10.12.2 is loaded from gstatic only when sync is on. The service worker now only handles GET requests for the app's own files and gstatic, so sync traffic is never cached.
- Tested against the Firestore emulator with two browsers: join, add, delete, settings, a bowl, reload and an offline edit all cross in about a second.

## Simpler Food tab and treats (27 October 2026)

- Every Food tab card has a Hide button, and hidden cards are listed under "Add a section" at the bottom. The choice is per phone (stored in the sync meta, not synced). Shown by default: Day by day, Treats and extras, Food and poos, His usual meals, His foods. Switching food gradually shows itself while a switch is under way (2 or more kibbles or wets today, or a bowl set for a future day), unless hidden. A hidden switch card goes back to automatic once the switch ends.
- Day by day shows the bowl as one line with "Change his bowl for this day". The editor only opens when asked, or when nothing is set yet.
- Treats are foodList entries of type Treats with kcal per unit (teaspoon, gram or piece). Recipes (S.recipes) mix treats with "his kibble" from his allowance, which adds no calories. Treat logs (S.treats) copy the recipe's parts.
- Treats advice for today: extra kcal and % of his day (warns over 10%), and how much to take out of his meals (kibble used in treats plus the extras' kcal as grams of his kibble mix). Filled meals take treats out automatically. If meals were filled before a treat, a button updates them. The vet summary includes treat kibble and extras.

## Ideas for later

- Summary tab that analyses all the data and suggests causes and things to try. Needs an AI step, so data would leave the phone: make it opt in, and never put an API key in this public repo (use the user's own key stored on the device, or a small private backend).
