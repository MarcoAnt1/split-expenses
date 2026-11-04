function splitAmount(amountCents, numberOfPeople) {
    const baseShare = Math.floor(amountCents / numberOfPeople);
    const extraCents = amountCents % numberOfPeople;
    const shares = [];

    for (let i = 0; i < numberOfPeople; i += 1) {
        shares.push(i < extraCents ? baseShare + 1 : baseShare);
    }

    return shares;
}

function calculateDebts(expenses) {
    const debts = [];

    for (const expense of expenses) {
        const shares = splitAmount(expense.amountCents, expense.sharedBy.length);

        expense.sharedBy.forEach((person, index) => {
            if (person !== expense.paidBy) {
                debts.push({
                    from: person,
                    to: expense.paidBy,
                    amountCents: shares[index],
                    description: expense.description,
                });
            }
        });
    }

    return debts;
}

function groupDebtsByPair(debts, people) {
    const groups = [];

    for (let i = 0; i < people.length; i += 1) {
        for (let j = i + 1; j < people.length; j += 1) {
            const personA = people[i];
            const personB = people[j];

            const pairDebts = debts.filter(
                (debt) =>
                    (debt.from === personA && debt.to === personB) ||
                    (debt.from === personB && debt.to === personA)
            );

            if (pairDebts.length === 0) {
                continue;
            }

            let balanceCents = 0;

            for (const debt of pairDebts) {
                if (debt.from === personA) {
                    balanceCents += debt.amountCents;
                } else {
                    balanceCents -= debt.amountCents;
                }
            }

            groups.push({
                personA,
                personB,
                debts: pairDebts,
                balanceCents,
            });
        }
    }

    return groups;
}