const testResults = document.querySelector("#test-results");
const testSummary = document.querySelector("#test-summary");

let failedTests = 0;

function test(name, actual, expected) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    const item = document.createElement("li");

    item.textContent = `${passed ? "PASS" : "FAIL"}: ${name}`;
    testResults.append(item);

    if (!passed) {
        failedTests += 1;
        console.error(name, { actual, expected });
    }
}

const everyone = ["A", "B", "C"];

const exampleExpenses = [
    { description: "Dinner", amountCents: 6000, paidBy: "A", sharedBy: everyone },
    { description: "Coffee", amountCents: 500, paidBy: "B", sharedBy: ["A"] },
    { description: "Taxi", amountCents: 1000, paidBy: "C", sharedBy: everyone },
];

const exampleDebts = calculateDebts(exampleExpenses);

test("Extra cents go to the first people", splitAmount(1000, 3), [334, 333, 333]);

test(
    "Shares add up to the full amount",
    splitAmount(1999, 6).reduce((total, share) => total + share, 0),
    1999
);

test(
    "Each debt is listed, without the payer's own share",
    exampleDebts.map((debt) => [debt.from, debt.to, debt.amountCents, debt.description]),
    [
        ["B", "A", 2000, "Dinner"],
        ["C", "A", 2000, "Dinner"],
        ["A", "B", 500, "Coffee"],
        ["A", "C", 334, "Taxi"],
        ["B", "C", 333, "Taxi"],
    ]
);

test(
    "Each pair gets the correct balance",
    groupDebtsByPair(exampleDebts, everyone).map((group) => [
        group.personA,
        group.personB,
        group.balanceCents,
    ]),
    [
        ["A", "B", -1500],
        ["A", "C", -1666],
        ["B", "C", 333],
    ]
);

test(
    "Equal debts give a balance of zero",
    groupDebtsByPair(
        calculateDebts([
            { description: "Lunch", amountCents: 1000, paidBy: "A", sharedBy: ["B"] },
            { description: "Snack", amountCents: 1000, paidBy: "B", sharedBy: ["A"] },
        ]),
        ["A", "B"]
    )[0].balanceCents,
    0
);

test(
    "A pair with no debts is left out",
    groupDebtsByPair(
        calculateDebts([
            { description: "Lunch", amountCents: 1000, paidBy: "A", sharedBy: ["B"] },
        ]),
        everyone
    ).length,
    1
);

testSummary.textContent = failedTests === 0
    ? "All tests passed"
    : `${failedTests} test(s) failed. Open the Console for details.`;