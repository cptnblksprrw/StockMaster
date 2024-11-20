// Toggle between showing Items and Groups
const showItemsButton = document.getElementById("showItems");
const showGroupsButton = document.getElementById("showGroups");
const itemList = document.getElementById("itemList");
const groupList = document.getElementById("groupList");

showItemsButton.addEventListener("click", () => {
  itemList.classList.remove("hidden");
  groupList.classList.add("hidden");
});

showGroupsButton.addEventListener("click", () => {
  groupList.classList.remove("hidden");
  itemList.classList.add("hidden");
});

// Select All Checkbox Functionality
const selectAll = document.getElementById("select-all");
const checkboxes = document.querySelectorAll(".item-checkbox");
selectAll.addEventListener("change", () => {
  checkboxes.forEach((checkbox) => (checkbox.checked = selectAll.checked));
});

// Handle Action Application (Create Group / Delete)
const applyAction = document.getElementById("applyAction");
const actionSelect = document.getElementById("actionSelect");
const inventoryForm = document.getElementById("inventoryForm"); // Assuming form for other actions

applyAction.addEventListener("click", async function (e) {
  e.preventDefault();
  const selectedAction = actionSelect.value;
  const selectedItems = Array.from(
    document.querySelectorAll(".item-checkbox:checked")
  ).map((checkbox) => checkbox.value);

  if (!selectedAction) {
    alert("Please select an action.");
    return;
  }

  if (selectedAction === "createGroup") {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to create a group.");
      return;
    }

    // Redirect to group creation page with selected items
    const queryString = selectedItems.map((id) => `items=${id}`).join("&");
    window.location.href = `/create-group?${queryString}`;
  } else if (selectedAction === "deleteSelected") {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to delete.");
      return;
    }

    console.log(selectedItems);

    // Send request to delete selected items
    try {
      const response = await fetch("/inventory/deleteSelected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedItems }),
      });

      try {
        const data = await response.json(); // Try parsing as JSON
        console.log(data); // Log the response if successful
      } catch (error) {
        // If the response is not JSON, handle it as plain text
        const text = await response.text(); // Read as text if not JSON
        console.error("Error:", text); // Log the error text
      }

      if (response.ok) {
        // Refresh the page to show updated inventory
        window.location.reload();
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting items.");
    }
  } else if (selectedAction === "printBarcode") {
    if (!selectedItems || selectedItems.length === 0) {
      alert("Please select at least one item to print barcodes.");
      return;
    }

    // Placeholder function to handle printing
    printBarcodes(selectedItems);
  } else {
    // Submit the form for other actions (like delete)
    inventoryForm.action = `/inventory/${selectedAction}`;
    inventoryForm.submit();
  }
});

// Fetch barcode data for selected items
async function printBarcodes(itemIds) {
  try {
    const response = await fetch("/inventory/barcodes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemIds }),
    });
    const barcodes = await response.json();

    // For now, just logging the barcodes to the console
    console.log("Barcodes to print: ", barcodes);

    // Placeholder for sending barcodes to the printer
    sendToPrinter(barcodes);
  } catch (error) {
    console.error("Error fetching barcodes:", error);
  }
}

// Placeholder for actual print function
function sendToPrinter(barcodes) {
  // Replace with your actual printer code
  console.log("Sending the following barcodes to printer:", barcodes);
}

// Get modal elements
const addInventoryModal = document.getElementById("addInventoryModal");
const scanItemModal = document.getElementById("scanItemModal");

// Get buttons that trigger modals
const openAddModalBtn = document.getElementById("openAddModal");
const openScanModalBtn = document.getElementById("openScanModal");

// Get buttons to close modals
const closeAddModalBtn = document.getElementById("closeAddModal");
const closeScanModalBtn = document.getElementById("closeScanModal");

// Function to open a modal
function openModal(modal) {
  modal.style.display = "block"; // Show the modal
  document.body.style.overflow = "hidden"; // Prevent body from scrolling when modal is open
}

// Function to close a modal
function closeModal(modal) {
  modal.style.display = "none"; // Hide the modal
  document.body.style.overflow = ""; // Enable scrolling again when modal is closed
}

// Event listeners to open modals
openAddModalBtn.addEventListener("click", function (e) {
  e.preventDefault();
  openModal(addInventoryModal);
});

openScanModalBtn.addEventListener("click", function (e) {
  e.preventDefault();
  openModal(scanItemModal);
});

// Event listeners to close modals
closeAddModalBtn.addEventListener("click", function (e) {
  e.preventDefault();
  closeModal(addInventoryModal);
});

closeScanModalBtn.addEventListener("click", function (e) {
  e.preventDefault();
  closeModal(scanItemModal);
});

// Optional: Close modal if clicked outside of the modal content
window.addEventListener("click", function (e) {
  if (e.target === addInventoryModal) {
    closeModal(addInventoryModal);
  }
  if (e.target === scanItemModal) {
    closeModal(scanItemModal);
  }
});

function sendToPrinter(barcodes) {
  const printers = dymo.label.framework.getPrinters();
  if (printers.length === 0) throw new Error("No DYMO printers found.");
  const printerName = printers[0].name;


  // Load the label template file
  const labelTemplate =
    "C:/Users/train/documents/ENSE374/Project/public/js/barcode_label.label"; // Use the full absolute path

  const label = dymo.label.framework.openLabelFile(labelTemplate);

  // Check if the label is loaded correctly
  if (!label) {
    throw new Error("Failed to load the label.");
  }

  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i];

    // Set the barcode object data (ensure "BARCODE" is the correct reference name in the label template)
    label.setObjectText("BarcodeObject0", barcode);

    // Print the label
    label.print(printerName);
  }
}
