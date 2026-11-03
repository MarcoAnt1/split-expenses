const MAX_PEOPLE = 6;
const MIN_PEOPLE = 2;

let people = [];
let expenses = [];
let nextExpenseId = 1;

const moneyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
});

const personForm = document.querySelector("#person-form");
const personNameInput = document.querySelector("#person-name");
const personError = document.querySelector("#person-error");
const peopleList = document.querySelector("#people-list");

const expenseHint = document.querySelector("#expense-hint");
const expenseForm = document.querySelector("#expense-form");
const expenseDescriptionInput = document.querySelector("#expense-description");
const expenseAmountInput = document.querySelector("#expense-amount");
const expensePaidBySelect = document.querySelector("#expense-paid-by");
const expenseSharedBy = document.querySelector("#expense-shared-by");
const expenseError = document.querySelector("#expense-error");
const expenseList = document.querySelector("#expense-list");

const debtsHint = document.querySelector("#debts-hint");
const debtGroups = document.querySelector("#debt-groups");

function formatMoney(cents) {
    return moneyFormatter.format(cents / 100);
}

function getPersonError(name) {
    if (name === "") {
        return "Please enter a name.";
    }

    if (people.length >= MAX_PEOPLE) {
        return `You can add up to ${MAX_PEOPLE} people.`;
    }

    const alreadyExists = people.some(
        (person) => person.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
        return `${name} is already on the list.`;
    }

    return "";
}

function removePerson(nameToRemove) {
    const isInExpense = expenses.some(
        (expense) =>
            expense.paidBy === nameToRemove ||
            expense.sharedBy.includes(nameToRemove)
    );

    if (isInExpense) {
        personError.textContent = `Remove ${nameToRemove}'s expenses first.`;
        return;
    }

    people = people.filter((person) => person !== nameToRemove);
    personError.textContent = "";
    renderPeople();
    renderExpenseForm();
}

function renderPeople() {
    peopleList.textContent = "";

    for (const person of people) {
        const item = document.createElement("li");

        const name = document.createElement("span");
        name.textContent = person;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-button";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${person}`);
        removeButton.addEventListener("click", () => removePerson(person));

        item.append(name, removeButton);
        peopleList.append(item);
    }
}

function renderExpenseForm() {
    const hasEnoughPeople = people.length >= MIN_PEOPLE;

    expenseHint.hidden = hasEnoughPeople;
    expenseForm.hidden = !hasEnoughPeople;
    expenseError.textContent = "";

    expensePaidBySelect.textContent = "";
    expensePaidBySelect.append(new Option("Choose a person", ""));

    expenseSharedBy.textContent = "";

    for (const person of people) {
        expensePaidBySelect.append(new Option(person, person));

        const label = document.createElement("label");
        label.className = "checkbox-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "shared-by";
        checkbox.value = person;
        checkbox.checked = true;

        label.append(checkbox, ` ${person}`);
        expenseSharedBy.append(label);
    }
}

function getExpenseError(description, amountCents, paidBy, sharedBy) {
    if (description === "") {
        return "Please enter what the expense was for.";
    }

    if (amountCents <= 0) {
        return "Please enter an amount greater than $0.00.";
    }

    if (paidBy === "") {
        return "Please choose who paid.";
    }

    if (sharedBy.length === 0) {
        return "Please choose who shares this expense.";
    }

    if (sharedBy.length === 1 && sharedBy[0] === paidBy) {
        return "Choose at least one person besides the one who paid.";
    }

    return "";
}

function removeExpense(idToRemove) {
    expenses = expenses.filter((expense) => expense.id !== idToRemove);
    personError.textContent = "";
    renderExpenses();
}

function renderExpenses() {
    expenseList.textContent = "";

    for (const expense of expenses) {
        const item = document.createElement("li");
        const content = document.createElement("div");

        const title = document.createElement("div");
        title.className = "expense-title";
        title.textContent = `${expense.description}: ${formatMoney(expense.amountCents)}`;

        const details = document.createElement("div");
        details.className = "expense-details";
        details.textContent = `Paid by ${expense.paidBy}. Shared by ${expense.sharedBy.join(", ")}.`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-button";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${expense.description}`);
        removeButton.addEventListener("click", () => removeExpense(expense.id));

        content.append(title, details);
        item.append(content, removeButton);
        expenseList.append(item);
    }
}

function splitAmount(amountCents, numberOfPeople) {
    const baseShare = Math.floor(amountCents / numberOfPeople);
    const extraCents = amountCents % numberOfPeople;
    const shares = [];

    for (let i = 0; i < numberOfPeople; i += 1) {
        shares.push(i < extraCents ? baseShare + 1 : baseShare);
    }

    return shares;
}

function calculateDebts() {
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

function groupDebtsByPair(debts) {
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

function getTotalText(group) {
    const { personA, personB, balanceCents } = group;

    if (balanceCents === 0) {
        return `In total: ${personA} and ${personB} are even.`;
    }

    if (balanceCents > 0) {
        return `In total: ${personA} pays ${personB} ${formatMoney(balanceCents)}`;
    }

    return `In total: ${personB} pays ${personA} ${formatMoney(-balanceCents)}`;
}

function renderDebts() {
    const groups = groupDebtsByPair(calculateDebts());

    debtsHint.hidden = expenses.length > 0;
    debtGroups.textContent = "";

    for (const group of groups) {
        const groupElement = document.createElement("div");
        groupElement.className = "debt-group";

        const title = document.createElement("h3");
        title.textContent = `${group.personA} and ${group.personB}`;
        groupElement.append(title);

        for (const debt of group.debts) {
            const line = document.createElement("p");
            line.className = "debt-line";
            line.textContent = `${debt.from} owes ${debt.to} ${formatMoney(debt.amountCents)}, for ${debt.description}`;
            groupElement.append(line);
        }

        const total = document.createElement("p");
        total.className = "debt-total";
        total.textContent = getTotalText(group);
        groupElement.append(total);

        debtGroups.append(groupElement);
    }
}

personForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = personNameInput.value.trim();
    const error = getPersonError(name);

    personError.textContent = error;

    if (error !== "") {
        return;
    }

    people.push(name);
    personNameInput.value = "";
    personNameInput.focus();
    renderPeople();
    renderExpenseForm();
});

expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const description = expenseDescriptionInput.value.trim();
    const amountCents = Math.round(Number(expenseAmountInput.value) * 100);
    const paidBy = expensePaidBySelect.value;
    const checkedBoxes = expenseForm.querySelectorAll('input[name="shared-by"]:checked');
    const sharedBy = Array.from(checkedBoxes, (checkbox) => checkbox.value);

    const error = getExpenseError(description, amountCents, paidBy, sharedBy);

    expenseError.textContent = error;

    if (error !== "") {
        return;
    }

    expenses.push({
        id: nextExpenseId,
        description,
        amountCents,
        paidBy,
        sharedBy,
    });
    nextExpenseId += 1;

    expenseDescriptionInput.value = "";
    expenseAmountInput.value = "";
    expenseDescriptionInput.focus();
    renderExpenseForm();
    renderExpenses();
    renderDebts();
});
