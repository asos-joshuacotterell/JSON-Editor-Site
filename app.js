const getStoredTheme = () => localStorage.getItem('theme')
const setStoredTheme = theme => localStorage.setItem('theme', theme)

document.addEventListener('keyup', e => {
  if (e.ctrlKey && e.key === '/') {
    document.querySelector('#filterInput').focus()
  }
})

document.addEventListener("DOMContentLoaded", () => {

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
          return storedTheme
        }
    
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    
      function setTheme() {
        const theme = getPreferredTheme();
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else {
          document.documentElement.setAttribute('data-bs-theme', theme)
        }
      }
    
    setTheme()

    const jsonFileInput = document.getElementById("jsonFileInput");
    const jsonEditor = document.getElementById("jsonEditor");
    const jsonDisplay = document.getElementById("jsonDisplay");
    const saveButton = document.getElementById("saveButton");
    const filterInput = document.getElementById("filterInput");
    
    let originalData = null; // Store the original JSON data
    let editedData = null;   // Store the edited JSON data
    let originalFilename = null; // Store the original filename

    
    const filterOptionMatchExact = document.getElementById("filterOptionMatchExact");
    document.getElementById("filterOptionMatchExactBtn").onclick = () => {
        filterOptionMatchExact.click();
    };
    
    const shouldFilterExactMatch = () => document.querySelector('#filterOptionMatchExact').checked;
    
    filterOptionMatchExact.addEventListener("change", () => {
        renderFilteredJSON();
    });
    
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'e') {
          e.preventDefault()
          filterOptionMatchExact.click();
        }
    });
   

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'f') {
          e.preventDefault()
          jsonFileInput.click();
        }
    });
    
    hideJsonEditor();

    jsonFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            originalFilename = file.name; // Store the original filename
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    originalData = JSON.parse(e.target.result);
                    showJsonEditor();
                    editedData = deepClone(originalData); // Create a deep copy for editing
                    renderFilteredJSON();
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    });

    function hideJsonEditor() {
        jsonEditor.style.display = "none";
    };

    function showJsonEditor() {
        jsonEditor.style.display = "block";
    };

    function renderFilteredJSON() {
        const filterText = filterInput.value.trim();
        jsonDisplay.innerHTML = ""; // Clear the display

        if (!filterText) {
            displayFormattedJSON(originalData, jsonDisplay);
        } else {
            const filteredData = findMatchingSections(originalData, filterText);
            displayFormattedJSON(filteredData, jsonDisplay);
        }
    }

    function findMatchingSections(data, filter) {
        const filterParts = filter.split(".");
        let currentData = data;

        for (const filterPart of filterParts) {
            currentData = findMatchingSection(currentData, filterPart);
            if (currentData === null) {
                return null;
            }
        }

        return currentData;
    }

    function findMatchingSection(data, filter) {
        if (typeof data === "object" && data !== null) {
            const result = {};
            for (const key in data) {
                const value = data[key];
                const keyIsFilter = key.toLowerCase() === filter.toLowerCase();
                const keyIncludesFilter = key.toLowerCase().includes(filter.toLowerCase());
                if (keyIsFilter || (keyIncludesFilter && !shouldFilterExactMatch())) {
                    result[key] = value;
                } else if (typeof value === "object") {
                    const nestedResult = findMatchingSection(value, filter);
                    if (nestedResult !== null && Object.keys(nestedResult).length > 0) {
                        result[key] = nestedResult;
                    }
                }
            }
            return Object.keys(result).length > 0 ? result : null;
        }
        return null;
    }

    function displayFormattedJSON(data, container, level = 1, path = "") {
        if (typeof data === "object" && data !== null) {
            const keys = Object.keys(data);
            keys.forEach((key) => {
                const value = data[key];
                const element = document.createElement("div");
                container.appendChild(element);
                if (level < 3) {
                    const keyHeading = document.createElement(level < 3 ? `h${level}` : "span");
                    keyHeading.className = "json-key";
                    keyHeading.textContent = `${path ? path + "." : ""}${key}`;
                    element.appendChild(keyHeading);
                }
                if (level == 2) {
                    const hr = document.createElement("hr");
                    element.appendChild(hr);
                }
                if (value === null) {
                    element.appendChild(createInputContainer(`${path}.${key}`, "null"));
                } else if (typeof value === "object") {
                    displayFormattedJSON(value, element, level + 1, `${path ? path + "." : ""}${key}`);
                } else if (typeof value === "boolean") {
                    element.appendChild(createBooleanInput(`${path}.${key}`, Boolean(value)));
                } else {
                    element.appendChild(createInputContainer(`${path}.${key}`, value));
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

        function createInputContainer(label, value) {
            const inputLabel = document.createElement("span");
            inputLabel.className = "input-group-text";
            inputLabel.id = "basic-addon3";
            inputLabel.textContent = label;

            const textInput = document.createElement("input");
            textInput.type = typeof value;
            textInput.value = value;
            textInput.className = "form-control";
            textInput.setAttribute("data-field-path", label);

            // Create input div 
            const inputDiv = document.createElement("div");
            inputDiv.className = "input-group";
            inputDiv.appendChild(inputLabel);
            inputDiv.appendChild(textInput);
            
            // Create outer div
            const div = document.createElement("div");
            div.className = "mb-3";
            div.appendChild(inputDiv);
            return div;
        }

        function createBooleanInput(label, value) {
            const inputLabel = document.createElement("label");
            inputLabel.textContent = label;
            inputLabel.className = "form-check-label";

            const input = document.createElement("input");
            input.className = "form-check-input";
            input.type = "checkbox";
            input.checked = value;
            input.querySelector.checked = value;
            input.value = value;
            input.setAttribute("data-field-path", label);

            const div = document.createElement("div");
            div.className = "form-check form-switch";
            div.appendChild(inputLabel);
            div.appendChild(input);
            
            return div;
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
        a.download = originalFilename;

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
