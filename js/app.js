"use strict";

/* =========================================================
   1. CONFIGURATION
========================================================= */

const STORAGE_KEY = "stock-counter-v2";

// Starting inventory:
// [Name, Pieces per box, Store pieces, Fridge pieces]

const STARTING_INVENTORY = [
  ["Water Big", 6, 72, 16],
  ["Water Small", 24, 264, 51],
  ["Espresso", 24, 300, 43],
  ["Sparkling Water Big", 6, 0, 14],
  ["Sparkling Water Small", 24, 258, 19],
  ["Italian wine (Chianti)", 6, 0, 3],
  ["French Wine (Cotes du Rhone)", 6, 0, 4],
  ["Sunset 1/2", 12, 0, 30],
  ["Sunset 1/1", 6, 10, 13],
  ["Blc de Blc 1/2", 12, 7, 12],
  ["Blc de Blc 1/1", 6, 7, 12],
  ["Ksara Red 1/2", 12, 0, 27],
  ["Ksara Red 1/1", 6, 12, 6],
  ["Ice tea Peach", 24, 90, 25],
  ["Ice tea Lemon", 24, 120, 14],
  ["Pepsi", 24, 144, 48],
  ["Pepsi Black", 24, 264, 25],
  ["Pepsi Diet", 24, 288, 56],
  ["Seven Up", 24, 120, 26],
  ["Seven Up Diet", 24, 48, 42],
  ["Mirinda", 24, 48, 21],
  ["Red Bull", 24, 24, 7],
  ["Heineken", 24, 36, 12],
  ["Corona", 24, 6, 13],
  ["961 Lager", 24, 83, 6],
  ["961 Pilsner", 24, 77, 5],
  ["961 Red Ale", 24, 93, 6],
];

// Available inventory locations

const LOCATIONS = [
  { id: "store", name: "Store" },
  { id: "fridge", name: "Fridge" },
  { id: "other", name: "Other" },
];

/* =========================================================
   2. APPLICATION STATE
========================================================= */

let items = loadInventory();

let nextId = items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

/* =========================================================
   3. DOM ELEMENT REFERENCES
========================================================= */

const elements = {
  list: document.getElementById("list"),
  grandTotal: document.getElementById("grand"),
  search: document.getElementById("search"),

  clearButton: document.getElementById("clear"),
  resetButton: document.getElementById("reset"),
  addButton: document.getElementById("add"),

  newName: document.getElementById("newName"),
  newPer: document.getElementById("newPer"),
  message: document.getElementById("msg"),
};

/* =========================================================
   4. INVENTORY INITIALIZATION
========================================================= */

function createStartingInventory() {
  return STARTING_INVENTORY.map((row, index) => ({
    id: index + 1,

    name: row[0],

    per: row[1],

    p: {
      store: row[2],
      fridge: row[3],
      other: 0,
    },
  }));
}

/* =========================================================
   5. LOCAL STORAGE MANAGEMENT
========================================================= */

function loadInventory() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      const parsedData = JSON.parse(savedData);

      if (Array.isArray(parsedData) && parsedData.length) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Could not load inventory:", error);
  }

  return createStartingInventory();
}

function saveInventory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Could not save inventory:", error);
  }
}

/* =========================================================
   6. GENERAL HELPER FUNCTIONS
========================================================= */

function getNumber(value) {
  const number = parseInt(value, 10);

  return Number.isNaN(number) ? 0 : number;
}

function formatNumber(number) {
  return number.toLocaleString("en-US");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"]/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };

    return replacements[character];
  });
}

function findItemById(id) {
  return items.find((item) => item.id === Number(id));
}

/* =========================================================
   7. INVENTORY CALCULATIONS
========================================================= */

// Calculate total pieces across all locations.

function calculateItemTotal(item) {
  return LOCATIONS.reduce((total, location) => {
    return total + item.p[location.id];
  }, 0);
}

// Convert pieces into boxes and remaining loose pieces.

function splitIntoBoxes(pieces, piecesPerBox) {
  if (piecesPerBox <= 0) {
    return [0, pieces];
  }

  const boxes = Math.floor(pieces / piecesPerBox);

  const loosePieces = pieces % piecesPerBox;

  return [boxes, loosePieces];
}

// Calculate total pieces across all inventory items.

function calculateGrandTotal() {
  return items.reduce((total, item) => {
    return total + calculateItemTotal(item);
  }, 0);
}

/* =========================================================
   8. HTML GENERATION
========================================================= */

// Generate the total section for one item.

function createResultHTML(item) {
  const total = calculateItemTotal(item);

  const [boxes, loosePieces] = splitIntoBoxes(total, item.per);

  return `
        <span>
            Total:
            <b>${formatNumber(boxes)}</b> boxes +
            <b>${formatNumber(loosePieces)}</b> pieces
        </span>

        <span>
            <b>${formatNumber(total)}</b> pieces
        </span>
    `;
}

// Generate one inventory location.

function createLocationHTML(item, location) {
  const pieces = item.p[location.id];

  const [boxes, loosePieces] = splitIntoBoxes(pieces, item.per);

  return `
        <div
            class="loc"
            data-loc="${location.id}"
        >

            <h3>${location.name}</h3>

            <div class="pair">

                <div>
                    <label>Boxes</label>

                    <input
                        data-k="b"
                        type="number"
                        min="0"
                        inputmode="numeric"
                        value="${boxes}"
                    >
                </div>

                <div>
                    <label>Pieces</label>

                    <input
                        data-k="l"
                        type="number"
                        min="0"
                        inputmode="numeric"
                        value="${loosePieces}"
                    >
                </div>

            </div>

        </div>
    `;
}

// Generate one complete inventory item.

function createItemHTML(item) {
  const locationsHTML = LOCATIONS.map((location) => {
    return createLocationHTML(item, location);
  }).join("");

  return `
        <div
            class="item"
            data-id="${item.id}"
        >

            <div class="top">

                <span class="name">
                    ${escapeHTML(item.name)}
                </span>

                <label class="per">

                    Per box

                    <input
                        data-per="1"
                        type="number"
                        min="1"
                        inputmode="numeric"
                        value="${item.per}"
                    >

                </label>

                <button
                    class="x"
                    data-del="1"
                    aria-label="Delete ${escapeHTML(item.name)}"
                >
                    ×
                </button>

            </div>

            <div class="locs">
                ${locationsHTML}
            </div>

            <div class="res">
                ${createResultHTML(item)}
            </div>

        </div>
    `;
}

/* =========================================================
   9. INVENTORY RENDERING
========================================================= */

function renderInventory() {
  const query = elements.search.value.trim().toLowerCase().replace(/\s+/g, " ");

  // Filter inventory according to search input.

  const filteredItems = items.filter((item) => {
    return item.name.toLowerCase().includes(query);
  });

  // Display inventory.

  if (filteredItems.length === 0) {
    elements.list.innerHTML = `
            <p class="sub">No items found.</p>
        `;
  } else {
    elements.list.innerHTML = filteredItems
      .map((item) => {
        return createItemHTML(item);
      })
      .join("");
  }

  updateGrandTotal();
}

// Update the fixed grand total.

function updateGrandTotal() {
  elements.grandTotal.textContent = formatNumber(calculateGrandTotal());
}

// Update one item's result section.

function updateItemResult(item, card) {
  card.querySelector(".res").innerHTML = createResultHTML(item);

  updateGrandTotal();
}

/* =========================================================
   10. ITEM INPUT HANDLING
========================================================= */

function handleItemInput(event) {
  const card = event.target.closest(".item");

  if (!card) {
    return;
  }

  const item = findItemById(card.dataset.id);

  if (!item) {
    return;
  }

  // Handle pieces-per-box changes.

  if (event.target.hasAttribute("data-per")) {
    const newPer = getNumber(event.target.value);

    if (newPer < 1) {
      return;
    }

    item.per = newPer;

    updateLocationInputs(card, item);
  }

  // Handle boxes and loose-piece changes.
  else {
    const locationElement = event.target.closest(".loc");

    if (!locationElement) {
      return;
    }

    updateLocationCount(item, locationElement);
  }

  updateItemResult(item, card);

  saveInventory();
}

// Update location inputs after changing box size.

function updateLocationInputs(card, item) {
  LOCATIONS.forEach((location) => {
    const locationElement = card.querySelector(`[data-loc="${location.id}"]`);

    const [boxes, loosePieces] = splitIntoBoxes(item.p[location.id], item.per);

    locationElement.querySelector('[data-k="b"]').value = boxes;

    locationElement.querySelector('[data-k="l"]').value = loosePieces;
  });
}

// Convert boxes and loose pieces into total pieces.

function updateLocationCount(item, locationElement) {
  const boxes = getNumber(locationElement.querySelector('[data-k="b"]').value);

  const loosePieces = getNumber(
    locationElement.querySelector('[data-k="l"]').value,
  );

  const locationId = locationElement.dataset.loc;

  item.p[locationId] = boxes * item.per + loosePieces;
}

/* =========================================================
   11. DELETE CONFIRMATION
========================================================= */

// Requires two clicks within four seconds.

function confirmAction(button, callback, message) {
  if (button._timer) {
    clearTimeout(button._timer);

    button.textContent = button._originalText;

    button._timer = null;

    callback();

    return;
  }

  button._originalText = button.textContent;

  button.textContent = message || "Tap again to confirm";

  button._timer = setTimeout(() => {
    button.textContent = button._originalText;

    button._timer = null;
  }, 4000);
}

// Delete an inventory item.

function handleDeleteItem(event) {
  const deleteButton = event.target.closest("[data-del]");

  if (!deleteButton) {
    return;
  }

  const card = deleteButton.closest(".item");

  const item = findItemById(card.dataset.id);

  if (!item) {
    return;
  }

  confirmAction(
    deleteButton,
    () => {
      items = items.filter((existingItem) => {
        return existingItem.id !== item.id;
      });

      saveInventory();

      renderInventory();
    },
    "Delete?",
  );
}

/* =========================================================
   12. SEARCH
========================================================= */

function handleSearch() {
  renderInventory();
}

/* =========================================================
   13. CLEAR AND RESET INVENTORY
========================================================= */

// Clear all counts without deleting inventory items.

function clearInventoryCounts() {
  items.forEach((item) => {
    item.p = {
      store: 0,
      fridge: 0,
      other: 0,
    };
  });

  saveInventory();

  renderInventory();
}

// Restore original starting inventory.

function resetInventory() {
  items = createStartingInventory();

  nextId = items.length + 1;

  saveInventory();

  renderInventory();
}

/* =========================================================
   14. ADD NEW INVENTORY ITEM
========================================================= */

function addNewItem() {
  const name = elements.newName.value.trim();

  const piecesPerBox = getNumber(elements.newPer.value);

  // Validate input.

  if (!name || piecesPerBox < 1) {
    elements.message.textContent = "Enter an item name and pieces per box.";

    return;
  }

  elements.message.textContent = "";

  // Create new item.

  const newItem = {
    id: nextId++,

    name: name,

    per: piecesPerBox,

    p: {
      store: 0,
      fridge: 0,
      other: 0,
    },
  };

  items.push(newItem);

  // Reset form.

  elements.newName.value = "";

  elements.newPer.value = "";

  saveInventory();

  renderInventory();
}

/* =========================================================
   15. EVENT LISTENERS
========================================================= */

function initializeEvents() {
  // Inventory input changes.

  elements.list.addEventListener("input", handleItemInput);

  // Delete inventory item.

  elements.list.addEventListener("click", handleDeleteItem);

  // Search inventory.

  elements.search.addEventListener("input", handleSearch);

  // Clear inventory counts.

  elements.clearButton.addEventListener("click", () => {
    confirmAction(elements.clearButton, clearInventoryCounts);
  });

  // Reload starting inventory.

  elements.resetButton.addEventListener("click", () => {
    confirmAction(elements.resetButton, resetInventory);
  });

  // Add inventory item.

  elements.addButton.addEventListener("click", addNewItem);
}

/* =========================================================
   16. APPLICATION INITIALIZATION
========================================================= */

function initializeApp() {
  initializeEvents();

  renderInventory();
}

// Start the application.

initializeApp();
