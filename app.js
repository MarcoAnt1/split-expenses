const MAX_PEOPLE = 6;

let people = [];

const personForm = document.querySelector("#person-form");
const personNameInput = document.querySelector("#person-name");
const personError = document.querySelector("#person-error");
const peopleList = document.querySelector("#people-list");

function getPersonError(name) {
    if (name === "") {
        return "Please enter a name.";
    }

    if (people.length >= MAX_PEOPLE) {
        return `You an add up to ${MAX_PEOPLE} people.`;
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
    people = people.filter((person) => person !== nameToRemove);
    personError.textContent = "";
    renderPeople();
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
});

