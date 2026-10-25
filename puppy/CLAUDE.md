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
