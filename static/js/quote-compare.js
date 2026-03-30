(function () {
    const QUOTE_REQUIRED_FIELDS = ["Supplier Name", "Product Name", "Unit", "Quantity", "Unit Price"];
    const QUOTE_DEMO_COMPARISON_ID = "quote-compare-demo";
    const QUOTE_FIELD_HELP = {
        "Supplier Name": "Choose the supplier, vendor, company, or firm column from your file.",
        "Product Name": "Choose the product, item, material, or description column for the quoted offer.",
        "Unit": "Choose the purchase unit or UOM used in the supplier quote.",
        "Quantity": "Choose the quoted quantity or amount for each supplier line.",
        "Unit Price": "Choose the quoted unit price or cost per unit.",
        "Total Price": "Optional. Use this if your file already includes a line total.",
        "Currency": "Optional. Use this if your file includes a currency code like USD or EUR.",
        "Delivery Time": "Optional. Use this for lead time, delivery days, or timing notes.",
        "Payment Term": "Optional. Use this for payment terms such as Net 30 or Net 45.",
        "Valid Until": "Optional. Use this for quote expiry or validity date.",
        "Notes": "Optional. Use this for freight, MOQ, quality, or commercial notes."
    };

    function getElements() {
        return {
            quoteCompareShell: document.getElementById("quoteCompareShell"),
            quoteCompareEmptyState: document.getElementById("quoteCompareEmptyState"),
            quoteSidebarBody: document.getElementById("quoteSidebarBody"),
            quoteSidebarToggleButton: document.getElementById("quoteSidebarToggleButton"),
            quoteComparisonList: document.getElementById("quoteComparisonList"),
            quoteComparisonEmpty: document.getElementById("quoteComparisonEmpty"),
            newQuoteComparisonButton: document.getElementById("newQuoteComparisonButton"),
            quoteDemoState: document.getElementById("quoteDemoState"),
            quoteExitDemoButton: document.getElementById("quoteExitDemoButton"),
            quoteCompareSummaryCard: document.getElementById("quoteCompareSummaryCard"),
            quoteCompareResultsCard: document.getElementById("quoteCompareResultsCard"),
            quoteComparisonEditorTitle: document.getElementById("quoteComparisonEditorTitle"),
            quoteComparisonMetaShell: document.getElementById("quoteComparisonMetaShell"),
            quoteComparisonMetaSection: document.getElementById("quoteComparisonMetaSection"),
            quoteComparisonPrimaryActions: document.getElementById("quoteComparisonPrimaryActions"),
            quoteComparisonNameInput: document.getElementById("quoteComparisonNameInput"),
            quoteComparisonNeedInput: document.getElementById("quoteComparisonNeedInput"),
            addQuoteBidButton: document.getElementById("addQuoteBidButton"),
            quoteBidsList: document.getElementById("quoteBidsList"),
            recalculateQuoteComparisonButton: document.getElementById("recalculateQuoteComparisonButton"),
            saveQuoteComparisonButton: document.getElementById("saveQuoteComparisonButton"),
            deleteQuoteComparisonButton: document.getElementById("deleteQuoteComparisonButton"),
            quoteDeleteConfirmHost: document.getElementById("quoteDeleteConfirmHost"),
            quoteComparisonStatusMessage: document.getElementById("quoteComparisonStatusMessage"),
            quoteCompareRecommendationChip: document.getElementById("quoteCompareRecommendationChip"),
            quoteCompareLowestPriceSupplier: document.getElementById("quoteCompareLowestPriceSupplier"),
            quoteCompareLowestPriceCopy: document.getElementById("quoteCompareLowestPriceCopy"),
            quoteCompareFastestDeliverySupplier: document.getElementById("quoteCompareFastestDeliverySupplier"),
            quoteCompareFastestDeliveryCopy: document.getElementById("quoteCompareFastestDeliveryCopy"),
            quoteCompareBestPaymentSupplier: document.getElementById("quoteCompareBestPaymentSupplier"),
            quoteCompareBestPaymentCopy: document.getElementById("quoteCompareBestPaymentCopy"),
            quoteCompareRecommendedSupplier: document.getElementById("quoteCompareRecommendedSupplier"),
            quoteCompareRecommendedCopy: document.getElementById("quoteCompareRecommendedCopy"),
            quoteCompareInsightsList: document.getElementById("quoteCompareInsightsList"),
            quoteCompareTableWrap: document.getElementById("quoteCompareTableWrap"),
            quoteCompareFileUpload: document.getElementById("quoteCompareFileUpload"),
            quoteCompareSelectFileButton: document.getElementById("quoteCompareSelectFileButton"),
            quoteCompareDemoButton: document.getElementById("quoteCompareDemoButton"),
            quoteCompareUploadKicker: document.getElementById("quoteCompareUploadKicker"),
            quoteCompareFileName: document.getElementById("quoteCompareFileName"),
            inspectQuoteCompareUploadButton: document.getElementById("inspectQuoteCompareUploadButton"),
            quoteImportModeButton: document.getElementById("quoteImportModeButton"),
            quoteManualModeButton: document.getElementById("quoteManualModeButton"),
            quoteImportPanel: document.getElementById("quoteImportPanel"),
            quoteManualPanel: document.getElementById("quoteManualPanel"),
            quoteBidsCard: document.querySelector(".quote-bids-card"),
            quoteCompareMappingPanel: document.getElementById("quoteCompareMappingPanel"),
            quoteCompareMappingIntro: document.getElementById("quoteCompareMappingIntro"),
            quoteCompareMappingSummary: document.getElementById("quoteCompareMappingSummary"),
            quoteCompareMappingGrid: document.getElementById("quoteCompareMappingGrid"),
            quoteCompareMappingMissingAlert: document.getElementById("quoteCompareMappingMissingAlert"),
            quoteCompareMappingOptionalAlert: document.getElementById("quoteCompareMappingOptionalAlert"),
            quoteCompareChangeFileButton: document.getElementById("quoteCompareChangeFileButton"),
            confirmQuoteCompareMappingButton: document.getElementById("confirmQuoteCompareMappingButton"),
            quoteCompareSearchInput: document.getElementById("quoteCompareSearchInput"),
            quoteCompareProductFilter: document.getElementById("quoteCompareProductFilter"),
            quoteCompareSupplierFilter: document.getElementById("quoteCompareSupplierFilter"),
            quoteCompareBestOnlyToggle: document.getElementById("quoteCompareBestOnlyToggle")
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

    function formatCurrency(value, currency = "USD") {
        return `${escapeHtml(currency)} ${Number(value || 0).toFixed(2)}`;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createEmptyBid() {
        return {
            supplier_name: "",
            product_name: "",
            unit: "",
            quantity: "",
            unit_price: "",
            total_price: "",
            currency: "USD",
            delivery_time: "",
            payment_term: "",
            valid_until: "",
            notes: ""
        };
    }

    function createEmptyComparison() {
        return {
            comparison_id: null,
            name: "",
            sourcing_need: "",
            bids: [createEmptyBid()]
        };
    }

    function createState() {
        return {
            comparisons: [],
            draft: createEmptyComparison(),
            activeComparisonId: null,
            evaluation: null,
            calculateTimer: null,
            deleteConfirmVisible: false,
            isDeleting: false,
            isDemoMode: false,
            sidebarCollapsed: true,
            intakeMode: "import",
            uploadFile: null,
            uploadReview: null,
            filters: { search: "", product: "", supplier: "", bestOnly: false }
        };
    }

    function buildComparisonListItem(comparison, fallbackId = null) {
        return {
            ...clone(comparison),
            comparison_id: comparison.comparison_id || fallbackId || `quote-${Date.now()}`,
            updated_at: comparison.updated_at || new Date().toISOString()
        };
    }

    function upsertComparison(state, comparison) {
        const normalized = buildComparisonListItem(comparison);
        const existingIndex = state.comparisons.findIndex((item) => item.comparison_id === normalized.comparison_id);
        if (existingIndex >= 0) {
            state.comparisons.splice(existingIndex, 1, normalized);
        } else {
            state.comparisons.unshift(normalized);
        }
    }

    function removeDemoComparison(state) {
        state.comparisons = state.comparisons.filter((item) => item.comparison_id !== QUOTE_DEMO_COMPARISON_ID);
    }

    function setStatus(elements, message = "", tone = "") {
        if (!elements.quoteComparisonStatusMessage) return;
        elements.quoteComparisonStatusMessage.hidden = !message;
        elements.quoteComparisonStatusMessage.className = `recipe-status${tone ? ` is-${tone}` : ""}`;
        elements.quoteComparisonStatusMessage.textContent = message;
    }

    function syncTopEmptyState(elements, state) {
        if (elements.quoteCompareEmptyState) {
            elements.quoteCompareEmptyState.hidden = true;
        }
    }

    function renderSidebarPanel(elements, state) {
        const hasComparisons = state.comparisons.length > 0;
        if (elements.quoteSidebarBody) {
            elements.quoteSidebarBody.hidden = !hasComparisons || state.sidebarCollapsed;
        }
        if (elements.quoteSidebarToggleButton) {
            elements.quoteSidebarToggleButton.hidden = !hasComparisons;
            elements.quoteSidebarToggleButton.textContent = state.sidebarCollapsed ? "Show Saved" : "Hide Saved";
            elements.quoteSidebarToggleButton.setAttribute("aria-expanded", hasComparisons && !state.sidebarCollapsed ? "true" : "false");
        }
    }

    function renderComparisonList(elements, state) {
        if (!elements.quoteComparisonList || !elements.quoteComparisonEmpty) return;
        syncTopEmptyState(elements, state);
        renderSidebarPanel(elements, state);
        if (!state.comparisons.length) {
            elements.quoteComparisonList.innerHTML = "";
            elements.quoteComparisonEmpty.hidden = true;
            return;
        }

        elements.quoteComparisonEmpty.hidden = true;
        elements.quoteComparisonList.innerHTML = state.comparisons.map((comparison) => {
            const isActive = comparison.comparison_id === state.activeComparisonId;
            const updatedLabel = comparison.updated_at
                ? new Date(comparison.updated_at).toLocaleDateString("en-US")
                : "Not saved yet";
            return `
                <button type="button" class="recipe-list-item ${isActive ? "is-active" : ""}" data-open-comparison="${escapeHtml(comparison.comparison_id)}">
                    <span class="recipe-list-name">${escapeHtml(comparison.name)}</span>
                    <span class="recipe-list-meta">${Number(comparison.bids?.length || 0)} offer${Number(comparison.bids?.length || 0) === 1 ? "" : "s"} | Updated ${escapeHtml(updatedLabel)}</span>
                </button>
            `;
        }).join("");
    }

    function renderDeleteConfirmation(elements, state) {
        const hasSavedComparison = Boolean(state.activeComparisonId);
        const hasOffers = getSupplierOfferCount(state) > 0;
        if (elements.deleteQuoteComparisonButton) {
            elements.deleteQuoteComparisonButton.hidden = !(hasSavedComparison && hasOffers);
            elements.deleteQuoteComparisonButton.disabled = state.isDeleting;
            elements.deleteQuoteComparisonButton.textContent = state.isDeleting ? "Deleting..." : "Delete Comparison";
        }
        if (elements.quoteDeleteConfirmHost) {
            const shouldRenderConfirm = hasSavedComparison && hasOffers && state.deleteConfirmVisible;
            elements.quoteDeleteConfirmHost.innerHTML = shouldRenderConfirm
                ? `
                    <div class="recipe-delete-confirm">
                        <div class="recipe-delete-confirm-copy">
                            <strong>Are you sure you want to delete this comparison?</strong>
                            <span>This action cannot be undone.</span>
                        </div>
                        <div class="recipe-delete-confirm-actions">
                            <button type="button" class="secondary-btn" data-quote-delete-cancel ${state.isDeleting ? "disabled" : ""}>Cancel</button>
                            <button type="button" class="action-btn" data-quote-delete-confirm ${state.isDeleting ? "disabled" : ""}>${state.isDeleting ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                `
                : "";
        }
    }

    function getSupplierOfferCount(state) {
        return state.draft.bids.filter((bid) => Object.values(bid).some((value) => String(value || "").trim() !== "")).length;
    }

    function isValidBid(bid) {
        const quantity = Number(bid.quantity || 0);
        const unitPrice = Number(bid.unit_price || 0);
        const totalPrice = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : Number(bid.total_price || 0);
        return Boolean(String(bid.supplier_name || "").trim())
            && Boolean(String(bid.product_name || "").trim())
            && quantity > 0
            && totalPrice > 0;
    }

    function getValidSupplierOfferCount(state) {
        return state.draft.bids.filter(isValidBid).length;
    }

    function hasMeaningfulDraft(state) {
        if (state.activeComparisonId) return true;
        return getSupplierOfferCount(state) > 0;
    }

    function syncEditorChrome(elements, state) {
        const hasDraft = hasMeaningfulDraft(state);
        const hasValidOffers = getValidSupplierOfferCount(state) > 0;
        if (elements.quoteComparisonEditorTitle) {
            elements.quoteComparisonEditorTitle.textContent = state.activeComparisonId
                ? "Edit saved comparison"
                : hasDraft
                    ? "Name and save this comparison"
                    : "Start a quote comparison";
        }
        if (elements.quoteComparisonMetaShell) elements.quoteComparisonMetaShell.hidden = !hasValidOffers;
        if (elements.quoteComparisonMetaSection) elements.quoteComparisonMetaSection.hidden = !hasValidOffers;
        if (elements.quoteComparisonPrimaryActions) elements.quoteComparisonPrimaryActions.hidden = !hasValidOffers;
        if (elements.recalculateQuoteComparisonButton) elements.recalculateQuoteComparisonButton.hidden = !hasValidOffers;
        if (elements.saveQuoteComparisonButton) {
            elements.saveQuoteComparisonButton.hidden = !hasValidOffers;
            elements.saveQuoteComparisonButton.disabled = !hasValidOffers;
        }
        if (elements.quoteDemoState) elements.quoteDemoState.hidden = !state.isDemoMode;
    }

    function renderProgressiveSections(elements, state) {
        const hasValidOffers = getValidSupplierOfferCount(state) > 0;
        if (elements.quoteCompareSummaryCard) elements.quoteCompareSummaryCard.hidden = !hasValidOffers;
        if (elements.quoteCompareResultsCard) elements.quoteCompareResultsCard.hidden = !hasValidOffers;
    }

    function renderUploadStatus(elements, state) {
        if (elements.quoteCompareFileName) {
            elements.quoteCompareFileName.textContent = state.uploadFile ? state.uploadFile.name : "No file selected yet";
        }
        if (elements.quoteCompareUploadKicker) {
            elements.quoteCompareUploadKicker.textContent = state.uploadFile
                ? "Supplier offer file ready for review"
                : "Import supplier offer sheets and map only the fields needed for quick comparison.";
        }
    }

    function renderIntakeMode(elements, state) {
        const isImport = state.intakeMode === "import";
        if (elements.quoteImportPanel) elements.quoteImportPanel.hidden = !isImport;
        if (elements.quoteManualPanel) elements.quoteManualPanel.hidden = isImport;
        if (elements.quoteBidsCard) elements.quoteBidsCard.hidden = isImport;
        if (elements.quoteImportModeButton) {
            elements.quoteImportModeButton.classList.toggle("is-active", isImport);
            elements.quoteImportModeButton.setAttribute("aria-selected", isImport ? "true" : "false");
        }
        if (elements.quoteManualModeButton) {
            elements.quoteManualModeButton.classList.toggle("is-active", !isImport);
            elements.quoteManualModeButton.setAttribute("aria-selected", !isImport ? "true" : "false");
        }
    }

    function renderBidRows(elements, state) {
        if (!elements.quoteBidsList) return;
        elements.quoteBidsList.innerHTML = state.draft.bids.map((bid, index) => {
            const quantity = Number(bid.quantity || 0);
            const unitPrice = Number(bid.unit_price || 0);
            const totalPrice = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : Number(bid.total_price || 0);
            return `
                <article class="quote-bid-row" data-index="${index}">
                    <div class="quote-bid-grid">
                        <label class="recipe-field"><span class="recipe-field-label">Supplier Name</span><input type="text" class="recipe-input" data-field="supplier_name" data-index="${index}" value="${escapeHtml(bid.supplier_name)}" placeholder="Example: Atlas Packaging"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Product Name</span><input type="text" class="recipe-input" data-field="product_name" data-index="${index}" value="${escapeHtml(bid.product_name)}" placeholder="Example: 8 oz amber glass jar"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Unit</span><input type="text" class="recipe-input" data-field="unit" data-index="${index}" value="${escapeHtml(bid.unit)}" placeholder="Case"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Quantity</span><input type="number" min="0" step="0.01" class="recipe-input" data-field="quantity" data-index="${index}" value="${escapeHtml(bid.quantity)}" placeholder="0.00"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Unit Price</span><input type="number" min="0" step="0.01" class="recipe-input" data-field="unit_price" data-index="${index}" value="${escapeHtml(bid.unit_price)}" placeholder="0.00"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Total Price</span><input type="number" min="0" step="0.01" class="recipe-input" data-field="total_price" data-index="${index}" value="${escapeHtml(totalPrice ? totalPrice.toFixed(2) : "")}" readonly></label>
                        <label class="recipe-field"><span class="recipe-field-label">Currency</span><input type="text" class="recipe-input" data-field="currency" data-index="${index}" value="${escapeHtml(bid.currency || "USD")}" placeholder="USD"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Delivery Time</span><input type="text" class="recipe-input" data-field="delivery_time" data-index="${index}" value="${escapeHtml(bid.delivery_time)}" placeholder="14 days"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Payment Term</span><input type="text" class="recipe-input" data-field="payment_term" data-index="${index}" value="${escapeHtml(bid.payment_term)}" placeholder="Net 30"></label>
                        <label class="recipe-field"><span class="recipe-field-label">Valid Until</span><input type="date" class="recipe-input" data-field="valid_until" data-index="${index}" value="${escapeHtml(bid.valid_until)}"></label>
                    </div>
                    <div class="quote-bid-footer">
                        <label class="recipe-field quote-bid-notes"><span class="recipe-field-label">Notes</span><input type="text" class="recipe-input" data-field="notes" data-index="${index}" value="${escapeHtml(bid.notes)}" placeholder="MOQ, freight, or commercial caveats"></label>
                        <button type="button" class="recipe-remove-btn" data-remove-bid="${index}" aria-label="Remove supplier offer">Remove</button>
                    </div>
                </article>
            `;
        }).join("");
    }

    function updateBidRowComputedFields(row, bid) {
        if (!row) return;
        const quantity = Number(bid.quantity || 0);
        const unitPrice = Number(bid.unit_price || 0);
        const totalPrice = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : Number(bid.total_price || 0);
        const totalInput = row.querySelector('input[data-field="total_price"]');
        if (totalInput) totalInput.value = totalPrice ? totalPrice.toFixed(2) : "";
    }

    function renderMappingReview(elements, state) {
        const review = state.uploadReview;
        if (!elements.quoteCompareMappingPanel) return;
        elements.quoteCompareMappingPanel.hidden = !review;
        if (!review) return;

        const fieldReviews = review.field_reviews || [];
        const headers = review.headers || [];
        const missingFields = review.missing_fields || [];
        const optionalColumns = review.optional_columns || [];
        const matched = Number(review.matched_fields || 0);
        const requiredCount = Number((review.required_fields || QUOTE_REQUIRED_FIELDS).length || QUOTE_REQUIRED_FIELDS.length);

        if (elements.quoteCompareMappingIntro) {
            elements.quoteCompareMappingIntro.textContent = review.review_message || "Review the required quote fields below before importing the offers.";
        }
        if (elements.quoteCompareMappingSummary) {
            elements.quoteCompareMappingSummary.innerHTML = `
                <span class="result-chip">${matched} of ${requiredCount} required fields matched</span>
                <span class="result-chip">${headers.length} uploaded columns</span>
            `;
        }
        if (elements.quoteCompareMappingGrid) {
            elements.quoteCompareMappingGrid.innerHTML = fieldReviews.map((fieldReview) => {
                const fieldName = fieldReview.field_name || fieldReview.field || "";
                const selectedColumn = review.mapping?.[fieldName] || fieldReview.selected_column || fieldReview.detected_column || "";
                const isRequired = QUOTE_REQUIRED_FIELDS.includes(fieldName);
                const helpText = QUOTE_FIELD_HELP[fieldName] || "Choose the matching column from your uploaded supplier offer file.";
                const options = ['<option value="">Choose a column</option>'].concat(
                    headers.map((header) => `<option value="${escapeHtml(header)}" ${header === selectedColumn ? "selected" : ""}>${escapeHtml(header)}</option>`)
                );
                return `
                    <article class="mapping-card">
                        <div class="mapping-card-head">
                            <div>
                                <div class="mapping-card-title">${escapeHtml(fieldName)}</div>
                                <div class="mapping-card-copy">${escapeHtml(helpText)}</div>
                            </div>
                            <div class="mapping-confidence ${fieldReview.match_quality === "strong" ? "is-strong" : fieldReview.match_quality === "possible" ? "is-possible" : "is-missing"}">${escapeHtml(fieldReview.match_quality || "missing")}</div>
                        </div>
                        <label class="mapping-field">
                            <span class="mapping-field-label">File column${isRequired ? " (Required)" : " (Optional)"}</span>
                            <select class="mapping-select" data-quote-mapping-field="${escapeHtml(fieldName)}">${options.join("")}</select>
                        </label>
                    </article>
                `;
            }).join("");
        }
        if (elements.quoteCompareMappingMissingAlert) {
            elements.quoteCompareMappingMissingAlert.hidden = !missingFields.length;
            elements.quoteCompareMappingMissingAlert.textContent = missingFields.length
                ? `Map these required fields before importing: ${missingFields.join(", ")}.`
                : "";
        }
        if (elements.quoteCompareMappingOptionalAlert) {
            elements.quoteCompareMappingOptionalAlert.hidden = false;
            elements.quoteCompareMappingOptionalAlert.textContent = optionalColumns.length
                ? `Optional columns available: ${optionalColumns.join(", ")}`
                : "No extra columns detected in this file.";
        }
    }

    function renderEditor(elements, state) {
        if (!state.draft.bids.length) state.draft.bids = [createEmptyBid()];
        syncEditorChrome(elements, state);
        if (elements.quoteComparisonNameInput) elements.quoteComparisonNameInput.value = state.draft.name || "";
        if (elements.quoteComparisonNeedInput) elements.quoteComparisonNeedInput.value = state.draft.sourcing_need || "";
        if (elements.saveQuoteComparisonButton) {
            elements.saveQuoteComparisonButton.textContent = state.activeComparisonId ? "Update Comparison" : "Save Comparison";
        }
        renderDeleteConfirmation(elements, state);
        renderUploadStatus(elements, state);
        renderIntakeMode(elements, state);
        renderProgressiveSections(elements, state);
        renderBidRows(elements, state);
        renderMappingReview(elements, state);
    }

    function resetSummary(elements) {
        if (elements.quoteCompareRecommendationChip) elements.quoteCompareRecommendationChip.textContent = "Awaiting supplier bids";
        if (elements.quoteCompareLowestPriceSupplier) elements.quoteCompareLowestPriceSupplier.textContent = "No bids yet";
        if (elements.quoteCompareLowestPriceCopy) elements.quoteCompareLowestPriceCopy.textContent = "The cheapest supplier offer in scope will appear here.";
        if (elements.quoteCompareFastestDeliverySupplier) elements.quoteCompareFastestDeliverySupplier.textContent = "No bids yet";
        if (elements.quoteCompareFastestDeliveryCopy) elements.quoteCompareFastestDeliveryCopy.textContent = "The quickest delivery option will appear here.";
        if (elements.quoteCompareBestPaymentSupplier) elements.quoteCompareBestPaymentSupplier.textContent = "No bids yet";
        if (elements.quoteCompareBestPaymentCopy) elements.quoteCompareBestPaymentCopy.textContent = "The strongest payment position will appear here.";
        if (elements.quoteCompareRecommendedSupplier) elements.quoteCompareRecommendedSupplier.textContent = "No recommendation yet";
        if (elements.quoteCompareRecommendedCopy) elements.quoteCompareRecommendedCopy.textContent = "A practical recommendation will appear once supplier bids are entered.";
        if (elements.quoteCompareInsightsList) {
            elements.quoteCompareInsightsList.innerHTML = '<div class="decision-list-empty">Add supplier bids to generate a recommendation summary.</div>';
        }
        if (elements.quoteCompareTableWrap) {
            elements.quoteCompareTableWrap.innerHTML = '<div class="decision-list-empty">Add supplier offers to compare them product by product.</div>';
        }
    }

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function getFilteredProducts(state) {
        const products = state.evaluation?.products || [];
        const search = normalizeText(state.filters.search);
        const productFilter = normalizeText(state.filters.product);
        const supplierFilter = normalizeText(state.filters.supplier);

        return products
            .map((product) => {
                const offers = (product.offers || []).filter((offer) => {
                    const matchesSearch = !search || [offer.product_name, offer.supplier_name].some((value) => normalizeText(value).includes(search));
                    const matchesProduct = !productFilter || normalizeText(product.product_name) === productFilter;
                    const matchesSupplier = !supplierFilter || normalizeText(offer.supplier_name) === supplierFilter;
                    const matchesBestOnly = !state.filters.bestOnly || (offer.badges || []).includes("Best Price");
                    return matchesSearch && matchesProduct && matchesSupplier && matchesBestOnly;
                });
                return { ...product, offers };
            })
            .filter((product) => product.offers.length > 0);
    }

    function renderFilterControls(elements, state) {
        const products = state.evaluation?.products || [];
        const productOptions = [...new Set(products.map((item) => item.product_name).filter(Boolean))].sort();
        const supplierOptions = [...new Set(products.flatMap((item) => (item.offers || []).map((offer) => offer.supplier_name)).filter(Boolean))].sort();

        if (elements.quoteCompareProductFilter) {
            elements.quoteCompareProductFilter.innerHTML = ['<option value="">All products</option>'].concat(
                productOptions.map((value) => `<option value="${escapeHtml(value)}" ${value === state.filters.product ? "selected" : ""}>${escapeHtml(value)}</option>`)
            ).join("");
        }
        if (elements.quoteCompareSupplierFilter) {
            elements.quoteCompareSupplierFilter.innerHTML = ['<option value="">All suppliers</option>'].concat(
                supplierOptions.map((value) => `<option value="${escapeHtml(value)}" ${value === state.filters.supplier ? "selected" : ""}>${escapeHtml(value)}</option>`)
            ).join("");
        }
        if (elements.quoteCompareSearchInput) elements.quoteCompareSearchInput.value = state.filters.search || "";
        if (elements.quoteCompareBestOnlyToggle) elements.quoteCompareBestOnlyToggle.checked = Boolean(state.filters.bestOnly);
    }

    function renderEvaluation(elements, state) {
        const evaluation = state.evaluation;
        if (!evaluation) {
            renderFilterControls(elements, state);
            resetSummary(elements);
            return;
        }

        const summary = evaluation.summary || {};
        if (elements.quoteCompareRecommendationChip) {
            elements.quoteCompareRecommendationChip.textContent = summary.recommended_supplier ? `Recommended: ${summary.recommended_supplier}` : "Awaiting supplier bids";
        }
        if (elements.quoteCompareLowestPriceSupplier) {
            elements.quoteCompareLowestPriceSupplier.textContent = summary.lowest_price_supplier || "No bids yet";
        }
        if (elements.quoteCompareLowestPriceCopy) {
            elements.quoteCompareLowestPriceCopy.textContent = summary.lowest_price_supplier
                ? `${summary.lowest_price_supplier} currently has the lowest total at ${formatCurrency(summary.lowest_price_value, evaluation.currencies?.[0] || "USD")}.`
                : "The cheapest supplier offer in scope will appear here.";
        }
        if (elements.quoteCompareFastestDeliverySupplier) {
            elements.quoteCompareFastestDeliverySupplier.textContent = summary.fastest_delivery_supplier || "No bids yet";
        }
        if (elements.quoteCompareFastestDeliveryCopy) {
            elements.quoteCompareFastestDeliveryCopy.textContent = summary.fastest_delivery_supplier
                ? `${summary.fastest_delivery_supplier} leads on delivery timing with ${summary.fastest_delivery_value}.`
                : "The quickest delivery option will appear here.";
        }
        if (elements.quoteCompareBestPaymentSupplier) {
            elements.quoteCompareBestPaymentSupplier.textContent = summary.best_payment_supplier || "No bids yet";
        }
        if (elements.quoteCompareBestPaymentCopy) {
            elements.quoteCompareBestPaymentCopy.textContent = summary.best_payment_supplier
                ? `${summary.best_payment_supplier} offers the strongest payment term with ${summary.best_payment_value}.`
                : "The strongest payment position will appear here.";
        }
        if (elements.quoteCompareRecommendedSupplier) {
            elements.quoteCompareRecommendedSupplier.textContent = summary.recommended_supplier || "No recommendation yet";
        }
        if (elements.quoteCompareRecommendedCopy) {
            elements.quoteCompareRecommendedCopy.textContent = summary.recommended_reason || "A practical recommendation will appear once supplier bids are entered.";
        }
        if (elements.quoteCompareInsightsList) {
            elements.quoteCompareInsightsList.innerHTML = (evaluation.insights || []).length
                ? evaluation.insights.map((item, index) => `<article class="decision-item"><div class="decision-item-rank">#${index + 1}</div><div class="decision-item-body"><div class="decision-item-title">${escapeHtml(item)}</div></div></article>`).join("")
                : '<div class="decision-list-empty">Add supplier bids to generate a recommendation summary.</div>';
        }

        renderFilterControls(elements, state);
        const filteredProducts = getFilteredProducts(state);

        if (!elements.quoteCompareTableWrap) return;
        if (!filteredProducts.length) {
            elements.quoteCompareTableWrap.innerHTML = '<div class="decision-list-empty">No supplier offers match the current filters.</div>';
            return;
        }

        elements.quoteCompareTableWrap.innerHTML = filteredProducts.map((product) => {
            const displayBestOffer = (product.offers || []).find((offer) => (offer.badges || []).includes("Best Price")) || product.offers[0];
            return `
            <article class="quote-product-group">
                <div class="quote-product-group-head">
                    <div>
                        <div class="quote-product-group-title">${escapeHtml(product.product_name)}</div>
                        <div class="quote-product-group-meta">${escapeHtml(product.unit || "Unit not provided")} | ${product.offers.length} offer${product.offers.length === 1 ? "" : "s"} in view</div>
                    </div>
                    <div class="result-chip">Best price: ${escapeHtml(displayBestOffer?.supplier_name || product.best_offer_supplier)} (${formatCurrency(displayBestOffer?.total_price || product.best_offer_value, displayBestOffer?.currency || evaluation.currencies?.[0] || "USD")})</div>
                </div>
                <div class="quote-compare-table-scroll">
                    <table class="quote-compare-table">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                <th>Delivery</th>
                                <th>Payment</th>
                                <th>Valid Until</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${product.offers.map((offer) => `
                                <tr class="${(offer.badges || []).includes("Best Price") ? "is-best-offer" : ""}">
                                    <td>
                                        <div class="quote-offer-supplier">${escapeHtml(offer.supplier_name)}</div>
                                        <div class="quote-offer-badges">${(offer.badges || []).map((badge) => `<span class="quote-offer-badge">${escapeHtml(badge)}</span>`).join("") || '<span class="quote-offer-badge is-muted">Offer</span>'}</div>
                                    </td>
                                    <td>${escapeHtml(offer.quantity)} ${escapeHtml(offer.unit || "")}</td>
                                    <td>${formatCurrency(offer.unit_price, offer.currency)}</td>
                                    <td>${formatCurrency(offer.total_price, offer.currency)}</td>
                                    <td>${escapeHtml(offer.delivery_time || "Not provided")}</td>
                                    <td>${escapeHtml(offer.payment_term || "Not provided")}</td>
                                    <td>${escapeHtml(offer.valid_until || "Not provided")}</td>
                                    <td>${escapeHtml(offer.notes || "Not provided")}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </article>
        `;
        }).join("");
    }

    function getFilledBids(state) {
        return state.draft.bids.filter((bid) => Object.values(bid).some((value) => String(value || "").trim() !== ""));
    }

    function buildPayload(state, { requireComplete = false } = {}) {
        const bids = getFilledBids(state).map((bid) => {
            const quantity = Number(bid.quantity || 0);
            const unitPrice = Number(bid.unit_price || 0);
            const totalPrice = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : Number(bid.total_price || 0);
            return { ...bid, quantity, unit_price: unitPrice, total_price: totalPrice };
        });

        const completeBids = bids.filter(isValidBid);
        if (requireComplete && bids.length !== completeBids.length) {
            throw new Error("Complete each supplier offer before saving the comparison.");
        }
        if (!bids.length) return null;

        return {
            comparison_id: state.activeComparisonId,
            name: String(state.draft.name || "").trim(),
            sourcing_need: String(state.draft.sourcing_need || "").trim(),
            bids
        };
    }

    async function fetchJson(url, options = {}) {
        const response = await fetch(url, {
            method: options.method || "GET",
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {})
            },
            ...options
        });
        const data = await response.json();
        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "The quote comparison request could not be completed.");
        }
        return data;
    }

    async function loadBootstrap(elements, state) {
        const data = await fetchJson("/quote-compare/bootstrap");
        state.comparisons = (data.comparisons || []).map((comparison) => buildComparisonListItem(comparison));
        renderComparisonList(elements, state);
        renderEditor(elements, state);
    }

    async function calculateComparison(elements, state, { quiet = false } = {}) {
        const payload = buildPayload(state);
        if (!payload) {
            state.evaluation = null;
            renderEvaluation(elements, state);
            if (!quiet) setStatus(elements, "Add at least one supplier offer to evaluate the comparison.", "info");
            return;
        }

        const evaluablePayload = quiet
            ? {
                ...payload,
                bids: payload.bids.filter(isValidBid)
            }
            : payload;

        if (!evaluablePayload.bids.length) {
            state.evaluation = null;
            renderEvaluation(elements, state);
            return;
        }

        try {
            const data = await fetchJson("/quote-compare/evaluate", {
                method: "POST",
                body: JSON.stringify(evaluablePayload)
            });
            state.evaluation = data.evaluation || null;
            renderEvaluation(elements, state);
            if (!quiet) setStatus(elements, "Quote comparison updated.", "info");
        } catch (error) {
            state.evaluation = null;
            renderEvaluation(elements, state);
            if (!quiet) {
                setStatus(elements, error.message, "error");
            }
        }
    }

    function scheduleCalculation(elements, state) {
        window.clearTimeout(state.calculateTimer);
        state.calculateTimer = window.setTimeout(() => {
            calculateComparison(elements, state, { quiet: true });
        }, 220);
    }

    function openComparison(elements, state, comparisonId) {
        const comparison = state.comparisons.find((item) => item.comparison_id === comparisonId);
        if (!comparison) return;
        state.activeComparisonId = comparisonId;
        state.deleteConfirmVisible = false;
        state.isDemoMode = comparisonId === QUOTE_DEMO_COMPARISON_ID;
        state.intakeMode = "import";
        state.uploadReview = null;
        state.uploadFile = null;
        state.draft = clone(comparison);
        renderComparisonList(elements, state);
        renderEditor(elements, state);
        setStatus(elements, `Opened comparison: ${comparison.name}`, "info");
        calculateComparison(elements, state, { quiet: true });
    }

    function resetDraft(elements, state) {
        removeDemoComparison(state);
        state.activeComparisonId = null;
        state.deleteConfirmVisible = false;
        state.isDemoMode = false;
        state.intakeMode = "import";
        state.uploadReview = null;
        state.uploadFile = null;
        state.draft = createEmptyComparison();
        state.evaluation = null;
        state.filters = { search: "", product: "", supplier: "", bestOnly: false };
        renderComparisonList(elements, state);
        renderEditor(elements, state);
        renderEvaluation(elements, state);
    }

    async function saveComparison(elements, state) {
        let payload;
        try {
            payload = buildPayload(state, { requireComplete: true });
        } catch (error) {
            setStatus(elements, error.message, "error");
            return;
        }

        if (!payload) {
            setStatus(elements, "Add supplier offers before saving the comparison.", "error");
            return;
        }

        try {
            const data = await fetchJson("/quote-compare/save", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            removeDemoComparison(state);
            state.comparisons = (data.comparisons || []).map((comparison) => buildComparisonListItem(comparison));
            state.activeComparisonId = data.comparison?.comparison_id || state.activeComparisonId;
            state.draft = clone(data.comparison || state.draft);
            state.evaluation = data.evaluation || null;
            renderComparisonList(elements, state);
            renderEditor(elements, state);
            renderEvaluation(elements, state);
            setStatus(elements, data.message || "Comparison saved.", "success");
        } catch (error) {
            setStatus(elements, error.message, "error");
        }
    }

    async function deleteComparison(elements, state) {
        if (!state.activeComparisonId || state.isDeleting) return;
        state.isDeleting = true;
        renderEditor(elements, state);

        try {
            const data = await fetchJson("/quote-compare/delete", {
                method: "POST",
                body: JSON.stringify({ comparison_id: state.activeComparisonId })
            });
            state.comparisons = data.comparisons || [];
            resetDraft(elements, state);
            setStatus(elements, data.message || "Comparison deleted.", "success");
        } catch (error) {
            state.deleteConfirmVisible = true;
            setStatus(elements, error.message, "error");
        } finally {
            state.isDeleting = false;
            renderEditor(elements, state);
        }
    }

    async function inspectUpload(elements, state) {
        if (!state.uploadFile) {
            setStatus(elements, "Choose a supplier offer file before reviewing columns.", "error");
            return;
        }
        const formData = new FormData();
        formData.append("file", state.uploadFile);

        try {
            const response = await fetch("/quote-compare/upload/inspect", {
                method: "POST",
                body: formData,
                headers: { Accept: "application/json" }
            });
            const data = await response.json();
            if (!response.ok || data.success !== true) {
                throw new Error(data.message || "The supplier offer file could not be inspected.");
            }
            state.uploadReview = data;
            renderEditor(elements, state);
            setStatus(elements, "Review the detected quote field matches before importing.", "info");
        } catch (error) {
            state.uploadReview = null;
            renderEditor(elements, state);
            setStatus(elements, error.message, "error");
        }
    }

    async function loadDemoData(elements, state) {
        try {
            const data = await fetchJson("/quote-compare/demo-data", {
                method: "POST"
            });
            const demoComparison = buildComparisonListItem(
                {
                    ...(data.comparison || createEmptyComparison()),
                    comparison_id: QUOTE_DEMO_COMPARISON_ID,
                    updated_at: new Date().toISOString()
                },
                QUOTE_DEMO_COMPARISON_ID
            );
            upsertComparison(state, demoComparison);
            state.activeComparisonId = QUOTE_DEMO_COMPARISON_ID;
            state.deleteConfirmVisible = false;
            state.isDemoMode = true;
            state.intakeMode = "manual";
            state.uploadFile = null;
            state.uploadReview = null;
            state.draft = clone(demoComparison);
            state.evaluation = data.evaluation || null;
            renderComparisonList(elements, state);
            renderEditor(elements, state);
            renderEvaluation(elements, state);
            setStatus(elements, data.message || "Loaded demo supplier offers.", "success");
        } catch (error) {
            setStatus(elements, error.message, "error");
        }
    }

    function collectMappingSelections(elements, state) {
        const mapping = {};
        (state.uploadReview?.field_reviews || []).forEach((review) => {
            const field = review.field_name || review.field;
            if (!field) return;
            const select = Array.from(elements.quoteCompareMappingGrid?.querySelectorAll("[data-quote-mapping-field]") || [])
                .find((item) => item.dataset.quoteMappingField === field);
            mapping[field] = select ? select.value || null : state.uploadReview?.mapping?.[field] || null;
        });
        return mapping;
    }

    async function confirmUpload(elements, state) {
        if (!state.uploadFile || !state.uploadReview) {
            setStatus(elements, "Review a supplier offer file before importing.", "error");
            return;
        }

        const mapping = collectMappingSelections(elements, state);
        const missingFields = QUOTE_REQUIRED_FIELDS.filter((field) => !mapping[field]);
        if (missingFields.length) {
            if (elements.quoteCompareMappingMissingAlert) {
                elements.quoteCompareMappingMissingAlert.hidden = false;
                elements.quoteCompareMappingMissingAlert.textContent = `Map these required fields before importing: ${missingFields.join(", ")}.`;
            }
            setStatus(elements, "Map all required quote fields before importing.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", state.uploadFile);
        formData.append("mappings", JSON.stringify(mapping));

        try {
            const response = await fetch("/quote-compare/upload/confirm", {
                method: "POST",
                body: formData,
                headers: { Accept: "application/json" }
            });
            const data = await response.json();
            if (!response.ok || data.success !== true) {
                throw new Error(data.message || "The supplier offer file could not be imported.");
            }
            state.activeComparisonId = null;
            state.deleteConfirmVisible = false;
            state.isDemoMode = false;
            state.intakeMode = "manual";
            state.draft = clone(data.comparison || createEmptyComparison());
            state.evaluation = data.evaluation || null;
            state.uploadReview = null;
            renderEditor(elements, state);
            renderEvaluation(elements, state);
            setStatus(elements, data.message || "Supplier offers imported.", "success");
        } catch (error) {
            setStatus(elements, error.message, "error");
        }
    }

    function bindEvents(elements, state) {
        if (elements.newQuoteComparisonButton && elements.newQuoteComparisonButton.dataset.bound !== "true") {
            elements.newQuoteComparisonButton.dataset.bound = "true";
            elements.newQuoteComparisonButton.addEventListener("click", () => {
                resetDraft(elements, state);
                setStatus(elements, "Started a new quote comparison.", "info");
            });
        }

        if (elements.quoteSidebarToggleButton && elements.quoteSidebarToggleButton.dataset.bound !== "true") {
            elements.quoteSidebarToggleButton.dataset.bound = "true";
            elements.quoteSidebarToggleButton.addEventListener("click", () => {
                state.sidebarCollapsed = !state.sidebarCollapsed;
                renderSidebarPanel(elements, state);
            });
        }

        if (elements.quoteExitDemoButton && elements.quoteExitDemoButton.dataset.bound !== "true") {
            elements.quoteExitDemoButton.dataset.bound = "true";
            elements.quoteExitDemoButton.addEventListener("click", () => {
                resetDraft(elements, state);
                setStatus(elements, "Demo cleared. Start your own comparison.", "info");
            });
        }

        if (elements.quoteComparisonNameInput && elements.quoteComparisonNameInput.dataset.bound !== "true") {
            elements.quoteComparisonNameInput.dataset.bound = "true";
            elements.quoteComparisonNameInput.addEventListener("input", (event) => {
                state.draft.name = event.target.value;
            });
        }

        if (elements.quoteComparisonNeedInput && elements.quoteComparisonNeedInput.dataset.bound !== "true") {
            elements.quoteComparisonNeedInput.dataset.bound = "true";
            elements.quoteComparisonNeedInput.addEventListener("input", (event) => {
                state.draft.sourcing_need = event.target.value;
            });
        }

        if (elements.quoteCompareFileUpload && elements.quoteCompareFileUpload.dataset.bound !== "true") {
            elements.quoteCompareFileUpload.dataset.bound = "true";
            elements.quoteCompareFileUpload.addEventListener("change", (event) => {
                state.uploadFile = event.target.files?.[0] || null;
                state.uploadReview = null;
                renderEditor(elements, state);
            });
        }

        if (elements.quoteCompareSelectFileButton && elements.quoteCompareSelectFileButton.dataset.bound !== "true") {
            elements.quoteCompareSelectFileButton.dataset.bound = "true";
            elements.quoteCompareSelectFileButton.addEventListener("click", () => {
                elements.quoteCompareFileUpload?.click();
            });
        }

        [
            ["quoteImportModeButton", "import"],
            ["quoteManualModeButton", "manual"]
        ].forEach(([elementKey, mode]) => {
            const button = elements[elementKey];
            if (!button || button.dataset.bound === "true") return;
            button.dataset.bound = "true";
            button.addEventListener("click", () => {
                state.intakeMode = mode;
                renderEditor(elements, state);
            });
        });

        if (elements.inspectQuoteCompareUploadButton && elements.inspectQuoteCompareUploadButton.dataset.bound !== "true") {
            elements.inspectQuoteCompareUploadButton.dataset.bound = "true";
            elements.inspectQuoteCompareUploadButton.addEventListener("click", () => inspectUpload(elements, state));
        }

        if (elements.quoteCompareDemoButton && elements.quoteCompareDemoButton.dataset.bound !== "true") {
            elements.quoteCompareDemoButton.dataset.bound = "true";
            elements.quoteCompareDemoButton.addEventListener("click", () => loadDemoData(elements, state));
        }

        if (elements.quoteCompareChangeFileButton && elements.quoteCompareChangeFileButton.dataset.bound !== "true") {
            elements.quoteCompareChangeFileButton.dataset.bound = "true";
            elements.quoteCompareChangeFileButton.addEventListener("click", () => {
                state.uploadReview = null;
                state.uploadFile = null;
                if (elements.quoteCompareFileUpload) elements.quoteCompareFileUpload.value = "";
                renderEditor(elements, state);
            });
        }

        if (elements.confirmQuoteCompareMappingButton && elements.confirmQuoteCompareMappingButton.dataset.bound !== "true") {
            elements.confirmQuoteCompareMappingButton.dataset.bound = "true";
            elements.confirmQuoteCompareMappingButton.addEventListener("click", () => confirmUpload(elements, state));
        }

        if (elements.quoteCompareMappingGrid && elements.quoteCompareMappingGrid.dataset.bound !== "true") {
            elements.quoteCompareMappingGrid.dataset.bound = "true";
            elements.quoteCompareMappingGrid.addEventListener("change", (event) => {
                const select = event.target.closest("[data-quote-mapping-field]");
                if (!select || !state.uploadReview) return;
                state.uploadReview.mapping = state.uploadReview.mapping || {};
                state.uploadReview.mapping[select.dataset.quoteMappingField] = select.value || null;
                const missingFields = QUOTE_REQUIRED_FIELDS.filter((field) => !state.uploadReview.mapping[field]);
                state.uploadReview.missing_fields = missingFields;
                state.uploadReview.matched_fields = QUOTE_REQUIRED_FIELDS.length - missingFields.length;
                renderMappingReview(elements, state);
            });
        }

        if (elements.addQuoteBidButton && elements.addQuoteBidButton.dataset.bound !== "true") {
            elements.addQuoteBidButton.dataset.bound = "true";
            elements.addQuoteBidButton.addEventListener("click", () => {
                state.draft.bids.push(createEmptyBid());
                renderEditor(elements, state);
            });
        }

        if (elements.quoteBidsList && elements.quoteBidsList.dataset.bound !== "true") {
            elements.quoteBidsList.dataset.bound = "true";
            elements.quoteBidsList.addEventListener("click", (event) => {
                const removeButton = event.target.closest("[data-remove-bid]");
                if (!removeButton) return;
                const index = Number(removeButton.dataset.removeBid);
                state.draft.bids.splice(index, 1);
                if (!state.draft.bids.length) state.draft.bids.push(createEmptyBid());
                renderEditor(elements, state);
                scheduleCalculation(elements, state);
            });

            elements.quoteBidsList.addEventListener("input", (event) => {
                const field = event.target.dataset.field;
                const index = Number(event.target.dataset.index);
                if (!field || Number.isNaN(index) || !state.draft.bids[index]) return;
                state.draft.bids[index][field] = event.target.value;
                syncEditorChrome(elements, state);
                updateBidRowComputedFields(event.target.closest(".quote-bid-row"), state.draft.bids[index]);
                scheduleCalculation(elements, state);
            });
        }

        if (elements.recalculateQuoteComparisonButton && elements.recalculateQuoteComparisonButton.dataset.bound !== "true") {
            elements.recalculateQuoteComparisonButton.dataset.bound = "true";
            elements.recalculateQuoteComparisonButton.addEventListener("click", () => calculateComparison(elements, state));
        }

        if (elements.saveQuoteComparisonButton && elements.saveQuoteComparisonButton.dataset.bound !== "true") {
            elements.saveQuoteComparisonButton.dataset.bound = "true";
            elements.saveQuoteComparisonButton.addEventListener("click", () => saveComparison(elements, state));
        }

        if (elements.deleteQuoteComparisonButton && elements.deleteQuoteComparisonButton.dataset.bound !== "true") {
            elements.deleteQuoteComparisonButton.dataset.bound = "true";
            elements.deleteQuoteComparisonButton.addEventListener("click", () => {
                if (!state.activeComparisonId || state.isDeleting) return;
                state.deleteConfirmVisible = true;
                renderEditor(elements, state);
                setStatus(elements);
            });
        }

        if (elements.quoteDeleteConfirmHost && elements.quoteDeleteConfirmHost.dataset.bound !== "true") {
            elements.quoteDeleteConfirmHost.dataset.bound = "true";
            elements.quoteDeleteConfirmHost.addEventListener("click", (event) => {
                const cancelButton = event.target.closest("[data-quote-delete-cancel]");
                if (cancelButton) {
                    state.deleteConfirmVisible = false;
                    renderEditor(elements, state);
                    return;
                }

                const confirmButton = event.target.closest("[data-quote-delete-confirm]");
                if (confirmButton) {
                    deleteComparison(elements, state);
                }
            });
        }

        if (elements.quoteComparisonList && elements.quoteComparisonList.dataset.bound !== "true") {
            elements.quoteComparisonList.dataset.bound = "true";
            elements.quoteComparisonList.addEventListener("click", (event) => {
                const button = event.target.closest("[data-open-comparison]");
                if (!button) return;
                openComparison(elements, state, button.dataset.openComparison || "");
            });
        }

        [
            ["quoteCompareSearchInput", "search", "value", "input"],
            ["quoteCompareProductFilter", "product", "value", "change"],
            ["quoteCompareSupplierFilter", "supplier", "value", "change"],
            ["quoteCompareBestOnlyToggle", "bestOnly", "checked", "change"]
        ].forEach(([elementKey, stateKey, property, eventName]) => {
            const element = elements[elementKey];
            if (!element || element.dataset.bound === "true") return;
            element.dataset.bound = "true";
            element.addEventListener(eventName, (event) => {
                state.filters[stateKey] = event.target[property];
                renderEvaluation(elements, state);
            });
        });
    }

    async function initQuoteCompare() {
        const elements = getElements();
        if (!elements.quoteCompareShell) return;

        const state = createState();
        renderComparisonList(elements, state);
        renderEditor(elements, state);
        renderEvaluation(elements, state);
        bindEvents(elements, state);

        try {
            await loadBootstrap(elements, state);
            await calculateComparison(elements, state, { quiet: true });
        } catch (error) {
            setStatus(elements, error.message, "error");
        }
    }

    document.addEventListener("DOMContentLoaded", initQuoteCompare);
})();
