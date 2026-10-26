# Puppy tracker

Logs toilet trips, training sessions and care reminders for a puppy. Version one, single device.

- Everything the user enters is saved in localStorage on the phone. Nothing is sent anywhere.
- Schedules are typical UK timings and are labelled as such. The vet's plan always wins and the user can edit or add items.
- Reminders go out as .ics calendar files so they land in Google Calendar or Apple Calendar.
- Export and import JSON is the stopgap for sharing between two phones. Proper sync (shared backend) is version two.
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

## Ideas for later

- Summary tab that analyses all the data and suggests causes and things to try. Needs an AI step, so data would leave the phone: make it opt in, and never put an API key in this public repo (use the user's own key stored on the device, or a small private backend).
