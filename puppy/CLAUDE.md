# Puppy tracker

Logs toilet trips, training sessions and care reminders for a puppy. Version one, single device.

- Everything the user enters is saved in localStorage on the phone. Nothing is sent anywhere.
- Schedules are typical UK timings and are labelled as such. The vet's plan always wins and the user can edit or add items.
- Reminders go out as .ics calendar files so they land in Google Calendar or Apple Calendar.
- Export and import JSON is the stopgap for sharing between two phones. Proper sync (shared backend) is version two.
- Advice links: UK sources first (PDSA, RSPCA, Dogs Trust, Kennel Club, BVA). US sources only for training method, never for legal or health rules.

## Version two (25 October 2026)

- Health tab: vaccinations are logged as real doses (any combination, any date, editable). Next jab comes from the vet's date if set, otherwise an annual booster 12 months after the dose marked "completes the course".
- Worming and flea: product, repeat interval and a log of doses. Next due is worked out from the last dose. Worming defaults by age (every 2 weeks to 12 weeks, 4 weeks to 6 months, then 13 weeks) unless an interval is set.
- Weight log with a simple chart and weekly gain. Breed and cross breed in settings.
- Food tab: food history with start dates, a 7 day transition guide and a 1 to 5 poo score logged against the current food.
- Food ratings: link out to All About Dog Food rather than building a ratings database.
