# Roadmap

Split Expenses tracks shared purchases between friends: who paid, who owes whom, and what has already been paid back.

Each phase should be usable on its own before the next one starts.

| Phase | Goal | Needs a server? | Status |
|---|---|---|---|
| 1. Core web app | Calculate debts and share the result | No | In progress |
| 2. Real group tracking | Replace the spreadsheet | No | Planned |
| 3. Payment reminders | Add payment dates to a calendar | No | Planned |
| 4. Friends and accounts | Add friends and share live data | Yes | Future |
| 5. Android app | Install the app and get push notifications | Yes | Future |

## Phase 1: Core web app

The first version has no accounts and doesn't save data. All amounts are in CAD.

- [x] Step 1: Set up the project
- [x] Step 2: Add people (2 to 6)
- [x] Step 3: Add expenses (description, amount, who paid, who shares it)
- [ ] Step 4: Show each debt with its label, plus one total for each pair
- [ ] Step 5: Warn before the page closes, because data isn't saved yet
- [ ] Step 6: Save the summary as an image
- [ ] Step 7: Create a view-only link, with the data compressed inside the link
- [ ] Step 8: Publish on GitHub Pages and test a real link on a phone

**Done when:** a friend can open a shared link on their phone and see the same debts.

## Phase 2: Real group tracking

This phase replaces the original Google Sheet.

- [ ] **Separate calculations:** move the debt calculations into their own file, such as `calculations.js`, with no page code in it.
- [ ] **Couples as one participant:** a participant can be a person or a couple, such as "Person A/Person B". Debts are split per participant.
- [ ] **Unknown amounts:** an expense can be saved without an amount. It counts as $0 and is marked as pending until it's filled in.
- [ ] **Notes:** expenses and payments can have an optional note.
- [ ] **Payments:** record the date, who paid, who received it, the amount, and an optional note. Partial payments are allowed.
- [ ] **Pair status:** each pair shows what remains, what has been paid, and "Quitado ✓" or "Pendente".
- [ ] **Balances:** summary cards show each participant's overall balance.
- [ ] **Saving:** data is saved on the device, which replaces the Step 5 warning as the main protection against data loss.
- [ ] **Backup:** export and import the data as a file.
- [ ] **Portuguese:** add Brazilian Portuguese to the interface.

### Calculations

1. **Balance** = total paid - total owed. Positive means the participant is owed money, and all balances add up to 0.
2. **Gross debt** from X to Y = the sum of X's shares on expenses paid by Y.
3. **Each pair (A, B):**
   - net = (A owes B) - (B owes A)
   - remaining = net - (payments from A to B - payments from B to A)
   - If remaining is positive, A owes B. If it's negative, B owes A. If it's 0, the pair is settled.

### Test case

These anonymized numbers come from the original spreadsheet, with no payments recorded.

| Expense | Paid by | Total | Shared by |
|---|---|---|---|
| Activity | A | 283.50 | A, B, C |
| Groceries | B | 132.51 | A, B, C |
| Extra items | B | 20.00 | A |
| Restaurant (unconfirmed) | B | 21.00 | A |
| Groceries 2 | C | Unknown | A, B, C |
| Restaurant 2 | A | Unknown | A, B, C |

Expected balances:

- A: +103.83
- B: +34.84
- C: -138.67

Expected debts:

- C owes A 94.50
- C owes B 44.17
- B owes A 9.33

**Done when:** this test case gives exactly these results, and recording a payment updates the pair's status.

## Phase 3: Payment reminders

This phase works without a server by using the calendar the user already has.

- [ ] Add an optional due date to a debt, defaulting to 7 days from today.
- [ ] Add an "Add to calendar" button with a Google Calendar link and an `.ics` file for other calendars.
- [ ] Show upcoming and overdue debts in the app.

The calendar sends the notification, so this needs no accounts. The app itself can't send notifications until Phase 4 or 5.

**Done when:** a user can add a payment reminder to their calendar and get notified on the due date.

## Phase 4: Friends and accounts

This is the biggest change, because data moves from the device to a server.

- [ ] Decide whether to move the frontend to a framework and TypeScript. See [Technical decisions](#technical-decisions).
- [ ] Choose a backend. Supabase or Firebase are good options because they include a database and login.
- [ ] Add accounts and login.
- [ ] Add friends by invite link.
- [ ] Create shared groups that update for all members.
- [ ] Define who can see and edit each group, and enforce those rules on the server.
- [ ] Move saved data from the device into an account.
- [ ] Let users delete their account and data.
- [ ] Send app notifications for payment reminders.

**Done when:** two people on different devices can share a group, and each sees the other's changes without needing a new link.

## Phase 5: Android app

- [ ] Make the web app installable as a Progressive Web App (PWA).
- [ ] Package the web app for Android with Capacitor, so both versions share the same code.
- [ ] Add native Android notifications.
- [ ] Publish on Google Play.

**Done when:** the app can be installed from Google Play, using the same accounts and data as the web version.

## Ideas for later

- Simplify debts so the group makes fewer payments
- Split expenses by custom amounts
- Support other currencies

## Technical decisions

### Backend: separate from the frontend

The web page and the Android app will use the same backend, so they share the same data, login, and permission rules. Permission rules must be enforced on the backend, because anyone can change code running on their own browser or phone.

A hosted service like Supabase or Firebase provides this separation without writing a custom server. Custom server code is only needed for something the service can't do, such as some kinds of scheduled notifications.

### Frontend: plain HTML, CSS, and JavaScript for now

- **Phases 1 to 3:** stay with plain HTML, CSS, and JavaScript. There are no build tools, the site runs directly on GitHub Pages, and the app is still small.
- **Start of Phase 4:** decide whether to move to a framework like React or Vue. Several screens, logins, and live updates are where redrawing the page by hand gets repetitive and easier to break.
- **Language:** if the frontend moves to a framework, add TypeScript at the same time. It catches mistakes like misspelled names before the page opens, which helps with money logic and backend data.
- **Why not move now:** Phase 1 is almost finished, and moving now would mean rewriting working code before anything has shipped. Keeping the calculations in their own file means they can carry over, so mostly the screens would need rewriting.
- **When to move sooner:** if simple changes keep breaking other parts of the page during Phase 2, or if learning a framework becomes the main goal. In the second case, start after Phase 1.

### Android: reuse the web code

Capacitor can package either a plain web app or a framework one, so the Android plan doesn't force a frontend choice now. Avoid a fully native Kotlin app, because the screens and calculations would have to be rewritten instead of reused.

## Open decisions

| Decision | Recommendation | Decide by |
|---|---|---|
| Interface language | Build Phase 1 in English, then add Portuguese in Phase 2 and keep both | Phase 2 |
| Editing without accounts | Keep links view-only until Phase 4 | Phase 2 |
| Limit of 6 participants | Keep it until Phase 4, then review it | Phase 4 |
| Backend | Compare Supabase and Firebase | Phase 4 |
| Frontend framework and TypeScript | Stay with plain JavaScript unless it's slowing the work down; if moving, add TypeScript too | Start of Phase 4 |

## Privacy

- Don't commit real names, amounts, or exported data. Free GitHub Pages sites generally need a public repository, where anyone can read them.
- Anyone with a view-only link can see all the data inside it.
