// this is the singular version of the print function, cannot be passed arrays of barcodes like other examples

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

  const barcode = barcodes;

  // Set the barcode object data (ensure "BARCODE" is the correct reference name in the label template)
  label.setObjectText("BarcodeObject0", barcode);

  // Print the label
  console.log("printing: ", barcode);
  label.print(printerName);
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
