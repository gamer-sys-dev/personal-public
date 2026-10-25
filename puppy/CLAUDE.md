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
- Food tab: food history with start dates, a 7 day transition guide and a 1 to 5 poo score logged against the current food.
- Food ratings: link out to All About Dog Food rather than building a ratings database.

## Version three (25 October 2026)

- Every live log (toilet, training, poo, feed, behaviour) has a "Log an earlier one" tick box that shows a date and time picker. Lists stay sorted by time.
- Feeding guide on the Food tab: food type (dry, wet, raw, mixed dry and wet), feeds a day, kcal per 100g from the packet (typical figures if blank). Uses resting energy 70 x kg^0.75 times 3 under 16 weeks, 2 while growing, 1.6 to 1.8 as an adult. Always shown as a range with a "follow the packet and your vet" disclaimer. Sighthounds get a bloat note.
- Feed log with amount and how much was eaten, a day by day view (feeds and poos) and a 7 day trend.
- Weight guide: rough adult weight range per breed or type (ADULT_KG), when that size usually stops growing, and an optional 1 to 9 body score with each weigh in.
- Behaviour tab: what happened, how strong, what was going on, what you did and how he responded. Shows weekly counts, what's working per behaviour (last 4 weeks) and short tips.

## Ideas for later

- Summary tab that analyses all the data and suggests causes and things to try. Needs an AI step, so data would leave the phone: make it opt in, and never put an API key in this public repo (use the user's own key stored on the device, or a small private backend).
