const MAX_PEOPLE = 6;
const MIN_PEOPLE = 2;

let people = [];
let expenses = [];
let nextExpenseId = 1;

let isViewOnly = false;

const SHARE_PREFIX = "#data=";
const SHARE_VERSION = 1;

const moneyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
});

const IMAGE_WIDTH = 600;
const IMAGE_PADDING = 24;
const IMAGE_SCALE = 2;
const IMAGE_FONT = "Arial, Helvetica, sans-serif";

const IMAGE_STYLES = {
    title: { font: `bold 28px ${IMAGE_FONT}`, color: "#0f766e", lineHeight: 36, gapBefore: 0 },
    heading: { font: `bold 20px ${IMAGE_FONT}`, color: "#1f2933", lineHeight: 28, gapBefore: 20 },
    subheading: { font: `bold 16px ${IMAGE_FONT}`, color: "#1f2933", lineHeight: 22, gapBefore: 14 },
    body: { font: `16px ${IMAGE_FONT}`, color: "#1f2933", lineHeight: 22, gapBefore: 2 },
    total: { font: `bold 16px ${IMAGE_FONT}`, color: "#0f766e", lineHeight: 22, gapBefore: 4 },
    muted: { font: `14px ${IMAGE_FONT}`, color: "#52606d", lineHeight: 20, gapBefore: 2 },
};

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

const saveImageButton = document.querySelector("#save-image-button");

const copyLinkButton = document.querySelector("#copy-link-button");
const shareLinkStatus = document.querySelector("#share-link-status");
const shareLinkOutput = document.querySelector("#share-link-output");
const shareBanner = document.querySelector("#share-banner");

function formatMoney(cents) {
    return moneyFormatter.format(cents / 100);
}

function getExpenseTitleText(expense) {
    return `${expense.description}: ${formatMoney(expense.amountCents)}`;
}

function getExpenseDetailsText(expense) {
    return `Paid by ${expense.paidBy}. Shared by ${expense.sharedBy.join(", ")}.`;
}

function getDebtText(debt) {
    return `${debt.from} owes ${debt.to} ${formatMoney(debt.amountCents)}, for ${debt.description}`;
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
    clearShareLink();

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
    renderDebts();
}

function renderExpenses() {
    expenseList.textContent = "";

    for (const expense of expenses) {
        const item = document.createElement("li");
        const content = document.createElement("div");

        const title = document.createElement("div");
        title.className = "expense-title";
        title.textContent = getExpenseTitleText(expense);

        const details = document.createElement("div");
        details.className = "expense-details";
        details.textContent = getExpenseDetailsText(expense);

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
    clearShareLink();

    const groups = groupDebtsByPair(calculateDebts());

    debtsHint.hidden = expenses.length > 0;
    saveImageButton.hidden = expenses.length === 0;
    copyLinkButton.hidden = expenses.length === 0;
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
            line.textContent = getDebtText(debt);
            groupElement.append(line);
        }

        const total = document.createElement("p");
        total.className = "debt-total";
        total.textContent = getTotalText(group);
        groupElement.append(total);

        debtGroups.append(groupElement);
    }
}

function getImageLines() {
    const lines = [
        { text: "Split Expenses", style: "title" },
        { text: `Created on ${new Date().toLocaleDateString("en-CA")}`, style: "muted" },
        { text: "Who owes whom", style: "heading" },
    ];

    for (const group of groupDebtsByPair(calculateDebts())) {
        lines.push({ text: `${group.personA} and ${group.personB}`, style: "subheading" });

        for (const debt of group.debts) {
            lines.push({ text: getDebtText(debt), style: "body" });
        }

        lines.push({ text: getTotalText(group), style: "total" });
    }

    lines.push({ text: "Expenses", style: "heading" });

    for (const expense of expenses) {
        lines.push({ text: getExpenseTitleText(expense), style: "subheading" });
        lines.push({ text: getExpenseDetailsText(expense), style: "muted" });
    }

    return lines;
}

function wrapText(context, text, maxWidth) {
    const words = text.split(" ");
    const wrappedLines = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine === "" ? word : `${currentLine} ${word}`;

        if (context.measureText(testLine).width > maxWidth && currentLine !== "") {
            wrappedLines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    wrappedLines.push(currentLine);
    return wrappedLines;
}

function createSummaryCanvas() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const maxWidth = IMAGE_WIDTH - IMAGE_PADDING * 2;

    const rows = [];
    let height = IMAGE_PADDING;

    for (const line of getImageLines()) {
        const style = IMAGE_STYLES[line.style];

        context.font = style.font;
        height += style.gapBefore;

        for (const text of wrapText(context, line.text, maxWidth)) {
            rows.push({ text, style, y: height });
            height += style.lineHeight;
        }
    }

    height += IMAGE_PADDING;

    canvas.width = IMAGE_WIDTH * IMAGE_SCALE;
    canvas.height = height * IMAGE_SCALE;
    context.scale(IMAGE_SCALE, IMAGE_SCALE);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, IMAGE_WIDTH, height);
    context.textBaseline = "top";

    for (const row of rows) {
        context.font = row.style.font;
        context.fillStyle = row.style.color;
        context.fillText(row.text, IMAGE_PADDING, row.y);
    }

    return canvas;
}

function saveSummaryImage() {
    const link = document.createElement("a");
    link.href = createSummaryCanvas().toDataURL("image/png");
    link.download = "split-expenses.png";
    link.click();
}

saveImageButton.addEventListener("click", saveSummaryImage);

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

window.addEventListener("beforeunload", (event) => {
    if (isViewOnly || people.length === 0) {
        return;
    }

    event.preventDefault();
    event.returnValue = "";
}); 

function clearShareLink() {
    shareLinkOutput.hidden = true;
    shareLinkOutput.value = "";
    shareLinkStatus.textContent = "";
}

function serializeData() {
    return JSON.stringify({
        v: SHARE_VERSION,
        p: people,
        e: expenses.map((expense) => [
            expense.description,
            expense.amountCents,
            people.indexOf(expense.paidBy),
            expense.sharedBy.map((person) => people.indexOf(person)),
        ]),
    });
}

function parseSharedData(json) {
    const data = JSON.parse(json);

    const hasValidPeople =
        Array.isArray(data.p) &&
        data.p.length >= MIN_PEOPLE &&
        data.p.length <= MAX_PEOPLE &&
        data.p.every((person) => typeof person === "string" && person !== "") &&
        new Set(data.p).size === data.p.length;

    if (data.v !== SHARE_VERSION || !hasValidPeople || !Array.isArray(data.e)) {
        throw new Error("Invalid shared data");
    }

    const sharedExpenses = data.e.map((entry, index) => {
        const [description, amountCents, paidByIndex, sharedByIndexes] = entry;
        const paidBy = data.p[paidByIndex];
        const sharedBy = sharedByIndexes.map((personIndex) => data.p[personIndex]);

        const isValid =
            typeof description === "string" &&
            Number.isInteger(amountCents) &&
            typeof paidBy === "string" &&
            sharedBy.every((person) => typeof person === "string") &&
            getExpenseError(description, amountCents, paidBy, sharedBy) === "";

        if (!isValid) {
            throw new Error("Invalid shared expense");
        }

        return { id: index + 1, description, amountCents, paidBy, sharedBy };
    });

    return { sharedPeople: data.p, sharedExpenses };
}

async function encodeData(text) {
    const stream = new Blob([text])
        .stream()
        .pipeThrough(new CompressionStream("deflate-raw"));
    const buffer = await new Response(stream).arrayBuffer();

    let binary = "";

    for (const byte of new Uint8Array(buffer)) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}

async function decodeData(encoded) {
    const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));

    return new Response(stream).text();
}

async function tryCopyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

async function copyShareLink() {
    try {
        const encoded = await encodeData(serializeData());
        const link = `${location.href.split("#")[0]}${SHARE_PREFIX}${encoded}`;
        const wasCopied = await tryCopyText(link);

        shareLinkOutput.value = link;
        shareLinkOutput.hidden = false;
        shareLinkStatus.textContent = wasCopied
            ? "Link copied!"
            : "Your browser blocked copying, so copy the link below.";
    } catch {
        shareLinkStatus.textContent = "This browser can't create the link. Try saving an image instead.";
    }
}

async function loadSharedLink() {
    if (!location.hash.startsWith(SHARE_PREFIX)) {
        return;
    }

    document.body.classList.add("view-only");

    try {
        const encoded = location.hash.slice(SHARE_PREFIX.length);
        const { sharedPeople, sharedExpenses } = parseSharedData(await decodeData(encoded));

        people = sharedPeople;
        expenses = sharedExpenses;
        isViewOnly = true;
        shareBanner.textContent = "This is a view-only summary. Ask for a new link if anything changes.";
        renderExpenses();
        renderDebts();
    } catch {
        document.body.classList.remove("view-only");
        shareBanner.textContent = "This link is broken or incomplete. Ask for a new one.";
    }
}

copyLinkButton.addEventListener("click", copyShareLink);
window.addEventListener("hashchange", () => location.reload());

loadSharedLink();
