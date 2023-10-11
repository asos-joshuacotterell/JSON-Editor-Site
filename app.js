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
    const jsonDisplay = document.getElementById("jsonDisplay");
    const saveButton = document.getElementById("saveButton");
    const filterInput = document.getElementById("filterInput");
    const filterDataList = document.getElementById("filterDataList");
    
    let originalData = null;
    let editedData = null;
    let originalFilename = null;

    const filterOptionMatchExact = document.getElementById("filterOptionMatchExact");
    document.getElementById("filterOptionMatchExactBtn").onclick = () => {
        filterOptionMatchExact.click();
    };
    
    const shouldFilterExactMatch = () => document.querySelector('#filterOptionMatchExact').checked;
    
    filterOptionMatchExact.addEventListener("change", () => {
        renderFilteredJSON();
    });

    filterInput.addEventListener("input", () => {
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
    
    jsonFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            originalFilename = file.name; // Store the original filename
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    originalData = JSON.parse(e.target.result);
                    editedData = deepClone(originalData); // Create a deep copy for editing
                    appendFilterSuggestions();
                    renderFilteredJSON();
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    });

    function appendFilterSuggestions() {
        const options = Object.keys(originalData).map(key => {
            return `<option value="${key}">${key}</option>`;
        }).join('');
        filterDataList.innerHTML = options;
    }

    function renderFilteredJSON() {
        const filterText = filterInput.value.trim();
        jsonDisplay.innerHTML = "";

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

                (level < 3) ? element.append(createHeading(`h${level}`, `${path ? path + "." : ""}${key}`)) : {};
                (level == 2) ? element.appendChild(document.createElement("hr")) : {};

                if (typeof value === "object") {
                    displayFormattedJSON(value, element, level + 1, `${path ? path + "." : ""}${key}`);
                } else if (typeof value === "boolean") {
                    element.appendChild(createBooleanInput(`${path}.${key}`, Boolean(value)));
                } else {
                    element.appendChild(createInputContainer(`${path}.${key}`, value));
                }
            });
        }
    }

    function createHeading(sizedHeader, value) {
        const keyHeading = document.createElement(sizedHeader);
        keyHeading.className = "json-key";
        keyHeading.textContent = value;
        return keyHeading;
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
        textInput.addEventListener("input", () => {
            const fieldPath = textInput.getAttribute("data-field-path");
            const newValue = (typeof value === "number") ? Number(textInput.value) : textInput.value;
            setEditedValue(editedData, fieldPath, newValue);
        });

        const inputDiv = document.createElement("div");
        inputDiv.className = "input-group";
        inputDiv.appendChild(inputLabel);
        inputDiv.appendChild(textInput);
        
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
        input.value = value;
        input.addEventListener("change", () => {
            const fieldPath = input.getAttribute("data-field-path");
            const newValue = input.checked;
            setEditedValue(editedData, fieldPath, newValue);
        });
        input.setAttribute("data-field-path", label);

        const div = document.createElement("div");
        div.className = "form-check form-switch";
        div.appendChild(inputLabel);
        div.appendChild(input);
        
        return div;
    }

    function setEditedValue(data, fieldPath, newValue) {
        const pathParts = fieldPath.split(".");
        let currentObj = data;
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentObj = currentObj[pathParts[i]];
        }
        console.log(`Setting ${pathParts[pathParts.length - 1]} to ${newValue}.`);
        currentObj[pathParts[pathParts.length - 1]] = newValue;
    }

    function deepClone(obj) {
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
        const editedDataJSON = JSON.stringify(editedData, null, 2);

        const blob = new Blob([editedDataJSON], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = originalFilename;
        a.click();
        URL.revokeObjectURL(url);
    });
});
