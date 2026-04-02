(function () {
    const DEFAULT_PRICING_MODE = "latest_price";
    const RECIPE_UNIT_OPTIONS = ["g", "kg", "oz", "lb", "ml", "l", "fl oz", "each", "portion"];
    const PACKAGE_BASE_UNIT_OPTIONS = ["g", "ml", "each"];
    const UNIT_TYPE_MAP = {
        g: "weight",
        kg: "weight",
        oz: "weight",
        lb: "weight",
        ml: "volume",
        l: "volume",
        "fl oz": "volume",
        each: "count",
        portion: "count",
        pack: "package",
        box: "package",
        case: "package",
        carton: "package",
        bottle: "package",
        can: "package",
        bag: "package",
        jar: "package"
    };
    const BASE_UNIT_BY_TYPE = {
        weight: "g",
        volume: "ml",
        count: "each"
    };
    const UNIT_ALIASES = {
        g: "g",
        gram: "g",
        grams: "g",
        oz: "oz",
        ounce: "oz",
        ounces: "oz",
        kg: "kg",
        kilogram: "kg",
        kilograms: "kg",
        lb: "lb",
        lbs: "lb",
        pound: "lb",
        pounds: "lb",
        ml: "ml",
        milliliter: "ml",
        milliliters: "ml",
        "fl oz": "fl oz",
        "fl. oz": "fl oz",
        floz: "fl oz",
        "fluid ounce": "fl oz",
        "fluid ounces": "fl oz",
        l: "l",
        lt: "l",
        liter: "l",
        liters: "l",
        each: "each",
        ea: "each",
        piece: "each",
        pieces: "each",
        pc: "each",
        pcs: "each",
        portion: "portion",
        portions: "portion",
        package: "pack",
        packages: "pack",
        pack: "pack",
        packs: "pack",
        box: "box",
        boxes: "box",
        case: "case",
        cases: "case",
        carton: "carton",
        cartons: "carton",
        bottle: "bottle",
        bottles: "bottle",
        can: "can",
        cans: "can",
        bag: "bag",
        bags: "bag",
        jar: "jar",
        jars: "jar"
    };
    const UNIT_FACTORS = {
        g: { type: "weight", factor: 1 },
        oz: { type: "weight", factor: 28.3495 },
        kg: { type: "weight", factor: 1000 },
        lb: { type: "weight", factor: 453.592 },
        ml: { type: "volume", factor: 1 },
        "fl oz": { type: "volume", factor: 29.5735 },
        l: { type: "volume", factor: 1000 },
        each: { type: "count", factor: 1 },
        portion: { type: "count", factor: 1 }
    };

    function getElements() {
        return {
            mainDashboardView: document.getElementById("mainDashboardView"),
            recipesWorkspaceState: document.getElementById("recipesWorkspaceState"),
            recipesPanel: document.getElementById("recipesPanel"),
            recipesShell: document.getElementById("recipesShell"),
            recipesList: document.getElementById("recipesList"),
            recipesEmpty: document.getElementById("recipesEmpty"),
            recipesSidebarActions: document.getElementById("recipesSidebarActions"),
            newRecipeButton: document.getElementById("newRecipeButton"),
            recipeEditorTitle: document.getElementById("recipeEditorTitle"),
            recipeNameInput: document.getElementById("recipeNameInput"),
            recipeYieldInput: document.getElementById("recipeYieldInput"),
            recipePricingModeSelect: document.getElementById("recipePricingModeSelect"),
            addRecipeIngredientButton: document.getElementById("addRecipeIngredientButton"),
            recipeIngredientsList: document.getElementById("recipeIngredientsList"),
            recalculateRecipeButton: document.getElementById("recalculateRecipeButton"),
            deleteRecipeButton: document.getElementById("deleteRecipeButton"),
            saveRecipeButton: document.getElementById("saveRecipeButton"),
            recipeDeleteConfirm: document.getElementById("recipeDeleteConfirm"),
            cancelDeleteRecipeButton: document.getElementById("cancelDeleteRecipeButton"),
            confirmDeleteRecipeButton: document.getElementById("confirmDeleteRecipeButton"),
            recipeStatusMessage: document.getElementById("recipeStatusMessage"),
            recipeTotalCost: document.getElementById("recipeTotalCost"),
            recipeCostPerPortion: document.getElementById("recipeCostPerPortion"),
            recipeMainCostDriver: document.getElementById("recipeMainCostDriver"),
            recipeMainCostDriverCopy: document.getElementById("recipeMainCostDriverCopy"),
            recipePricingModeChip: document.getElementById("recipePricingModeChip"),
            recipeBreakdownList: document.getElementById("recipeBreakdownList"),
            openRecipeLibraryButton: document.getElementById("openRecipeLibraryButton"),
            createRecipeFromLibraryButton: document.getElementById("createRecipeFromLibraryButton"),
            openRecipeLibraryInlineButton: document.getElementById("openRecipeLibraryInlineButton"),
            recipeLibraryOverlay: document.getElementById("recipeLibraryOverlay"),
            closeRecipeLibraryButton: document.getElementById("closeRecipeLibraryButton"),
            recipeLibrarySearchInput: document.getElementById("recipeLibrarySearchInput"),
            recipeLibrarySortSelect: document.getElementById("recipeLibrarySortSelect"),
            recipeLibraryList: document.getElementById("recipeLibraryList")
        };
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatCurrency(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function hasAnalysis(elements) {
        const stateHost = elements.mainDashboardView || elements.recipesWorkspaceState;
        return stateHost?.dataset.hasAnalysis === "true";
    }

    function normalizeUnit(unit) {
        const normalizedUnit = String(unit || "").trim();
        return UNIT_ALIASES[normalizedUnit.toLowerCase()] || normalizedUnit;
    }

    function getUnitType(unit) {
        return UNIT_TYPE_MAP[normalizeUnit(unit)] || "";
    }

    function isPackageUnit(unit) {
        return getUnitType(unit) === "package";
    }

    function getBaseUnitForType(unitType) {
        return BASE_UNIT_BY_TYPE[unitType] || "";
    }

    function getPackageConversionKey(productName, purchaseUnit) {
        const normalizedProductName = String(productName || "").trim().toLowerCase();
        const normalizedPurchaseUnit = normalizeUnit(purchaseUnit);
        return `${normalizedProductName}::${normalizedPurchaseUnit}`;
    }

    function rememberPackageConversion(state, productName, purchaseUnit, purchaseSize, purchaseBaseUnit) {
        if (!state || !productName || !isPackageUnit(purchaseUnit) || Number(purchaseSize || 0) <= 0 || !purchaseBaseUnit) {
            return;
        }
        state.packageConversionMap.set(
            getPackageConversionKey(productName, purchaseUnit),
            {
                purchase_size: Number(purchaseSize),
                purchase_base_unit: normalizeUnit(purchaseBaseUnit)
            }
        );
    }

    function getRememberedPackageConversion(state, productName, purchaseUnit) {
        if (!state || !productName || !isPackageUnit(purchaseUnit)) {
            return null;
        }
        return state.packageConversionMap.get(getPackageConversionKey(productName, purchaseUnit)) || null;
    }

    function inferPurchaseSize(purchaseUnit, usageUnit) {
        const normalizedPurchaseUnit = normalizeUnit(purchaseUnit);
        const normalizedUsageUnit = normalizeUnit(usageUnit);
        if (!normalizedPurchaseUnit || !normalizedUsageUnit || normalizedPurchaseUnit === normalizedUsageUnit) {
            return 1;
        }
        if (isPackageUnit(normalizedPurchaseUnit)) {
            return 0;
        }
        const purchaseMeta = UNIT_FACTORS[normalizedPurchaseUnit];
        const usageMeta = UNIT_FACTORS[normalizedUsageUnit];
        if (purchaseMeta && usageMeta && purchaseMeta.type === usageMeta.type && usageMeta.factor > 0) {
            return purchaseMeta.factor / usageMeta.factor;
        }
        return 1;
    }

    function resolvePurchaseBaseUnit(purchaseUnit, usageUnit, fallbackBaseUnit = "") {
        const normalizedPurchaseUnit = normalizeUnit(purchaseUnit);
        const normalizedUsageUnit = normalizeUnit(usageUnit);
        const normalizedFallback = normalizeUnit(fallbackBaseUnit);
        if (isPackageUnit(normalizedPurchaseUnit)) {
            const fallbackType = getUnitType(normalizedFallback);
            if (fallbackType && fallbackType !== "package") {
                return getBaseUnitForType(fallbackType) || normalizedFallback;
            }
            const usageType = getUnitType(normalizedUsageUnit);
            if (usageType && usageType !== "package") {
                return getBaseUnitForType(usageType) || normalizedUsageUnit;
            }
            return "each";
        }
        const purchaseType = getUnitType(normalizedPurchaseUnit);
        if (purchaseType === "package") {
            return "each";
        }
        return getBaseUnitForType(purchaseType) || normalizedPurchaseUnit || normalizedFallback || "";
    }

    function hasUnitTypeMismatch(ingredient) {
        const usageType = getUnitType(ingredient?.unit);
        const purchaseType = getUnitType(ingredient?.purchase_unit);
        const purchaseBaseType = getUnitType(ingredient?.purchase_base_unit);
        if (!usageType || !purchaseType) {
            return false;
        }
        if (purchaseType === "package") {
            return !purchaseBaseType || purchaseBaseType === "package" || usageType !== purchaseBaseType;
        }
        return usageType !== purchaseType;
    }

    function createEmptyIngredient() {
        return {
            product_name: "",
            quantity: "",
            unit: "",
            purchase_unit: "",
            purchase_size: 1,
            purchase_base_unit: ""
        };
    }

    function createEmptyRecipe() {
        return {
            recipe_id: null,
            name: "",
            yield_portions: 1,
            pricing_mode: DEFAULT_PRICING_MODE,
            ingredients: [createEmptyIngredient()]
        };
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeIngredientDraft(ingredient = {}, state = null) {
        const productName = String(ingredient.product_name || "").trim();
        const sourcePurchaseUnit = state ? getSourcePurchaseUnitForProduct(state, productName) : "";
        const purchaseUnit = normalizeUnit(sourcePurchaseUnit || ingredient.purchase_unit || ingredient.unit || "");
        const storedBaseUnit = normalizeUnit(ingredient.purchase_base_unit || ingredient.conversion_unit || "");
        const rememberedConversion = getRememberedPackageConversion(state, productName, purchaseUnit);
        const purchaseBaseUnit = resolvePurchaseBaseUnit(
            purchaseUnit,
            ingredient.unit || storedBaseUnit || purchaseUnit,
            rememberedConversion?.purchase_base_unit || storedBaseUnit
        );
        const purchaseType = getUnitType(purchaseUnit);
        const defaultUsageUnit = purchaseType === "package"
            ? (purchaseBaseUnit || "each")
            : purchaseUnit;
        const candidateUsageUnit = normalizeUnit(ingredient.unit || defaultUsageUnit || "");
        const usageUnit = getUnitType(candidateUsageUnit) === "package"
            ? normalizeUnit(defaultUsageUnit || purchaseBaseUnit || "each")
            : candidateUsageUnit;
        const purchaseSize = Number(
            ingredient.purchase_size
            || rememberedConversion?.purchase_size
            || 0
        );
        const normalizedIngredient = {
            product_name: productName,
            quantity: ingredient.quantity === 0 ? 0 : (ingredient.quantity || ""),
            unit: usageUnit,
            purchase_unit: purchaseUnit,
            purchase_size: purchaseSize > 0
                ? purchaseSize
                : inferPurchaseSize(purchaseUnit, purchaseBaseUnit || usageUnit),
            purchase_base_unit: purchaseBaseUnit || resolvePurchaseBaseUnit(purchaseUnit, usageUnit)
        };
        rememberPackageConversion(
            state,
            normalizedIngredient.product_name,
            normalizedIngredient.purchase_unit,
            normalizedIngredient.purchase_size,
            normalizedIngredient.purchase_base_unit
        );
        return normalizedIngredient;
    }

    function normalizeRecipeDraft(recipe, state) {
        const normalizedRecipe = clone(recipe || createEmptyRecipe());
        normalizedRecipe.recipe_id = normalizedRecipe.recipe_id || null;
        normalizedRecipe.name = String(normalizedRecipe.name || "");
        normalizedRecipe.yield_portions = normalizedRecipe.yield_portions || 1;
        normalizedRecipe.pricing_mode = normalizedRecipe.pricing_mode || DEFAULT_PRICING_MODE;
        normalizedRecipe.ingredients = Array.isArray(normalizedRecipe.ingredients) && normalizedRecipe.ingredients.length
            ? normalizedRecipe.ingredients.map((ingredient) => normalizeIngredientDraft(ingredient, state))
            : [createEmptyIngredient()];
        return normalizedRecipe;
    }

    function createState() {
        return {
            products: [],
            productMap: new Map(),
            pricingModes: [],
            recipes: [],
            activeRecipeId: null,
            draft: createEmptyRecipe(),
            calculation: null,
            calculateTimer: null,
            isLoaded: false,
            deleteConfirmVisible: false,
            deleteTargetRecipeId: null,
            isDeleting: false,
            openProductDropdownIndex: null,
            packageConversionMap: new Map(),
            recipeLibraryOpen: false,
            recipeLibrarySearch: "",
            recipeLibrarySort: "newest"
        };
    }

    function syncProductMap(state) {
        state.productMap = new Map(state.products.map((product) => [product.product_name, product]));
    }

    function setStatus(elements, message = "", tone = "") {
        if (!elements.recipeStatusMessage) {
            return;
        }
        elements.recipeStatusMessage.hidden = !message;
        elements.recipeStatusMessage.className = `recipe-status${tone ? ` is-${tone}` : ""}`;
        elements.recipeStatusMessage.textContent = message;
    }

    function resetCalculationView(elements) {
        if (elements.recipeTotalCost) elements.recipeTotalCost.textContent = "$0.00";
        if (elements.recipeCostPerPortion) elements.recipeCostPerPortion.textContent = "$0.00";
        if (elements.recipeMainCostDriver) elements.recipeMainCostDriver.textContent = "No recipe yet";
        if (elements.recipeMainCostDriverCopy) {
            elements.recipeMainCostDriverCopy.textContent = "The ingredient driving the largest share of recipe cost will appear here.";
        }
        if (elements.recipePricingModeChip) elements.recipePricingModeChip.textContent = "Choose a pricing mode";
        if (elements.recipeBreakdownList) {
            elements.recipeBreakdownList.innerHTML = '<div class="decision-list-empty">Add ingredients and choose a pricing mode to see the recipe cost breakdown.</div>';
        }
    }

    function renderPricingModes(elements, state) {
        if (!elements.recipePricingModeSelect) {
            return;
        }
        elements.recipePricingModeSelect.innerHTML = state.pricingModes.map((mode) => `
            <option value="${escapeHtml(mode.value)}">${escapeHtml(mode.label)}</option>
        `).join("");
        elements.recipePricingModeSelect.value = state.draft.pricing_mode || DEFAULT_PRICING_MODE;
    }

    function getUnitsForProduct(state, productName) {
        return state.productMap.get(productName)?.units || [];
    }

    function getSourcePurchaseUnitForProduct(state, productName) {
        const product = state.productMap.get(productName);
        return normalizeUnit(product?.purchase_unit || product?.units?.[0] || "");
    }

    function clearIngredientProductSelection(state, index) {
        if (!state.draft.ingredients[index]) {
            return;
        }
        state.draft.ingredients[index].product_name = "";
        state.draft.ingredients[index].unit = "";
        state.draft.ingredients[index].purchase_unit = "";
        state.draft.ingredients[index].purchase_size = 1;
        state.draft.ingredients[index].purchase_base_unit = "";
        state.openProductDropdownIndex = null;
    }

    function getFilteredProducts(state, query) {
        const normalizedQuery = String(query || "").trim().toLowerCase();
        const products = Array.isArray(state.products) ? state.products : [];
        if (!normalizedQuery) {
            return products.slice(0, 80);
        }
        return products.filter((product) => (
            String(product.product_name || "").toLowerCase().includes(normalizedQuery)
        )).slice(0, 80);
    }

    function formatRecipeUpdatedAt(value) {
        if (!value) {
            return "Not saved yet";
        }
        try {
            return new Date(value).toLocaleDateString("en-US");
        } catch (error) {
            return "Not saved yet";
        }
    }

    function getSortedRecipes(recipes, sortMode = "newest") {
        return [...(recipes || [])].sort((leftRecipe, rightRecipe) => {
            if (sortMode === "name_asc") {
                return String(leftRecipe.name || "").localeCompare(String(rightRecipe.name || ""));
            }
            if (sortMode === "oldest") {
                return new Date(leftRecipe.updated_at || 0).getTime() - new Date(rightRecipe.updated_at || 0).getTime();
            }
            if (sortMode === "cost_desc") {
                return Number(rightRecipe.cost_per_portion || 0) - Number(leftRecipe.cost_per_portion || 0);
            }
            if (sortMode === "cost_asc") {
                return Number(leftRecipe.cost_per_portion || 0) - Number(rightRecipe.cost_per_portion || 0);
            }
            return new Date(rightRecipe.updated_at || 0).getTime() - new Date(leftRecipe.updated_at || 0).getTime();
        });
    }

    function getLibraryRecipes(state) {
        const query = String(state.recipeLibrarySearch || "").trim().toLowerCase();
        const recipes = query
            ? state.recipes.filter((recipe) => String(recipe.name || "").toLowerCase().includes(query))
            : state.recipes;
        return getSortedRecipes(recipes, state.recipeLibrarySort);
    }

    function renderIngredients(elements, state) {
        if (!elements.recipeIngredientsList) {
            return;
        }

        elements.recipeIngredientsList.innerHTML = state.draft.ingredients.map((ingredient, index) => {
            const normalizedIngredient = normalizeIngredientDraft(ingredient, state);
            state.draft.ingredients[index] = normalizedIngredient;
            const productResults = getFilteredProducts(state, normalizedIngredient.product_name);
            const productOptions = productResults
                .map((product) => `
                    <button
                        type="button"
                        class="recipe-product-option"
                        data-select-product="${escapeHtml(product.product_name)}"
                        data-index="${index}"
                    >${escapeHtml(product.product_name)}</button>
                `)
                .join("");
            const productDropdownOpen = state.openProductDropdownIndex === index;
            const purchaseUnitType = getUnitType(normalizedIngredient.purchase_unit);
            const purchaseBaseUnit = resolvePurchaseBaseUnit(
                normalizedIngredient.purchase_unit,
                normalizedIngredient.unit,
                normalizedIngredient.purchase_base_unit
            );
            normalizedIngredient.purchase_base_unit = purchaseBaseUnit;
            const hasMismatch = hasUnitTypeMismatch(normalizedIngredient);
            const availableUnits = Array.from(new Set([
                normalizedIngredient.unit,
                ...RECIPE_UNIT_OPTIONS
            ].filter(Boolean)));
            const unitOptions = [
                '<option value="">Usage unit</option>',
                ...availableUnits.map((unit) => `<option value="${escapeHtml(unit)}" ${unit === normalizedIngredient.unit ? "selected" : ""}>${escapeHtml(unit)}</option>`)
            ].join("");
            const packageBaseUnits = Array.from(new Set([
                purchaseBaseUnit,
                ...PACKAGE_BASE_UNIT_OPTIONS
            ].filter(Boolean)));
            const packageBaseOptions = packageBaseUnits
                .map((unit) => `<option value="${escapeHtml(unit)}" ${unit === purchaseBaseUnit ? "selected" : ""}>${escapeHtml(unit)}</option>`)
                .join("");
            const showConversionBasis = Boolean(
                normalizedIngredient.product_name
                && normalizedIngredient.purchase_unit
                && normalizedIngredient.unit
                && normalizedIngredient.purchase_unit !== normalizedIngredient.unit
            );

            return `
                <div class="recipe-ingredient-row recipe-ingredient-grid${productDropdownOpen ? " is-product-open" : ""}" data-index="${index}">
                    <label class="recipe-field recipe-ingredient-cell">
                        <span class="recipe-field-label">Product Name</span>
                        <div class="recipe-product-picker-wrap">
                            <input
                                type="text"
                                class="recipe-input recipe-product-search-input${normalizedIngredient.product_name ? " has-clear-action" : ""}"
                                data-field="product_name"
                                data-index="${index}"
                                value="${escapeHtml(normalizedIngredient.product_name)}"
                                placeholder="Search product"
                                autocomplete="off"
                                aria-expanded="${productDropdownOpen ? "true" : "false"}"
                            >
                            ${normalizedIngredient.product_name ? `
                                <button
                                    type="button"
                                    class="recipe-product-clear-btn"
                                    data-clear-product="${index}"
                                    aria-label="Clear selected product"
                                >x</button>
                            ` : ""}
                            ${productDropdownOpen ? `
                                <div class="recipe-product-dropdown" data-product-dropdown="${index}">
                                    ${productOptions || '<div class="recipe-product-option-empty">No matching products</div>'}
                                </div>
                            ` : ""}
                        </div>
                        <div class="recipe-purchase-meta">Bought as: 1 ${escapeHtml(normalizedIngredient.purchase_unit || "purchase unit")}</div>
                    </label>
                    <label class="recipe-field recipe-ingredient-cell">
                        <span class="recipe-field-label">Usage Qty</span>
                        <input type="number" min="0" step="0.01" class="recipe-input" data-field="quantity" data-index="${index}" value="${escapeHtml(normalizedIngredient.quantity)}" placeholder="0.00">
                    </label>
                    <label class="recipe-field recipe-ingredient-cell">
                        <span class="recipe-field-label">Recipe Unit</span>
                        <select class="recipe-select" data-field="unit" data-index="${index}" ${normalizedIngredient.product_name ? "" : "disabled"}>
                            ${unitOptions}
                        </select>
                        ${showConversionBasis ? `
                            <div class="recipe-conversion-row">
                                <span class="recipe-conversion-copy">1 ${escapeHtml(normalizedIngredient.purchase_unit || "unit")}</span>
                                <span class="recipe-conversion-copy">=</span>
                                <input
                                    type="number"
                                    min="0.0001"
                                    step="0.01"
                                    class="recipe-input recipe-conversion-input"
                                    data-field="purchase_size"
                                    data-index="${index}"
                                    value="${escapeHtml(normalizedIngredient.purchase_size)}"
                                    placeholder="0"
                                    ${purchaseUnitType === "package" ? "" : "disabled"}
                                >
                                ${purchaseUnitType === "package" ? `
                                    <select class="recipe-select recipe-conversion-unit-select" data-field="purchase_base_unit" data-index="${index}">
                                        ${packageBaseOptions}
                                    </select>
                                ` : `
                                    <span class="recipe-conversion-copy is-target-unit">${escapeHtml(purchaseBaseUnit || normalizedIngredient.unit || "unit")}</span>
                                `}
                                <span
                                    class="recipe-conversion-info"
                                    tabindex="0"
                                    data-tooltip="Convert purchase unit to recipe usage unit"
                                    aria-label="Convert purchase unit to recipe usage unit"
                                >i</span>
                            </div>
                        ` : ""}
                        ${hasMismatch ? `
                            <div class="recipe-unit-warning">Selected unit type does not match product type.</div>
                        ` : ""}
                    </label>
                    <div class="recipe-ingredient-action">
                        <button type="button" class="recipe-remove-btn" data-remove-ingredient="${index}" aria-label="Remove ingredient">Remove</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderRecipeList(elements, state) {
        if (!elements.recipesList || !elements.recipesEmpty) {
            return;
        }

        if (!state.recipes.length) {
            elements.recipesList.innerHTML = "";
            elements.recipesEmpty.hidden = false;
            if (elements.openRecipeLibraryInlineButton) {
                elements.openRecipeLibraryInlineButton.hidden = true;
            }
            return;
        }

        elements.recipesEmpty.hidden = true;
        if (elements.openRecipeLibraryInlineButton) {
            elements.openRecipeLibraryInlineButton.hidden = false;
        }
        elements.recipesList.innerHTML = getSortedRecipes(state.recipes, "newest").slice(0, 5).map((recipe) => {
            const isActive = recipe.recipe_id === state.activeRecipeId;
            const updatedLabel = formatRecipeUpdatedAt(recipe.updated_at);
            return `
                <div class="recipe-list-item-shell ${isActive ? "is-active" : ""}">
                    <button type="button" class="recipe-list-item" data-open-recipe="${escapeHtml(recipe.recipe_id)}">
                        <span class="recipe-list-name">${escapeHtml(recipe.name)}</span>
                        <span class="recipe-list-meta">${Number(recipe.yield_portions || 0)} portion${Number(recipe.yield_portions || 0) === 1 ? "" : "s"} | Updated ${escapeHtml(updatedLabel)}</span>
                    </button>
                    <button type="button" class="recipe-list-delete-btn" data-delete-recipe="${escapeHtml(recipe.recipe_id)}" aria-label="Delete ${escapeHtml(recipe.name)} recipe">x</button>
                </div>
                ${state.deleteConfirmVisible && state.deleteTargetRecipeId === recipe.recipe_id ? `
                    <div class="recipe-delete-confirm recipe-delete-confirm-sidebar">
                        <div class="recipe-delete-confirm-copy">
                            <strong>Delete this recipe?</strong>
                            <span>This action cannot be undone.</span>
                        </div>
                        <div class="recipe-delete-confirm-actions">
                            <button type="button" class="secondary-btn" data-cancel-recipe-delete>Cancel</button>
                            <button type="button" class="action-btn" data-confirm-recipe-delete="${escapeHtml(recipe.recipe_id)}" ${state.isDeleting ? "disabled" : ""}>${state.isDeleting ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                ` : ""}
            `;
        }).join("");
    }

    function renderRecipeLibrary(elements, state) {
        if (!elements.recipeLibraryOverlay || !elements.recipeLibraryList) {
            return;
        }

        elements.recipeLibraryOverlay.hidden = !state.recipeLibraryOpen;
        if (!state.recipeLibraryOpen) {
            return;
        }

        if (elements.recipeLibrarySearchInput && document.activeElement !== elements.recipeLibrarySearchInput) {
            elements.recipeLibrarySearchInput.value = state.recipeLibrarySearch || "";
        }
        if (elements.recipeLibrarySortSelect) {
            elements.recipeLibrarySortSelect.value = state.recipeLibrarySort || "newest";
        }

        const recipes = getLibraryRecipes(state);
        elements.recipeLibraryList.innerHTML = recipes.length
            ? recipes.map((recipe) => {
                const isActive = recipe.recipe_id === state.activeRecipeId;
                const ingredientCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
                const previewIngredient = Array.isArray(recipe.ingredients) && recipe.ingredients.length
                    ? recipe.ingredients[0].product_name
                    : "No ingredients yet";
                const updatedLabel = formatRecipeUpdatedAt(recipe.updated_at);
                return `
                    <div class="recipes-library-row-shell ${isActive ? "is-active" : ""}">
                        <button type="button" class="recipes-library-row" data-open-library-recipe="${escapeHtml(recipe.recipe_id)}">
                            <div class="recipes-library-main-copy">
                                <div class="recipes-library-name">${escapeHtml(recipe.name || "Untitled recipe")}</div>
                                <div class="recipes-library-meta">Updated ${escapeHtml(updatedLabel)} | ${ingredientCount} ingredient${ingredientCount === 1 ? "" : "s"}</div>
                                <div class="recipes-library-preview">Quick preview: ${escapeHtml(previewIngredient)} | Last cost ${formatCurrency(recipe.total_recipe_cost || 0)}</div>
                            </div>
                            <div class="recipes-library-metrics">
                                <div class="recipes-library-metric">
                                    <span class="recipes-library-metric-label">Per Portion</span>
                                    <strong>${formatCurrency(recipe.cost_per_portion || 0)}</strong>
                                </div>
                                <div class="recipes-library-metric total">
                                    <span class="recipes-library-metric-label">Total Cost</span>
                                    <strong>${formatCurrency(recipe.total_recipe_cost || 0)}</strong>
                                </div>
                            </div>
                        </button>
                        <button type="button" class="secondary-btn recipes-library-open-btn" data-open-library-recipe="${escapeHtml(recipe.recipe_id)}">Open</button>
                        <button type="button" class="secondary-btn recipes-library-edit-btn" data-open-library-recipe="${escapeHtml(recipe.recipe_id)}">Edit</button>
                        <button type="button" class="recipe-list-delete-btn recipes-library-delete-btn" data-delete-recipe="${escapeHtml(recipe.recipe_id)}" aria-label="Delete ${escapeHtml(recipe.name || "recipe")}">x</button>
                    </div>
                    ${state.deleteConfirmVisible && state.deleteTargetRecipeId === recipe.recipe_id ? `
                        <div class="recipe-delete-confirm recipe-library-delete-confirm">
                            <div class="recipe-delete-confirm-copy">
                                <strong>Delete this recipe?</strong>
                                <span>This action cannot be undone.</span>
                            </div>
                            <div class="recipe-delete-confirm-actions">
                                <button type="button" class="secondary-btn" data-cancel-recipe-delete>Cancel</button>
                                <button type="button" class="action-btn" data-confirm-recipe-delete="${escapeHtml(recipe.recipe_id)}" ${state.isDeleting ? "disabled" : ""}>${state.isDeleting ? "Deleting..." : "Delete"}</button>
                            </div>
                        </div>
                    ` : ""}
                `;
            }).join("")
            : `
                <div class="recipes-library-empty-state">
                    <div class="recipes-library-empty-title">${state.recipes.length ? "No matching recipes" : "No recipes yet"}</div>
                    <div class="recipes-library-empty-copy">${state.recipes.length ? "Try a different recipe name or sort mode." : "Create your first recipe to start tracking costs."}</div>
                    ${state.recipes.length ? "" : '<button type="button" class="action-btn" id="recipeLibraryEmptyCreateButton">Create Recipe</button>'}
                </div>
            `;
    }

    function renderRecipeCollections(elements, state) {
        renderRecipeList(elements, state);
        renderRecipeLibrary(elements, state);
    }

    function renderEditor(elements, state) {
        if (!state.draft.ingredients.length) {
            state.draft.ingredients = [createEmptyIngredient()];
        }
        if (elements.recipeEditorTitle) {
            elements.recipeEditorTitle.textContent = state.activeRecipeId ? "Edit saved recipe" : "Create a recipe";
            elements.recipeEditorTitle.classList.toggle("is-editing", Boolean(state.activeRecipeId));
        }
        if (elements.recipeNameInput) elements.recipeNameInput.value = state.draft.name || "";
        if (elements.recipeYieldInput) elements.recipeYieldInput.value = state.draft.yield_portions || 1;
        renderPricingModes(elements, state);
        renderIngredients(elements, state);
        if (elements.saveRecipeButton) {
            elements.saveRecipeButton.textContent = state.activeRecipeId ? "Update Recipe" : "Save Recipe";
        }
    }

    function startNewRecipeDraft(elements, state, statusMessage = "Started a new recipe draft.") {
        state.activeRecipeId = null;
        state.deleteConfirmVisible = false;
        state.deleteTargetRecipeId = null;
        state.openProductDropdownIndex = null;
        state.draft = createEmptyRecipe();
        state.calculation = null;
        renderRecipeCollections(elements, state);
        renderEditor(elements, state);
        renderCalculation(elements, null);
        setStatus(elements, statusMessage, "info");
    }

    function renderCalculation(elements, calculation) {
        if (!calculation) {
            resetCalculationView(elements);
            return;
        }

        if (elements.recipeTotalCost) {
            elements.recipeTotalCost.textContent = formatCurrency(calculation.total_recipe_cost);
        }
        if (elements.recipeCostPerPortion) {
            elements.recipeCostPerPortion.textContent = formatCurrency(calculation.cost_per_portion);
        }
        if (elements.recipePricingModeChip) {
            elements.recipePricingModeChip.textContent = calculation.pricing_mode_label || "Pricing mode";
        }
        if (elements.recipeMainCostDriver) {
            elements.recipeMainCostDriver.textContent = calculation.main_cost_driver
                ? calculation.main_cost_driver.product_name
                : "No dominant ingredient";
        }
        if (elements.recipeMainCostDriverCopy) {
            elements.recipeMainCostDriverCopy.textContent = calculation.main_cost_driver
                ? `${calculation.main_cost_driver.product_name} is the main cost driver at ${formatCurrency(calculation.main_cost_driver.ingredient_cost)} using ${calculation.main_cost_driver.pricing_label}.`
                : "The ingredient driving the largest share of recipe cost will appear here.";
        }
        if (elements.recipeBreakdownList) {
            elements.recipeBreakdownList.innerHTML = (calculation.ingredient_breakdown || []).length
                ? calculation.ingredient_breakdown.map((item) => `
                    <article class="decision-item">
                        <div class="decision-item-rank supplier">${escapeHtml(item.unit)}</div>
                        <div class="decision-item-body">
                            <div class="decision-item-title">${escapeHtml(item.product_name)}</div>
                            <div class="decision-item-meta">${Number(item.quantity)} ${escapeHtml(item.unit)} = ${Number(item.usage_quantity_in_base_unit || 0).toFixed(4)} ${escapeHtml(item.purchase_base_unit || item.unit)} using ${Number(item.purchase_ratio || 0).toFixed(4)} ${escapeHtml(item.purchase_unit || item.unit)}.</div>
                            <div class="decision-item-meta">Basis: 1 ${escapeHtml(item.purchase_unit || item.unit)} = ${Number(item.purchase_size || 1)} ${escapeHtml(item.purchase_base_unit || item.unit)} | ${formatCurrency(item.price_used)} / ${escapeHtml(item.purchase_unit || item.unit)} | ${escapeHtml(item.pricing_label)} | Supplier: ${escapeHtml(item.supplier)}</div>
                        </div>
                        <div class="decision-item-value negative">${formatCurrency(item.ingredient_cost)}</div>
                    </article>
                `).join("")
                : '<div class="decision-list-empty">Add ingredients and choose a pricing mode to see the recipe cost breakdown.</div>';
        }
    }

    function getFilledIngredients(state) {
        return state.draft.ingredients
            .map((ingredient) => normalizeIngredientDraft(ingredient, state))
            .filter((ingredient) => ingredient.product_name || ingredient.unit || ingredient.purchase_unit || ingredient.quantity);
    }

    function buildPayload(state, { requireComplete = false } = {}) {
        const filledIngredients = getFilledIngredients(state);
        const mismatchedIngredient = filledIngredients.find((ingredient) => (
            ingredient.product_name
            && ingredient.unit
            && ingredient.purchase_unit
            && hasUnitTypeMismatch(ingredient)
        ));
        if (mismatchedIngredient) {
            throw new Error("Selected unit type does not match product type.");
        }
        const completeIngredients = filledIngredients.filter((ingredient) => (
            ingredient.product_name
            && ingredient.unit
            && ingredient.purchase_unit
            && ingredient.purchase_base_unit
            && !hasUnitTypeMismatch(ingredient)
            && Number(ingredient.quantity) > 0
            && Number(ingredient.purchase_size) > 0
        ));

        if (requireComplete && filledIngredients.length !== completeIngredients.length) {
            throw new Error("Complete each ingredient row before saving the recipe.");
        }

        if (!completeIngredients.length) {
            return null;
        }

        return {
            recipe_id: state.draft.recipe_id,
            name: String(state.draft.name || "").trim(),
            yield_portions: Number(state.draft.yield_portions || 0),
            pricing_mode: state.draft.pricing_mode || DEFAULT_PRICING_MODE,
            ingredients: completeIngredients.map((ingredient) => ({
                product_name: ingredient.product_name,
                quantity: Number(ingredient.quantity),
                unit: ingredient.unit,
                purchase_unit: ingredient.purchase_unit,
                purchase_size: Number(ingredient.purchase_size || 1),
                purchase_base_unit: ingredient.purchase_base_unit
            }))
        };
    }

    async function fetchJson(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {})
            },
            ...options
        });
        const data = await response.json();
        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "The recipe request could not be completed.");
        }
        return data;
    }

    async function loadBootstrap(elements, state) {
        if (!hasAnalysis(elements)) {
            state.products = [];
            syncProductMap(state);
            state.packageConversionMap = new Map();
            state.recipes = [];
            state.activeRecipeId = null;
            state.draft = createEmptyRecipe();
            state.calculation = null;
            renderRecipeCollections(elements, state);
            renderEditor(elements, state);
            resetCalculationView(elements);
            return;
        }

        const data = await fetchJson("/recipes/bootstrap");
        state.products = data.products || [];
        state.pricingModes = data.pricing_modes || [];
        state.packageConversionMap = new Map();
        syncProductMap(state);
        state.recipes = (data.recipes || []).map((recipe) => normalizeRecipeDraft(recipe, state));
        state.draft = normalizeRecipeDraft(state.draft, state);
        state.isLoaded = true;
        renderRecipeCollections(elements, state);
        renderEditor(elements, state);

        if (state.activeRecipeId) {
            const savedRecipe = state.recipes.find((recipe) => recipe.recipe_id === state.activeRecipeId);
            if (savedRecipe) {
                state.draft = normalizeRecipeDraft(savedRecipe, state);
                renderEditor(elements, state);
            }
        }
    }

    async function calculateRecipe(elements, state, { quiet = false } = {}) {
        if (!hasAnalysis(elements)) {
            return;
        }

        const payload = buildPayload(state);
        if (!payload) {
            state.calculation = null;
            renderCalculation(elements, null);
            if (!quiet) {
                setStatus(elements, "Add at least one complete ingredient row to calculate recipe cost.", "info");
            } else if (elements.recipeStatusMessage?.classList.contains("is-error")) {
                setStatus(elements);
            }
            return;
        }

        try {
            const data = await fetchJson("/recipes/calculate", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            state.calculation = data.calculation;
            renderCalculation(elements, state.calculation);
            if (!quiet) {
                setStatus(elements, "Recipe costs updated.", "info");
            } else if (elements.recipeStatusMessage?.classList.contains("is-error")) {
                setStatus(elements);
            }
        } catch (error) {
            state.calculation = null;
            renderCalculation(elements, null);
            setStatus(elements, error.message, "error");
        }
    }

    function scheduleCalculation(elements, state) {
        window.clearTimeout(state.calculateTimer);
        state.calculateTimer = window.setTimeout(() => {
            calculateRecipe(elements, state, { quiet: true });
        }, 220);
    }

    function openRecipe(elements, state, recipeId) {
        const recipe = state.recipes.find((item) => item.recipe_id === recipeId);
        if (!recipe) {
            return;
        }
        state.activeRecipeId = recipeId;
        state.deleteConfirmVisible = false;
        state.deleteTargetRecipeId = null;
        state.openProductDropdownIndex = null;
        state.draft = normalizeRecipeDraft(recipe, state);
        renderRecipeCollections(elements, state);
        renderEditor(elements, state);
        setStatus(elements, `Opened recipe: ${recipe.name}`, "info");
        calculateRecipe(elements, state, { quiet: true });
    }

    function resetDraftAfterDelete(elements, state) {
        state.activeRecipeId = null;
        state.deleteConfirmVisible = false;
        state.deleteTargetRecipeId = null;
        state.openProductDropdownIndex = null;
        state.draft = createEmptyRecipe();
        state.calculation = null;
        renderRecipeCollections(elements, state);
        renderEditor(elements, state);
        renderCalculation(elements, null);
    }

    async function saveRecipe(elements, state) {
        if (!hasAnalysis(elements)) {
            return;
        }

        let payload;
        try {
            payload = buildPayload(state, { requireComplete: true });
        } catch (error) {
            setStatus(elements, error.message, "error");
            return;
        }

        if (!payload) {
            setStatus(elements, "Add ingredients before saving the recipe.", "error");
            return;
        }

        payload.name = String(state.draft.name || "").trim();
        payload.yield_portions = Number(state.draft.yield_portions || 0);

        try {
            const data = await fetchJson("/recipes/save", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            state.recipes = data.recipes || [];
            state.activeRecipeId = data.recipe?.recipe_id || state.activeRecipeId;
            state.deleteConfirmVisible = false;
            state.deleteTargetRecipeId = null;
            state.draft = normalizeRecipeDraft(data.recipe || state.draft, state);
            state.calculation = data.calculation || null;
            renderRecipeCollections(elements, state);
            renderEditor(elements, state);
            renderCalculation(elements, state.calculation);
            setStatus(elements, data.message || "Recipe saved successfully", "success");
        } catch (error) {
            setStatus(elements, error.message, "error");
        }
    }

    async function deleteRecipe(elements, state, recipeId = state.deleteTargetRecipeId || state.activeRecipeId) {
        if (!hasAnalysis(elements) || !recipeId || state.isDeleting) {
            return;
        }

        state.deleteTargetRecipeId = recipeId;
        state.isDeleting = true;
        renderRecipeCollections(elements, state);

        try {
            const data = await fetchJson("/recipes/delete", {
                method: "POST",
                body: JSON.stringify({ recipe_id: recipeId })
            });
            state.recipes = data.recipes || [];
            if (state.activeRecipeId === recipeId) {
                resetDraftAfterDelete(elements, state);
            } else {
                state.deleteConfirmVisible = false;
                state.deleteTargetRecipeId = null;
                renderRecipeCollections(elements, state);
            }
            setStatus(elements, data.message || "Recipe deleted", "danger");
        } catch (error) {
            state.deleteConfirmVisible = true;
            setStatus(elements, error.message, "error");
        } finally {
            state.isDeleting = false;
            renderRecipeCollections(elements, state);
            renderEditor(elements, state);
        }
    }

    function bindEvents(elements, state) {
        if (elements.newRecipeButton && elements.newRecipeButton.dataset.bound !== "true") {
            elements.newRecipeButton.dataset.bound = "true";
            elements.newRecipeButton.addEventListener("click", () => {
                startNewRecipeDraft(elements, state);
            });
        }

        if (elements.recipeNameInput && elements.recipeNameInput.dataset.bound !== "true") {
            elements.recipeNameInput.dataset.bound = "true";
            elements.recipeNameInput.addEventListener("input", (event) => {
                state.draft.name = event.target.value;
            });
        }

        if (elements.recipeYieldInput && elements.recipeYieldInput.dataset.bound !== "true") {
            elements.recipeYieldInput.dataset.bound = "true";
            elements.recipeYieldInput.addEventListener("input", (event) => {
                state.draft.yield_portions = event.target.value;
                scheduleCalculation(elements, state);
            });
        }

        if (elements.recipePricingModeSelect && elements.recipePricingModeSelect.dataset.bound !== "true") {
            elements.recipePricingModeSelect.dataset.bound = "true";
            elements.recipePricingModeSelect.addEventListener("change", (event) => {
                state.draft.pricing_mode = event.target.value;
                scheduleCalculation(elements, state);
            });
        }

        if (elements.addRecipeIngredientButton && elements.addRecipeIngredientButton.dataset.bound !== "true") {
            elements.addRecipeIngredientButton.dataset.bound = "true";
            elements.addRecipeIngredientButton.addEventListener("click", () => {
                state.draft.ingredients.push(createEmptyIngredient());
                state.openProductDropdownIndex = state.draft.ingredients.length - 1;
                renderIngredients(elements, state);
            });
        }

        if (elements.recipeIngredientsList && elements.recipeIngredientsList.dataset.bound !== "true") {
            elements.recipeIngredientsList.dataset.bound = "true";
            elements.recipeIngredientsList.addEventListener("click", (event) => {
                const clearProductButton = event.target.closest("[data-clear-product]");
                if (clearProductButton) {
                    const index = Number(clearProductButton.dataset.clearProduct);
                    if (Number.isNaN(index)) {
                        return;
                    }
                    clearIngredientProductSelection(state, index);
                    renderIngredients(elements, state);
                    scheduleCalculation(elements, state);
                    return;
                }

                const productOptionButton = event.target.closest("[data-select-product]");
                if (productOptionButton) {
                    const index = Number(productOptionButton.dataset.index);
                    const productName = productOptionButton.dataset.selectProduct || "";
                    if (Number.isNaN(index) || !state.draft.ingredients[index]) {
                        return;
                    }
                    state.draft.ingredients[index].product_name = productName;
                    state.draft.ingredients[index].purchase_unit = getSourcePurchaseUnitForProduct(state, productName)
                        || normalizeUnit(state.draft.ingredients[index].purchase_unit || "");
                    const rememberedConversion = getRememberedPackageConversion(
                        state,
                        productName,
                        state.draft.ingredients[index].purchase_unit
                    );
                    state.draft.ingredients[index].purchase_base_unit = resolvePurchaseBaseUnit(
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].unit,
                        rememberedConversion?.purchase_base_unit || state.draft.ingredients[index].purchase_base_unit
                    );
                    const nextUsageUnit = normalizeUnit(state.draft.ingredients[index].unit);
                    const compatibleUsageType = getUnitType(nextUsageUnit) === getUnitType(state.draft.ingredients[index].purchase_base_unit);
                    state.draft.ingredients[index].unit = nextUsageUnit && compatibleUsageType
                        ? nextUsageUnit
                        : normalizeUnit(state.draft.ingredients[index].purchase_base_unit || state.draft.ingredients[index].purchase_unit || "");
                    state.draft.ingredients[index].purchase_size = inferPurchaseSize(
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_base_unit || state.draft.ingredients[index].unit
                    );
                    if (rememberedConversion?.purchase_size > 0) {
                        state.draft.ingredients[index].purchase_size = rememberedConversion.purchase_size;
                    }
                    rememberPackageConversion(
                        state,
                        state.draft.ingredients[index].product_name,
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_size,
                        state.draft.ingredients[index].purchase_base_unit
                    );
                    state.openProductDropdownIndex = null;
                    renderIngredients(elements, state);
                    scheduleCalculation(elements, state);
                    return;
                }

                const removeButton = event.target.closest("[data-remove-ingredient]");
                if (!removeButton) {
                    return;
                }
                const index = Number(removeButton.dataset.removeIngredient);
                state.draft.ingredients.splice(index, 1);
                if (!state.draft.ingredients.length) {
                    state.draft.ingredients.push(createEmptyIngredient());
                }
                state.openProductDropdownIndex = null;
                renderIngredients(elements, state);
                scheduleCalculation(elements, state);
            });

            elements.recipeIngredientsList.addEventListener("input", (event) => {
                const field = event.target.dataset.field;
                const index = Number(event.target.dataset.index);
                if (!field || Number.isNaN(index) || !state.draft.ingredients[index]) {
                    return;
                }
                state.draft.ingredients[index][field] = field === "purchase_size"
                    ? Number(event.target.value || 0)
                    : event.target.value;
                if (field === "product_name") {
                    state.openProductDropdownIndex = index;
                    renderIngredients(elements, state);
                    const activeInput = elements.recipeIngredientsList.querySelector(`.recipe-product-search-input[data-index="${index}"]`);
                    if (activeInput) {
                        const cursorAt = String(state.draft.ingredients[index].product_name || "").length;
                        activeInput.focus();
                        activeInput.setSelectionRange(cursorAt, cursorAt);
                    }
                    return;
                }
                if (field === "purchase_size") {
                    rememberPackageConversion(
                        state,
                        state.draft.ingredients[index].product_name,
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_size,
                        state.draft.ingredients[index].purchase_base_unit
                    );
                }
                scheduleCalculation(elements, state);
            });

            elements.recipeIngredientsList.addEventListener("focusin", (event) => {
                const productInput = event.target.closest('.recipe-product-search-input[data-field="product_name"]');
                if (!productInput) {
                    return;
                }
                const index = Number(productInput.dataset.index);
                if (Number.isNaN(index)) {
                    return;
                }
                if (state.openProductDropdownIndex === index && productInput.getAttribute("aria-expanded") === "true") {
                    return;
                }
                state.openProductDropdownIndex = index;
                renderIngredients(elements, state);
                const activeInput = elements.recipeIngredientsList.querySelector(`.recipe-product-search-input[data-index="${index}"]`);
                if (activeInput) {
                    const cursorAt = String(state.draft.ingredients[index]?.product_name || "").length;
                    activeInput.focus();
                    activeInput.setSelectionRange(cursorAt, cursorAt);
                }
            });

            elements.recipeIngredientsList.addEventListener("change", (event) => {
                const field = event.target.dataset.field;
                const index = Number(event.target.dataset.index);
                if (!field || Number.isNaN(index) || !state.draft.ingredients[index]) {
                    return;
                }
                state.draft.ingredients[index][field] = field === "purchase_size"
                    ? Number(event.target.value || 0)
                    : event.target.value;
                if (field === "product_name") {
                    const units = getUnitsForProduct(state, event.target.value);
                    if (!units.length) {
                        state.draft.ingredients[index].purchase_unit = "";
                        state.draft.ingredients[index].unit = "";
                        state.draft.ingredients[index].purchase_size = 1;
                        state.draft.ingredients[index].purchase_base_unit = "";
                        state.openProductDropdownIndex = index;
                        renderIngredients(elements, state);
                        return;
                    }
                    const currentUnit = normalizeUnit(state.draft.ingredients[index].unit);
                    const rememberedConversion = getRememberedPackageConversion(
                        state,
                        event.target.value,
                        state.draft.ingredients[index].purchase_unit
                    );
                    state.draft.ingredients[index].purchase_unit = getSourcePurchaseUnitForProduct(state, event.target.value)
                        || normalizeUnit(state.draft.ingredients[index].purchase_unit || "");
                    state.draft.ingredients[index].purchase_base_unit = resolvePurchaseBaseUnit(
                        state.draft.ingredients[index].purchase_unit,
                        currentUnit,
                        rememberedConversion?.purchase_base_unit || state.draft.ingredients[index].purchase_base_unit
                    );
                    const compatibleUsageType = getUnitType(currentUnit) === getUnitType(state.draft.ingredients[index].purchase_base_unit);
                    state.draft.ingredients[index].unit = currentUnit && compatibleUsageType
                        ? currentUnit
                        : normalizeUnit(state.draft.ingredients[index].purchase_base_unit || state.draft.ingredients[index].purchase_unit || "");
                    state.draft.ingredients[index].purchase_size = inferPurchaseSize(
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_base_unit || state.draft.ingredients[index].unit
                    );
                    if (rememberedConversion?.purchase_size > 0) {
                        state.draft.ingredients[index].purchase_size = rememberedConversion.purchase_size;
                    }
                    rememberPackageConversion(
                        state,
                        state.draft.ingredients[index].product_name,
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_size,
                        state.draft.ingredients[index].purchase_base_unit
                    );
                    state.openProductDropdownIndex = null;
                    renderIngredients(elements, state);
                }
                if (field === "unit" || field === "purchase_base_unit") {
                    state.draft.ingredients[index].unit = normalizeUnit(state.draft.ingredients[index].unit);
                    state.draft.ingredients[index].purchase_unit = getSourcePurchaseUnitForProduct(
                        state,
                        state.draft.ingredients[index].product_name
                    ) || normalizeUnit(state.draft.ingredients[index].purchase_unit);
                    state.draft.ingredients[index].purchase_base_unit = resolvePurchaseBaseUnit(
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].unit,
                        state.draft.ingredients[index].purchase_base_unit
                    );
                    state.draft.ingredients[index].purchase_size = inferPurchaseSize(
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_base_unit || state.draft.ingredients[index].unit
                    );
                    rememberPackageConversion(
                        state,
                        state.draft.ingredients[index].product_name,
                        state.draft.ingredients[index].purchase_unit,
                        state.draft.ingredients[index].purchase_size,
                        state.draft.ingredients[index].purchase_base_unit
                    );
                    renderIngredients(elements, state);
                }
                scheduleCalculation(elements, state);
            });
        }

        if (elements.recalculateRecipeButton && elements.recalculateRecipeButton.dataset.bound !== "true") {
            elements.recalculateRecipeButton.dataset.bound = "true";
            elements.recalculateRecipeButton.addEventListener("click", () => {
                calculateRecipe(elements, state);
            });
        }

        if (elements.saveRecipeButton && elements.saveRecipeButton.dataset.bound !== "true") {
            elements.saveRecipeButton.dataset.bound = "true";
            elements.saveRecipeButton.addEventListener("click", () => {
                saveRecipe(elements, state);
            });
        }

        if (elements.recipesList && elements.recipesList.dataset.bound !== "true") {
            elements.recipesList.dataset.bound = "true";
            elements.recipesList.addEventListener("click", (event) => {
                const deleteButton = event.target.closest("[data-delete-recipe]");
                if (deleteButton) {
                    state.deleteConfirmVisible = true;
                    state.deleteTargetRecipeId = deleteButton.dataset.deleteRecipe || null;
                    renderRecipeCollections(elements, state);
                    setStatus(elements);
                    return;
                }

                if (event.target.closest("[data-cancel-recipe-delete]")) {
                    state.deleteConfirmVisible = false;
                    state.deleteTargetRecipeId = null;
                    renderRecipeCollections(elements, state);
                    return;
                }

                const confirmDeleteButton = event.target.closest("[data-confirm-recipe-delete]");
                if (confirmDeleteButton) {
                    deleteRecipe(elements, state, confirmDeleteButton.dataset.confirmRecipeDelete || "");
                    return;
                }

                const button = event.target.closest("[data-open-recipe]");
                if (!button) {
                    return;
                }
                openRecipe(elements, state, button.dataset.openRecipe || "");
            });
        }

        const openLibrary = () => {
            state.recipeLibraryOpen = true;
            renderRecipeLibrary(elements, state);
            window.setTimeout(() => {
                elements.recipeLibrarySearchInput?.focus();
            }, 0);
        };

        const closeLibrary = () => {
            state.recipeLibraryOpen = false;
            state.deleteConfirmVisible = false;
            state.deleteTargetRecipeId = null;
            renderRecipeLibrary(elements, state);
        };

        if (elements.openRecipeLibraryButton && elements.openRecipeLibraryButton.dataset.bound !== "true") {
            elements.openRecipeLibraryButton.dataset.bound = "true";
            elements.openRecipeLibraryButton.addEventListener("click", openLibrary);
        }

        if (elements.openRecipeLibraryInlineButton && elements.openRecipeLibraryInlineButton.dataset.bound !== "true") {
            elements.openRecipeLibraryInlineButton.dataset.bound = "true";
            elements.openRecipeLibraryInlineButton.addEventListener("click", openLibrary);
        }

        if (elements.createRecipeFromLibraryButton && elements.createRecipeFromLibraryButton.dataset.bound !== "true") {
            elements.createRecipeFromLibraryButton.dataset.bound = "true";
            elements.createRecipeFromLibraryButton.addEventListener("click", () => {
                closeLibrary();
                startNewRecipeDraft(elements, state, "Started a new recipe from Recipe Library.");
            });
        }

        if (elements.closeRecipeLibraryButton && elements.closeRecipeLibraryButton.dataset.bound !== "true") {
            elements.closeRecipeLibraryButton.dataset.bound = "true";
            elements.closeRecipeLibraryButton.addEventListener("click", closeLibrary);
        }

        if (elements.recipeLibraryOverlay && elements.recipeLibraryOverlay.dataset.bound !== "true") {
            elements.recipeLibraryOverlay.dataset.bound = "true";
            elements.recipeLibraryOverlay.addEventListener("click", (event) => {
                if (event.target === elements.recipeLibraryOverlay) {
                    closeLibrary();
                }
            });
        }

        if (elements.recipeLibrarySearchInput && elements.recipeLibrarySearchInput.dataset.bound !== "true") {
            elements.recipeLibrarySearchInput.dataset.bound = "true";
            elements.recipeLibrarySearchInput.addEventListener("input", (event) => {
                state.recipeLibrarySearch = event.target.value;
                renderRecipeLibrary(elements, state);
            });
        }

        if (elements.recipeLibrarySortSelect && elements.recipeLibrarySortSelect.dataset.bound !== "true") {
            elements.recipeLibrarySortSelect.dataset.bound = "true";
            elements.recipeLibrarySortSelect.addEventListener("change", (event) => {
                state.recipeLibrarySort = event.target.value;
                renderRecipeLibrary(elements, state);
            });
        }

        if (elements.recipeLibraryList && elements.recipeLibraryList.dataset.bound !== "true") {
            elements.recipeLibraryList.dataset.bound = "true";
            elements.recipeLibraryList.addEventListener("click", (event) => {
                if (event.target.closest("#recipeLibraryEmptyCreateButton")) {
                    closeLibrary();
                    startNewRecipeDraft(elements, state, "Started a new recipe from Recipe Library.");
                    return;
                }

                const deleteButton = event.target.closest("[data-delete-recipe]");
                if (deleteButton) {
                    state.deleteConfirmVisible = true;
                    state.deleteTargetRecipeId = deleteButton.dataset.deleteRecipe || null;
                    renderRecipeCollections(elements, state);
                    return;
                }

                if (event.target.closest("[data-cancel-recipe-delete]")) {
                    state.deleteConfirmVisible = false;
                    state.deleteTargetRecipeId = null;
                    renderRecipeCollections(elements, state);
                    return;
                }

                const confirmDeleteButton = event.target.closest("[data-confirm-recipe-delete]");
                if (confirmDeleteButton) {
                    deleteRecipe(elements, state, confirmDeleteButton.dataset.confirmRecipeDelete || "");
                    return;
                }

                const openButton = event.target.closest("[data-open-library-recipe]");
                if (!openButton) {
                    return;
                }
                closeLibrary();
                openRecipe(elements, state, openButton.dataset.openLibraryRecipe || "");
            });
        }

        if (document.body.dataset.recipeDropdownBound !== "true") {
            document.body.dataset.recipeDropdownBound = "true";
            document.addEventListener("click", (event) => {
                if (event.target.closest(".recipe-product-picker-wrap")) {
                    return;
                }
                if (state.openProductDropdownIndex === null) {
                    return;
                }
                state.openProductDropdownIndex = null;
                renderIngredients(elements, state);
            });
        }
    }

    async function initRecipes() {
        const elements = getElements();
        const stateHost = elements.mainDashboardView || elements.recipesWorkspaceState;
        if (!elements.recipesShell || !stateHost) {
            return;
        }

        const state = createState();
        renderRecipeCollections(elements, state);
        renderEditor(elements, state);
        renderCalculation(elements, null);
        bindEvents(elements, state);

        const refreshBootstrap = async () => {
            if (!hasAnalysis(elements)) {
                state.products = [];
                syncProductMap(state);
                state.packageConversionMap = new Map();
                state.recipes = [];
                state.activeRecipeId = null;
                state.deleteConfirmVisible = false;
                state.deleteTargetRecipeId = null;
                state.isDeleting = false;
                state.recipeLibraryOpen = false;
                state.openProductDropdownIndex = null;
                state.draft = createEmptyRecipe();
                state.calculation = null;
                renderRecipeCollections(elements, state);
                renderEditor(elements, state);
                renderCalculation(elements, null);
                setStatus(elements);
                return;
            }
            try {
                await loadBootstrap(elements, state);
                await calculateRecipe(elements, state, { quiet: true });
                setStatus(elements);
            } catch (error) {
                setStatus(elements, error.message, "error");
            }
        };

        await refreshBootstrap();

        const observer = new MutationObserver(() => {
            refreshBootstrap();
        });
        observer.observe(stateHost, {
            attributes: true,
            attributeFilter: ["data-has-analysis"]
        });
    }

    document.addEventListener("DOMContentLoaded", initRecipes);
})();
