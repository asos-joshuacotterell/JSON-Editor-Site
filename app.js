document.addEventListener("DOMContentLoaded", () => {
    const jsonFileInput = document.getElementById("jsonFileInput");
    const jsonDisplay = document.getElementById("jsonDisplay");
    const saveButton = document.getElementById("saveButton");
    const filterInput = document.getElementById("filterInput");

    let originalData = null; // Store the original JSON data
    let editedData = null;   // Store the edited JSON data

    jsonFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    originalData = JSON.parse(e.target.result);
                    // displayFormattedJSON(originalData, jsonDisplay);
                    editedData = deepClone(originalData); // Create a deep copy for editing
                    renderFilteredJSON();
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    });

    function renderFilteredJSON() {
        const filterText = filterInput.value.trim();
        jsonDisplay.innerHTML = ""; // Clear the display

        if (!filterText) {
            // If no filter is provided, display the entire JSON
            displayFormattedJSON(originalData, jsonDisplay);
        } else {
            // Filter the JSON data and display matching sections
            const filteredData = findMatchingSections(originalData, filterText);
            displayFormattedJSON(filteredData, jsonDisplay);
        }
    }

    function findMatchingSections(data, filter) {
        const filterParts = filter.split(".");

        if (filterParts.length === 0) {
            return data;
        }

        const currentFilter = filterParts[0]; // Get the current filter part
        const remainingFilter = filterParts.slice(1).join("."); // Get the remaining filter parts

        if (typeof data === "object" && data !== null) {
            const result = {};

            for (const key in data) {
                const value = data[key];

                if (key.startsWith(currentFilter)) {
                    if (remainingFilter && typeof value === "object") {
                        const nestedResult = findMatchingSections(value, remainingFilter);
                        if (Object.keys(nestedResult).length > 0) {
                            result[key] = nestedResult;
                        }
                    } else if (!remainingFilter) {
                        // If no remaining filter, add the entire section
                        result[key] = value;
                    }
                }
            }

            return result;
        }
        return null;
    }

    function valueIncludesFilter(value, filter) {
        // Check if a value (string, array, or object) includes the filter text
        if (value === null) {
            return false;
        }
        if (typeof value === "string" && value.includes(filter)) {
            return true;
        } else if (Array.isArray(value)) {
            return value.some((item) => valueIncludesFilter(item, filter));
        } else if (typeof value === "object") {
            return Object.values(value).some((v) => valueIncludesFilter(v, filter));
        }
        return false;
    }

    function displayFormattedJSON(data, container, level = 1, path = "") {
        if (typeof data === "object" && data !== null) {
            const keys = Object.keys(data);
            keys.forEach((key) => {
                const value = data[key];
                const element = document.createElement("div");
                container.appendChild(element);
                
                var keyHeading;
                if (level < 3) {
                    keyHeading = document.createElement(`h${level}`);
                } else {
                    keyHeading = document.createElement("span");
                }
                    keyHeading.className = "json-key";
                    keyHeading.textContent = `${path ? path + "." : ""}${key}: `;
                    element.appendChild(keyHeading);
                if (value === null) {
                    const textInput = document.createElement("input");
                    textInput.type = "text";
                    textInput.value = "null";
                    textInput.setAttribute("data-field-path", `${path}.${key}`);
                    element.appendChild(textInput);
                } else if (typeof value === "object") {
                    displayFormattedJSON(value, element, level + 1, `${path ? path + "." : ""}${key}`);
                } else if (Array.isArray(value)) {
                    const textInput = document.createElement("input");
                    textInput.type = "text";
                    textInput.value = value.join(", ");
                    textInput.setAttribute("data-field-path", `${path}.${key}`);
                    element.appendChild(textInput);
                } else {
                    const textInput = document.createElement("input");
                    textInput.type = "text";
                    textInput.value = value;
                    textInput.setAttribute("data-field-path", `${path}.${key}`);
                    element.appendChild(textInput);
                }
            });

            const textInputs = container.querySelectorAll("input[type='text']");
            textInputs.forEach((input) => {
                input.addEventListener("input", () => {
                    const fieldPath = input.getAttribute("data-field-path");
                    const newValue = input.value;
                    setEditedValue(editedData, fieldPath, newValue);
                });
            });
        }

        // Add an event listener to text input fields for editing
        const textInputs = container.querySelectorAll("input[type='text']");
        textInputs.forEach((input) => {
            input.addEventListener("input", () => {
                const fieldPath = input.getAttribute("data-field-path");
                const newValue = input.value;
                setEditedValue(editedData, fieldPath, newValue);
            });
        });
    }

    function setEditedValue(data, fieldPath, newValue) {
        // Function to set edited values in the editedData object
        const pathParts = fieldPath.split(".");
        let currentObj = data;
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentObj = currentObj[pathParts[i]];
        }
        currentObj[pathParts[pathParts.length - 1]] = newValue;
    }

    function deepClone(obj) {
        // Deep clone a JavaScript object
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        if (Array.isArray(obj)) {
            const cloneArr = [];
            for (const item of obj) {
                cloneArr.push(deepClone(item));
            }
            return cloneArr;
        }
        const cloneObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloneObj[key] = deepClone(obj[key]);
            }
        }
        return cloneObj;
    }

    saveButton.addEventListener("click", () => {
        // When the save button is clicked, convert the editedData to JSON
        const editedDataJSON = JSON.stringify(editedData, null, 2);

        // Create a Blob object and create a URL for it
        const blob = new Blob([editedDataJSON], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create a temporary <a> element to trigger the download
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "edited-json.json";

        // Trigger a click event to initiate the download
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    filterInput.addEventListener("input", () => {
        renderFilteredJSON();
    });
});
