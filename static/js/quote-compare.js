(function () {
    const REQUIRED_FIELDS = ["Product Name", "Supplier", "Unit", "Quantity", "Unit Price", "Date"];
    const OPTIONAL_FIELDS = ["Currency", "Delivery Time", "Payment Terms", "Valid Until", "Notes"];
    const FIELD_HELP = {
        "Product Name": "Choose the product, item, material, or description column.",
        "Supplier": "Choose the supplier, vendor, company, or seller column.",
        "Unit": "Choose the purchase unit, UOM, pack, or package column.",
        "Quantity": "Choose the quantity, qty, amount, or ordered quantity column.",
        "Unit Price": "Choose the unit price, price, cost, or rate column.",
        "Date": "Choose the price, purchase, invoice, or transaction date column.",
        "Currency": "Optional. Use this when the file includes a currency code like USD or EUR.",
        "Delivery Time": "Optional. Use this for lead time or delivery timing.",
        "Payment Terms": "Optional. Use this for Net 30, Net 45, or similar terms.",
        "Valid Until": "Optional. Use this for expiry or validity dates.",
        "Notes": "Optional. Use this for freight, MOQ, quality, or commercial notes."
    };
    const HIGH_CONFIDENCE_MATCHES = new Set(["exact", "alias", "strong"]);
    const QUOTE_COMPARE_SCROLL_KEY = "quote_compare_scroll_v1";
    const QUOTE_COMPARE_STATE_KEY = "quote_compare_state_v1";
    const QUOTE_COMPARE_ACTIVE_SESSION_KEY = "quote_compare_active_session_v1";
    const QUOTE_COMPARE_HISTORY_COLUMNS_KEY = "quote_compare_history_columns_v1";
    const QUOTE_COMPARE_HISTORY_COLUMNS_ORDER_KEY = "quote_compare_history_columns_order_v1";
    const HISTORY_COLUMN_DEFINITIONS = [
        { key: "quoteDate", label: "Date", essential: true, headerClassName: "qc2-history-cell-date", cellClassName: "qc2-history-cell-date", render: (row) => escapeHtml(formatDate(row.quoteDate || row.createdAt)) },
        { key: "productName", label: "Product", essential: true, headerClassName: "qc2-history-cell-product", cellClassName: "qc2-history-cell-product", render: (row) => escapeHtml(row.productName) },
        { key: "supplier", label: "Supplier", essential: true, headerClassName: "qc2-history-cell-supplier", cellClassName: "qc2-history-cell-supplier", render: (row) => escapeHtml(row.supplier) },
        { key: "unit", label: "Unit", essential: false, headerClassName: "qc2-history-cell-unit", cellClassName: "qc2-history-cell-unit", render: (row) => escapeHtml(row.unit || "-") },
        { key: "quantity", label: "Qty", essential: false, headerClassName: "qc2-history-cell-quantity", cellClassName: "qc2-history-cell-quantity", render: (row) => escapeHtml(String(row.quantity || 0)) },
        { key: "unitPrice", label: "Unit Price", essential: false, headerClassName: "qc2-history-cell-unitPrice", cellClassName: "qc2-history-cell-unitPrice", render: (row) => escapeHtml(formatCurrency(row.unitPrice, row.currency)) },
        { key: "totalPrice", label: "Total", essential: false, headerClassName: "qc2-history-cell-totalPrice", cellClassName: "qc2-history-cell-totalPrice", render: (row) => escapeHtml(formatCurrency(row.totalPrice, row.currency)) },
        { key: "changeValue", label: "Change", essential: false, headerClassName: "qc2-history-cell-changeValue", cellClassName: "qc2-history-cell-changeValue", toneClassName: (row) => row.changeValue == null ? "" : row.changeValue > 0 ? "qc2-change-negative" : row.changeValue < 0 ? "qc2-change-positive" : "", render: (row) => row.changeValue == null ? "--" : escapeHtml(formatCurrency(row.changeValue, row.currency)) },
        { key: "changePercent", label: "Change %", essential: false, headerClassName: "qc2-history-cell-changePercent", cellClassName: "qc2-history-cell-changePercent", toneClassName: (row) => row.changePercent == null ? "" : row.changePercent > 0 ? "qc2-change-negative" : row.changePercent < 0 ? "qc2-change-positive" : "", render: (row) => row.changePercent == null ? "--" : escapeHtml(formatPercent(row.changePercent)) }
    ];
    const OPPORTUNITY_CARD_PALETTE = [
        {
            border: "rgba(96, 165, 250, 0.24)",
            glow: "rgba(59, 130, 246, 0.16)",
            badgeBg: "rgba(59, 130, 246, 0.16)",
            badgeText: "#dbeafe",
            laneBorder: "rgba(96, 165, 250, 0.18)",
            laneBestBorder: "rgba(125, 211, 252, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(30, 64, 175, 0.30), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(96, 165, 250, 0.22)",
            savingsText: "#93c5fd"
        },
        {
            border: "rgba(52, 211, 153, 0.24)",
            glow: "rgba(16, 185, 129, 0.14)",
            badgeBg: "rgba(16, 185, 129, 0.16)",
            badgeText: "#d1fae5",
            laneBorder: "rgba(52, 211, 153, 0.18)",
            laneBestBorder: "rgba(110, 231, 183, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(6, 95, 70, 0.30), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(52, 211, 153, 0.22)",
            savingsText: "#86efac"
        },
        {
            border: "rgba(251, 191, 36, 0.24)",
            glow: "rgba(245, 158, 11, 0.14)",
            badgeBg: "rgba(245, 158, 11, 0.16)",
            badgeText: "#fef3c7",
            laneBorder: "rgba(251, 191, 36, 0.18)",
            laneBestBorder: "rgba(252, 211, 77, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(146, 64, 14, 0.28), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(251, 191, 36, 0.22)",
            savingsText: "#fcd34d"
        },
        {
            border: "rgba(244, 114, 182, 0.24)",
            glow: "rgba(236, 72, 153, 0.14)",
            badgeBg: "rgba(236, 72, 153, 0.16)",
            badgeText: "#fce7f3",
            laneBorder: "rgba(244, 114, 182, 0.18)",
            laneBestBorder: "rgba(249, 168, 212, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(157, 23, 77, 0.28), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(244, 114, 182, 0.22)",
            savingsText: "#f9a8d4"
        },
        {
            border: "rgba(167, 139, 250, 0.24)",
            glow: "rgba(139, 92, 246, 0.14)",
            badgeBg: "rgba(139, 92, 246, 0.16)",
            badgeText: "#ede9fe",
            laneBorder: "rgba(167, 139, 250, 0.18)",
            laneBestBorder: "rgba(196, 181, 253, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(91, 33, 182, 0.28), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(167, 139, 250, 0.22)",
            savingsText: "#c4b5fd"
        },
        {
            border: "rgba(248, 113, 113, 0.24)",
            glow: "rgba(239, 68, 68, 0.14)",
            badgeBg: "rgba(239, 68, 68, 0.16)",
            badgeText: "#fee2e2",
            laneBorder: "rgba(248, 113, 113, 0.18)",
            laneBestBorder: "rgba(252, 165, 165, 0.24)",
            decisionBg: "linear-gradient(135deg, rgba(153, 27, 27, 0.28), rgba(15, 23, 42, 0.78))",
            decisionBorder: "rgba(248, 113, 113, 0.22)",
            savingsText: "#fca5a5"
        }
    ];

    function getElements() {
        return {
            workspace: document.getElementById("quoteCompareWorkspaceView"),
            shell: document.getElementById("quoteCompareShell"),
            app: document.getElementById("quoteCompareApp"),
            quoteDataScopeSummary: document.getElementById("quoteDataScopeSummary")
        };
    }

    function createManualUploadId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }
        return `manual-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    }

    function setQuoteCompareReady(elements, isReady) {
        if (!elements.workspace) return;
        elements.workspace.setAttribute("data-qc-ready", isReady ? "true" : "false");
    }

    async function refreshSharedScopeSummary(elements, state) {
        if (!elements.quoteDataScopeSummary) {
            return;
        }
        try {
            const data = await fetchJson("/analysis/scope-bootstrap");
            state.dataScopeSummary = data.scope_summary || null;
            const summary = state.dataScopeSummary || {};
            const rowCount = Number(summary.row_count || 0);
            const productCount = Number(summary.product_count || 0);
            const scopeLabel = summary.scope_label || "Current File";
            elements.quoteDataScopeSummary.textContent = rowCount
                ? `${scopeLabel} • ${productCount} products • ${rowCount} rows`
                : `${scopeLabel} • No analyzed file yet`;
        } catch (error) {
            elements.quoteDataScopeSummary.textContent = "Current File";
        }
    }

    function setSharedAnalysisAvailability(hasAnalysis) {
        const value = hasAnalysis ? "true" : "false";
        const mainDashboardView = document.getElementById("mainDashboardView");
        const recipesWorkspaceState = document.getElementById("recipesWorkspaceState");
        if (mainDashboardView) {
            mainDashboardView.dataset.hasAnalysis = value;
        }
        if (recipesWorkspaceState) {
            recipesWorkspaceState.dataset.hasAnalysis = value;
        }
    }

    async function activateCurrentUploadScope(elements, state) {
        state.dataScope = "current_upload";
        setSharedAnalysisAvailability(true);
        await refreshSharedScopeSummary(elements, state);
        window.dispatchEvent(new CustomEvent("shared-analysis-context-updated", {
            detail: {
                scope: "current_upload",
                uploadId: state.analysisResult?.comparison?.upload_id || state.activeSessionId || state.manualUploadId || ""
            }
        }));
    }

    function findScrollableParent(node) {
        let current = node?.parentElement || null;
        while (current) {
            const styles = window.getComputedStyle(current);
            const overflowY = styles.overflowY || styles.overflow || "";
            if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    function getScrollContext(elements) {
        const container = findScrollableParent(elements.shell);
        if (container) {
            return { type: "element", target: container };
        }
        return { type: "window", target: document.scrollingElement || document.documentElement };
    }

    function readScrollPosition(elements) {
        const context = getScrollContext(elements);
        return context.type === "element"
            ? context.target.scrollTop
            : window.scrollY || context.target.scrollTop || 0;
    }

    function writeScrollPosition(elements, top) {
        const context = getScrollContext(elements);
        const nextTop = Math.max(Number(top) || 0, 0);
        if (context.type === "element") {
            context.target.scrollTo({ top: nextTop, behavior: "auto" });
            return;
        }
        window.scrollTo({ top: nextTop, behavior: "auto" });
    }

    function getAnchorOffset(elements, selector) {
        if (!selector || !elements.app) return null;
        const anchor = elements.app.querySelector(selector);
        if (!anchor) return null;
        const context = getScrollContext(elements);
        if (context.type === "element") {
            const containerTop = context.target.getBoundingClientRect().top;
            return anchor.getBoundingClientRect().top - containerTop;
        }
        return anchor.getBoundingClientRect().top;
    }

    function restoreAnchorOffset(elements, selector, previousOffset) {
        if (!selector || previousOffset == null || !elements.app) return;
        const anchor = elements.app.querySelector(selector);
        if (!anchor) return;
        const context = getScrollContext(elements);
        const currentOffset = context.type === "element"
            ? anchor.getBoundingClientRect().top - context.target.getBoundingClientRect().top
            : anchor.getBoundingClientRect().top;
        const delta = currentOffset - previousOffset;
        if (Math.abs(delta) < 1) return;
        const currentTop = readScrollPosition(elements);
        writeScrollPosition(elements, currentTop + delta);
    }

    function getDefaultHistoryColumnKeys() {
        return HISTORY_COLUMN_DEFINITIONS.map((column) => column.key);
    }

    function getDefaultHistorySort() {
        return { key: "", direction: null };
    }

    function normalizeHistoryColumnKeys(value) {
        const validKeys = new Set(getDefaultHistoryColumnKeys());
        const essentialKeys = HISTORY_COLUMN_DEFINITIONS.filter((column) => column.essential).map((column) => column.key);
        const requestedKeys = Array.isArray(value) ? value.filter((key) => validKeys.has(key)) : [];
        const requestedSet = new Set(requestedKeys);
        essentialKeys.forEach((key) => requestedSet.add(key));
        return HISTORY_COLUMN_DEFINITIONS
            .map((column) => column.key)
            .filter((key) => requestedSet.has(key));
    }

    function normalizeHistoryColumnOrder(value) {
        const validKeys = new Set(getDefaultHistoryColumnKeys());
        const requestedKeys = Array.isArray(value) ? value.filter((key) => validKeys.has(key)) : [];
        const orderedKeys = [];
        requestedKeys.forEach((key) => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });
        getDefaultHistoryColumnKeys().forEach((key) => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });
        return orderedKeys;
    }

    function normalizeHistorySort(value) {
        const validKeys = new Set(getDefaultHistoryColumnKeys());
        if (!value || typeof value !== "object") return getDefaultHistorySort();
        const key = validKeys.has(value.key) ? value.key : "";
        const direction = value.direction === "asc" || value.direction === "desc" ? value.direction : null;
        if (!key || !direction) {
            return getDefaultHistorySort();
        }
        return { key, direction };
    }

    function persistHistoryColumnPreferences(state) {
        try {
            localStorage.setItem(QUOTE_COMPARE_HISTORY_COLUMNS_KEY, JSON.stringify({
                visibleKeys: normalizeHistoryColumnKeys(state.historyColumnVisibility)
            }));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function hydrateHistoryColumnPreferences(state, snapshot) {
        if (!snapshot || typeof snapshot !== "object") return;
        state.historyColumnVisibility = normalizeHistoryColumnKeys(snapshot.visibleKeys);
    }

    function restoreHistoryColumnPreferences(state) {
        try {
            const snapshot = JSON.parse(localStorage.getItem(QUOTE_COMPARE_HISTORY_COLUMNS_KEY) || "null");
            hydrateHistoryColumnPreferences(state, snapshot);
        } catch (error) {
            // Ignore invalid preference payloads.
        }
    }

    function persistHistoryColumnOrder(state) {
        try {
            localStorage.setItem(QUOTE_COMPARE_HISTORY_COLUMNS_ORDER_KEY, JSON.stringify({
                order: normalizeHistoryColumnOrder(state.historyColumnOrder)
            }));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function restoreHistoryColumnOrder(state) {
        try {
            const snapshot = JSON.parse(localStorage.getItem(QUOTE_COMPARE_HISTORY_COLUMNS_ORDER_KEY) || "null");
            state.historyColumnOrder = normalizeHistoryColumnOrder(snapshot?.order || state.historyColumnOrder);
        } catch (error) {
            // Ignore invalid preference payloads.
        }
    }

    function getVisibleHistoryColumns(state) {
        const visibleKeys = new Set(normalizeHistoryColumnKeys(state.historyColumnVisibility));
        const orderedKeys = normalizeHistoryColumnOrder(state.historyColumnOrder);
        return orderedKeys
            .map((key) => HISTORY_COLUMN_DEFINITIONS.find((column) => column.key === key))
            .filter((column) => column && visibleKeys.has(column.key));
    }

    function setHistoryColumnVisibility(state, columnKey, isVisible) {
        const column = HISTORY_COLUMN_DEFINITIONS.find((item) => item.key === columnKey);
        if (!column || column.essential) return;
        const current = new Set(normalizeHistoryColumnKeys(state.historyColumnVisibility));
        if (isVisible) {
            current.add(columnKey);
        } else {
            current.delete(columnKey);
        }
        state.historyColumnVisibility = HISTORY_COLUMN_DEFINITIONS
            .map((item) => item.key)
            .filter((key) => current.has(key));
        persistHistoryColumnPreferences(state);
    }

    function cycleHistorySort(state, columnKey) {
        const currentSort = normalizeHistorySort(state.historySort);
        if (currentSort.key !== columnKey) {
            state.historySort = { key: columnKey, direction: "asc" };
            return;
        }
        if (currentSort.direction === "asc") {
            state.historySort = { key: columnKey, direction: "desc" };
            return;
        }
        state.historySort = getDefaultHistorySort();
    }

    function getHistorySortIndicator(state, columnKey) {
        const currentSort = normalizeHistorySort(state.historySort);
        if (currentSort.key !== columnKey || !currentSort.direction) return "";
        return currentSort.direction === "asc" ? " ^" : " v";
    }

    function getHistorySortValue(row, key) {
        switch (key) {
            case "quoteDate":
                return Number(row.effectiveTimestamp) || 0;
            case "productName":
                return String(row.productName || "");
            case "supplier":
                return String(row.supplier || "");
            case "unit":
                return String(row.unit || "");
            case "quantity":
                return Number(row.quantity);
            case "unitPrice":
                return Number(row.unitPrice);
            case "totalPrice":
                return Number(row.totalPrice);
            case "changeValue":
                return Number(row.changeValue);
            case "changePercent":
                return Number(row.changePercent);
            default:
                return null;
        }
    }

    function compareHistorySortRows(left, right, key, direction) {
        const leftValue = getHistorySortValue(left, key);
        const rightValue = getHistorySortValue(right, key);
        const leftMissing = leftValue == null || leftValue === "" || Number.isNaN(leftValue);
        const rightMissing = rightValue == null || rightValue === "" || Number.isNaN(rightValue);

        if (leftMissing && rightMissing) return 0;
        if (leftMissing) return 1;
        if (rightMissing) return -1;

        let comparison = 0;
        if (typeof leftValue === "string" || typeof rightValue === "string") {
            comparison = String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: "base" });
        } else {
            comparison = Number(leftValue) - Number(rightValue);
        }

        if (comparison === 0) return 0;
        return direction === "desc" ? comparison * -1 : comparison;
    }

    function getHistorySortIndicator(state, columnKey) {
        const currentSort = normalizeHistorySort(state.historySort);
        if (currentSort.key !== columnKey || !currentSort.direction) return "";
        return currentSort.direction === "asc" ? " ^" : " v";
    }

    function getHistorySortValue(row, key) {
        switch (key) {
            case "quoteDate":
                return Number.isFinite(row.effectiveTimestamp) ? row.effectiveTimestamp : null;
            case "productName":
                return String(row.productName || "");
            case "supplier":
                return String(row.supplier || "");
            case "unit":
                return String(row.unit || "");
            case "quantity":
                return Number(row.quantity);
            case "unitPrice":
                return Number(row.unitPrice);
            case "totalPrice":
                return Number(row.totalPrice);
            case "changeValue":
                return Number(row.changeValue);
            case "changePercent":
                return Number(row.changePercent);
            default:
                return null;
        }
    }

    function getHistoryDisplayRows(state, rows) {
        const memo = getHistoryMemo(state);
        const currentSort = normalizeHistorySort(state.historySort);
        if (!currentSort.key || !currentSort.direction) {
            return rows;
        }
        const displayKey = `${currentSort.key}|${currentSort.direction}`;
        if (memo.displayRowsRef === rows && memo.displayKey === displayKey && Array.isArray(memo.displayRows)) {
            return memo.displayRows;
        }
        const displayRows = rows
            .map((row, index) => ({ row, index }))
            .sort((left, right) => {
                const comparison = compareHistorySortRows(left.row, right.row, currentSort.key, currentSort.direction);
                if (comparison !== 0) return comparison;
                return left.index - right.index;
            })
            .map((item) => item.row);
        memo.displayRowsRef = rows;
        memo.displayKey = displayKey;
        memo.displayRows = displayRows;
        return displayRows;
    }

    function getHistorySeriesKey(productName, unit) {
        return `${String(productName || "").trim()}__${String(unit || "").trim()}`;
    }

    function getHistorySeriesRows(rows, seriesKey) {
        if (!seriesKey) return [];
        return (Array.isArray(rows) ? rows : []).filter((row) => getHistorySeriesKey(row.productName, row.unit) === seriesKey);
    }

    function getHistoryFullSeriesRows(state, seriesKey) {
        return getHistorySeriesRows(getHistoryDataset(state), seriesKey)
            .slice()
            .sort((left, right) => {
                if (left.effectiveTimestamp !== right.effectiveTimestamp) return left.effectiveTimestamp - right.effectiveTimestamp;
                return left.supplier.localeCompare(right.supplier);
            });
    }

    function setHistorySelectedSeries(state, rows, seriesKey, rowId = "") {
        const selectedRows = getHistoryFullSeriesRows(state, seriesKey);
        state.historySelectedSeriesKey = seriesKey || "";
        state.historySelectedRows = selectedRows;
        state.historySelectedProductName = selectedRows[0]?.productName || "";
        state.historySelectedUnit = selectedRows[0]?.unit || "";
        state.historySelectedRowId = rowId || "";
    }

    function openHistoryDetailModal(state, seriesRows, useFullSeries = false) {
        const rows = Array.isArray(seriesRows) ? seriesRows.slice().sort((left, right) => {
            if (left.effectiveTimestamp !== right.effectiveTimestamp) return left.effectiveTimestamp - right.effectiveTimestamp;
            return left.supplier.localeCompare(right.supplier);
        }) : [];
        state.historyDetailModalOpen = rows.length > 0;
        state.historyDetailModalSeries = rows.length ? {
            key: getHistorySeriesKey(rows[0].productName, rows[0].unit),
            productName: rows[0].productName,
            unit: rows[0].unit,
            rows,
            usesFullSeries: Boolean(useFullSeries)
        } : null;
    }

    function closeHistoryDetailModal(state) {
        state.historyDetailModalOpen = false;
        state.historyDetailModalSeries = null;
    }

    function getHistoryTableScroller(elements) {
        return elements.app?.querySelector("[data-qc-history-table-scroll]") || null;
    }

    function scheduleHistoryDetailChartRender(elements, state) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                renderHistoryDetailChart(elements, state);
            });
        });
    }

    function restoreHistoryTablePosition(elements, pageScrollTop, tableScrollTop) {
        requestAnimationFrame(() => {
            writeScrollPosition(elements, pageScrollTop);
            const nextTableScroller = getHistoryTableScroller(elements);
            if (nextTableScroller) {
                nextTableScroller.scrollTop = tableScrollTop;
            }
        });
    }

    function shouldScrollToHistoryTrend(elements) {
        const trendSection = elements.app?.querySelector("[data-qc-history-trend-content]");
        if (!trendSection) return false;
        const rect = trendSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        return rect.top < 120 || rect.bottom > viewportHeight - 80;
    }

    function clearHistorySelectedSeries(state) {
        state.historySelectedSeriesKey = "";
        state.historySelectedProductName = "";
        state.historySelectedUnit = "";
        state.historySelectedRowId = "";
        state.historySelectedRows = [];
    }

    function getHistoryVolatilityLabel(rows) {
        const prices = rows.map((row) => Number(row.unitPrice)).filter(Number.isFinite);
        if (!prices.length) return "Low";
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (!minPrice) return "Low";
        const volatilityRatio = (maxPrice - minPrice) / minPrice;
        if (volatilityRatio >= 0.2) return "High";
        if (volatilityRatio >= 0.08) return "Medium";
        return "Low";
    }

    function buildHistorySeriesSummary(rows) {
        if (!rows.length) {
            return {
                latestUnitPrice: null,
                latestUnitPriceSupplier: "",
                latestUnitPriceDate: "",
                earliestUnitPrice: null,
                earliestUnitPriceSupplier: "",
                earliestUnitPriceDate: "",
                lowestUnitPrice: null,
                lowestUnitPriceSupplier: "",
                lowestUnitPriceDate: "",
                highestUnitPrice: null,
                highestUnitPriceSupplier: "",
                highestUnitPriceDate: "",
                currentVsBestUnitPrice: null,
                currentVsBestLabel: "",
                netChange: null,
                netChangePercent: null,
                averageUnitPrice: null,
                movementCount: 0,
                supplierCount: 0,
                supplierNames: [],
                firstDate: "",
                latestDate: ""
            };
        }
        const sortedRows = rows.slice().sort((left, right) => {
            if (left.effectiveTimestamp !== right.effectiveTimestamp) return left.effectiveTimestamp - right.effectiveTimestamp;
            return left.supplier.localeCompare(right.supplier);
        });
        const prices = sortedRows.map((row) => Number(row.unitPrice)).filter(Number.isFinite);
        const first = sortedRows[0];
        const latest = sortedRows[sortedRows.length - 1];
        const lowestUnitPrice = prices.length ? Math.min(...prices) : null;
        const lowestPriceRow = lowestUnitPrice == null
            ? null
            : [...sortedRows].reverse().find((row) => Number(row.unitPrice) === lowestUnitPrice) || null;
        const highestUnitPrice = prices.length ? Math.max(...prices) : null;
        const highestPriceRow = highestUnitPrice == null
            ? null
            : [...sortedRows].reverse().find((row) => Number(row.unitPrice) === highestUnitPrice) || null;
        const averageUnitPrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null;
        const netChange = Number.isFinite(first.unitPrice) && Number.isFinite(latest.unitPrice) ? latest.unitPrice - first.unitPrice : null;
        const netChangePercent = netChange != null && first.unitPrice ? (netChange / first.unitPrice) * 100 : null;
        const currentVsBestUnitPrice = latest && lowestPriceRow && Number.isFinite(latest.unitPrice) && Number.isFinite(lowestPriceRow.unitPrice)
            ? Math.max(Number(latest.unitPrice) - Number(lowestPriceRow.unitPrice), 0)
            : null;
        const supplierNames = Array.from(new Set(sortedRows.map((row) => row.supplier).filter(Boolean)));
        return {
            latestUnitPrice: latest.unitPrice,
            latestUnitPriceSupplier: latest.supplier || "",
            latestUnitPriceDate: formatDate(latest.quoteDate || latest.createdAt),
            earliestUnitPrice: first.unitPrice,
            earliestUnitPriceSupplier: first.supplier || "",
            earliestUnitPriceDate: formatDate(first.quoteDate || first.createdAt),
            lowestUnitPrice,
            lowestUnitPriceSupplier: lowestPriceRow?.supplier || "",
            lowestUnitPriceDate: lowestPriceRow ? formatDate(lowestPriceRow.quoteDate || lowestPriceRow.createdAt) : "",
            highestUnitPrice,
            highestUnitPriceSupplier: highestPriceRow?.supplier || "",
            highestUnitPriceDate: highestPriceRow ? formatDate(highestPriceRow.quoteDate || highestPriceRow.createdAt) : "",
            currentVsBestUnitPrice,
            currentVsBestLabel: currentVsBestUnitPrice === 0
                ? "Matches best recorded price"
                : `${latest.supplier || "Current supplier"} above best recorded price`,
            netChange,
            netChangePercent,
            averageUnitPrice,
            movementCount: sortedRows.length,
            supplierCount: supplierNames.length,
            supplierNames,
            firstDate: formatDate(first.quoteDate || first.createdAt),
            latestDate: formatDate(latest.quoteDate || latest.createdAt)
        };
    }

    function buildHistorySeriesInsights(rows) {
        if (!rows.length) return [];
        const summary = buildHistorySeriesSummary(rows);
        const sortedRows = rows.slice().sort((left, right) => left.effectiveTimestamp - right.effectiveTimestamp);
        const first = sortedRows[0];
        const latest = sortedRows[sortedRows.length - 1];
        const lowestRow = summary.lowestUnitPrice == null
            ? null
            : [...sortedRows].reverse().find((row) => Number(row.unitPrice) === Number(summary.lowestUnitPrice)) || null;
        const highestRow = summary.highestUnitPrice == null
            ? null
            : [...sortedRows].reverse().find((row) => Number(row.unitPrice) === Number(summary.highestUnitPrice)) || null;
        const visibleCurrency = latest?.currency || first?.currency || "USD";
        return [
            lowestRow
                ? `Best recorded price: ${formatCurrency(lowestRow.unitPrice || 0, lowestRow.currency || visibleCurrency)} from ${lowestRow.supplier || "Supplier missing"} on ${formatDate(lowestRow.quoteDate || lowestRow.createdAt)}.`
                : "Best recorded price is not available.",
            highestRow
                ? `Highest observed price: ${formatCurrency(highestRow.unitPrice || 0, highestRow.currency || visibleCurrency)} from ${highestRow.supplier || "Supplier missing"} on ${formatDate(highestRow.quoteDate || highestRow.createdAt)}.`
                : "Highest observed price is not available.",
            latest && lowestRow && Number(latest.unitPrice) === Number(lowestRow.unitPrice)
                ? "Current supplier is already at the best price."
                : `Current supplier is ${summary.currentVsBestUnitPrice == null ? "--" : formatCurrency(summary.currentVsBestUnitPrice, visibleCurrency)} above the best recorded price.`,
            `Price volatility is ${getHistoryVolatilityLabel(sortedRows).toLowerCase()} across ${summary.movementCount} movements.`
        ];
    }

    function renderHistoryDetailChartFallback(elements, message) {
        const shell = elements.app?.querySelector(".qc2-history-chart-shell");
        if (!shell) return;
        shell.innerHTML = `<div class="decision-list-empty">${escapeHtml(message)}</div>`;
    }

    function renderHistoryDetailSvgChart(elements, rows) {
        const shell = elements.app?.querySelector(".qc2-history-chart-shell");
        if (!shell || !rows.length) return;

        const prices = rows.map((row) => Number(row.unitPrice)).filter(Number.isFinite);
        if (!prices.length) {
            renderHistoryDetailChartFallback(elements, "Chart unavailable for this series.");
            return;
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;
        const width = 900;
        const height = 320;
        const paddingX = 36;
        const paddingY = 28;
        const innerWidth = width - paddingX * 2;
        const innerHeight = height - paddingY * 2;
        const stepX = rows.length > 1 ? innerWidth / (rows.length - 1) : 0;
        const points = rows.map((row, index) => {
            const value = Number(row.unitPrice);
            const x = paddingX + (stepX * index);
            const y = paddingY + innerHeight - (((value - minPrice) / priceRange) * innerHeight);
            return { x, y, value, row };
        });
        const linePath = points
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
            .join(" ");
        const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - paddingY).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - paddingY).toFixed(2)} Z`;

        shell.innerHTML = `
            <svg class="qc2-history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Selected product unit price trend chart" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="qc2HistoryDetailLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="rgba(147, 197, 253, 1)" />
                        <stop offset="100%" stop-color="rgba(56, 189, 248, 0.32)" />
                    </linearGradient>
                    <linearGradient id="qc2HistoryDetailFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="rgba(96, 165, 250, 0.18)" />
                        <stop offset="100%" stop-color="rgba(56, 189, 248, 0.02)" />
                    </linearGradient>
                </defs>
                <path d="${areaPath}" fill="url(#qc2HistoryDetailFill)"></path>
                <path d="${linePath}" fill="none" stroke="url(#qc2HistoryDetailLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
                ${points.map((point) => `
                    <g>
                        <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="4" fill="#dbeafe" stroke="#ffffff" stroke-width="2"></circle>
                        <title>${escapeHtml(`${formatDate(point.row.effectiveDate)} | ${point.row.supplier || "Supplier missing"} | ${formatCurrency(point.value, point.row.currency)}`)}</title>
                    </g>
                `).join("")}
            </svg>
        `;
    }

    function renderHistoryDetailChart(elements, state, attempt = 0) {
        const modalSeriesRows = Array.isArray(state.historyDetailModalSeries?.rows) ? state.historyDetailModalSeries.rows : [];
        if (!state.historyDetailModalOpen || !modalSeriesRows.length) return;
        const validRows = modalSeriesRows
            .filter((row) => row.effectiveDate && Number.isFinite(Number(row.unitPrice)))
            .sort((left, right) => {
                const leftTime = new Date(left.effectiveDate).getTime();
                const rightTime = new Date(right.effectiveDate).getTime();
                if (leftTime !== rightTime) return leftTime - rightTime;
                return left.supplier.localeCompare(right.supplier);
            });
        if (!validRows.length) {
            renderHistoryDetailChartFallback(elements, "Chart unavailable for this series.");
            return;
        }
        if (typeof Chart === "undefined") {
            if (attempt < 6) {
                requestAnimationFrame(() => renderHistoryDetailChart(elements, state, attempt + 1));
            } else {
                renderHistoryDetailSvgChart(elements, validRows);
            }
            return;
        }
        const canvas = elements.app?.querySelector("[data-qc-history-detail-chart]");
        if (!canvas) {
            if (attempt < 6) {
                requestAnimationFrame(() => renderHistoryDetailChart(elements, state, attempt + 1));
            } else {
                renderHistoryDetailSvgChart(elements, validRows);
            }
            return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
            if (attempt < 6) {
                requestAnimationFrame(() => renderHistoryDetailChart(elements, state, attempt + 1));
            } else {
                renderHistoryDetailSvgChart(elements, validRows);
            }
            return;
        }
        if ((!canvas.clientWidth || !canvas.clientHeight) && attempt < 6) {
            requestAnimationFrame(() => renderHistoryDetailChart(elements, state, attempt + 1));
            return;
        }
        if (window.qcHistoryDetailChartInstance) {
            window.qcHistoryDetailChartInstance.destroy();
            window.qcHistoryDetailChartInstance = null;
        }
        if (state.historyDetailChart) {
            state.historyDetailChart.destroy();
            state.historyDetailChart = null;
        }
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        const themeText = "rgba(226, 232, 240, 0.84)";
        const themeGrid = "rgba(148, 163, 184, 0.10)";
        state.historyDetailChart = new Chart(context, {
            type: "line",
            data: {
                labels: validRows.map((row) => formatDate(row.effectiveDate)),
                datasets: [{
                    label: "Unit Price",
                    data: validRows.map((row) => Number(row.unitPrice)),
                    tension: 0.35,
                    borderWidth: 3,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBorderWidth: 2,
                    pointBackgroundColor: "#dbeafe",
                    pointBorderColor: "#ffffff",
                    pointHoverBackgroundColor: "#ffffff",
                    pointHoverBorderColor: "#7dd3fc",
                    fill: true,
                    borderColor(chartContext) {
                        const { chart } = chartContext;
                        const area = chart.chartArea;
                        if (!area) return "#7dd3fc";
                        const gradient = chart.ctx.createLinearGradient(area.left, area.top, area.left, area.bottom);
                        gradient.addColorStop(0, "rgba(147, 197, 253, 1)");
                        gradient.addColorStop(1, "rgba(56, 189, 248, 0.28)");
                        return gradient;
                    },
                    backgroundColor(chartContext) {
                        const { chart } = chartContext;
                        const area = chart.chartArea;
                        if (!area) return "rgba(56, 189, 248, 0.12)";
                        const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                        gradient.addColorStop(0, "rgba(96, 165, 250, 0.20)");
                        gradient.addColorStop(1, "rgba(56, 189, 248, 0.02)");
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 720,
                    easing: "easeOutQuart"
                },
                interaction: {
                    mode: "nearest",
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false,
                        backgroundColor: "rgba(15, 23, 42, 0.96)",
                        borderColor: "rgba(125, 167, 255, 0.20)",
                        borderWidth: 1,
                        padding: 12,
                        titleColor: "#f8fafc",
                        bodyColor: "#dbeafe",
                        callbacks: {
                            title(items) {
                                return items[0]?.label || "";
                            },
                            label(context) {
                                const row = validRows[context.dataIndex];
                                return [
                                    `Supplier: ${row.supplier || "Supplier missing"}`,
                                    `Unit Price: ${formatCurrency(row.unitPrice, row.currency)}`,
                                    `Quantity: ${row.quantity || 0}`,
                                    `Total: ${formatCurrency(row.totalPrice, row.currency)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: themeGrid,
                            drawBorder: false
                        },
                        ticks: {
                            color: themeText,
                            maxRotation: 0,
                            autoSkip: true
                        }
                    },
                    y: {
                        grid: {
                            color: themeGrid,
                            display: false
                        },
                        ticks: {
                            color: themeText,
                            callback(value) {
                                return formatCurrency(Number(value), validRows[validRows.length - 1]?.currency || "USD");
                            }
                        }
                    }
                }
            }
        });
        window.qcHistoryDetailChartInstance = state.historyDetailChart;
    }

    function renderHistorySeriesChart(rows) {
        if (!rows.length) {
            return '<div class="decision-list-empty">No movement points are available for this series.</div>';
        }
        return `
            <div class="qc2-history-chart-shell">
                <canvas class="qc2-history-chart" data-qc-history-detail-chart aria-label="Selected product unit price trend chart"></canvas>
            </div>
        `;
    }

    function getHistoryHeaderSortDirection(state, columnKey) {
        const currentSort = normalizeHistorySort(state.historySort);
        if (currentSort.key !== columnKey || !currentSort.direction) return null;
        return currentSort.direction;
    }

    function getHistoryHeaderSortIndicator(state, columnKey) {
        const direction = getHistoryHeaderSortDirection(state, columnKey);
        if (direction === "asc") return "↑";
        if (direction === "desc") return "↓";
        return "↕";
    }

    function getHistoryHeaderSortHint(state, columnKey) {
        const direction = getHistoryHeaderSortDirection(state, columnKey);
        if (direction === "asc") return "Sorted ascending";
        if (direction === "desc") return "Sorted descending";
        return "Click to sort";
    }

    function getHistoryHeaderAriaSort(state, columnKey) {
        const direction = getHistoryHeaderSortDirection(state, columnKey);
        if (direction === "asc") return "ascending";
        if (direction === "desc") return "descending";
        return "none";
    }

    function moveHistoryColumn(state, draggedKey, targetKey) {
        if (!draggedKey || !targetKey || draggedKey === targetKey) return false;
        const orderedKeys = normalizeHistoryColumnOrder(state.historyColumnOrder);
        const draggedIndex = orderedKeys.indexOf(draggedKey);
        const targetIndex = orderedKeys.indexOf(targetKey);
        if (draggedIndex < 0 || targetIndex < 0) return false;
        orderedKeys.splice(draggedIndex, 1);
        orderedKeys.splice(targetIndex, 0, draggedKey);
        state.historyColumnOrder = orderedKeys;
        persistHistoryColumnOrder(state);
        return true;
    }

    function scrollHistorySectionIntoView(elements) {
        if (!elements.app) return;
        const anchor = elements.app.querySelector('[data-qc-anchor="history-top"]');
        if (!anchor) return;
        const context = getScrollContext(elements);
        if (context.type === "element") {
            const containerRect = context.target.getBoundingClientRect();
            const anchorRect = anchor.getBoundingClientRect();
            const nextTop = context.target.scrollTop + (anchorRect.top - containerRect.top);
            context.target.scrollTo({ top: Math.max(nextTop, 0), behavior: "auto" });
            return;
        }
        const nextTop = (window.scrollY || context.target.scrollTop || 0) + anchor.getBoundingClientRect().top;
        window.scrollTo({ top: Math.max(nextTop, 0), behavior: "auto" });
    }

    function buildPersistedState(state) {
        return {
            currentScreen: state.currentScreen,
            lastFlowScreen: state.lastFlowScreen,
            mode: state.mode,
            analyzeMode: state.analyzeMode,
            analysisResult: state.analysisResult,
            uploadReview: state.uploadReview,
            headers: state.headers,
            rows: state.rows,
            detectedMappings: state.detectedMappings,
            selectedMappings: state.selectedMappings,
            activeSessionId: state.activeSessionId,
            manualUploadId: state.manualUploadId,
            historyFilters: state.historyFilters,
            historyFocusedSeriesKey: state.historyFocusedSeriesKey,
            historyColumnVisibility: state.historyColumnVisibility,
            historyColumnOrder: state.historyColumnOrder,
            historySort: state.historySort,
            historySelectedSeriesKey: state.historySelectedSeriesKey,
            historySelectedProductName: state.historySelectedProductName,
            historySelectedUnit: state.historySelectedUnit,
            historySelectedRowId: state.historySelectedRowId,
            historyDetailModalOpen: state.historyDetailModalOpen,
            historyDetailModalSeries: state.historyDetailModalSeries,
            savedComparisons: state.savedComparisons,
            collapsedDecisionCards: state.collapsedDecisionCards,
            selectedAnalysisRowKey: state.selectedAnalysisRowKey,
            analysisTableFilter: state.analysisTableFilter,
            analysisTableSearch: state.analysisTableSearch,
            activeAnalyzeTab: state.activeAnalyzeTab,
            showOpportunitySection: state.showOpportunitySection,
            showFullComparison: state.showFullComparison,
            showOptimizedSummary: state.showOptimizedSummary,
            fullComparisonTableScroll: state.fullComparisonTableScroll,
            previousAnalyzeTab: state.previousAnalyzeTab,
            manualRows: state.manualRows,
            status: state.status
        };
    }

    function persistQuoteCompareSession(state, elements) {
        try {
            sessionStorage.setItem(QUOTE_COMPARE_STATE_KEY, JSON.stringify(buildPersistedState(state)));
            sessionStorage.setItem(QUOTE_COMPARE_SCROLL_KEY, JSON.stringify({ top: readScrollPosition(elements) }));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function scheduleQuoteCompareSessionPersist(state, elements) {
        window.clearTimeout(state.persistSessionTimer);
        state.persistSessionTimer = window.setTimeout(() => {
            persistQuoteCompareSession(state, elements);
        }, 180);
    }

    function clearPersistedQuoteCompareState() {
        try {
            sessionStorage.removeItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY);
            sessionStorage.removeItem(QUOTE_COMPARE_STATE_KEY);
            sessionStorage.removeItem(QUOTE_COMPARE_SCROLL_KEY);
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function resetQuoteCompareUploadState(state, message = "") {
        state.file = null;
        state.headers = [];
        state.rows = [];
        state.detectedMappings = {};
        state.selectedMappings = {};
        state.validation = { mappedCount: 0, missingFields: [...REQUIRED_FIELDS], duplicateColumns: [], ready: false };
        state.analysisResult = null;
        state.uploadReview = null;
        state.activeSessionId = "";
        state.manualUploadId = createManualUploadId();
        state.productSummaryModalOpen = false;
        state.productSummaryModalData = null;
        state.parseError = "";
        state.isParsing = false;
        state.isSubmitting = false;
        state.currentScreen = "start";
        state.lastFlowScreen = "review";
        clearPersistedQuoteCompareState();
        if (message) {
            setStatus(state, message, "info");
        }
    }

    function hydratePersistedState(state, snapshot) {
        if (!snapshot || typeof snapshot !== "object") return;
        state.currentScreen = snapshot.currentScreen || state.currentScreen;
        state.lastFlowScreen = snapshot.lastFlowScreen || state.lastFlowScreen;
        state.mode = snapshot.mode || state.mode;
        state.analyzeMode = snapshot.analyzeMode || state.analyzeMode;
        state.analysisResult = snapshot.analysisResult || state.analysisResult;
        state.uploadReview = snapshot.uploadReview || state.uploadReview;
        state.headers = snapshot.headers || state.headers;
        state.rows = snapshot.rows || state.rows;
        state.detectedMappings = snapshot.detectedMappings || state.detectedMappings;
        state.selectedMappings = snapshot.selectedMappings || state.selectedMappings;
        state.activeSessionId = snapshot.activeSessionId || state.activeSessionId;
        state.manualUploadId = snapshot.manualUploadId || state.manualUploadId;
        state.historyFilters = { ...state.historyFilters, ...(snapshot.historyFilters || {}) };
        state.historyFocusedSeriesKey = snapshot.historyFocusedSeriesKey || state.historyFocusedSeriesKey;
        state.historyColumnVisibility = normalizeHistoryColumnKeys(snapshot.historyColumnVisibility || state.historyColumnVisibility);
        state.historyColumnOrder = normalizeHistoryColumnOrder(snapshot.historyColumnOrder || state.historyColumnOrder);
        state.historySort = normalizeHistorySort(snapshot.historySort || state.historySort);
        state.historySelectedSeriesKey = snapshot.historySelectedSeriesKey || state.historySelectedSeriesKey;
        state.historySelectedProductName = snapshot.historySelectedProductName || state.historySelectedProductName;
        state.historySelectedUnit = snapshot.historySelectedUnit || state.historySelectedUnit;
        state.historySelectedRowId = snapshot.historySelectedRowId || state.historySelectedRowId;
        state.historyDetailModalOpen = Boolean(snapshot.historyDetailModalOpen);
        state.historyDetailModalSeries = snapshot.historyDetailModalSeries || state.historyDetailModalSeries;
        state.savedComparisons = Array.isArray(snapshot.savedComparisons) ? snapshot.savedComparisons : state.savedComparisons;
        state.collapsedDecisionCards = snapshot.collapsedDecisionCards || state.collapsedDecisionCards;
        state.selectedAnalysisRowKey = snapshot.selectedAnalysisRowKey || state.selectedAnalysisRowKey;
        state.analysisTableFilter = snapshot.analysisTableFilter || state.analysisTableFilter;
        state.analysisTableSearch = snapshot.analysisTableSearch || state.analysisTableSearch;
        state.activeAnalyzeTab = snapshot.activeAnalyzeTab || state.activeAnalyzeTab;
        state.showOpportunitySection = snapshot.showOpportunitySection !== false;
        state.showFullComparison = Boolean(snapshot.showFullComparison);
        state.showOptimizedSummary = Boolean(snapshot.showOptimizedSummary);
        state.fullComparisonTableScroll = snapshot.fullComparisonTableScroll || state.fullComparisonTableScroll;
        state.previousAnalyzeTab = snapshot.previousAnalyzeTab || state.previousAnalyzeTab;
        state.manualRows = Array.isArray(snapshot.manualRows) && snapshot.manualRows.length ? snapshot.manualRows : state.manualRows;
        state.status = snapshot.status || state.status;
        state.qcHistoryData = [];
    }

    function restoreQuoteCompareSession(state) {
        try {
            const snapshot = JSON.parse(sessionStorage.getItem(QUOTE_COMPARE_STATE_KEY) || "null");
            hydratePersistedState(state, snapshot);
        } catch (error) {
            // Ignore invalid session payloads.
        }
    }

    function restoreHistoryUiPreferences(state) {
        restoreHistoryColumnPreferences(state);
        restoreHistoryColumnOrder(state);
    }

    function restoreQuoteCompareScroll(elements) {
        let savedTop = null;
        try {
            const saved = JSON.parse(sessionStorage.getItem(QUOTE_COMPARE_SCROLL_KEY) || "null");
            savedTop = Number(saved?.top);
        } catch (error) {
            savedTop = null;
        }
        if (!Number.isFinite(savedTop)) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                writeScrollPosition(elements, savedTop);
            });
        });
    }

    function isValidSelectedMappingSet(selectedMappings, headers) {
        if (!selectedMappings || typeof selectedMappings !== "object") return false;
        const headerSet = new Set(Array.isArray(headers) ? headers : []);
        return Object.values(selectedMappings).every((columnName) => !columnName || headerSet.has(columnName));
    }

    function isValidRestorableReviewSession(activeSession) {
        const dataframe = activeSession?.dataframe;
        const hasHydratedDataframe = Boolean(
            dataframe
            && Array.isArray(dataframe.columns)
            && dataframe.columns.length
            && Array.isArray(dataframe.records)
        );
        const hasCachedUpload = Boolean(String(activeSession?.cached_upload_path || activeSession?.file_path || "").trim());
        return Boolean(
            activeSession
            && Array.isArray(activeSession.headers)
            && activeSession.headers.length
            && (hasHydratedDataframe || hasCachedUpload)
        );
    }

    function isValidRestorableAnalyzeSession(activeSession) {
        return Boolean(
            isValidRestorableReviewSession(activeSession)
            && activeSession.step === "analyze"
            && activeSession.comparison
            && activeSession.evaluation
        );
    }

    function hasRestorableReviewContext(state) {
        return Boolean(
            state
            && Array.isArray(state.headers)
            && state.headers.length
            && state.uploadReview
        );
    }

    function hasRestorableAnalyzeContext(state) {
        return Boolean(
            hasRestorableReviewContext(state)
            && state.analysisResult
            && state.analysisResult.comparison
            && state.analysisResult.evaluation
        );
    }

    function hasRestorableQuoteCompareContext(state) {
        return hasRestorableAnalyzeContext(state) || hasRestorableReviewContext(state);
    }

    async function fetchActiveQuoteCompareSession(sessionId) {
        if (!sessionId) return null;
        const data = await fetchJson(`/quote-compare/bootstrap?session_id=${encodeURIComponent(sessionId)}`);
        return data.active_session || null;
    }

    function openDateInputPicker(input) {
        if (!input || input.disabled) return;
        input.focus({ preventScroll: true });
        if (typeof input.showPicker === "function") {
            try {
                input.showPicker();
                return;
            } catch (error) {
                // Fall back to native click behavior below.
            }
        }
        input.click();
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
        const numericValue = Number(value || 0);
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericValue);
        } catch (error) {
            return `$${numericValue.toFixed(2)}`;
        }
    }

    function formatPercent(value) {
        return `${Number(value || 0).toFixed(1)}%`;
    }

    function parseDateValue(value, options = {}) {
        if (!value) return null;
        const normalizedValue = value instanceof Date ? value : String(value).trim();
        if (!normalizedValue) return null;
        if (normalizedValue instanceof Date) {
            const parsedDate = new Date(normalizedValue.getTime());
            if (options.endOfDay) parsedDate.setHours(23, 59, 59, 999);
            if (options.startOfDay) parsedDate.setHours(0, 0, 0, 0);
            return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
        }

        const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
            const [, yearText, monthText, dayText] = dateOnlyMatch;
            const year = Number(yearText);
            const monthIndex = Number(monthText) - 1;
            const day = Number(dayText);
            const parsedDate = options.endOfDay
                ? new Date(year, monthIndex, day, 23, 59, 59, 999)
                : new Date(year, monthIndex, day, 0, 0, 0, 0);
            return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
        }

        const parsed = new Date(normalizedValue);
        if (Number.isNaN(parsed.getTime())) return null;
        if (options.endOfDay) parsed.setHours(23, 59, 59, 999);
        if (options.startOfDay) parsed.setHours(0, 0, 0, 0);
        return parsed;
    }

    function formatDate(value) {
        const parsed = parseDateValue(value);
        if (!parsed) return "Not provided";
        return parsed.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function createEmptyManualRow() {
        return {
            product_name: "",
            supplier_name: "",
            unit: "",
            quantity: "",
            unit_price: "",
            quote_date: "",
            total_price: "",
            currency: "USD",
            delivery_time: "",
            payment_term: "",
            valid_until: "",
            notes: ""
        };
    }

    function createState() {
        return {
            currentScreen: "start",
            lastFlowScreen: "review",
            mode: "upload",
            analyzeMode: "compare",
            file: null,
            headers: [],
            rows: [],
            detectedMappings: {},
            selectedMappings: {},
            validation: { mappedCount: 0, missingFields: [...REQUIRED_FIELDS], duplicateColumns: [], ready: false },
            analysisResult: null,
            uploadReview: null,
            activeSessionId: "",
            manualUploadId: createManualUploadId(),
            dataScopeSummary: null,
            parseError: "",
            status: { message: "", tone: "" },
            isParsing: false,
            isSubmitting: false,
            isSaving: false,
            isHistoryLoading: false,
            manualRows: [createEmptyManualRow()],
            savedComparisons: [],
            qcHistoryData: [],
            hasLoadedSavedComparisons: false,
            collapsedDecisionCards: {},
            selectedAnalysisRowKey: "",
            analysisTableFilter: "all",
            analysisTableSearch: "",
            activeAnalyzeTab: "savings",
            showOpportunitySection: true,
            showFullComparison: false,
            showOptimizedSummary: false,
            fullComparisonTableScroll: { top: 0, left: 0 },
            previousAnalyzeTab: "savings",
            historyColumnVisibility: getDefaultHistoryColumnKeys(),
            historyColumnOrder: getDefaultHistoryColumnKeys(),
            historySort: getDefaultHistorySort(),
            historyDrag: { key: "", suppressClick: false },
            historySelectedSeriesKey: "",
            historySelectedProductName: "",
            historySelectedUnit: "",
            historySelectedRowId: "",
            historyFocusedSeriesKey: "",
            historySelectedRows: [],
            historyDetailModalOpen: false,
            historyDetailModalSeries: null,
            productSummaryModalOpen: false,
            productSummaryModalData: null,
            historyDetailChart: null,
            historyRowClickTimer: null,
            historyFilters: {
                product: "",
                supplier: "",
                dateFrom: "",
                dateTo: ""
            },
            persistSessionTimer: null,
            analysisFilterTimer: null,
            historyRefreshFrame: 0,
            historyMemo: null
        };
    }

    async function fetchJson(url, options = {}) {
        const fetchStartedAt = performance.now();
        console.info("[quote compare fetch start]", {
            url,
            method: options.method || "GET"
        });
        const response = await fetch(url, {
            method: options.method || "GET",
            headers: {
                Accept: "application/json",
                ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {})
            },
            body: options.body
        });
        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }
        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Request failed.");
        }
        console.info("[quote compare fetch end]", {
            url,
            method: options.method || "GET",
            durationMs: Number((performance.now() - fetchStartedAt).toFixed(1))
        });
        return data;
    }

    function setStatus(state, message = "", tone = "") {
        state.status = { message, tone };
    }

    function renderStatus(state) {
        if (!state.status.message) return "";
        return `<div class="recipe-status${state.status.tone ? ` is-${escapeHtml(state.status.tone)}` : ""}">${escapeHtml(state.status.message)}</div>`;
    }

    function waitForNextPaint() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    }

    function computeValidation(state) {
        const mapping = state.selectedMappings || {};
        const missingFields = REQUIRED_FIELDS.filter((fieldName) => !mapping[fieldName]);
        const duplicates = Object.entries(mapping).reduce((accumulator, [fieldName, columnName]) => {
            if (!columnName) return accumulator;
            accumulator[columnName] = accumulator[columnName] || [];
            accumulator[columnName].push(fieldName);
            return accumulator;
        }, {});
        const duplicateColumns = Object.entries(duplicates)
            .filter(([, fieldNames]) => fieldNames.length > 1)
            .map(([columnName, fieldNames]) => ({ columnName, fieldNames }));

        state.validation = {
            mappedCount: REQUIRED_FIELDS.length - missingFields.length,
            missingFields,
            duplicateColumns,
            ready: missingFields.length === 0 && duplicateColumns.length === 0
        };
    }

    function isHighConfidenceReview(review) {
        return HIGH_CONFIDENCE_MATCHES.has(String(review?.match_quality || "").toLowerCase());
    }

    function buildReviewMap(state) {
        return new Map(
            (state.uploadReview?.field_reviews || [])
                .map((item) => [item.field_name || item.field || "", item])
                .filter(([fieldName]) => Boolean(fieldName))
        );
    }

    function buildAutoMappings(state, { includePossible = false } = {}) {
        const reviewMap = buildReviewMap(state);
        const autoMappings = {};
        const usedColumns = new Set();
        [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((fieldName) => {
            const review = reviewMap.get(fieldName) || {};
            const detectedColumn = review.detected_column || state.detectedMappings?.[fieldName] || "";
            const canUseDetected = detectedColumn && (includePossible || isHighConfidenceReview(review));
            if (!canUseDetected || usedColumns.has(detectedColumn)) {
                autoMappings[fieldName] = "";
                return;
            }
            autoMappings[fieldName] = detectedColumn;
            usedColumns.add(detectedColumn);
        });
        return autoMappings;
    }

    function applyAutoMappings(state, options = {}) {
        state.selectedMappings = buildAutoMappings(state, options);
        computeValidation(state);
    }

    function clearMappings(state) {
        state.selectedMappings = Object.fromEntries(
            [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((fieldName) => [fieldName, ""])
        );
        computeValidation(state);
    }

    function initializeReviewState(state, payload) {
        state.uploadReview = payload;
        state.headers = payload.available_columns || payload.headers || [];
        state.detectedMappings = { ...(payload.mapping || {}) };
        applyAutoMappings(state);
    }

    async function inspectUpload(state) {
        if (!state.file) {
            setStatus(state, "Choose a supplier file before reviewing mappings.", "error");
            return false;
        }
        const inspectStartedAt = performance.now();
        state.isParsing = true;
        state.parseError = "";
        setStatus(state, "Parsing uploaded headers and detecting likely matches.", "info");
        const formData = new FormData();
        formData.append("file", state.file);
        try {
            const fetchStartedAt = performance.now();
            const response = await fetch("/quote-compare/upload/inspect", {
                method: "POST",
                headers: {
                    Accept: "application/json"
                },
                body: formData
            });
            const fetchFinishedAt = performance.now();
            let data = {};
            try {
                data = await response.json();
            } catch (error) {
                data = {};
            }
            const jsonFinishedAt = performance.now();
            if (!response.ok || data.success === false) {
                throw new Error(data.message || "Request failed.");
            }
            initializeReviewState(state, data);
            const reviewInitializedAt = performance.now();
            state.activeSessionId = data.session_id || "";
            if (state.activeSessionId) {
                sessionStorage.setItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY, state.activeSessionId);
            }
            state.isParsing = false;
            setStatus(state, `Headers detected for ${state.file.name}.`, "success");
            console.info("[quote compare inspect timing]", {
                fileName: state.file.name,
                fetchMs: Number((fetchFinishedAt - fetchStartedAt).toFixed(1)),
                jsonParseMs: Number((jsonFinishedAt - fetchFinishedAt).toFixed(1)),
                initializeReviewMs: Number((reviewInitializedAt - jsonFinishedAt).toFixed(1)),
                totalInspectMs: Number((reviewInitializedAt - inspectStartedAt).toFixed(1)),
                headerCount: Array.isArray(data.headers) ? data.headers.length : 0,
                fieldReviewCount: Array.isArray(data.field_reviews) ? data.field_reviews.length : 0
            });
            return true;
        } catch (error) {
            state.isParsing = false;
            state.headers = [];
            state.rows = [];
            state.uploadReview = null;
            state.detectedMappings = {};
            state.selectedMappings = {};
            state.validation = { mappedCount: 0, missingFields: [...REQUIRED_FIELDS], duplicateColumns: [], ready: false };
            state.parseError = error.message;
            setStatus(state, error.message, "error");
            return false;
        }
    }

    function getReviewRows(state) {
        const reviewMap = buildReviewMap(state);
        return [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((fieldName) => {
            const review = reviewMap.get(fieldName) || {};
            const detectedColumn = review.detected_column || state.detectedMappings[fieldName] || "";
            const selectedColumn = state.selectedMappings[fieldName] || "";
            return {
                fieldName,
                helpText: FIELD_HELP[fieldName] || (state.mode === "manual"
                    ? "Choose the matching column from the entered pricing data."
                    : "Choose the matching column from the uploaded file."),
                detectedColumn,
                selectedColumn,
                detectedQuality: review.match_quality || (detectedColumn ? "possible" : "missing"),
                autoDetected: Boolean(selectedColumn && detectedColumn && selectedColumn === detectedColumn && isHighConfidenceReview(review)),
                required: REQUIRED_FIELDS.includes(fieldName)
            };
        });
    }

    function buildManualPayload(state) {
        const incompleteTouchedRows = state.manualRows.filter((row) => isManualRowTouched(row) && getManualRowMissingFields(row).length > 0);
        if (incompleteTouchedRows.length) {
            throw new Error("Complete all required manual fields before starting analysis.");
        }

        const bids = getManualNormalizedRows(state);

        if (!bids.length) {
            throw new Error("Add at least one complete supplier price row before starting analysis.");
        }

        return {
            upload_id: state.manualUploadId,
            name: `Manual Pricing Analysis ${new Date().toLocaleDateString("en-US")}`,
            sourcing_need: "",
            source_type: "manual",
            bids,
            weighting: null
        };
    }

    function getSupplierKey(value) {
        return String(value || "").trim().toLowerCase();
    }

    function compareOffersByRecency(left, right) {
        const leftDate = parseDateValue(left.quote_date);
        const rightDate = parseDateValue(right.quote_date);
        if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) return rightDate - leftDate;
        if (leftDate) return -1;
        if (rightDate) return 1;
        return (right._sourceIndex || 0) - (left._sourceIndex || 0);
    }

    function compareOffersByPrice(left, right) {
        if (left.total_price !== right.total_price) return left.total_price - right.total_price;
        if (left.unit_price !== right.unit_price) return left.unit_price - right.unit_price;
        return compareOffersByRecency(left, right);
    }

    function compareOffersByUnitPrice(left, right) {
        if (left.unit_price !== right.unit_price) return left.unit_price - right.unit_price;
        if (left.total_price !== right.total_price) return left.total_price - right.total_price;
        return compareOffersByRecency(left, right);
    }

    function normalizeQuantityContext(quantity) {
        const numericQuantity = Number(quantity || 0);
        return Number.isFinite(numericQuantity) ? numericQuantity.toFixed(4) : "";
    }

    function getProductUnitKey(productName, unit) {
        return `${String(productName || "").trim()}__${String(unit || "").trim()}`;
    }

    function isSameOffer(left, right) {
        if (!left || !right) return false;
        return Number(left._sourceIndex || -1) === Number(right._sourceIndex || -2);
    }

    function buildProductSummaryStats(offers, productName, unit) {
        const offersByRecency = [...offers].sort(compareOffersByRecency);
        const offersByOldest = [...offers].sort((left, right) => compareOffersByRecency(right, left));
        const offersByUnitPrice = [...offers].sort(compareOffersByUnitPrice);
        const lowestObservedOffer = offersByUnitPrice[0] || null;
        const highestObservedOffer = [...offersByUnitPrice].reverse()[0] || null;
        const latestObservedOffer = offersByRecency[0] || null;
        const earliestObservedOffer = offersByOldest[0] || null;
        const averageObservedUnitPrice = offers.length
            ? offers.reduce((sum, offer) => sum + Number(offer.unit_price || 0), 0) / offers.length
            : 0;

        return {
            key: getProductUnitKey(productName, unit),
            productName,
            unit,
            offers: offersByRecency,
            lowestObservedOffer,
            highestObservedOffer,
            latestObservedOffer,
            earliestObservedOffer,
            averageObservedUnitPrice,
            supplierCount: new Set(offers.map((offer) => getSupplierKey(offer.supplier_name)).filter(Boolean)).size
        };
    }

    function buildDecisionCards(comparison) {
        const bids = comparison?.bids || [];
        const grouped = new Map();
        const productOfferMap = new Map();

        bids.forEach((bid, index) => {
            const product = String(bid.product_name || "").trim();
            const unit = String(bid.unit || "").trim();
            if (!product) return;
            const normalizedBid = {
                ...bid,
                _sourceIndex: index,
                quantity: Number(bid.quantity || 0),
                unit_price: Number(bid.unit_price || 0),
                total_price: Number(bid.total_price || 0) || Number(bid.quantity || 0) * Number(bid.unit_price || 0)
            };
            const productUnitKey = getProductUnitKey(product, unit);
            if (!productOfferMap.has(productUnitKey)) productOfferMap.set(productUnitKey, []);
            productOfferMap.get(productUnitKey).push(normalizedBid);
            const quantityKey = normalizeQuantityContext(bid.quantity);
            const key = `${product}__${unit}__${quantityKey}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(normalizedBid);
        });

        const productSummaries = new Map(
            Array.from(productOfferMap.entries()).map(([key, offers]) => {
                const [productName, unit] = key.split("__");
                return [key, buildProductSummaryStats(offers, productName, unit)];
            })
        );

        return Array.from(grouped.values())
            .map((offers) => {
                const offersByRecency = [...offers].sort(compareOffersByRecency);
                const currentOffer = offersByRecency[0] || null;
                const productSummary = productSummaries.get(getProductUnitKey(currentOffer?.product_name, currentOffer?.unit)) || buildProductSummaryStats(offers, currentOffer?.product_name || "", currentOffer?.unit || "");
                const productOffers = productSummary.offers || offersByRecency;
                const lowestObservedOffer = productSummary.lowestObservedOffer || null;
                const currentSupplierKey = getSupplierKey(currentOffer?.supplier_name);
                const currentQuantityKey = normalizeQuantityContext(currentOffer?.quantity);
                const quantityMatchedOffers = offers
                    .filter((offer) => {
                        if (isSameOffer(offer, currentOffer)) return false;
                        if (normalizeQuantityContext(offer?.quantity) !== currentQuantityKey) return false;
                        if (currentOffer?.currency && offer?.currency && offer.currency !== currentOffer.currency) return false;
                        return true;
                    })
                    .sort(compareOffersByUnitPrice);
                const currentUnitPrice = Number(currentOffer?.unit_price || 0);
                const quantityBasis = Number(currentOffer?.quantity || 0);
                const currentTotalBasis = Number(currentOffer?.total_price || 0) > 0
                    ? Number(currentOffer?.total_price || 0)
                    : currentUnitPrice * quantityBasis;
                const sameSupplierOffers = productOffers
                    .filter((offer) => getSupplierKey(offer?.supplier_name) === currentSupplierKey)
                    .filter((offer) => !isSameOffer(offer, currentOffer))
                    .sort(compareOffersByUnitPrice);
                const lowerPriceWithAnotherSupplier = productOffers
                    .filter((offer) => getSupplierKey(offer?.supplier_name) !== currentSupplierKey)
                    .filter((offer) => Number(offer?.unit_price || 0) < currentUnitPrice)
                    .filter((offer) => !currentOffer?.currency || !offer?.currency || offer.currency === currentOffer.currency)
                    .sort(compareOffersByUnitPrice)[0] || null;
                const lowerHistoricalPriceWithCurrentSupplier = sameSupplierOffers
                    .filter((offer) => Number(offer?.unit_price || 0) < currentUnitPrice)
                    .sort(compareOffersByUnitPrice)[0] || null;
                const lowerObservedOffer = productOffers
                    .filter((offer) => Number(offer?.unit_price || 0) < currentUnitPrice)
                    .sort(compareOffersByUnitPrice)[0] || null;
                const switchAlternatives = quantityMatchedOffers
                    .filter((offer) => {
                        const supplierKey = getSupplierKey(offer?.supplier_name);
                        return supplierKey && supplierKey !== currentSupplierKey;
                    });
                const recommendedSwitchOffer = switchAlternatives[0] || null;
                const supplierSwitchOffer = recommendedSwitchOffer || lowerPriceWithAnotherSupplier;
                const recommendedSwitchUnitPrice = Number(supplierSwitchOffer?.unit_price || 0);
                const switchUnitPriceAdvantage = Math.max(currentUnitPrice - recommendedSwitchUnitPrice, 0);
                const hasSupplierSwitchSavings = Boolean(
                    currentOffer &&
                    supplierSwitchOffer &&
                    currentSupplierKey &&
                    getSupplierKey(supplierSwitchOffer?.supplier_name) &&
                    getSupplierKey(supplierSwitchOffer?.supplier_name) !== currentSupplierKey &&
                    switchUnitPriceAdvantage > 0 &&
                    quantityBasis > 0 &&
                    currentTotalBasis > 0 &&
                    Number(supplierSwitchOffer?.unit_price || 0) > 0
                );
                const savingsType = hasSupplierSwitchSavings ? "supplier-switch" : "";
                const recommendedOffer = hasSupplierSwitchSavings ? supplierSwitchOffer : null;
                const recommendedUnitPrice = Number(recommendedOffer?.unit_price || 0);
                const unitPriceAdvantage = Math.max(currentUnitPrice - recommendedUnitPrice, 0);
                const hasValidAlternative = Boolean(savingsType && recommendedOffer && unitPriceAdvantage > 0);
                const bestOffer = hasValidAlternative ? recommendedOffer : currentOffer;
                const savingsAmount = hasValidAlternative
                    ? Math.max(currentTotalBasis - (quantityBasis * recommendedUnitPrice), 0)
                    : 0;
                const savingsPercent = hasValidAlternative && currentTotalBasis
                    ? (savingsAmount / currentTotalBasis) * 100
                    : 0;
                const comparableAlternativeCount = new Set(
                    productOffers
                        .filter((offer) => getSupplierKey(offer?.supplier_name) && getSupplierKey(offer?.supplier_name) !== currentSupplierKey)
                        .map((offer) => getSupplierKey(offer?.supplier_name))
                        .filter(Boolean)
                ).size;
                const isCurrentLowestObserved = Boolean(currentOffer && lowestObservedOffer && Number(currentOffer.unit_price || 0) === Number(lowestObservedOffer.unit_price || 0));
                const observedAtDifferentQuantity = Boolean(lowerObservedOffer && normalizeQuantityContext(lowerObservedOffer.quantity) !== currentQuantityKey);
                const otherSupplierObservedAtDifferentQuantity = Boolean(
                    lowerPriceWithAnotherSupplier &&
                    normalizeQuantityContext(lowerPriceWithAnotherSupplier.quantity) !== currentQuantityKey
                );
                const sameSupplierObservedAtDifferentQuantity = Boolean(
                    lowerHistoricalPriceWithCurrentSupplier &&
                    normalizeQuantityContext(lowerHistoricalPriceWithCurrentSupplier.quantity) !== currentQuantityKey
                );
                let decisionType = "price-variation-detected";
                if (lowerPriceWithAnotherSupplier) {
                    decisionType = "lower-price-with-another-supplier";
                } else if (lowerHistoricalPriceWithCurrentSupplier) {
                    decisionType = "lower-historical-price-with-current-supplier";
                } else if (isCurrentLowestObserved) {
                    decisionType = "lowest-observed-price-already-used";
                }
                const decisionTypeLabel = decisionType === "lower-price-with-another-supplier"
                    ? "Lower price with another supplier"
                    : decisionType === "lower-historical-price-with-current-supplier"
                        ? "Lower historical price with current supplier"
                        : decisionType === "lowest-observed-price-already-used"
                            ? "No immediate action"
                            : "Price variation detected";
                const lowestObservedUnitPrice = Number(lowestObservedOffer?.unit_price || 0);
                const currentQuantity = Number(currentOffer?.quantity || 0);
                const potentialSavingsAmount = lowestObservedOffer && lowestObservedUnitPrice < currentUnitPrice
                    ? Math.max((currentUnitPrice - lowestObservedUnitPrice) * currentQuantity, 0)
                    : 0;
                const hasPotentialSavings = potentialSavingsAmount > 0;
                const potentialSavingsObservedAtDifferentQuantity = Boolean(
                    hasPotentialSavings &&
                    lowestObservedOffer &&
                    normalizeQuantityContext(lowestObservedOffer.quantity) !== currentQuantityKey
                );
                const lowestPriceInsight = lowestObservedOffer
                    ? isCurrentLowestObserved
                        ? "Lowest price observed"
                        : `Lower price observed: ${formatCurrency(lowestObservedOffer.unit_price || 0, lowestObservedOffer.currency || currentOffer?.currency)} (${lowestObservedOffer.supplier_name || "Supplier missing"}, Qty ${Number(lowestObservedOffer.quantity || 0)}, ${formatDate(lowestObservedOffer.quote_date)})`
                    : "";
                const referenceOffer = hasValidAlternative
                    ? recommendedOffer
                    : decisionType === "lower-price-with-another-supplier"
                        ? lowerPriceWithAnotherSupplier
                        : decisionType === "lower-historical-price-with-current-supplier"
                            ? lowerHistoricalPriceWithCurrentSupplier
                            : decisionType === "price-variation-detected"
                                ? (lowerObservedOffer || lowestObservedOffer || currentOffer)
                                : (lowestObservedOffer || currentOffer);
                const quantityContextNote = referenceOffer
                    ? normalizeQuantityContext(referenceOffer.quantity) !== currentQuantityKey
                        ? "Observed at different quantity"
                        : "Observed at matching quantity"
                    : "";
                const referenceOfferLabel = hasValidAlternative
                    ? "Direct savings reference"
                    : decisionType === "lower-price-with-another-supplier"
                        ? "Another supplier reference"
                        : decisionType === "lower-historical-price-with-current-supplier"
                            ? "Current supplier history"
                            : decisionType === "lowest-observed-price-already-used"
                                ? "Best price benchmark"
                                : "Observed price reference";
                const compactResultInsight = hasValidAlternative && recommendedOffer
                    ? `Best: ${formatCurrency(recommendedOffer.unit_price || 0, recommendedOffer.currency || currentOffer?.currency)} (${recommendedOffer.supplier_name || "Supplier missing"})`
                    : decisionType === "lowest-observed-price-already-used"
                        ? "Lowest price observed"
                        : referenceOffer && Number(referenceOffer.unit_price || 0) > 0
                            ? `Best: ${formatCurrency(referenceOffer.unit_price || 0, referenceOffer.currency || currentOffer?.currency)} (${referenceOffer.supplier_name || "Supplier missing"})`
                            : "";
                const resultBadgeTooltip = referenceOffer && Number(referenceOffer.unit_price || 0) > 0
                    ? `Best price: ${formatCurrency(referenceOffer.unit_price || 0, referenceOffer.currency || currentOffer?.currency)} from ${referenceOffer.supplier_name || "Supplier missing"}${referenceOffer.quote_date ? ` (${formatDate(referenceOffer.quote_date)})` : ""}`
                    : decisionTypeLabel;
                const supplierSwitchQuantityNote = recommendedOffer && normalizeQuantityContext(recommendedOffer.quantity) !== currentQuantityKey
                    ? ` The lower supplier price was observed at Qty ${Number(recommendedOffer.quantity || 0)} and is estimated against the current Qty ${Number(quantityBasis || 0)}.`
                    : " The lower supplier price was observed at the same quantity.";
                const decisionSentence = savingsType === "supplier-switch"
                    ? `Supplier switch savings are visible. Move from ${currentOffer?.supplier_name || "the current supplier"} at ${formatCurrency(currentUnitPrice, currentOffer?.currency)} per unit to ${recommendedOffer?.supplier_name || "the recommended supplier"} at ${formatCurrency(recommendedUnitPrice, recommendedOffer?.currency)} per unit.${supplierSwitchQuantityNote} Estimated savings on the current quantity: ${formatCurrency(savingsAmount, currentOffer?.currency)} (${formatPercent(savingsPercent)} lower total spend).`
                    : decisionType === "lower-price-with-another-supplier"
                        ? `${lowerPriceWithAnotherSupplier?.supplier_name || "Another supplier"} has a lower observed unit price for this product at ${formatCurrency(lowerPriceWithAnotherSupplier?.unit_price || 0, lowerPriceWithAnotherSupplier?.currency || currentOffer?.currency)}. ${otherSupplierObservedAtDifferentQuantity ? "Observed at different quantity." : "Observed in comparable quantity history."}`
                        : decisionType === "lower-historical-price-with-current-supplier"
                            ? `${currentOffer?.supplier_name || "The current supplier"} previously offered this product at a lower observed unit price of ${formatCurrency(lowerHistoricalPriceWithCurrentSupplier?.unit_price || 0, lowerHistoricalPriceWithCurrentSupplier?.currency || currentOffer?.currency)}. ${sameSupplierObservedAtDifferentQuantity ? "Observed at different quantity." : "Observed in matching quantity history."}`
                            : decisionType === "lowest-observed-price-already-used"
                                ? `This row already matches the best recorded unit price for this product. Keep it as the price benchmark while reviewing supplier and quantity context.`
                                : comparableAlternativeCount
                                    ? `Lower prices were observed for this product, but only under a different commercial context. Review supplier, quantity, and date before acting on the price movement.`
                                    : `Only one visible pricing context exists for this product, so the screen is showing price intelligence rather than a supplier-switch recommendation.`;
                const sameSupplierPriceVariation = Boolean(lowerHistoricalPriceWithCurrentSupplier);
                const resultTone = decisionType === "price-variation-detected" || decisionType === "lowest-observed-price-already-used"
                    ? "neutral"
                    : "opportunity";

                return {
                    productName: currentOffer?.product_name || bestOffer?.product_name || "",
                    unit: currentOffer?.unit || bestOffer?.unit || "",
                    quantity: currentOffer?.quantity || bestOffer?.quantity || 0,
                    quoteDate: currentOffer?.quote_date || bestOffer?.quote_date || "",
                    currency: currentOffer?.currency || bestOffer?.currency || "USD",
                    currentOffer,
                    bestOffer,
                    offers: [...offers].sort(compareOffersByPrice),
                    savingsAmount,
                    savingsPercent,
                    savingsType,
                    isCurrentBest: decisionType === "lowest-observed-price-already-used" && !hasValidAlternative,
                    hasValidAlternative,
                    comparableAlternativeCount,
                    sameSupplierPriceVariation,
                    decisionType,
                    quantityContextNote,
                    lowerPriceWithAnotherSupplier,
                    lowerHistoricalPriceWithCurrentSupplier,
                    observedAtDifferentQuantity,
                    referenceOffer,
                    referenceOfferLabel,
                    productSummary,
                    lowestObservedOffer,
                    lowestPriceInsight,
                    compactResultInsight,
                    resultBadgeTooltip,
                    potentialSavingsAmount,
                    hasPotentialSavings,
                    potentialSavingsObservedAtDifferentQuantity,
                    isCurrentLowestObserved,
                    decisionSentence,
                    statusLabel: decisionTypeLabel,
                    statusTone: resultTone
                };
            })
            .sort((left, right) => left.productName.localeCompare(right.productName) || String(left.unit || "").localeCompare(String(right.unit || "")) || Number(right.quantity || 0) - Number(left.quantity || 0));
    }

    function buildAnalyzeSummary(result) {
        const comparison = result?.comparison || { bids: [] };
        const bids = comparison.bids || [];
        const suppliers = new Set();
        const products = new Set();
        const decisionCards = buildDecisionCards(comparison);
        const productsWithSavings = decisionCards.filter((card) => card.hasValidAlternative && card.savingsAmount > 0).length;
        const totalVisibleSavings = decisionCards.reduce((sum, card) => sum + (card.hasValidAlternative ? card.savingsAmount : 0), 0);
        const currentSpend = decisionCards.reduce((sum, card) => sum + Number(card.currentOffer?.total_price || 0), 0);
        const optimizedSpend = decisionCards.reduce((sum, card) => sum + Number(card.bestOffer?.total_price || 0), 0);
        const optimizedSavings = Math.max(currentSpend - optimizedSpend, 0);
        const optimizedSavingsPercent = currentSpend ? (optimizedSavings / currentSpend) * 100 : 0;
        const optimizedRows = decisionCards.map((card) => ({
            productName: card.productName,
            selectedSupplier: card.bestOffer?.supplier_name || "",
            unitPrice: Number(card.bestOffer?.unit_price || 0),
            quantity: Number(card.bestOffer?.quantity || card.quantity || 0),
            totalPrice: Number(card.bestOffer?.total_price || 0),
            sourceType: comparison.source_type || "manual",
            quoteDate: card.bestOffer?.quote_date || card.quoteDate || "",
            currency: card.bestOffer?.currency || card.currency || "USD",
            chosenOffer: card.bestOffer,
            offers: card.offers || [],
            unit: card.unit || ""
        }));

        bids.forEach((bid) => {
            if (bid.supplier_name) suppliers.add(String(bid.supplier_name).trim());
            if (bid.product_name) products.add(`${String(bid.product_name).trim()}__${String(bid.unit || "").trim()}`);
        });

        return {
            rowCount: bids.length,
            supplierCount: suppliers.size,
            productCount: products.size,
            productsWithSavings,
            totalVisibleSavings,
            currentSpend,
            optimizedSpend,
            optimizedSavings,
            optimizedSavingsPercent,
            optimizedRows,
            decisionCards
        };
    }

    function getAnalysisSummary(result) {
        const existingSummary = result?.summary;
        if (
            existingSummary &&
            Array.isArray(existingSummary.decisionCards) &&
            (!existingSummary.decisionCards.length || existingSummary.decisionCards[0]?.productSummary)
        ) {
            return existingSummary;
        }
        return buildAnalyzeSummary(result);
    }

    function getHistoryComparisons(state) {
        const historyMap = new Map();
        (state.savedComparisons || []).forEach((comparison) => {
            if (comparison?.comparison_id) historyMap.set(comparison.comparison_id, comparison);
        });

        const currentComparison = state.analysisResult?.comparison;
        if (currentComparison?.comparison_id && !historyMap.has(currentComparison.comparison_id)) {
            historyMap.set(currentComparison.comparison_id, currentComparison);
        } else if (currentComparison && !currentComparison.comparison_id) {
            historyMap.set(`current-${state.mode}`, {
                ...currentComparison,
                comparison_id: `current-${state.mode}`,
                created_at: new Date().toISOString()
            });
        }

        return Array.from(historyMap.values());
    }

    function normalizeHistoryText(value) {
        return String(value == null ? "" : value).trim();
    }

    function isValidHistoryDimension(value) {
        const normalized = normalizeHistoryText(value);
        return normalized !== "" && normalized !== "-";
    }

    function buildHistoryDataset(state) {
        return getHistoryComparisons(state).flatMap((comparison) => {
            const comparisonCreatedAt = comparison.created_at || comparison.updated_at || "";
            const comparisonSourceType = comparison.source_type || "manual";
            return (comparison.bids || []).map((bid, index) => {
                const quoteDate = bid.quote_date || bid.date || "";
                const effectiveDate = parseDateValue(quoteDate) || parseDateValue(comparisonCreatedAt);
                const productName = normalizeHistoryText(bid.product_name);
                const supplier = normalizeHistoryText(bid.supplier_name);
                return {
                    historyId: `${comparison.comparison_id || "comparison"}-${index}`,
                    comparisonId: comparison.comparison_id || "",
                    uploadId: comparison.upload_id || "",
                    comparisonName: comparison.name || "Saved pricing records",
                    productName,
                    supplier,
                    unit: normalizeHistoryText(bid.unit),
                    quantity: Number(bid.quantity || 0),
                    unitPrice: Number(bid.unit_price || 0),
                    totalPrice: Number(bid.total_price || 0),
                    quoteDate,
                    currency: normalizeHistoryText(bid.currency || "USD") || "USD",
                    deliveryTime: normalizeHistoryText(bid.delivery_time),
                    paymentTerm: normalizeHistoryText(bid.payment_term),
                    validUntil: normalizeHistoryText(bid.valid_until),
                    notes: normalizeHistoryText(bid.notes),
                    sourceType: comparisonSourceType,
                    createdAt: comparisonCreatedAt,
                    effectiveDate,
                    effectiveTimestamp: effectiveDate ? effectiveDate.getTime() : 0
                };
            });
        }).filter((row) => isValidHistoryDimension(row.productName) && isValidHistoryDimension(row.supplier));
    }

    function getHistoryDataset(state) {
        if (!Array.isArray(state.qcHistoryData)) {
            state.qcHistoryData = [];
        }
        if (!state.qcHistoryData.length) {
            state.qcHistoryData = buildHistoryDataset(state);
        }
        return state.qcHistoryData;
    }

    function getHistoryMemo(state) {
        const dataset = getHistoryDataset(state);
        if (!state.historyMemo || state.historyMemo.datasetRef !== dataset) {
            state.historyMemo = {
                datasetRef: dataset,
                filterScope: new Map(),
                filterOptions: new Map(),
                filteredKey: "",
                filteredRows: null,
                displayRowsRef: null,
                displayKey: "",
                displayRows: null
            };
        }
        return state.historyMemo;
    }

    function flattenHistoryRows(state) {
        return getHistoryDataset(state);
    }

    function getHistoryFilterScope(state, { ignoreKey = "" } = {}) {
        const product = ignoreKey === "product" ? "" : normalizeHistoryText(state.historyFilters.product);
        const supplier = ignoreKey === "supplier" ? "" : normalizeHistoryText(state.historyFilters.supplier);
        const startDate = ignoreKey === "dateFrom" ? null : parseDateValue(state.historyFilters.dateFrom, { startOfDay: true });
        const endDate = ignoreKey === "dateTo" ? null : parseDateValue(state.historyFilters.dateTo, { endOfDay: true });
        const focusedSeriesKey = normalizeHistoryText(state.historyFocusedSeriesKey);
        const memo = getHistoryMemo(state);
        const scopeKey = [ignoreKey, product, supplier, startDate?.getTime() || "", endDate?.getTime() || "", focusedSeriesKey].join("|");
        if (memo.filterScope.has(scopeKey)) {
            return memo.filterScope.get(scopeKey);
        }
        const rows = getHistoryDataset(state).filter((row) => {
            if (focusedSeriesKey && getHistorySeriesKey(row.productName, row.unit) !== focusedSeriesKey) return false;
            if (product && row.productName !== product) return false;
            if (supplier && row.supplier !== supplier) return false;
            if (startDate && row.effectiveDate && row.effectiveDate < startDate) return false;
            if (endDate && row.effectiveDate && row.effectiveDate > endDate) return false;
            return true;
        });
        memo.filterScope.set(scopeKey, rows);
        return rows;
    }

    function getHistoryFilterOptions(state, key) {
        const memo = getHistoryMemo(state);
        const optionKey = [key, normalizeHistoryText(state.historyFilters.product), normalizeHistoryText(state.historyFilters.supplier), state.historyFilters.dateFrom || "", state.historyFilters.dateTo || "", normalizeHistoryText(state.historyFocusedSeriesKey)].join("|");
        if (memo.filterOptions.has(optionKey)) {
            return memo.filterOptions.get(optionKey);
        }
        let options = [];
        if (key === "product") {
            options = Array.from(new Set(
                getHistoryFilterScope(state, { ignoreKey: "product" })
                    .map((row) => row.productName)
                    .filter(isValidHistoryDimension)
            )).sort((left, right) => left.localeCompare(right));
        }
        if (key === "supplier") {
            options = Array.from(new Set(
                getHistoryFilterScope(state, { ignoreKey: "supplier" })
                    .map((row) => row.supplier)
                    .filter(isValidHistoryDimension)
            )).sort((left, right) => left.localeCompare(right));
        }
        memo.filterOptions.set(optionKey, options);
        return options;
    }

    function syncHistoryFilterDefaults(state) {
        let didChange = false;
        let guard = 0;
        do {
            didChange = false;
            const productOptions = getHistoryFilterOptions(state, "product");
            if (state.historyFilters.product && !productOptions.includes(state.historyFilters.product)) {
                state.historyFilters.product = "";
                didChange = true;
            }
            const supplierOptions = getHistoryFilterOptions(state, "supplier");
            if (state.historyFilters.supplier && !supplierOptions.includes(state.historyFilters.supplier)) {
                state.historyFilters.supplier = "";
                didChange = true;
            }
            guard += 1;
        } while (didChange && guard < 5);
    }

    function getFilteredHistoryRows(state) {
        syncHistoryFilterDefaults(state);
        const { product, supplier, dateFrom, dateTo } = state.historyFilters;
        const startDate = parseDateValue(dateFrom, { startOfDay: true });
        const endDate = parseDateValue(dateTo, { endOfDay: true });
        const focusedSeriesKey = normalizeHistoryText(state.historyFocusedSeriesKey);
        const memo = getHistoryMemo(state);
        const filteredKey = [product, supplier, dateFrom || "", dateTo || "", focusedSeriesKey].join("|");
        if (memo.filteredKey === filteredKey && Array.isArray(memo.filteredRows)) {
            return memo.filteredRows;
        }

        const visibleRows = getHistoryDataset(state)
            .filter((row) => !focusedSeriesKey || getHistorySeriesKey(row.productName, row.unit) === focusedSeriesKey)
            .filter((row) => !product || row.productName === product)
            .filter((row) => !supplier || row.supplier === supplier)
            .filter((row) => {
                if (!startDate || !row.effectiveDate) return true;
                return row.effectiveDate >= startDate;
            })
            .filter((row) => {
                if (!endDate || !row.effectiveDate) return true;
                return row.effectiveDate <= endDate;
            })
            .sort((left, right) => {
                if (left.effectiveTimestamp !== right.effectiveTimestamp) return left.effectiveTimestamp - right.effectiveTimestamp;
                return left.supplier.localeCompare(right.supplier);
            });

        const lastSeenBySeries = new Map();
        const filteredRows = visibleRows.map((row) => {
                const seriesKey = getHistorySeriesKey(row.productName, row.unit);
                const previousSameSeries = lastSeenBySeries.get(seriesKey) || null;
                const changeValue = previousSameSeries ? row.unitPrice - previousSameSeries.unitPrice : null;
                const changePercent = previousSameSeries && previousSameSeries.unitPrice
                    ? (changeValue / previousSameSeries.unitPrice) * 100
                    : null;
                lastSeenBySeries.set(seriesKey, row);
                return {
                    ...row,
                    changeValue,
                    changePercent
                };
            });
        memo.filteredKey = filteredKey;
        memo.filteredRows = filteredRows;
        return filteredRows;
    }

    function getHistorySummary(rows) {
        if (!rows.length) {
            return {
                latestPrice: null,
                oldestPrice: null,
                minPrice: null,
                maxPrice: null,
                totalChange: null,
                totalChangePercent: null
            };
        }

        const sortedRows = rows.slice().sort((left, right) => {
            if (left.effectiveTimestamp !== right.effectiveTimestamp) return left.effectiveTimestamp - right.effectiveTimestamp;
            return left.supplier.localeCompare(right.supplier);
        });
        const oldest = sortedRows[0];
        const latest = sortedRows[sortedRows.length - 1];
        const prices = sortedRows.map((row) => row.unitPrice).filter((value) => Number.isFinite(value));
        const minPrice = prices.length ? Math.min(...prices) : null;
        const maxPrice = prices.length ? Math.max(...prices) : null;
        const totalChange = latest.unitPrice - oldest.unitPrice;
        const totalChangePercent = oldest.unitPrice ? (totalChange / oldest.unitPrice) * 100 : null;

        return {
            latestPrice: latest.unitPrice,
            oldestPrice: oldest.unitPrice,
            minPrice,
            maxPrice,
            totalChange,
            totalChangePercent
        };
    }

    function getHistoryViewModel(state) {
        syncHistoryFilterDefaults(state);
        const historyRows = getHistoryDataset(state);
        const filteredRows = getFilteredHistoryRows(state);
        const tableRows = getHistoryDisplayRows(state, filteredRows);
        const uniqueSeries = Array.from(new Set(filteredRows.map((row) => getHistorySeriesKey(row.productName, row.unit))));
        if (uniqueSeries.length === 1) {
            const autoSeriesKey = uniqueSeries[0];
            const autoRowId = tableRows.find((row) => getHistorySeriesKey(row.productName, row.unit) === autoSeriesKey)?.historyId || "";
            if (state.historySelectedSeriesKey !== autoSeriesKey) {
                setHistorySelectedSeries(state, filteredRows, autoSeriesKey, autoRowId);
            } else if (!state.historySelectedRowId) {
                state.historySelectedRowId = autoRowId;
            }
        } else {
            const selectedExistsInFiltered = state.historySelectedSeriesKey && uniqueSeries.includes(state.historySelectedSeriesKey);
            if (!selectedExistsInFiltered) {
                clearHistorySelectedSeries(state);
            }
        }
        const selectedSeriesRows = state.historySelectedSeriesKey
            ? getHistoryFullSeriesRows(state, state.historySelectedSeriesKey)
            : [];
        const summaryRows = selectedSeriesRows;
        const summaryCurrency = summaryRows[summaryRows.length - 1]?.currency || filteredRows[filteredRows.length - 1]?.currency || "USD";
        return {
            hasHistoryContext: historyRows.length > 0,
            productOptions: getHistoryFilterOptions(state, "product"),
            supplierOptions: getHistoryFilterOptions(state, "supplier"),
            filteredRows,
            tableRows,
            selectedSeriesRows,
            selectedSeriesKey: state.historySelectedSeriesKey,
            selectedSeriesLabel: selectedSeriesRows.length ? `${selectedSeriesRows[0].productName} | ${selectedSeriesRows[0].unit}` : "",
            summary: getHistorySummary(summaryRows),
            currency: summaryCurrency
        };
    }

    function initializeHistoryFilters(state) {
        state.qcHistoryData = buildHistoryDataset(state);
        state.historyMemo = null;
        state.historyFocusedSeriesKey = "";
        syncHistoryFilterDefaults(state);
    }

    function focusHistoryOnProductSeries(state, productName, unit) {
        const normalizedProduct = normalizeHistoryText(productName);
        const normalizedUnit = normalizeHistoryText(unit);
        state.historyFocusedSeriesKey = getHistorySeriesKey(normalizedProduct, normalizedUnit);
        state.historyFilters.product = normalizedProduct;
        state.historyFilters.supplier = "";
        state.historyFilters.dateFrom = "";
        state.historyFilters.dateTo = "";
        clearHistorySelectedSeries(state);
        closeHistoryDetailModal(state);
        const focusedRows = getFilteredHistoryRows(state);
        const firstFocusedRowId = focusedRows[0]?.historyId || "";
        setHistorySelectedSeries(state, focusedRows, state.historyFocusedSeriesKey, firstFocusedRowId);
    }

    function hydrateComparisons(state, comparisons) {
        state.savedComparisons = Array.isArray(comparisons) ? comparisons : [];
        state.hasLoadedSavedComparisons = true;
        initializeHistoryFilters(state);
    }

    async function loadSavedComparisons(state, { includeComparisons = false } = {}) {
        const loadStartedAt = performance.now();
        const hasExistingActiveContext = hasRestorableQuoteCompareContext(state);
        try {
            const activeSessionId = state.activeSessionId || sessionStorage.getItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY) || "";
            const persistedSelectedMappings = { ...(state.selectedMappings || {}) };
            const persistedCurrentScreen = state.currentScreen;
            if (activeSessionId) {
                state.activeSessionId = activeSessionId;
            }
            const params = new URLSearchParams();
            if (activeSessionId) {
                params.set("session_id", activeSessionId);
            }
            if (includeComparisons) {
                params.set("include_comparisons", "true");
            }
            const query = params.toString() ? `?${params.toString()}` : "";
            const data = await fetchJson(`/quote-compare/bootstrap${query}`);
            if (includeComparisons) {
                hydrateComparisons(state, data.comparisons || []);
            }
            if (activeSessionId && !data.active_session) {
                if (!includeComparisons || !hasExistingActiveContext) {
                    resetQuoteCompareUploadState(
                        state,
                        "Your last upload session could not be recovered. Please upload the file again."
                    );
                }
                return;
            }
            if (!data.active_session) {
                if (["review", "analyze", "history"].includes(persistedCurrentScreen)) {
                    if (!includeComparisons || !hasExistingActiveContext) {
                        resetQuoteCompareUploadState(state);
                    }
                }
                return;
            }

            const activeSession = data.active_session;
            const canRestoreAnalyze = isValidRestorableAnalyzeSession(activeSession);
            const canRestoreReview = activeSession.step === "review" && isValidRestorableReviewSession(activeSession);
            if (!canRestoreReview && !canRestoreAnalyze) {
                if (!includeComparisons || !hasExistingActiveContext) {
                    resetQuoteCompareUploadState(
                        state,
                        "Your last upload session is incomplete. Please upload the file again."
                    );
                }
                return;
            }

            state.activeSessionId = activeSession.session_id || state.activeSessionId;
            if (state.activeSessionId) {
                sessionStorage.setItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY, state.activeSessionId);
            }
            state.uploadReview = {
                session_id: activeSession.session_id || "",
                filename: activeSession.filename || "",
                required_fields: activeSession.required_fields || REQUIRED_FIELDS,
                optional_fields: activeSession.optional_fields || OPTIONAL_FIELDS,
                message: activeSession.message || "",
                review_message: activeSession.review_message || "",
                mapping: activeSession.mapping || {},
                field_reviews: activeSession.field_reviews || [],
                matched_fields: activeSession.matched_fields || 0,
                missing_fields: activeSession.missing_fields || [],
                optional_columns: activeSession.optional_columns || [],
                headers: activeSession.headers || []
            };
            state.headers = activeSession.headers || [];
            state.detectedMappings = { ...(activeSession.mapping || {}) };
            state.selectedMappings = (
                activeSession.session_id === activeSessionId
                && isValidSelectedMappingSet(persistedSelectedMappings, state.headers)
                && Object.values(persistedSelectedMappings).some(Boolean)
            )
                ? persistedSelectedMappings
                : { ...(activeSession.mapping || {}) };
            computeValidation(state);

            if (canRestoreAnalyze) {
                state.analysisResult = {
                    comparison: activeSession.comparison,
                    evaluation: activeSession.evaluation,
                    summary: buildAnalyzeSummary({ comparison: activeSession.comparison })
                };
                state.rows = activeSession.comparison?.bids || [];
                state.currentScreen = persistedCurrentScreen === "history" ? "history" : "analyze";
                return;
            }

            state.analysisResult = null;
            state.rows = [];
            state.currentScreen = "review";
            console.info("[quote compare bootstrap timing]", {
                includeComparisons,
                durationMs: Number((performance.now() - loadStartedAt).toFixed(1)),
                currentScreen: state.currentScreen
            });
        } catch (error) {
            if (!includeComparisons || !hasExistingActiveContext) {
                resetQuoteCompareUploadState(
                    state,
                    "Your last upload session could not be restored. Please upload the file again."
                );
            }
        }
    }

    async function ensureHistoryComparisonsLoaded(state) {
        if (state.hasLoadedSavedComparisons || state.isHistoryLoading) {
            return;
        }
        state.isHistoryLoading = true;
        const startedAt = performance.now();
        try {
            await loadSavedComparisons(state, { includeComparisons: true });
            console.info("[quote compare history bootstrap timing]", {
                durationMs: Number((performance.now() - startedAt).toFixed(1)),
                comparisons: state.savedComparisons.length
            });
        } finally {
            state.isHistoryLoading = false;
        }
    }

    function renderQcStart() {
        return `
            <section class="qc2-screen qc2-screen-start">
                <div class="qc2-head">
                    <div class="panel-label">Quote Compare</div>
                    <h2 class="qc2-title">Choose how you want to begin</h2>
                    <p class="qc2-copy">Upload a supplier pricing file for column review or enter supplier price rows manually when you need a quick buying decision.</p>
                </div>
                <div class="qc2-choice-grid">
                    <button type="button" class="qc2-choice-card" data-qc-action="start-upload">
                        <span class="qc2-choice-title">Upload Pricing File</span>
                        <span class="qc2-choice-copy">Parse one CSV or Excel file, review the detected mappings, and move straight into analysis.</span>
                    </button>
                    <button type="button" class="qc2-choice-card qc2-choice-card-secondary" data-qc-action="start-manual">
                        <span class="qc2-choice-title">Enter Supplier Prices Manually</span>
                        <span class="qc2-choice-copy">Add supplier price rows one by one when data arrives outside a spreadsheet.</span>
                    </button>
                </div>
            </section>
        `;
    }

    function renderQcUpload(state) {
        const fileName = state.file ? state.file.name : "No file selected yet";
        const canReview = !state.isParsing && Boolean(state.file && state.uploadReview && state.headers.length);
        const fileStatus = state.isParsing
            ? "Parsing uploaded file"
            : state.headers.length
                ? `${state.headers.length} columns detected`
                : "Waiting for file";
        return `
            <section class="qc2-screen qc2-screen-upload">
                <div class="qc2-card qc2-upload-card">
                    <div class="qc2-head qc2-upload-head">
                        <div class="upload-step">Step 1</div>
                        <h2 class="qc2-title">Upload supplier pricing file</h2>
                        <p class="qc2-copy">Upload one supplier pricing file, check the detected columns, and move into review with a clean structured file.</p>
                    </div>
                    <div class="qc2-upload-panel">
                        <div class="qc2-upload-shell">
                            <div class="qc2-upload-copy-block">
                                <div class="qc2-upload-title">Supported formats</div>
                                <div class="qc2-upload-copy">CSV, XLSX, XLS</div>
                                <div class="qc2-upload-note">Use a supplier export or pricing sheet with clear column headers so matching can be reviewed quickly.</div>
                            </div>
                            <div class="qc2-upload-actions">
                                <button type="button" class="secondary-btn" data-qc-action="pick-file">Choose File</button>
                                <button type="button" class="secondary-btn" data-qc-action="replace-file" ${state.file ? "" : "hidden"}>Replace File</button>
                                <button type="button" class="secondary-btn" data-qc-action="remove-file" ${state.file ? "" : "hidden"}>Remove File</button>
                            </div>
                        </div>
                        <div class="qc2-file-panel">
                            <div class="qc2-file-panel-head">
                                <div class="qc2-file-panel-label">Selected file</div>
                                <span class="mapping-summary-chip">${escapeHtml(fileStatus)}</span>
                            </div>
                            <div class="qc2-file-line">
                                <div class="qc2-file-meta">
                                    <span class="qc2-file-label">File name</span>
                                    <span class="qc2-file-name">${escapeHtml(fileName)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input class="qc2-hidden-input" id="qc2FileInput" type="file" accept=".csv,.xlsx,.xls">
                    ${renderStatus(state)}
                    <div class="qc2-actions qc2-upload-footer">
                        <button type="button" class="secondary-btn" data-qc-action="back-start">Back</button>
                        <button type="button" class="action-btn" data-qc-action="go-review" ${canReview ? "" : "disabled"}>${state.isParsing ? "Parsing Headers..." : "Review Columns"}</button>
                    </div>
                </div>
            </section>
        `;
    }

    const MANUAL_REQUIRED_FIELD_LABELS = {
        product_name: "Product Name",
        supplier_name: "Supplier",
        unit: "Unit",
        quantity: "Quantity",
        unit_price: "Unit Price",
        quote_date: "Date"
    };

    const MANUAL_OPTIONAL_FIELDS = [
        { key: "currency", label: "Currency", type: "text" },
        { key: "delivery_time", label: "Delivery Time", type: "text" },
        { key: "payment_term", label: "Payment Terms", type: "text" },
        { key: "valid_until", label: "Valid Until", type: "date" },
        { key: "notes", label: "Notes", type: "text", className: "is-wide" }
    ];

    function getManualRowMissingFields(row) {
        const safeRow = row || {};
        const missingFields = [];
        if (!String(safeRow.product_name || "").trim()) missingFields.push("product_name");
        if (!String(safeRow.supplier_name || "").trim()) missingFields.push("supplier_name");
        if (!String(safeRow.unit || "").trim()) missingFields.push("unit");
        if (!(Number(safeRow.quantity || 0) > 0)) missingFields.push("quantity");
        if (!(Number(safeRow.unit_price || 0) > 0)) missingFields.push("unit_price");
        if (!String(safeRow.quote_date || "").trim()) missingFields.push("quote_date");
        return missingFields;
    }

    function isManualRowTouched(row) {
        const safeRow = row || {};
        return [
            safeRow.product_name,
            safeRow.supplier_name,
            safeRow.unit,
            safeRow.quantity,
            safeRow.unit_price,
            safeRow.quote_date
        ].some((value) => String(value ?? "").trim() !== "");
    }

    function renderManualFieldLabel(label) {
        return `${escapeHtml(label)} <span class="qc2-manual-required" aria-hidden="true">*</span>`;
    }

    function renderManualOptionalField(row, index, field) {
        const value = row[field.key] ?? "";
        const inputClassName = field.type === "date"
            ? "recipe-input qc2-manual-date-input"
            : "recipe-input";
        return `
            <label class="recipe-field ${field.className || ""}">
                <span class="recipe-field-label">${escapeHtml(field.label)}</span>
                <input
                    class="${inputClassName}"
                    type="${field.type}"
                    data-manual-field="${field.key}"
                    data-index="${index}"
                    value="${escapeHtml(value)}"
                    aria-label="${escapeHtml(field.label)}"
                >
            </label>
        `;
    }

    function getManualTouchedRows(state) {
        return (state.manualRows || []).filter((row) => isManualRowTouched(row));
    }

    function getManualValidation(state) {
        const touchedRows = getManualTouchedRows(state);
        const incompleteRows = touchedRows
            .map((row, index) => ({
                index,
                row,
                missingFields: getManualRowMissingFields(row)
            }))
            .filter((item) => item.missingFields.length > 0);
        const completeRows = touchedRows.filter((row) => getManualRowMissingFields(row).length === 0);
        return {
            touchedRows,
            touchedCount: touchedRows.length,
            completeRows,
            completeCount: completeRows.length,
            incompleteRows,
            incompleteCount: incompleteRows.length,
            ready: completeRows.length > 0 && incompleteRows.length === 0
        };
    }

    function getManualNormalizedRows(state) {
        return getManualValidation(state).completeRows.map((row) => {
            const quantity = Number(row.quantity || 0);
            const unitPrice = Number(row.unit_price || 0);
            const derivedTotalPrice = quantity * unitPrice;
            return {
                supplier_name: String(row.supplier_name || "").trim(),
                product_name: String(row.product_name || "").trim(),
                unit: String(row.unit || "").trim(),
                quantity,
                unit_price: unitPrice,
                total_price: row.total_price ? Number(row.total_price || 0) : derivedTotalPrice,
                quote_date: String(row.quote_date || "").trim() || null,
                currency: String(row.currency || "USD").trim() || "USD",
                delivery_time: String(row.delivery_time || "").trim(),
                payment_term: String(row.payment_term || "").trim(),
                valid_until: String(row.valid_until || "").trim() || null,
                notes: String(row.notes || "").trim() || null
            };
        });
    }

    function renderManualDateInput(index, value) {
        return `
            <div class="recipe-field">
                <span class="recipe-field-label">${renderManualFieldLabel("Date")}</span>
                <input class="recipe-input qc2-manual-date-input" type="date" data-manual-field="quote_date" data-index="${index}" value="${escapeHtml(value)}" aria-label="Date">
            </div>
        `;
    }

    function renderManualRow(row, index) {
        const missingFields = getManualRowMissingFields(row);
        const showInlineFeedback = isManualRowTouched(row) && missingFields.length > 0;
        return `
            <div class="qc2-manual-row${showInlineFeedback ? " is-incomplete" : ""}" data-manual-row="${index}">
                <div class="qc2-manual-row-main">
                    <label class="recipe-field"><span class="recipe-field-label">${renderManualFieldLabel("Product Name")}</span><input class="recipe-input" data-manual-field="product_name" data-index="${index}" value="${escapeHtml(row.product_name)}"></label>
                    <label class="recipe-field"><span class="recipe-field-label">${renderManualFieldLabel("Supplier")}</span><input class="recipe-input" data-manual-field="supplier_name" data-index="${index}" value="${escapeHtml(row.supplier_name)}"></label>
                    <label class="recipe-field"><span class="recipe-field-label">${renderManualFieldLabel("Unit")}</span><input class="recipe-input" data-manual-field="unit" data-index="${index}" value="${escapeHtml(row.unit)}"></label>
                    <label class="recipe-field"><span class="recipe-field-label">${renderManualFieldLabel("Quantity")}</span><input class="recipe-input" type="number" min="0" step="0.01" data-manual-field="quantity" data-index="${index}" value="${escapeHtml(row.quantity)}"></label>
                    <label class="recipe-field"><span class="recipe-field-label">${renderManualFieldLabel("Unit Price")}</span><input class="recipe-input" type="number" min="0" step="0.01" data-manual-field="unit_price" data-index="${index}" value="${escapeHtml(row.unit_price)}"></label>
                    ${renderManualDateInput(index, row.quote_date)}
                    <button type="button" class="secondary-btn qc2-remove-row qc2-manual-row-action" data-qc-action="remove-manual-row" data-index="${index}" ${index === 0 ? "disabled" : ""}>Remove</button>
                </div>
                <div class="qc2-manual-row-optional">
                    ${MANUAL_OPTIONAL_FIELDS.map((field) => renderManualOptionalField(row, index, field)).join("")}
                </div>
                ${showInlineFeedback ? `<div class="qc2-manual-inline-note">Complete required fields: ${escapeHtml(missingFields.map((fieldName) => MANUAL_REQUIRED_FIELD_LABELS[fieldName]).join(", "))}.</div>` : ""}
            </div>
        `;
    }

    function renderQcManual(state) {
        const validation = getManualValidation(state);
        return `
            <section class="qc2-screen qc2-screen-manual">
                <div class="qc2-card qc2-upload-card">
                    <div class="qc2-head qc2-head-compact">
                        <div class="upload-step">Step 1</div>
                        <h2 class="qc2-title">Enter supplier prices manually</h2>
                        <p class="qc2-copy">Enter supplier rows by hand using the same required fields and review discipline as the upload flow before analysis begins.</p>
                    </div>
                    <div class="qc2-upload-panel">
                        <div class="qc2-upload-shell">
                            <div class="qc2-upload-copy-block">
                                <div class="qc2-upload-title">Manual pricing rows</div>
                                <div class="qc2-upload-copy">${validation.completeCount} ready rows • ${validation.incompleteCount} incomplete rows</div>
                                <div class="qc2-upload-note">Required fields come first. Optional context stays available below each row when payment terms, notes, or validity dates matter.</div>
                            </div>
                            <div class="qc2-upload-actions">
                                <button type="button" class="secondary-btn" data-qc-action="add-manual-row">Add Row</button>
                            </div>
                        </div>
                    </div>
                    <div class="qc2-manual-list">
                        ${state.manualRows.map(renderManualRow).join("")}
                    </div>
                    ${renderStatus(state)}
                    <div class="qc2-actions qc2-manual-actions">
                        <div class="qc2-manual-actions-group">
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="back-start">Back</button>
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="add-manual-row">Add Row</button>
                        </div>
                        <div class="qc2-manual-actions-group qc2-manual-actions-group-end">
                            <button type="button" class="action-btn qc2-manual-footer-btn qc2-manual-footer-btn-primary" data-qc-action="go-manual-review" ${validation.completeCount ? "" : "disabled"}>Review Manual Rows</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderManualReviewTableRow(row, index) {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(row.product_name)}</td>
                <td>${escapeHtml(row.supplier_name)}</td>
                <td>${escapeHtml(row.unit)}</td>
                <td>${escapeHtml(String(row.quantity))}</td>
                <td>${escapeHtml(formatCurrency(row.unit_price, row.currency))}</td>
                <td>${escapeHtml(formatDate(row.quote_date))}</td>
                <td>${escapeHtml(row.currency || "USD")}</td>
                <td>${escapeHtml(row.notes || "—")}</td>
            </tr>
        `;
    }

    function renderQcManualReview(state) {
        const validation = getManualValidation(state);
        const normalizedRows = getManualNormalizedRows(state);
        const incompleteText = validation.incompleteRows.length
            ? validation.incompleteRows.map((item) => `Row ${item.index + 1}: ${item.missingFields.map((fieldName) => MANUAL_REQUIRED_FIELD_LABELS[fieldName]).join(", ")}`).join(" | ")
            : "";

        return `
            <section class="qc2-screen qc2-screen-review">
                <div class="mapping-review-panel qc2-review-panel">
                    <div class="mapping-review-head">
                        <div>
                            <div class="upload-step">Step 2</div>
                            <h2 class="mapping-review-title">Review your manual pricing rows</h2>
                            <p class="mapping-review-copy">Confirm the required fields, scan the entered supplier rows, and move to analysis only when the manual dataset is complete.</p>
                        </div>
                        <div class="mapping-summary-chips">
                            <span class="mapping-summary-chip">${validation.completeCount} of ${validation.touchedCount || state.manualRows.length} rows ready</span>
                            <span class="mapping-summary-chip ${validation.ready ? "" : "is-warning"}">${validation.ready ? "Ready for analysis" : "Incomplete rows"}</span>
                        </div>
                    </div>
                    <div class="mapping-alert mapping-alert-info">Manual entry uses the same required fields as upload: Product Name, Supplier, Unit, Quantity, Unit Price, and Date.</div>
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Entered supplier rows</div>
                                <div class="mapping-section-copy">Review the rows exactly as they will be sent into pricing analysis.</div>
                            </div>
                        </div>
                        <div class="quote-compare-table-scroll qc2-manual-review-table-shell">
                            <table class="quote-compare-table qc2-manual-review-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product Name</th>
                                        <th>Supplier</th>
                                        <th>Unit</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Date</th>
                                        <th>Currency</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${normalizedRows.length ? normalizedRows.map((row, index) => renderManualReviewTableRow(row, index)).join("") : '<tr><td colspan="9"><div class="decision-list-empty">Add at least one complete supplier row to review it here.</div></td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Optional context</div>
                                <div class="mapping-section-copy">Currency, delivery timing, payment terms, validity, and notes are passed through when provided.</div>
                            </div>
                        </div>
                        <div class="mapping-alert mapping-alert-info">Total price is derived automatically from Quantity x Unit Price when not entered manually.</div>
                    </section>
                    ${incompleteText ? `<div class="mapping-alert mapping-alert-error">${escapeHtml(incompleteText)}</div>` : ""}
                    ${renderStatus(state)}
                    <div class="qc2-actions">
                        <button type="button" class="secondary-btn" data-qc-action="back-review">Back</button>
                        <button type="button" class="action-btn" data-qc-action="manual-analyze" ${validation.ready && !state.isSubmitting ? "" : "disabled"}>${state.isSubmitting ? "Starting..." : "Start Analysis"}</button>
                    </div>
                </div>
            </section>
        `;
    }

    function detectStatusText(fieldName, selectedColumn, detectedColumn, detectedQuality) {
        if (!selectedColumn) return REQUIRED_FIELDS.includes(fieldName) ? "Missing" : "Optional";
        if (!detectedColumn) return "Manual";
        if (selectedColumn !== detectedColumn) return "Changed";
        return detectedQuality === "exact" || detectedQuality === "alias" || detectedQuality === "strong" ? "Auto-detected" : "Likely match";
    }

    function buildMappingOptions(state, row) {
        const assignedColumns = new Set(
            Object.entries(state.selectedMappings || {})
                .filter(([fieldName, columnName]) => fieldName !== row.fieldName && columnName)
                .map(([, columnName]) => columnName)
        );
        return state.headers.map((columnName) => ({
            value: columnName,
            disabled: assignedColumns.has(columnName) && columnName !== row.selectedColumn
        }));
    }

    function renderMappingRow(row, duplicateColumns) {
        const statusText = detectStatusText(row.fieldName, row.selectedColumn, row.detectedColumn, row.detectedQuality);
        const hasDuplicate = row.selectedColumn && duplicateColumns.includes(row.selectedColumn);
        const isVisualError = hasDuplicate || (row.required && !row.selectedColumn);
        const statusClass = !row.selectedColumn || hasDuplicate
            ? "is-missing"
            : row.detectedColumn && row.selectedColumn === row.detectedColumn
                ? (row.detectedQuality === "exact" || row.detectedQuality === "alias" || row.detectedQuality === "strong" ? "is-strong" : "is-possible")
                : "is-possible";
        const duplicateNote = hasDuplicate ? "This uploaded column is already assigned elsewhere." : "";
        return `
            <div class="mapping-row ${isVisualError ? "is-missing" : ""}" data-field-name="${escapeHtml(row.fieldName)}">
                <div class="mapping-field-label mapping-row-info">
                    <div class="qc2-review-field-head">
                        <div class="mapping-field-title">${escapeHtml(row.fieldName)}</div>
                        ${!row.required ? '<span class="qc2-optional-badge">Optional</span>' : ""}
                        ${row.autoDetected ? '<span class="qc2-detected-badge">Auto-detected</span>' : ""}
                    </div>
                    <div class="mapping-field-help">${escapeHtml(FIELD_HELP[row.fieldName] || "")}</div>
                    ${duplicateNote ? `<div class="qc2-inline-error">${escapeHtml(duplicateNote)}</div>` : ""}
                    ${row.required && !row.selectedColumn ? '<div class="qc2-inline-error">This required field still needs a unique column.</div>' : ""}
                </div>
                <div class="mapping-select-shell mapping-row-select">
                    <select class="mapping-select" data-qc-mapping-field="${escapeHtml(row.fieldName)}">
                        <option value="">Choose a column</option>
                        ${row.options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === row.selectedColumn ? "selected" : ""} ${option.disabled ? "disabled" : ""}>${escapeHtml(option.value)}${option.disabled ? " (Already used)" : ""}</option>`).join("")}
                    </select>
                </div>
                <div class="mapping-row-status">
                    <span class="mapping-status ${statusClass}">${escapeHtml(statusText)}</span>
                </div>
            </div>
        `;
    }

    function renderQcReview(state) {
        if (state.mode === "manual") {
            return renderQcManualReview(state);
        }
        const rows = getReviewRows(state).map((row) => ({ ...row, options: buildMappingOptions(state, row) }));
        const requiredRows = rows.filter((row) => row.required);
        const optionalRows = rows.filter((row) => !row.required);
        const duplicateColumns = state.validation.duplicateColumns.map((item) => item.columnName);
        const duplicateText = state.validation.duplicateColumns.map((item) => `"${item.columnName}" is assigned to ${item.fieldNames.join(", ")}.`).join(" ");
        const missingText = state.validation.missingFields.length ? `Map the remaining required fields: ${state.validation.missingFields.join(", ")}.` : "";

        return `
            <section class="qc2-screen qc2-screen-review">
                <div class="mapping-review-panel qc2-review-panel">
                    <div class="mapping-review-head">
                        <div>
                            <div class="upload-step">Step 2</div>
                            <h2 class="mapping-review-title">Review your column matches</h2>
                            <p class="mapping-review-copy">Confirm each required field, adjust anything that was matched incorrectly, and start analysis only when the mapping is complete.</p>
                        </div>
                        <div class="mapping-summary-chips">
                            <span class="mapping-summary-chip">${state.validation.mappedCount} of ${REQUIRED_FIELDS.length} required fields mapped</span>
                            <span class="mapping-summary-chip ${state.validation.ready ? "" : "is-warning"}">${state.validation.ready ? "Ready for analysis" : "Incomplete mapping"}</span>
                        </div>
                    </div>
                    <div class="mapping-alert mapping-alert-info">${escapeHtml(state.file?.name || state.uploadReview?.filename || "Uploaded file")}</div>
                    <div class="mapping-toolbar">
                        <div class="mapping-toolbar-copy">Required fields come first. Each uploaded column can be assigned only once.</div>
                        <div class="mapping-toolbar-actions">
                            <button type="button" class="secondary-btn mapping-toolbar-btn" data-qc-action="clear-mappings">Clear selections</button>
                        </div>
                    </div>
                    ${!state.headers.length ? '<div class="mapping-alert mapping-alert-error">No parsed columns are available for this upload. Go back and choose another file.</div>' : ""}
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Required mappings</div>
                                <div class="mapping-section-copy">These six fields must be mapped uniquely before analysis can begin.</div>
                            </div>
                        </div>
                        <div class="mapping-grid">
                            ${requiredRows.map((row) => renderMappingRow(row, duplicateColumns)).join("")}
                        </div>
                    </section>
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Optional context</div>
                                <div class="mapping-section-copy">Use these only when payment terms, delivery timing, currency, or notes should add context to the sourcing decision.</div>
                            </div>
                        </div>
                        <div class="mapping-grid">
                            ${optionalRows.map((row) => renderMappingRow(row, duplicateColumns)).join("") || '<div class="decision-list-empty">No optional fields were detected for this upload.</div>'}
                        </div>
                    </section>
                    ${missingText || duplicateText ? `<div class="mapping-alert mapping-alert-error">${escapeHtml(`${missingText} ${duplicateText}`.trim())}</div>` : ""}
                    ${renderStatus(state)}
                    <div class="qc2-actions">
                        <button type="button" class="secondary-btn" data-qc-action="back-upload">Back</button>
                        <button type="button" class="action-btn" data-qc-action="start-analysis" ${state.validation.ready && !state.isSubmitting ? "" : "disabled"}>${state.isSubmitting ? "Starting..." : "Start Analysis"}</button>
                    </div>
                </div>
            </section>
        `;
    }

    const MANUAL_REBUILD_FIELDS = [
        { key: "product_name", label: "Product Name", required: true, type: "text" },
        { key: "supplier_name", label: "Supplier", required: true, type: "text" },
        { key: "unit", label: "Unit", required: true, type: "text" },
        { key: "quantity", label: "Quantity", required: true, type: "number", min: "0", step: "0.01" },
        { key: "unit_price", label: "Unit Price", required: true, type: "number", min: "0", step: "0.01" },
        { key: "quote_date", label: "Date", required: true, type: "date" },
        { key: "currency", label: "Currency", required: false, type: "text" },
        { key: "delivery_time", label: "Delivery Time", required: false, type: "text" },
        { key: "payment_term", label: "Payment Terms", required: false, type: "text" },
        { key: "valid_until", label: "Valid Until", required: false, type: "date" },
        { key: "notes", label: "Notes", required: false, type: "text" }
    ];

    const MANUAL_REBUILD_HEADERS = MANUAL_REBUILD_FIELDS.map((field) => field.label);
    const MANUAL_REBUILD_REQUIRED_LABELS = Object.fromEntries(
        MANUAL_REBUILD_FIELDS.filter((field) => field.required).map((field) => [field.key, field.label])
    );

    function normalizeManualDraftText(value) {
        return String(value ?? "").trim();
    }

    function parseManualDraftNumber(value) {
        const normalizedValue = String(value ?? "").trim().replace(/,/g, "");
        if (!normalizedValue) return 0;
        const parsed = Number(normalizedValue);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function isManualDraftRowBlank(row) {
        return MANUAL_REBUILD_FIELDS.every((field) => normalizeManualDraftText(row?.[field.key]) === "");
    }

    function getManualRowMissingFields(row) {
        return MANUAL_REBUILD_FIELDS
            .filter((field) => field.required)
            .filter((field) => {
                if (field.key === "quantity" || field.key === "unit_price") {
                    return !(parseManualDraftNumber(row?.[field.key]) > 0);
                }
                return !normalizeManualDraftText(row?.[field.key]);
            })
            .map((field) => field.key);
    }

    function getManualDraftStats(state) {
        const draftRows = (state.manualRows || []).filter((row) => !isManualDraftRowBlank(row));
        const incompleteRows = draftRows
            .map((row, index) => ({
                index,
                row,
                missingFields: getManualRowMissingFields(row)
            }))
            .filter((item) => item.missingFields.length > 0);
        return {
            draftRows,
            rowCount: draftRows.length,
            incompleteRows,
            incompleteCount: incompleteRows.length,
            readyCount: draftRows.length - incompleteRows.length,
            ready: draftRows.length > 0 && incompleteRows.length === 0
        };
    }

    function buildManualDraftTableRows(state) {
        return getManualDraftStats(state).draftRows.map((row) => Object.fromEntries(
            MANUAL_REBUILD_FIELDS.map((field) => [field.label, row?.[field.key] ?? ""])
        ));
    }

    function buildManualReviewPayloadFromDraft() {
        return {
            session_id: "",
            filename: "Manual entry",
            required_fields: REQUIRED_FIELDS,
            optional_fields: OPTIONAL_FIELDS,
            message: "Manual pricing rows are ready for mapping review.",
            review_message: "Review required and optional column matches before moving into pricing analysis.",
            mapping: Object.fromEntries(MANUAL_REBUILD_FIELDS.map((field) => [field.label, field.label])),
            field_reviews: MANUAL_REBUILD_FIELDS.map((field) => ({
                field: field.label,
                detected_column: field.label,
                score: 200,
                match_quality: "exact"
            })),
            matched_fields: REQUIRED_FIELDS.length,
            missing_fields: [],
            optional_columns: [],
            headers: MANUAL_REBUILD_HEADERS
        };
    }

    function prepareManualDraftForReview(state) {
        const stats = getManualDraftStats(state);
        if (!stats.rowCount) {
            throw new Error("Add at least one pricing row before continuing to review.");
        }
        if (stats.incompleteCount) {
            const incompleteText = stats.incompleteRows
                .map((item) => `Row ${item.index + 1}: ${item.missingFields.map((fieldKey) => MANUAL_REBUILD_REQUIRED_LABELS[fieldKey]).join(", ")}`)
                .join(" | ");
            throw new Error(`Complete the required fields before continuing. ${incompleteText}`);
        }
        state.rows = buildManualDraftTableRows(state);
        initializeReviewState(state, buildManualReviewPayloadFromDraft());
    }

    function applySelectedMappingsToRows(rows, mapping) {
        const missingFields = REQUIRED_FIELDS.filter((fieldName) => !mapping?.[fieldName]);
        if (missingFields.length) {
            throw new Error(`Missing required field mappings: ${missingFields.join(", ")}`);
        }
        return (rows || []).map((row) => {
            const mappedRow = {};
            [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((fieldName) => {
                const sourceColumn = mapping?.[fieldName];
                if (!sourceColumn) return;
                mappedRow[fieldName] = row?.[sourceColumn] ?? "";
            });
            return mappedRow;
        });
    }

    function normalizeMappedManualRows(rows) {
        const textFields = new Set(["Supplier", "Product Name", "Unit", "Date", "Currency", "Delivery Time", "Payment Terms", "Valid Until", "Notes"]);
        return (rows || []).map((row) => {
            const normalizedRow = {};
            Object.entries(row || {}).forEach(([key, value]) => {
                normalizedRow[key] = textFields.has(key) ? normalizeManualDraftText(value) : value;
            });
            return normalizedRow;
        });
    }

    function buildQuoteBidImportResultFromRows(rows) {
        const bids = [];
        let skippedRowCount = 0;
        (rows || []).forEach((row) => {
            const supplierName = normalizeManualDraftText(row?.["Supplier"]);
            const productName = normalizeManualDraftText(row?.["Product Name"]);
            const unit = normalizeManualDraftText(row?.["Unit"]);
            const quantity = parseManualDraftNumber(row?.["Quantity"]);
            const unitPrice = parseManualDraftNumber(row?.["Unit Price"]);
            const totalPrice = parseManualDraftNumber(row?.["Total Price"]);
            if (!supplierName && !productName && quantity <= 0 && unitPrice <= 0 && totalPrice <= 0) {
                skippedRowCount += 1;
                return;
            }
            if (!supplierName || quantity <= 0) {
                skippedRowCount += 1;
                return;
            }
            const resolvedTotal = totalPrice > 0 ? totalPrice : quantity * unitPrice;
            if (unitPrice <= 0 && resolvedTotal <= 0) {
                skippedRowCount += 1;
                return;
            }
            bids.push({
                supplier_name: supplierName,
                product_name: productName,
                unit,
                quantity: Number(quantity.toFixed(4)),
                unit_price: Number(unitPrice.toFixed(4)),
                total_price: Number(resolvedTotal.toFixed(4)),
                quote_date: normalizeManualDraftText(row?.["Date"]),
                currency: normalizeManualDraftText(row?.["Currency"]).toUpperCase() || "USD",
                delivery_time: normalizeManualDraftText(row?.["Delivery Time"]),
                payment_term: normalizeManualDraftText(row?.["Payment Terms"]),
                valid_until: normalizeManualDraftText(row?.["Valid Until"]),
                notes: normalizeManualDraftText(row?.["Notes"])
            });
        });
        return {
            bids,
            skipped_row_count: skippedRowCount,
            valid_row_count: bids.length
        };
    }

    function refreshManualDraftUi(elements, state, rowIndex) {
        if (state.currentScreen !== "manual" || !elements.app) return;
        const stats = getManualDraftStats(state);
        const summaryNode = elements.app.querySelector("[data-qc-manual-summary]");
        if (summaryNode) {
            summaryNode.textContent = `${stats.readyCount} ready rows | ${stats.incompleteCount} incomplete rows`;
        }
        const reviewButton = elements.app.querySelector('[data-qc-action="go-manual-review"]');
        if (reviewButton) {
            reviewButton.disabled = !stats.rowCount;
        }
        const rowNode = elements.app.querySelector(`[data-manual-row="${rowIndex}"]`);
        if (!rowNode) return;
        const row = state.manualRows[rowIndex] || createEmptyManualRow();
        const missingFields = getManualRowMissingFields(row);
        const showInlineFeedback = !isManualDraftRowBlank(row) && missingFields.length > 0;
        rowNode.classList.toggle("is-incomplete", showInlineFeedback);
        rowNode.querySelectorAll("[data-manual-field]").forEach((input) => {
            const fieldKey = input.dataset.manualField || "";
            const isInvalid = showInlineFeedback && missingFields.includes(fieldKey);
            input.classList.toggle("is-invalid", isInvalid);
            if (isInvalid) {
                input.setAttribute("aria-invalid", "true");
            } else {
                input.removeAttribute("aria-invalid");
            }
        });
        const noteNode = rowNode.querySelector("[data-qc-manual-row-note]");
        if (noteNode) {
            noteNode.hidden = !showInlineFeedback;
            noteNode.textContent = showInlineFeedback
                ? `Complete: ${missingFields.map((fieldKey) => MANUAL_REBUILD_REQUIRED_LABELS[fieldKey]).join(", ")}.`
                : "";
        }
    }

    function getManualEntryScroller(elements) {
        return elements.app?.querySelector(".qc2-manual-entry-scroll") || null;
    }

    function restoreManualEntryScrollLeft(elements, scrollLeft) {
        requestAnimationFrame(() => {
            const scroller = getManualEntryScroller(elements);
            if (!scroller) return;
            scroller.scrollLeft = Math.max(Number(scrollLeft) || 0, 0);
        });
    }

    function renderManualDraftHeaderCell(field) {
        return `
            <th class="${field.required ? "is-required" : "is-optional"}">
                <span class="qc2-manual-entry-head-label">${escapeHtml(field.label)}</span>
                <span class="qc2-manual-entry-head-badge">${field.required ? "Required" : "Optional"}</span>
            </th>
        `;
    }

    function renderManualDraftCell(row, index, field) {
        const value = row?.[field.key] ?? "";
        const missingFields = getManualRowMissingFields(row);
        const isInvalid = !isManualDraftRowBlank(row) && missingFields.includes(field.key);
        const attrs = [];
        if (field.min != null) attrs.push(`min="${escapeHtml(field.min)}"`);
        if (field.step != null) attrs.push(`step="${escapeHtml(field.step)}"`);
        return `
            <td class="${field.required ? "is-required" : "is-optional"}">
                <label class="qc2-manual-entry-cell">
                    <span class="qc2-manual-entry-mobile-label">${escapeHtml(field.label)}${field.required ? " *" : ""}</span>
                    <input
                        class="recipe-input qc2-manual-entry-input ${isInvalid ? "is-invalid" : ""}"
                        type="${field.type}"
                        ${attrs.join(" ")}
                        data-manual-field="${field.key}"
                        data-index="${index}"
                        value="${escapeHtml(value)}"
                        aria-label="${escapeHtml(field.label)}"
                    >
                </label>
            </td>
        `;
    }

    function renderManualDraftRow(row, index) {
        const missingFields = getManualRowMissingFields(row);
        const showInlineFeedback = !isManualDraftRowBlank(row) && missingFields.length > 0;
        return `
            <tr class="${showInlineFeedback ? "is-incomplete" : ""}" data-manual-row="${index}">
                <td class="qc2-manual-entry-row-index">${index + 1}</td>
                ${MANUAL_REBUILD_FIELDS.map((field) => renderManualDraftCell(row, index, field)).join("")}
                <td class="qc2-manual-entry-row-actions">
                    <button type="button" class="secondary-btn qc2-remove-row" data-qc-action="remove-manual-row" data-index="${index}" ${index === 0 ? "disabled" : ""}>Remove</button>
                    ${showInlineFeedback ? `<div class="qc2-manual-inline-note">Complete: ${escapeHtml(missingFields.map((fieldKey) => MANUAL_REBUILD_REQUIRED_LABELS[fieldKey]).join(", "))}.</div>` : ""}
                </td>
            </tr>
        `;
    }

    function renderQcManual(state) {
        const stats = getManualDraftStats(state);
        return `
            <section class="qc2-screen qc2-screen-manual">
                <div class="qc2-card qc2-upload-card">
                    <div class="qc2-head qc2-head-compact">
                        <div class="upload-step">Step 1</div>
                        <h2 class="qc2-title">Enter pricing data</h2>
                        <p class="qc2-copy">Enter pricing rows manually using the same fields expected by upload, then continue into the same mapping and analysis workflow.</p>
                    </div>
                    <div class="qc2-upload-panel">
                        <div class="qc2-upload-shell">
                            <div class="qc2-upload-copy-block">
                                <div class="qc2-upload-title">Manual entry</div>
                                <div class="qc2-upload-copy">${stats.readyCount} ready rows • ${stats.incompleteCount} incomplete rows</div>
                                <div class="qc2-upload-note">Required fields mirror upload exactly. Optional fields keep delivery, payment, and validity context attached to each row.</div>
                            </div>
                            <div class="qc2-upload-actions">
                                <button type="button" class="secondary-btn" data-qc-action="add-manual-row">Add Row</button>
                            </div>
                        </div>
                    </div>
                    <div class="qc2-manual-entry-shell">
                        <div class="qc2-manual-entry-scroll">
                            <table class="quote-compare-table qc2-manual-entry-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        ${MANUAL_REBUILD_FIELDS.map((field) => renderManualDraftHeaderCell(field)).join("")}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.manualRows.map((row, index) => renderManualDraftRow(row, index)).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="qc2-manual-entry-legend">
                        <span><strong>Required:</strong> Product Name, Supplier, Unit, Quantity, Unit Price, Date</span>
                        <span><strong>Optional:</strong> Currency, Delivery Time, Payment Terms, Valid Until, Notes</span>
                    </div>
                    ${renderStatus(state)}
                    <div class="qc2-actions qc2-manual-actions">
                        <div class="qc2-manual-actions-group">
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="back-start">Back</button>
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="add-manual-row">Add Row</button>
                        </div>
                        <div class="qc2-manual-actions-group qc2-manual-actions-group-end">
                            <button type="button" class="action-btn qc2-manual-footer-btn qc2-manual-footer-btn-primary" data-qc-action="go-manual-review" ${stats.rowCount ? "" : "disabled"}>Review Columns</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderQcReview(state) {
        const rows = getReviewRows(state).map((row) => ({ ...row, options: buildMappingOptions(state, row) }));
        const requiredRows = rows.filter((row) => row.required);
        const optionalRows = rows.filter((row) => !row.required);
        const duplicateColumns = state.validation.duplicateColumns.map((item) => item.columnName);
        const duplicateText = state.validation.duplicateColumns.map((item) => `"${item.columnName}" is assigned to ${item.fieldNames.join(", ")}.`).join(" ");
        const missingText = state.validation.missingFields.length ? `Map the remaining required fields: ${state.validation.missingFields.join(", ")}.` : "";
        const reviewCopy = state.mode === "manual"
            ? "Confirm the required fields, adjust anything you want to reinterpret, and start analysis only when the mapping is complete."
            : "Confirm each required field, adjust anything that was matched incorrectly, and start analysis only when the mapping is complete.";
        const sourceLabel = state.mode === "manual" ? "Manual entry" : (state.file?.name || state.uploadReview?.filename || "Uploaded file");
        const toolbarCopy = state.mode === "manual"
            ? "Required fields come first. Each entered column can be assigned only once."
            : "Required fields come first. Each uploaded column can be assigned only once.";

        return `
            <section class="qc2-screen qc2-screen-review">
                <div class="mapping-review-panel qc2-review-panel">
                    <div class="mapping-review-head">
                        <div>
                            <div class="upload-step">Step 2</div>
                            <h2 class="mapping-review-title">Review your column matches</h2>
                            <p class="mapping-review-copy">${reviewCopy}</p>
                        </div>
                        <div class="mapping-summary-chips">
                            <span class="mapping-summary-chip">${state.validation.mappedCount} of ${REQUIRED_FIELDS.length} required fields mapped</span>
                            <span class="mapping-summary-chip ${state.validation.ready ? "" : "is-warning"}">${state.validation.ready ? "Ready for analysis" : "Incomplete mapping"}</span>
                        </div>
                    </div>
                    <div class="mapping-alert mapping-alert-info">${escapeHtml(sourceLabel)}</div>
                    <div class="mapping-toolbar">
                        <div class="mapping-toolbar-copy">${escapeHtml(toolbarCopy)}</div>
                        <div class="mapping-toolbar-actions">
                            <button type="button" class="secondary-btn mapping-toolbar-btn" data-qc-action="clear-mappings">Clear selections</button>
                        </div>
                    </div>
                    ${!state.headers.length ? '<div class="mapping-alert mapping-alert-error">No parsed columns are available for this entry set. Go back and add pricing rows.</div>' : ""}
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Required mappings</div>
                                <div class="mapping-section-copy">These six fields must be mapped uniquely before analysis can begin.</div>
                            </div>
                        </div>
                        <div class="mapping-grid">
                            ${requiredRows.map((row) => renderMappingRow(row, duplicateColumns)).join("")}
                        </div>
                    </section>
                    <section class="mapping-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Optional context</div>
                                <div class="mapping-section-copy">Use these only when payment terms, delivery timing, currency, or notes should add context to the sourcing decision.</div>
                            </div>
                        </div>
                        <div class="mapping-grid">
                            ${optionalRows.map((row) => renderMappingRow(row, duplicateColumns)).join("") || '<div class="decision-list-empty">No optional fields were detected for this entry set.</div>'}
                        </div>
                    </section>
                    ${missingText || duplicateText ? `<div class="mapping-alert mapping-alert-error">${escapeHtml(`${missingText} ${duplicateText}`.trim())}</div>` : ""}
                    ${renderStatus(state)}
                    <div class="qc2-actions">
                        <button type="button" class="secondary-btn" data-qc-action="back-review">Back</button>
                        <button type="button" class="action-btn" data-qc-action="start-analysis" ${state.validation.ready && !state.isSubmitting ? "" : "disabled"}>${state.isSubmitting ? "Starting..." : "Start Analysis"}</button>
                    </div>
                </div>
            </section>
        `;
    }

    function renderManualDraftCell(row, index, field) {
        const value = row?.[field.key] ?? "";
        const missingFields = getManualRowMissingFields(row);
        const isInvalid = !isManualDraftRowBlank(row) && missingFields.includes(field.key);
        const attrs = [];
        if (field.min != null) attrs.push(`min="${escapeHtml(field.min)}"`);
        if (field.step != null) attrs.push(`step="${escapeHtml(field.step)}"`);
        return `
            <td class="${field.required ? "is-required" : "is-optional"}">
                <label class="qc2-manual-entry-cell">
                    <span class="qc2-manual-entry-mobile-label">${escapeHtml(field.label)}${field.required ? " *" : ""}</span>
                    <input
                        class="recipe-input qc2-manual-entry-input ${isInvalid ? "is-invalid" : ""}"
                        type="${field.type}"
                        ${attrs.join(" ")}
                        data-manual-field="${field.key}"
                        data-index="${index}"
                        value="${escapeHtml(value)}"
                        aria-label="${escapeHtml(field.label)}"
                        ${isInvalid ? 'aria-invalid="true"' : ""}
                    >
                </label>
            </td>
        `;
    }

    function renderManualDraftRow(row, index) {
        const missingFields = getManualRowMissingFields(row);
        const showInlineFeedback = !isManualDraftRowBlank(row) && missingFields.length > 0;
        return `
            <tr class="${showInlineFeedback ? "is-incomplete" : ""}" data-manual-row="${index}">
                <td class="qc2-manual-entry-row-index">${index + 1}</td>
                ${MANUAL_REBUILD_FIELDS.map((field) => renderManualDraftCell(row, index, field)).join("")}
                <td class="qc2-manual-entry-row-actions">
                    <button type="button" class="secondary-btn qc2-remove-row" data-qc-action="remove-manual-row" data-index="${index}" ${index === 0 ? "disabled" : ""}>Remove</button>
                    <div class="qc2-manual-inline-note" data-qc-manual-row-note ${showInlineFeedback ? "" : "hidden"}>${showInlineFeedback ? `Complete: ${escapeHtml(missingFields.map((fieldKey) => MANUAL_REBUILD_REQUIRED_LABELS[fieldKey]).join(", "))}.` : ""}</div>
                </td>
            </tr>
        `;
    }

    function renderQcManual(state) {
        const stats = getManualDraftStats(state);
        return `
            <section class="qc2-screen qc2-screen-manual">
                <div class="qc2-card qc2-upload-card">
                    <div class="qc2-head qc2-head-compact">
                        <div class="upload-step">Step 1</div>
                        <h2 class="qc2-title">Enter pricing data</h2>
                        <p class="qc2-copy">Enter pricing rows manually using the same fields expected by upload, then continue into the same mapping and analysis workflow.</p>
                    </div>
                    <div class="qc2-upload-panel">
                        <div class="qc2-upload-shell">
                            <div class="qc2-upload-copy-block">
                                <div class="qc2-upload-title">Manual entry</div>
                                <div class="qc2-upload-copy" data-qc-manual-summary>${stats.readyCount} ready rows | ${stats.incompleteCount} incomplete rows</div>
                                <div class="qc2-upload-note">Required fields mirror upload exactly. Optional fields keep delivery, payment, and validity context attached to each row.</div>
                            </div>
                            <div class="qc2-upload-actions">
                                <button type="button" class="secondary-btn" data-qc-action="add-manual-row">Add Row</button>
                            </div>
                        </div>
                    </div>
                    <div class="qc2-manual-entry-shell">
                        <div class="qc2-manual-entry-scroll">
                            <table class="quote-compare-table qc2-manual-entry-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        ${MANUAL_REBUILD_FIELDS.map((field) => renderManualDraftHeaderCell(field)).join("")}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.manualRows.map((row, index) => renderManualDraftRow(row, index)).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="qc2-manual-entry-legend">
                        <span><strong>Required:</strong> Product Name, Supplier, Unit, Quantity, Unit Price, Date</span>
                        <span><strong>Optional:</strong> Currency, Delivery Time, Payment Terms, Valid Until, Notes</span>
                    </div>
                    ${renderStatus(state)}
                    <div class="qc2-actions qc2-manual-actions">
                        <div class="qc2-manual-actions-group">
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="back-start">Back</button>
                            <button type="button" class="secondary-btn qc2-manual-footer-btn" data-qc-action="add-manual-row">Add Row</button>
                        </div>
                        <div class="qc2-manual-actions-group qc2-manual-actions-group-end">
                            <button type="button" class="action-btn qc2-manual-footer-btn qc2-manual-footer-btn-primary" data-qc-action="go-manual-review" ${stats.rowCount ? "" : "disabled"}>Review Columns</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function getDecisionCardKey(card) {
        return `${card.productName}__${card.unit}__${normalizeQuantityContext(card.quantity)}__${card.currentOffer?.supplier_name || ""}__${card.bestOffer?.supplier_name || ""}`;
    }

    function getScopedDecisionCardKey(scope, baseKey) {
        return `${scope}::${baseKey}`;
    }

    function clearDecisionCardsForScope(collapsedDecisionCards, scope) {
        const prefix = `${scope}::`;
        return Object.fromEntries(
            Object.entries(collapsedDecisionCards || {}).filter(([key]) => !key.startsWith(prefix))
        );
    }

    function toggleDecisionCardState(collapsedDecisionCards, cardKey) {
        const nextDecisionCards = { ...(collapsedDecisionCards || {}) };
        if (nextDecisionCards[cardKey]) {
            delete nextDecisionCards[cardKey];
        } else {
            nextDecisionCards[cardKey] = true;
        }
        return nextDecisionCards;
    }

    function clearFullComparisonDetails(collapsedDecisionCards) {
        return clearDecisionCardsForScope(
            clearDecisionCardsForScope(collapsedDecisionCards, "analysis"),
            "optimize"
        );
    }

    function getFullComparisonTableScroller(elements) {
        return elements.app?.querySelector(".qc2-analysis-table-scroll") || null;
    }

    function rememberFullComparisonTablePosition(elements, state) {
        const tableScroller = getFullComparisonTableScroller(elements);
        if (!tableScroller) return;
        state.fullComparisonTableScroll = {
            top: Number(tableScroller.scrollTop || 0),
            left: Number(tableScroller.scrollLeft || 0)
        };
    }

    function restoreFullComparisonTablePosition(elements, state) {
        const tableScroller = getFullComparisonTableScroller(elements);
        if (!tableScroller || state.currentScreen !== "analyze") return;
        const savedPosition = state.fullComparisonTableScroll || {};
        tableScroller.scrollTop = Number(savedPosition.top || 0);
        tableScroller.scrollLeft = Number(savedPosition.left || 0);
    }

    function setFullComparisonTableActiveState(elements, isActive) {
        elements.app?.querySelector(".qc2-analysis-table-frame")?.classList.toggle("is-active", Boolean(isActive));
    }

    function selectFullComparisonRow(elements, state, cardKey, { persist = true } = {}) {
        const nextCardKey = String(cardKey || "").trim();
        if (!nextCardKey) return;
        state.selectedAnalysisRowKey = nextCardKey;
        elements.app?.querySelectorAll("[data-qc-analysis-card-key]").forEach((row) => {
            row.classList.toggle("is-selected", row.dataset.qcAnalysisCardKey === nextCardKey);
        });
        if (persist) {
            scheduleQuoteCompareSessionPersist(state, elements);
        }
    }

    function cssEscape(value) {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(String(value || ""));
        }
        return String(value || "").replace(/["\\]/g, "\\$&");
    }

    function setDecisionButtonLabel(button, isExpanded) {
        if (!button) return;
        const cardKey = button.dataset.cardKey || "";
        const scope = getDecisionCardScope(cardKey);
        button.textContent = scope === "spotlight"
            ? (isExpanded ? "Hide table" : "Show table")
            : (isExpanded ? "Close table" : "Open table");
        button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    }

    function toggleSpotlightCardInPlace(elements, state, cardKey) {
        if (!elements.app || !cardKey) return false;
        const targetCard = elements.app.querySelector(`[data-qc-card-key="${cssEscape(cardKey)}"]`);
        if (!targetCard) return false;
        const panelScroll = targetCard.closest(".qc2-spotlight-panel-scroll");
        const anchorTopBefore = panelScroll
            ? targetCard.getBoundingClientRect().top - panelScroll.getBoundingClientRect().top
            : targetCard.getBoundingClientRect().top;
        const panelScrollTopBefore = panelScroll ? panelScroll.scrollTop : 0;
        const pageScrollTopBefore = panelScroll ? 0 : readScrollPosition(elements);
        const nextExpanded = !state.collapsedDecisionCards[cardKey];
        const spotlightCards = Array.from(elements.app.querySelectorAll("[data-qc-card-key]"));
        spotlightCards.forEach((card) => {
            const isTarget = card.dataset.qcCardKey === cardKey;
            const shouldExpand = nextExpanded && isTarget;
            card.classList.toggle("is-expanded", shouldExpand);
            setDecisionButtonLabel(card.querySelector('[data-qc-action="toggle-decision-card"]'), shouldExpand);
        });
        const anchorTopAfter = panelScroll
            ? targetCard.getBoundingClientRect().top - panelScroll.getBoundingClientRect().top
            : targetCard.getBoundingClientRect().top;
        const anchorDelta = anchorTopAfter - anchorTopBefore;
        if (panelScroll && Math.abs(anchorDelta) > 1) {
            panelScroll.scrollTop = panelScrollTopBefore + anchorDelta;
        } else if (Math.abs(anchorDelta) > 1) {
            writeScrollPosition(elements, pageScrollTopBefore + anchorDelta);
        }
        state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
        if (nextExpanded) {
            state.collapsedDecisionCards[cardKey] = true;
        }
        persistQuoteCompareSession(state, elements);
        return true;
    }

    function getAnalysisFilterResultValue(card) {
        if (card.decisionType === "lowest-observed-price-already-used") return "no-immediate-action";
        return "pricing-opportunities";
    }

    function normalizeAnalysisTableFilter(filterValue) {
        if (filterValue === "direct-savings" || filterValue === "another-supplier-lower" || filterValue === "same-supplier-lower" || filterValue === "price-variation") {
            return "pricing-opportunities";
        }
        if (filterValue === "lowest-observed") return "no-immediate-action";
        return filterValue || "all";
    }

    function getDecisionCardScope(cardKey) {
        if (typeof cardKey !== "string") return "";
        const separatorIndex = cardKey.indexOf("::");
        return separatorIndex === -1 ? "" : cardKey.slice(0, separatorIndex);
    }

    function renderAnalysisFilterBar(state, cards) {
        const counts = cards.reduce((summary, card) => {
            const resultKey = getAnalysisFilterResultValue(card);
            summary.all += 1;
            summary[resultKey] += 1;
            return summary;
        }, {
            all: 0,
            "pricing-opportunities": 0,
            "no-immediate-action": 0
        });
        const activeFilter = normalizeAnalysisTableFilter(state.analysisTableFilter);
        const filters = [
            { value: "all", label: "All results" },
            { value: "pricing-opportunities", label: "Pricing opportunities" },
            { value: "no-immediate-action", label: "No immediate action" }
        ];
        return `
            <div class="qc2-analysis-filterbar" data-qc-analysis-filterbar>
                <div class="qc2-analysis-filterbar-actions">
                    ${filters.map((filter) => `
                        <button
                            type="button"
                            class="secondary-btn qc2-analysis-filter-btn ${activeFilter === filter.value ? "is-active" : ""}"
                            data-qc-action="set-analysis-filter"
                            data-filter-value="${escapeHtml(filter.value)}"
                            aria-pressed="${activeFilter === filter.value ? "true" : "false"}"
                        >
                            ${escapeHtml(filter.label)} <span class="qc2-analysis-filter-count">${counts[filter.value]}</span>
                        </button>
                    `).join("")}
                </div>
                <div class="search-input-shell qc2-analysis-search-shell" role="search" aria-label="Search products or suppliers">
                    <input
                        type="search"
                        class="search-input qc2-analysis-search-input"
                        data-qc-analysis-search
                        value="${escapeHtml(state.analysisTableSearch || "")}"
                        placeholder="Search product or supplier"
                        autocomplete="off"
                    >
                    <button type="button" class="action-btn qc2-analysis-search-button" tabindex="-1" aria-hidden="true">Search</button>
                </div>
            </div>
        `;
    }

    function getOpportunityCardTheme(index) {
        return OPPORTUNITY_CARD_PALETTE[index % OPPORTUNITY_CARD_PALETTE.length];
    }

    function getTopPricingOpportunityPriority(card) {
        if (card.hasValidAlternative && card.savingsAmount > 0) return 0;
        if (card.decisionType === "lower-historical-price-with-current-supplier") return 1;
        if (card.decisionType === "lower-price-with-another-supplier") return 2;
        if (card.observedAtDifferentQuantity) return 3;
        return 4;
    }

    function getTopPricingOpportunityScore(card) {
        if (card.hasValidAlternative && card.savingsAmount > 0) {
            return Number(card.savingsAmount || 0);
        }
        return Math.max(
            Number(card.currentOffer?.unit_price || 0) - Number(card.referenceOffer?.unit_price || 0),
            0
        );
    }

    function getTopPricingOpportunityCards(cards) {
        return [...(cards || [])]
            .filter((card) => card.decisionType !== "lowest-observed-price-already-used")
            .sort((left, right) => {
                const priorityDelta = getTopPricingOpportunityPriority(left) - getTopPricingOpportunityPriority(right);
                if (priorityDelta !== 0) return priorityDelta;
                const scoreDelta = getTopPricingOpportunityScore(right) - getTopPricingOpportunityScore(left);
                if (scoreDelta !== 0) return scoreDelta;
                return String(left.productName || "").localeCompare(String(right.productName || ""));
            })
            .slice(0, 12);
    }

    function getSpotlightBadgeLabel(card) {
        if (card.hasValidAlternative && card.savingsAmount > 0) return "Direct savings";
        if (card.decisionType === "lower-historical-price-with-current-supplier") return "Current supplier history";
        if (card.decisionType === "lower-price-with-another-supplier") return "Another supplier lower";
        if (card.observedAtDifferentQuantity) return "Different quantity";
        return "Price insight";
    }

    function renderDecisionSpotlightCards(cards, state) {
        if (!cards.length) {
            return '<div class="decision-list-empty">No savings opportunities are visible in the current pricing set.</div>';
        }
        return `
            <div class="qc2-spotlight-panel">
                <div class="qc2-spotlight-panel-scroll">
                    <div class="qc2-spotlight-grid">
                ${cards.map((card, index) => {
                    const theme = getOpportunityCardTheme(index);
                    const cardKey = getScopedDecisionCardKey("spotlight", getDecisionCardKey(card));
                    const isExpanded = Boolean(state.collapsedDecisionCards[cardKey]);
                    return `
                        <article
                            class="qc2-spotlight-card ${isExpanded ? "is-expanded" : ""}"
                            data-qc-card-key="${escapeHtml(cardKey)}"
                            style="
                                --qc2-card-border:${theme.border};
                                --qc2-card-glow:${theme.glow};
                                --qc2-card-badge-bg:${theme.badgeBg};
                                --qc2-card-badge-text:${theme.badgeText};
                                --qc2-card-lane-border:${theme.laneBorder};
                                --qc2-card-best-border:${theme.laneBestBorder};
                                --qc2-card-decision-bg:${theme.decisionBg};
                                --qc2-card-decision-border:${theme.decisionBorder};
                                --qc2-card-savings-text:${theme.savingsText};
                            "
                        >
                            <div class="qc2-spotlight-card-head">
                                <div>
                                    <div class="qc2-spotlight-title">${escapeHtml(card.productName)}</div>
                                    <div class="qc2-spotlight-meta">${escapeHtml(card.unit || "Unit not provided")} | Qty ${escapeHtml(String(card.quantity || 0))}</div>
                                </div>
                                <span class="qc2-spotlight-badge">Top savings</span>
                            </div>
                            <div class="qc2-spotlight-compare">
                                <div class="qc2-spotlight-lane is-current">
                                    <div class="qc2-spotlight-label">Current supplier</div>
                                    <div class="qc2-spotlight-supplier">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-spotlight-value">${escapeHtml(formatCurrency(card.currentOffer?.total_price || 0, card.currency))}</div>
                                </div>
                                <div class="qc2-spotlight-arrow">→</div>
                                <div class="qc2-spotlight-lane is-best">
                                    <div class="qc2-spotlight-label">Recommended supplier</div>
                                    <div class="qc2-spotlight-supplier">${escapeHtml(card.bestOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-spotlight-value">${escapeHtml(formatCurrency(card.bestOffer?.total_price || 0, card.currency))}</div>
                                </div>
                            </div>
                            <div class="qc2-spotlight-savings-row">
                                <div>
                                    <div class="qc2-spotlight-savings-value">${escapeHtml(formatCurrency(card.savingsAmount, card.currency))}</div>
                                    <div class="qc2-spotlight-savings-copy">${card.hasValidAlternative ? `${escapeHtml(formatPercent(card.savingsPercent))} lower unit price` : "Insight only"}</div>
                                </div>
                                <div class="qc2-spotlight-actions">
                                    <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="open-product-summary" data-product-name="${escapeHtml(card.productName)}" data-product-unit="${escapeHtml(card.unit || "")}">
                                        Price summary
                                    </button>
                                    <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="toggle-decision-card" data-card-key="${escapeHtml(cardKey)}" aria-expanded="${isExpanded ? "true" : "false"}">
                                        ${isExpanded ? "Hide table" : "Show table"}
                                    </button>
                                </div>
                            </div>
                            <div class="qc2-spotlight-decision ${card.statusTone === "neutral" ? "is-neutral" : ""}">${escapeHtml(card.decisionSentence)}</div>
                            <div class="qc2-spotlight-detail">
                                <div class="qc2-spotlight-detail-shell">
                                    <div class="qc2-spotlight-detail-grid">
                                        <section class="qc2-spotlight-detail-group" aria-label="Current price detail">
                                            <div class="qc2-spotlight-detail-group-title">Current Price</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Supplier</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Unit price</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Price date</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatDate(card.quoteDate))}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group is-highlighted" aria-label="Recommended price detail">
                                            <div class="qc2-spotlight-detail-group-title">Recommended Price</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Supplier</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.bestOffer?.supplier_name || "Supplier missing")}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Unit price</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.bestOffer?.unit_price || 0, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Price date</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatDate(card.bestOffer?.quote_date || card.quoteDate))}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group" aria-label="Savings and impact detail">
                                            <div class="qc2-spotlight-detail-group-title">Savings / Impact</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Total savings</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.savingsAmount, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Variance</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatPercent(card.savingsPercent))} lower unit price</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Quantity</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(String(card.quantity || 0))} ${escapeHtml(card.unit || "")}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group qc2-spotlight-detail-group-notes" aria-label="Decision guidance detail">
                                            <div class="qc2-spotlight-detail-group-title">Decision Guidance</div>
                                            <div class="qc2-spotlight-detail-note">${escapeHtml(card.decisionSentence)}</div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </article>
                    `;
                }).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    function renderDecisionSpotlightCards(cards, state) {
        if (!cards.length) {
            return '<div class="decision-list-empty">No immediate pricing opportunities found. Review full table for detailed price insights.</div>';
        }
        return `
            <div class="qc2-spotlight-panel">
                <div class="qc2-spotlight-panel-scroll">
                    <div class="qc2-spotlight-grid">
                ${cards.map((card, index) => {
                    const theme = getOpportunityCardTheme(index);
                    const cardKey = getScopedDecisionCardKey("spotlight", getDecisionCardKey(card));
                    const isExpanded = Boolean(state.collapsedDecisionCards[cardKey]);
                    const badgeLabel = getSpotlightBadgeLabel(card);
                    return `
                        <article
                            class="qc2-spotlight-card ${isExpanded ? "is-expanded" : ""}"
                            data-qc-card-key="${escapeHtml(cardKey)}"
                            style="
                                --qc2-card-border:${theme.border};
                                --qc2-card-glow:${theme.glow};
                                --qc2-card-badge-bg:${theme.badgeBg};
                                --qc2-card-badge-text:${theme.badgeText};
                                --qc2-card-lane-border:${theme.laneBorder};
                                --qc2-card-best-border:${theme.laneBestBorder};
                                --qc2-card-decision-bg:${theme.decisionBg};
                                --qc2-card-decision-border:${theme.decisionBorder};
                                --qc2-card-savings-text:${theme.savingsText};
                            "
                        >
                            <div class="qc2-spotlight-card-head">
                                <div>
                                    <div class="qc2-spotlight-title">${escapeHtml(card.productName)}</div>
                                    <div class="qc2-spotlight-meta">${escapeHtml(card.statusLabel)} | ${escapeHtml(card.unit || "Unit not provided")} | Qty ${escapeHtml(String(card.quantity || 0))}</div>
                                </div>
                                <span class="qc2-spotlight-badge">${escapeHtml(badgeLabel)}</span>
                            </div>
                            <div class="qc2-spotlight-compare">
                                <div class="qc2-spotlight-lane is-current">
                                    <div class="qc2-spotlight-label">Current unit price</div>
                                    <div class="qc2-spotlight-supplier">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-spotlight-value">${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))}</div>
                                    <div class="qc2-spotlight-meta">${escapeHtml(formatDate(card.quoteDate))} | Qty ${escapeHtml(String(card.currentOffer?.quantity || card.quantity || 0))}</div>
                                </div>
                                <div class="qc2-spotlight-arrow">-&gt;</div>
                                <div class="qc2-spotlight-lane is-best">
                                    <div class="qc2-spotlight-label">${escapeHtml(card.referenceOfferLabel || "Reference price")}</div>
                                    <div class="qc2-spotlight-supplier">${escapeHtml(card.referenceOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-spotlight-value">${escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))}</div>
                                    <div class="qc2-spotlight-meta">${escapeHtml(formatDate(card.referenceOffer?.quote_date || card.quoteDate))} | Qty ${escapeHtml(String(card.referenceOffer?.quantity || 0))}</div>
                                </div>
                            </div>
                            <div class="qc2-spotlight-savings-row">
                                <div>
                                    <div class="qc2-spotlight-savings-value">${card.hasValidAlternative ? escapeHtml(formatCurrency(card.savingsAmount, card.currency)) : escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))}</div>
                                    <div class="qc2-spotlight-savings-copy">${card.hasValidAlternative ? `${escapeHtml(formatPercent(card.savingsPercent))} direct savings` : escapeHtml(card.quantityContextNote || "Insight only")}</div>
                                    ${card.hasPotentialSavings ? `
                                        <div class="qc2-spotlight-potential">
                                            <span class="qc2-spotlight-potential-label">Potential savings</span>
                                            <span class="qc2-spotlight-potential-value">${escapeHtml(formatCurrency(card.potentialSavingsAmount, card.currency))}</span>
                                        </div>
                                        ${card.potentialSavingsObservedAtDifferentQuantity ? '<div class="qc2-spotlight-potential-note">Estimated based on price observed at different quantity</div>' : ""}
                                    ` : ""}
                                </div>
                                <div class="qc2-spotlight-actions">
                                    <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="open-product-summary" data-product-name="${escapeHtml(card.productName)}" data-product-unit="${escapeHtml(card.unit || "")}">
                                        View summary
                                    </button>
                                    <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="toggle-decision-card" data-card-key="${escapeHtml(cardKey)}" aria-expanded="${isExpanded ? "true" : "false"}">
                                        ${isExpanded ? "Hide table" : "Show table"}
                                    </button>
                                </div>
                            </div>
                            <div class="qc2-spotlight-decision ${card.statusTone === "neutral" ? "is-neutral" : ""}">${escapeHtml(card.decisionSentence)}</div>
                            <div class="qc2-spotlight-detail">
                                <div class="qc2-spotlight-detail-shell">
                                    <div class="qc2-spotlight-detail-grid">
                                        <section class="qc2-spotlight-detail-group" aria-label="Current price detail">
                                            <div class="qc2-spotlight-detail-group-title">Current Price</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Supplier</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Unit price</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Price date</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatDate(card.quoteDate))}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group is-highlighted" aria-label="Reference price detail">
                                            <div class="qc2-spotlight-detail-group-title">Reference Price</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Supplier</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.referenceOffer?.supplier_name || "Supplier missing")}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Unit price</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Price date</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatDate(card.referenceOffer?.quote_date || card.quoteDate))}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group" aria-label="Opportunity detail">
                                            <div class="qc2-spotlight-detail-group-title">Opportunity Snapshot</div>
                                            <div class="qc2-spotlight-detail-table">
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Opportunity type</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.statusLabel)}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Current vs reference</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))} vs ${escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))}</span>
                                                </div>
                                                <div class="qc2-spotlight-detail-row">
                                                    <span class="qc2-spotlight-detail-label">Context</span>
                                                    <span class="qc2-spotlight-detail-value">${escapeHtml(card.quantityContextNote || "Observed context available")}</span>
                                                </div>
                                            </div>
                                        </section>
                                        <section class="qc2-spotlight-detail-group qc2-spotlight-detail-group-notes" aria-label="Decision guidance detail">
                                            <div class="qc2-spotlight-detail-group-title">Decision Guidance</div>
                                            <div class="qc2-spotlight-detail-note">${escapeHtml(card.decisionSentence)}</div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </article>
                    `;
                }).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    function getAnalysisDecisionCards(state) {
        return getAnalysisSummary(state.analysisResult || { comparison: { bids: [] } }).decisionCards || [];
    }

    function findProductSummaryCard(state, productName, unit) {
        const cards = getAnalysisDecisionCards(state)
            .filter((card) => card.productName === productName && String(card.unit || "") === String(unit || ""));
        if (!cards.length) return null;
        return [...cards].sort((left, right) => compareOffersByRecency(left.currentOffer || {}, right.currentOffer || {}))[0] || cards[0];
    }

    function openProductSummary(state, productName, unit) {
        const card = findProductSummaryCard(state, productName, unit);
        if (!card?.productSummary) return false;
        state.productSummaryModalOpen = true;
        state.productSummaryModalData = {
            productName: card.productName,
            unit: card.unit || "",
            currentOffer: card.currentOffer || null,
            productSummary: card.productSummary
        };
        return true;
    }

    function closeProductSummary(state) {
        state.productSummaryModalOpen = false;
        state.productSummaryModalData = null;
    }

    function renderProductSummaryDrawer(state) {
        if (!state.productSummaryModalOpen || !state.productSummaryModalData?.productSummary) return "";
        const { productName, unit, currentOffer, productSummary } = state.productSummaryModalData;
        const {
            lowestObservedOffer,
            highestObservedOffer,
            latestObservedOffer,
            earliestObservedOffer,
            averageObservedUnitPrice,
            supplierCount,
            offers
        } = productSummary;
        const currency = lowestObservedOffer?.currency || currentOffer?.currency || "USD";
        const currentVsLowestUnitGap = Math.max(Number(currentOffer?.unit_price || 0) - Number(lowestObservedOffer?.unit_price || 0), 0);
        const currentVsLowestPercent = Number(currentOffer?.unit_price || 0)
            ? (currentVsLowestUnitGap / Number(currentOffer?.unit_price || 0)) * 100
            : 0;
        const summaryInsights = [
            lowestObservedOffer
                ? `Best recorded price: ${formatCurrency(lowestObservedOffer.unit_price || 0, lowestObservedOffer.currency || currency)} from ${lowestObservedOffer.supplier_name || "Supplier missing"} on ${formatDate(lowestObservedOffer.quote_date)} at quantity ${Number(lowestObservedOffer.quantity || 0)}.`
                : "Best recorded price is not available.",
            highestObservedOffer
                ? `Highest observed price: ${formatCurrency(highestObservedOffer.unit_price || 0, highestObservedOffer.currency || currency)} from ${highestObservedOffer.supplier_name || "Supplier missing"} on ${formatDate(highestObservedOffer.quote_date)}.`
                : "Highest observed price is not available.",
            currentOffer && lowestObservedOffer
                ? currentVsLowestUnitGap > 0
                    ? `${currentOffer.supplier_name || "Current supplier"} is ${formatCurrency(currentVsLowestUnitGap, currentOffer.currency || currency)} per unit above the best recorded price (${formatPercent(currentVsLowestPercent)} gap).`
                    : `${currentOffer.supplier_name || "Current supplier"} is already at the best recorded unit price for this product.`
                : "Current supplier comparison is not available."
        ];

        return `
            <div class="qc2-product-summary-backdrop" data-qc-product-summary-close></div>
            <aside class="qc2-product-summary-drawer" role="dialog" aria-modal="true" aria-label="${escapeHtml(`${productName} ${unit} price summary`)}">
                <div class="qc2-product-summary-head">
                    <div>
                        <div class="mapping-section-title">${escapeHtml(productName)}</div>
                        <div class="mapping-section-copy">Unit: ${escapeHtml(unit || "Unit missing")} | ${offers.length} observed records | ${supplierCount} suppliers</div>
                    </div>
                    <button type="button" class="secondary-btn" data-qc-product-summary-close="true" aria-label="Close price summary">Close</button>
                </div>
                <div class="qc2-product-summary-kpis">
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Best Unit Price</div><div class="summary-card-value compact">${lowestObservedOffer ? escapeHtml(formatCurrency(lowestObservedOffer.unit_price || 0, lowestObservedOffer.currency || currency)) : "--"}</div><div class="summary-card-insight">${escapeHtml(lowestObservedOffer?.supplier_name || "Supplier missing")} | Qty ${escapeHtml(String(lowestObservedOffer?.quantity || 0))}</div></article>
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Highest Unit Price</div><div class="summary-card-value compact">${highestObservedOffer ? escapeHtml(formatCurrency(highestObservedOffer.unit_price || 0, highestObservedOffer.currency || currency)) : "--"}</div><div class="summary-card-insight">${escapeHtml(highestObservedOffer?.supplier_name || "Supplier missing")}</div></article>
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Latest Unit Price</div><div class="summary-card-value compact">${latestObservedOffer ? escapeHtml(formatCurrency(latestObservedOffer.unit_price || 0, latestObservedOffer.currency || currency)) : "--"}</div><div class="summary-card-insight">${escapeHtml(formatDate(latestObservedOffer?.quote_date))}</div></article>
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Earliest Unit Price</div><div class="summary-card-value compact">${earliestObservedOffer ? escapeHtml(formatCurrency(earliestObservedOffer.unit_price || 0, earliestObservedOffer.currency || currency)) : "--"}</div><div class="summary-card-insight">${escapeHtml(formatDate(earliestObservedOffer?.quote_date))}</div></article>
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Average Unit Price</div><div class="summary-card-value compact">${escapeHtml(formatCurrency(averageObservedUnitPrice || 0, currency))}</div><div class="summary-card-insight">Across all observed records</div></article>
                    <article class="summary-card qc2-product-summary-kpi"><div class="summary-card-title">Current vs Best</div><div class="summary-card-value compact">${currentOffer && lowestObservedOffer ? escapeHtml(formatCurrency(currentVsLowestUnitGap, currency)) : "--"}</div><div class="summary-card-insight">${currentOffer && lowestObservedOffer ? (currentVsLowestUnitGap > 0 ? `${escapeHtml(formatPercent(currentVsLowestPercent))} above best` : "Matches best recorded price") : "Current comparison unavailable"}</div></article>
                </div>
                <div class="qc2-product-summary-insights">
                    ${summaryInsights.map((insight) => `<div class="qc2-product-summary-insight">${escapeHtml(insight)}</div>`).join("")}
                </div>
                <div class="qc2-product-summary-timeline">
                    ${offers.map((offer) => `
                        <div class="qc2-product-summary-item ${lowestObservedOffer && isSameOffer(offer, lowestObservedOffer) ? "is-highlighted" : ""}">
                            <div class="qc2-product-summary-item-head">
                                <span>${escapeHtml(formatDate(offer.quote_date))}</span>
                                <span>${escapeHtml(offer.supplier_name || "Supplier missing")}</span>
                            </div>
                            <div class="qc2-product-summary-item-copy">Qty ${escapeHtml(String(offer.quantity || 0))} | Unit ${escapeHtml(formatCurrency(offer.unit_price || 0, offer.currency || currency))} | Total ${escapeHtml(formatCurrency(offer.total_price || 0, offer.currency || currency))}</div>
                        </div>
                    `).join("")}
                </div>
            </aside>
        `;
    }

    function renderAnalyzeRows(cards, state) {
        if (!cards.length) {
            return '<div class="decision-list-empty">No supplier rows were available for comparison.</div>';
        }
        return `
            <div class="qc2-analysis-table qc2-full-table-v3">
                <div class="qc2-analysis-table-head qc2-ft-head qc2-ft-grid" role="row">
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--product" role="columnheader">Product</span>
                    <span class="qc2-ft-head-cell" role="columnheader">Current Supplier</span>
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--price" role="columnheader">Current Price</span>
                    <span class="qc2-ft-head-cell" role="columnheader">Reference Supplier</span>
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--price" role="columnheader">Reference Price</span>
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--savings" role="columnheader">Savings</span>
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--result" role="columnheader">Result</span>
                    <span class="qc2-ft-head-cell qc2-ft-head-cell--details" role="columnheader">Details</span>
                </div>
                ${cards.map((card, rowIndex) => {
                    const cardKey = getScopedDecisionCardKey("analysis", getDecisionCardKey(card));
                    const isExpanded = Boolean(state.collapsedDecisionCards[cardKey]);
                    const resultValue = getAnalysisFilterResultValue(card);
                    const searchText = [
                        card.productName,
                        card.currentOffer?.supplier_name,
                        card.referenceOffer?.supplier_name
                    ].filter(Boolean).join(" ").toLowerCase();
                    const supplierSearchText = [
                        card.currentOffer?.supplier_name,
                        card.referenceOffer?.supplier_name
                    ].filter(Boolean).join(" ").toLowerCase();
                    const hasDirectSavings = card.hasValidAlternative && Number(card.savingsAmount || 0) > 0;
                    const statusToneClass = card.statusTone === "best"
                        ? "qc2-ft-result__badge--best"
                        : card.statusTone === "neutral"
                            ? "qc2-ft-result__badge--neutral"
                            : "qc2-ft-result__badge--opportunity";
                    return `
                    <article
                        class="qc2-analysis-row qc2-ft-row ${isExpanded ? "is-expanded" : ""} ${state.selectedAnalysisRowKey === cardKey ? "is-selected" : ""}"
                        data-qc-analysis-row
                        data-qc-analysis-card-key="${escapeHtml(cardKey)}"
                        data-result="${escapeHtml(resultValue)}"
                        data-row-index="${rowIndex}"
                        data-search-text="${escapeHtml(searchText)}"
                        data-product-search-text="${escapeHtml(String(card.productName || "").toLowerCase())}"
                        data-supplier-search-text="${escapeHtml(supplierSearchText)}"
                        data-product-name="${escapeHtml(card.productName)}"
                        data-product-unit="${escapeHtml(card.unit || "")}"
                    >
                        <div class="qc2-analysis-row-main qc2-ft-row-main qc2-ft-grid" role="row">
                            <div class="qc2-analysis-cell qc2-analysis-cell-product qc2-ft-cell qc2-ft-cell--product" role="gridcell">
                                <div class="qc2-ft-stack">
                                    <div class="qc2-ft-primary qc2-ft-product" title="${escapeHtml(card.productName)}">${escapeHtml(card.productName)}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(card.unit || "Unit not provided")} | Qty ${escapeHtml(String(card.quantity || 0))}</div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-ft-cell qc2-ft-cell--supplier" role="gridcell">
                                <div class="qc2-ft-stack">
                                    <div class="qc2-ft-primary qc2-ft-supplier" title="${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(formatDate(card.quoteDate))}</div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-ft-cell qc2-ft-cell--price" role="gridcell">
                                <div class="qc2-ft-stack">
                                    <div class="qc2-ft-primary qc2-ft-money">${escapeHtml(formatCurrency(card.currentOffer?.total_price || 0, card.currency))}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))} unit</div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-ft-cell qc2-ft-cell--supplier" role="gridcell">
                                <div class="qc2-ft-stack">
                                    <div class="qc2-ft-primary qc2-ft-supplier" title="${escapeHtml(card.referenceOffer?.supplier_name || "Supplier missing")}">${escapeHtml(card.referenceOffer?.supplier_name || "Supplier missing")}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(card.referenceOfferLabel || "Reference price")}</div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-ft-cell qc2-ft-cell--price" role="gridcell">
                                <div class="qc2-ft-stack">
                                    <div class="qc2-ft-primary qc2-ft-money">${escapeHtml(formatCurrency(card.referenceOffer?.total_price || 0, card.currency))}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))} unit</div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-ft-cell qc2-ft-cell--savings" role="gridcell">
                                ${!hasDirectSavings ? `
                                    <div class="qc2-ft-neutral-value">--</div>
                                ` : `
                                    <div class="qc2-ft-savings-pill">${escapeHtml(formatCurrency(card.savingsAmount, card.currency))}</div>
                                    <div class="qc2-ft-meta">${escapeHtml(formatPercent(card.savingsPercent))}</div>
                                `}
                            </div>
                            <div class="qc2-analysis-cell qc2-analysis-cell-result qc2-ft-cell qc2-ft-cell--result" role="gridcell">
                                <div class="qc2-ft-result" aria-label="Result summary">
                                    <div class="qc2-ft-result__badge-zone">
                                        <div class="qc2-ft-result__badge ${statusToneClass}" title="${escapeHtml(card.resultBadgeTooltip || card.statusLabel || "")}">${escapeHtml(card.statusLabel)}</div>
                                    </div>
                                    <div class="qc2-ft-result__helper-zone">
                                        <div class="qc2-ft-result__helper">${escapeHtml(hasDirectSavings ? "Direct savings available" : "No direct savings")}</div>
                                    </div>
                                    <div class="qc2-ft-result__insight-zone">
                                        <div class="qc2-ft-result__insight">${card.compactResultInsight ? escapeHtml(card.compactResultInsight) : ""}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="qc2-analysis-cell qc2-analysis-cell-expand qc2-ft-cell qc2-ft-cell--details ${card.hasValidAlternative && card.savingsAmount > 0 ? "" : "single-action"}" role="gridcell">
                                <div class="qc2-ft-actions">
                                    ${card.hasValidAlternative && card.savingsAmount > 0 ? `
                                        <button
                                            type="button"
                                            class="secondary-btn qc2-collapse-btn qc2-analysis-history-btn"
                                            data-qc-action="see-history-offers"
                                            data-product-name="${escapeHtml(card.productName)}"
                                            data-product-unit="${escapeHtml(card.unit || "")}"
                                        >
                                            See history
                                        </button>
                                        <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="open-product-summary" data-product-name="${escapeHtml(card.productName)}" data-product-unit="${escapeHtml(card.unit || "")}">
                                            Price summary
                                        </button>
                                        <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="toggle-decision-card" data-card-key="${escapeHtml(cardKey)}" aria-expanded="${isExpanded ? "true" : "false"}">
                                            ${isExpanded ? "Close table" : "Open table"}
                                        </button>
                                    ` : `
                                        <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="open-product-summary" data-product-name="${escapeHtml(card.productName)}" data-product-unit="${escapeHtml(card.unit || "")}">
                                            Price summary
                                        </button>
                                        <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="toggle-decision-card" data-card-key="${escapeHtml(cardKey)}" aria-expanded="${isExpanded ? "true" : "false"}">
                                            ${isExpanded ? "Close table" : "Open table"}
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                        <div class="qc2-analysis-row-detail qc2-ft-detail-panel">
                            <div class="qc2-analysis-detail-grid qc2-ft-detail-grid">
                                <div class="qc2-analysis-detail-item qc2-ft-detail-card">
                                    <span class="qc2-analysis-detail-label">Price Date</span>
                                    <span class="qc2-analysis-detail-value">${escapeHtml(formatDate(card.quoteDate))}</span>
                                </div>
                                <div class="qc2-analysis-detail-item qc2-ft-detail-card">
                                    <span class="qc2-analysis-detail-label">Current Price</span>
                                    <span class="qc2-analysis-detail-value">${escapeHtml(card.currentOffer?.supplier_name || "Supplier missing")} | ${escapeHtml(formatCurrency(card.currentOffer?.unit_price || 0, card.currency))} unit</span>
                                </div>
                                <div class="qc2-analysis-detail-item qc2-ft-detail-card">
                                    <span class="qc2-analysis-detail-label">Reference Price</span>
                                    <span class="qc2-analysis-detail-value">${escapeHtml(card.referenceOffer?.supplier_name || "Supplier missing")} | ${escapeHtml(formatCurrency(card.referenceOffer?.unit_price || 0, card.currency))} unit</span>
                                </div>
                                <div class="qc2-analysis-detail-item qc2-ft-detail-card">
                                    <span class="qc2-analysis-detail-label">Commercial Terms</span>
                                    <span class="qc2-analysis-detail-value">${escapeHtml(card.referenceOffer?.currency || card.currency || "USD")} | ${escapeHtml(card.referenceOffer?.delivery_time || "Delivery not provided")} | ${escapeHtml(card.referenceOffer?.payment_term || "Payment terms not provided")}</span>
                                </div>
                                <div class="qc2-analysis-detail-item qc2-ft-detail-card">
                                    <span class="qc2-analysis-detail-label">Price Validity</span>
                                    <span class="qc2-analysis-detail-value">${escapeHtml(formatDate(card.referenceOffer?.valid_until) || "Not provided")}</span>
                                </div>
                            </div>
                            ${(card.currentOffer?.notes || card.referenceOffer?.notes) ? `<div class="qc2-analysis-detail-note qc2-analysis-detail-note-secondary qc2-ft-detail-note">${escapeHtml(card.currentOffer?.notes || card.referenceOffer?.notes)}</div>` : ""}
                            <div class="qc2-analysis-detail-note qc2-ft-detail-insight">${escapeHtml(card.decisionSentence)}</div>
                        </div>
                    </article>
                `;
                }).join("")}
                <div class="qc2-analysis-filter-empty" data-qc-analysis-empty hidden>No comparison rows match the selected filter.</div>
            </div>
        `;
    }

    function renderOptimizeRows(rows, state) {
        if (!rows.length) {
            return '<div class="decision-list-empty">No products are available to optimize yet.</div>';
        }
        return `
            <div class="qc2-analysis-table qc2-analysis-table-optimize">
                <div class="qc2-analysis-table-head qc2-analysis-table-head-optimize">
                    <span>Product</span>
                    <span>Selected Supplier</span>
                    <span>Unit Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                    <span>Source</span>
                    <span>Price Date</span>
                    <span class="qc2-analysis-expand-col">Details</span>
                </div>
                ${rows.map((row) => {
                    const rowKey = getScopedDecisionCardKey("optimize", `${row.productName}__${row.unit}__${row.selectedSupplier}`);
                    const isExpanded = Boolean(state.collapsedDecisionCards[rowKey]);
                    return `
                    <article class="qc2-analysis-row ${isExpanded ? "is-expanded" : ""}">
                        <div class="qc2-analysis-row-main qc2-analysis-row-main-optimize">
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-product">${escapeHtml(row.productName)}</div>
                                <div class="qc2-analysis-sub">${escapeHtml(row.unit || "Unit not provided")}</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(row.selectedSupplier || "Supplier missing")}</div>
                                <div class="qc2-analysis-sub">Best visible price</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(formatCurrency(row.unitPrice || 0, row.currency))}</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(String(row.quantity || 0))}</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(formatCurrency(row.totalPrice || 0, row.currency))}</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(row.sourceType || "manual")}</div>
                            </div>
                            <div class="qc2-analysis-cell">
                                <div class="qc2-analysis-value">${escapeHtml(formatDate(row.quoteDate))}</div>
                            </div>
                            <div class="qc2-analysis-cell qc2-analysis-cell-expand">
                                <button type="button" class="secondary-btn qc2-collapse-btn" data-qc-action="toggle-decision-card" data-card-key="${escapeHtml(rowKey)}" aria-expanded="${isExpanded ? "true" : "false"}">
                                    ${isExpanded ? "Close table" : "Open table"}
                                </button>
                            </div>
                        </div>
                        <div class="qc2-analysis-row-detail">
                            <div class="qc2-analysis-detail-grid">
                                ${(row.offers || []).map((offer) => `
                                    <div class="qc2-analysis-detail-item ${offer.supplier_name === row.selectedSupplier && Number(offer.total_price || 0) === Number(row.totalPrice || 0) ? "is-highlighted" : ""}">
                                        <span class="qc2-analysis-detail-label">${escapeHtml(offer.supplier_name || "Supplier missing")}</span>
                                        <span class="qc2-analysis-detail-value">${escapeHtml(formatCurrency(offer.total_price || 0, offer.currency || row.currency))} | ${escapeHtml(formatCurrency(offer.unit_price || 0, offer.currency || row.currency))} unit | ${escapeHtml(formatDate(offer.quote_date))}</span>
                                        <span class="qc2-analysis-detail-value">${escapeHtml(offer.currency || row.currency || "USD")} | ${escapeHtml(offer.delivery_time || "Delivery not provided")} | ${escapeHtml(offer.payment_term || "Payment terms not provided")}</span>
                                        ${(offer.valid_until || offer.notes) ? `<span class="qc2-analysis-detail-value">${escapeHtml(offer.valid_until ? formatDate(offer.valid_until) : "Validity not provided")}${offer.notes ? ` | ${escapeHtml(offer.notes)}` : ""}</span>` : ""}
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    </article>
                `;
                }).join("")}
            </div>
        `;
    }

    function renderQcAnalyze(state) {
        const result = state.analysisResult || { comparison: { bids: [] }, evaluation: null, summary: { rowCount: 0, supplierCount: 0, productCount: 0, productsWithSavings: 0, totalVisibleSavings: 0, currentSpend: 0, optimizedSpend: 0, optimizedSavings: 0, optimizedSavingsPercent: 0, optimizedRows: [], decisionCards: [] } };
        const summary = getAnalysisSummary(result);
        const decisionCards = summary.decisionCards || [];
        const opportunityCards = getTopPricingOpportunityCards(decisionCards);
        const totalPotentialSavings = opportunityCards.reduce(
            (sum, card) => sum + (card.hasPotentialSavings ? Number(card.potentialSavingsAmount || 0) : 0),
            0
        );
        const expandedOpportunityCards = opportunityCards.filter((card) => Boolean(state.collapsedDecisionCards[getScopedDecisionCardKey("spotlight", getDecisionCardKey(card))]));
        const comparisonCurrency = result.comparison?.bids?.[0]?.currency || "USD";
        const isOpportunitySectionVisible = state.showOpportunitySection !== false;
        const activeAnalyzeTab = state.activeAnalyzeTab || "savings";
        const shouldRenderFullComparison = state.showFullComparison && activeAnalyzeTab === "full-table";
        return `
            <section class="qc2-screen qc2-screen-analyze" id="qc2AnalysisTop">
                <div class="qc2-card qc2-analyze-card">
                    <div class="qc2-head qc2-head-compact qc2-analyze-head">
                        <div class="qc2-head-shell">
                            <div class="qc2-head-copy">
                                <div class="upload-step">Step 3</div>
                                <h2 class="qc2-title">Procurement decision screen</h2>
                                <p class="qc2-copy">See direct savings first, then review product-level price intelligence so you can spot lower supplier, historical, and quantity-based price patterns.</p>
                            </div>
                        </div>
                    </div>
                    <div class="qc2-analyze-tabs" role="tablist" aria-label="Analysis views">
                        <button type="button" class="secondary-btn qc2-analyze-tab ${activeAnalyzeTab === "savings" ? "active-tab" : ""}" data-qc-action="set-analyze-tab" data-tab="savings" role="tab" aria-selected="${activeAnalyzeTab === "savings" ? "true" : "false"}">
                            Top Savings
                        </button>
                        <button type="button" class="secondary-btn qc2-analyze-tab ${activeAnalyzeTab === "full-table" ? "active-tab" : ""}" data-qc-action="set-analyze-tab" data-tab="full-table" role="tab" aria-selected="${activeAnalyzeTab === "full-table" ? "true" : "false"}">
                            Full Table
                        </button>
                    </div>
                    <div class="qc2-summary-grid qc2-summary-grid-compact qc2-summary-grid-hero">
                        <article class="summary-card qc2-summary-card-compact"><div class="summary-card-title">Products analyzed</div><div class="summary-card-value compact">${summary.productCount}</div><div class="summary-card-insight">Visible product groups in this analysis.</div></article>
                        <article class="summary-card qc2-summary-card-compact"><div class="summary-card-title">Suppliers compared</div><div class="summary-card-value compact">${summary.supplierCount}</div><div class="summary-card-insight">Unique suppliers in the imported pricing data.</div></article>
                        <article class="summary-card qc2-summary-card-compact"><div class="summary-card-title">Pricing opportunities</div><div class="summary-card-value compact">${opportunityCards.length}</div><div class="summary-card-insight">Visible actionable pricing opportunity cards in this summary.</div></article>
                        <article class="summary-card qc2-summary-card-compact is-savings"><div class="summary-card-title">Total potential savings</div><div class="summary-card-value compact">${escapeHtml(formatCurrency(totalPotentialSavings, comparisonCurrency))}</div><div class="summary-card-insight">Sum of the visible potential savings shown in the pricing opportunity cards.</div></article>
                    </div>
                    <div class="qc2-analyze-tab-panels">
                        <div id="qcTabSavings" class="qc2-analyze-tab-panel ${activeAnalyzeTab === "savings" ? "active-tab" : ""}" role="tabpanel" aria-hidden="${activeAnalyzeTab === "savings" ? "false" : "true"}">
                            <section class="qc2-analysis-block qc2-analysis-block-primary ${isOpportunitySectionVisible ? "" : "is-collapsed"}" data-qc-anchor="opportunity-section">
                                ${isOpportunitySectionVisible ? `
                                    <div class="mapping-section-head">
                                        <div>
                                            <div class="mapping-section-title">Top pricing opportunities</div>
                                            <div class="mapping-section-copy">Review direct savings first, then the strongest supplier, historical, and quantity-based price opportunities that may warrant action.</div>
                                        </div>
                                        <div class="qc2-analysis-section-actions">
                                            <button type="button" class="secondary-btn qc2-section-action-btn" data-qc-action="collapse-all-opportunity-tables">Collapse all tables</button>
                                            <button type="button" class="secondary-btn qc2-section-action-btn" data-qc-action="hide-opportunity-section">Hide section</button>
                                        </div>
                                    </div>
                                    ${renderDecisionSpotlightCards(opportunityCards, state)}
                                ` : `
                                    <button type="button" class="qc2-collapsible-summary qc2-section-summary-btn" data-qc-action="toggle-opportunity-section" aria-expanded="false">
                                        <span>
                                            <span class="mapping-section-title">Top pricing opportunities</span>
                                            <span class="qc2-collapsible-summary-copy">Top pricing opportunity cards are hidden from view.</span>
                                        </span>
                                        <span class="qc2-collapsible-summary-action">Show section</span>
                                    </button>
                                `}
                            </section>
                        </div>
                        <div id="qcTabFullTable" class="qc2-analyze-tab-panel ${activeAnalyzeTab === "full-table" ? "active-tab" : ""}" role="tabpanel" aria-hidden="${activeAnalyzeTab === "full-table" ? "false" : "true"}">
                            <section class="qc2-analysis-block qc2-analysis-block-advanced" data-qc-anchor="full-comparison-section">
                                <div class="mapping-section-head qc2-analysis-table-headbar">
                                    <div>
                                        <div class="mapping-section-title">Full comparison table</div>
                                        <div class="mapping-section-copy">Structured all-products price intelligence view across the complete pricing set.</div>
                                    </div>
                                    <div class="qc2-analysis-section-actions">
                                        ${shouldRenderFullComparison ? '<button type="button" class="secondary-btn qc2-section-action-btn" data-qc-action="hide-all-details">Hide selections</button>' : ""}
                                        <button type="button" class="secondary-btn qc2-section-action-btn" data-qc-action="toggle-full-comparison" aria-expanded="${state.showFullComparison ? "true" : "false"}">
                                            ${state.showFullComparison ? "Hide table" : "Open table"}
                                        </button>
                                    </div>
                                </div>
                                ${shouldRenderFullComparison ? `
                                    ${renderAnalysisFilterBar(state, summary.decisionCards)}
                                    <div class="qc2-analysis-table-frame">
                                        <div class="qc2-analysis-table-scroll" tabindex="0" aria-label="Full comparison table results">
                                            ${renderAnalyzeRows(summary.decisionCards, state)}
                                        </div>
                                    </div>
                                ` : ""}
                            </section>
                        </div>
                    </div>
                    ${renderStatus(state)}
                    <div data-qc-product-summary-modal>${renderProductSummaryDrawer(state)}</div>
                    <div class="qc2-actions qc2-analyze-actions" id="qc2AnalysisLower">
                        <div class="qc2-analyze-actions-slot is-left">
                            <button type="button" class="secondary-btn" data-qc-action="back-review">Back to Review</button>
                        </div>
                        <div class="qc2-analyze-actions-slot is-right">
                            <button type="button" class="action-btn" data-qc-action="go-history">Product History</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderHistoryTrend(state, rows, { hasHistoryContext = false } = {}) {
        if (!hasHistoryContext) {
            return '<div class="decision-list-empty">Save supplier price records to start building product history.</div>';
        }
        if (!state.historySelectedSeriesKey) {
            return '<div class="decision-list-empty">Select a product to view trend.</div>';
        }
        if (!rows.length) {
            if (hasHistoryContext) {
                return '<div class="decision-list-empty">The selected product is outside the current filters.</div>';
            }
            return '<div class="decision-list-empty">Save supplier price records to start building product history.</div>';
        }
        const summary = buildHistorySeriesSummary(rows);
        const prices = rows.map((row) => row.unitPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice;
        const minBarWidth = 18;
        const equalBarWidth = 70;
        return `
            <div class="qc2-history-selected-series-head">
                <div>
                    <div class="mapping-section-title">${escapeHtml(state.historySelectedProductName || rows[0].productName)}</div>
                    <div class="mapping-section-copy">${escapeHtml(state.historySelectedUnit || rows[0].unit || "Unit missing")} | ${rows.length} visible movements</div>
                </div>
                <div class="qc2-history-selected-series-stats">
                    <span>Latest ${escapeHtml(formatCurrency(summary.latestUnitPrice, rows[rows.length - 1]?.currency || "USD"))}</span>
                    <span>${summary.firstDate} to ${summary.latestDate}</span>
                </div>
            </div>
            <div class="qc2-trend-list qc2-trend-list-series">
                ${rows.map((row) => {
                    const normalizedWidth = range === 0
                        ? equalBarWidth
                        : minBarWidth + (((row.unitPrice - minPrice) / range) * (100 - minBarWidth));
                    const priceRatio = range === 0 ? 0.35 : (row.unitPrice - minPrice) / range;
                    const directionClass = row.changeValue == null ? "neutral" : row.changeValue > 0 ? "negative" : row.changeValue < 0 ? "positive" : "neutral";
                    let trackColor = "linear-gradient(90deg, rgba(96, 165, 250, 0.88), rgba(56, 189, 248, 0.72))";
                    if (priceRatio >= 0.75) {
                        trackColor = "linear-gradient(90deg, rgba(251, 191, 36, 0.9), rgba(249, 115, 22, 0.76))";
                    } else if (priceRatio >= 0.45) {
                        trackColor = "linear-gradient(90deg, rgba(52, 211, 153, 0.88), rgba(250, 204, 21, 0.70))";
                    } else if (priceRatio >= 0.2) {
                        trackColor = "linear-gradient(90deg, rgba(59, 130, 246, 0.88), rgba(16, 185, 129, 0.68))";
                    }
                    return `
                        <div class="qc2-trend-row">
                            <div class="qc2-trend-meta">
                                <span>${escapeHtml(formatDate(row.quoteDate || row.createdAt))}</span>
                                <span>${escapeHtml(row.supplier || "Supplier missing")} | Qty ${escapeHtml(String(row.quantity || 0))}</span>
                            </div>
                            <div class="qc2-trend-bar-shell">
                                <div class="qc2-trend-bar-track">
                                    <div class="qc2-trend-bar is-${directionClass}" style="width:${normalizedWidth}%; background:${trackColor};"></div>
                                </div>
                            </div>
                            <div class="qc2-trend-value">
                                ${escapeHtml(formatCurrency(row.unitPrice, row.currency))}
                                <span class="qc2-trend-value-sub">${escapeHtml(formatCurrency(row.totalPrice, row.currency))}${row.changeValue == null ? "" : ` | ${escapeHtml(formatCurrency(row.changeValue, row.currency))}`}</span>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderHistoryCombobox(key, label, placeholder, selectedValue, options) {
        const emptyLabel = key === "product" ? "Clear product" : "All suppliers";
        return `
            <label class="recipe-field">
                <span class="recipe-field-label">${label}</span>
                <div class="qc2-history-combobox" data-qc-history-combobox="${key}">
                    <button
                        type="button"
                        class="mapping-select qc2-history-combobox-trigger ${selectedValue ? "has-value" : ""}"
                        data-qc-history-combobox-toggle="${key}"
                        aria-expanded="false"
                        aria-haspopup="listbox"
                    >
                        <span class="qc2-history-combobox-value ${selectedValue ? "" : "is-placeholder"}">${escapeHtml(selectedValue || placeholder)}</span>
                        <span class="qc2-history-combobox-caret" aria-hidden="true"></span>
                    </button>
                    <div class="qc2-history-combobox-panel" hidden>
                        <div class="qc2-history-combobox-search-shell">
                            <input
                                type="text"
                                class="qc2-history-combobox-search"
                                data-qc-history-filter-search="${key}"
                                value=""
                                placeholder="${escapeHtml(placeholder)}"
                                autocomplete="off"
                                spellcheck="false"
                                aria-label="${escapeHtml(`Search ${label.toLowerCase()}`)}"
                            >
                        </div>
                        <div class="qc2-history-combobox-options" role="listbox">
                            <button type="button" class="qc2-history-combobox-option is-clear" data-qc-history-filter-option="${key}" data-value="">
                                ${emptyLabel}
                            </button>
                            ${options.map((option) => `
                                <button
                                    type="button"
                                    class="qc2-history-combobox-option${option === selectedValue ? " is-selected" : ""}"
                                    data-qc-history-filter-option="${key}"
                                    data-value="${escapeHtml(option)}"
                                >
                                    ${escapeHtml(option)}
                                </button>
                            `).join("")}
                            <div class="qc2-history-combobox-empty" data-qc-history-filter-empty hidden>No matches found.</div>
                        </div>
                    </div>
                </div>
            </label>
        `;
    }

    function renderHistoryFilters(state, productOptions, supplierOptions) {
        return `
            <div class="qc2-history-filters">
                ${renderHistoryCombobox("product", "Product", "Search product", state.historyFilters.product || "", productOptions)}
                ${renderHistoryCombobox("supplier", "Supplier", "Search supplier", state.historyFilters.supplier || "", supplierOptions)}
                <div class="recipe-field">
                    <span class="recipe-field-label">Start Date</span>
                    <label class="date-input-inline qc2-history-date-shell ${state.historyFilters.dateFrom ? "has-value" : ""}" data-date-shell>
                        <input class="date-input qc2-history-date-input" type="date" data-qc-history-filter="dateFrom" value="${escapeHtml(state.historyFilters.dateFrom)}" aria-label="History start date">
                        <span class="qc2-history-date-value ${state.historyFilters.dateFrom ? "" : "is-placeholder"}">${escapeHtml(state.historyFilters.dateFrom || "Start date")}</span>
                        ${state.historyFilters.dateFrom ? '<button type="button" class="qc2-history-date-clear" data-qc-history-date-clear="dateFrom" aria-label="Clear start date filter">Clear date</button>' : ""}
                        <button type="button" class="qc2-history-date-trigger" aria-label="Open start date picker"></button>
                    </label>
                </div>
                <div class="recipe-field">
                    <span class="recipe-field-label">End Date</span>
                    <label class="date-input-inline qc2-history-date-shell ${state.historyFilters.dateTo ? "has-value" : ""}" data-date-shell>
                        <input class="date-input qc2-history-date-input" type="date" data-qc-history-filter="dateTo" value="${escapeHtml(state.historyFilters.dateTo)}" aria-label="History end date">
                        <span class="qc2-history-date-value ${state.historyFilters.dateTo ? "" : "is-placeholder"}">${escapeHtml(state.historyFilters.dateTo || "End date")}</span>
                        ${state.historyFilters.dateTo ? '<button type="button" class="qc2-history-date-clear" data-qc-history-date-clear="dateTo" aria-label="Clear end date filter">Clear date</button>' : ""}
                        <button type="button" class="qc2-history-date-trigger" aria-label="Open end date picker"></button>
                    </label>
                </div>
            </div>
        `;
    }

    function applyHistoryFilterValue(state, key, value) {
        if (!["product", "supplier"].includes(key)) return false;
        const normalizedValue = String(value || "").trim();
        const optionSource = getHistoryFilterOptions(state, key);
        const matchedValue = optionSource.find((option) => option.toLowerCase() === normalizedValue.toLowerCase()) || "";
        state.historyFilters[key] = matchedValue;
        syncHistoryFilterDefaults(state);
        return true;
    }

function filterHistoryComboboxOptions(combobox, searchTerm) {
    if (!combobox) return;

    const normalizedSearch = String(searchTerm || "").trim().toLowerCase();
    let visibleCount = 0;

    combobox.querySelectorAll("[data-qc-history-filter-option]").forEach((option) => {
        if (option.dataset.value === "") {
            option.style.display = "";
            return;
        }

        const text = option.textContent.toLowerCase();
        const matches = !normalizedSearch || text.includes(normalizedSearch);

        option.style.display = matches ? "" : "none";

        if (matches) {
            visibleCount += 1;
        }
    });

    const emptyState = combobox.querySelector("[data-qc-history-filter-empty]");
    if (emptyState) {
        emptyState.style.display = visibleCount > 0 ? "none" : "";
    }
}

    function closeHistoryComboboxes(elements) {
        if (!elements.app) return;
        elements.app.querySelectorAll("[data-qc-history-combobox]").forEach((combobox) => {
            combobox.classList.remove("is-open");
            const trigger = combobox.querySelector("[data-qc-history-combobox-toggle]");
            const panel = combobox.querySelector(".qc2-history-combobox-panel");
            if (trigger) {
                trigger.setAttribute("aria-expanded", "false");
            }
            if (panel) {
                panel.hidden = true;
            }
        });
    }

    function openHistoryCombobox(elements, key) {
        if (!elements.app) return;
        closeHistoryComboboxes(elements);
        const combobox = elements.app.querySelector(`[data-qc-history-combobox="${key}"]`);
        if (!combobox) return;
        const trigger = combobox.querySelector("[data-qc-history-combobox-toggle]");
        const panel = combobox.querySelector(".qc2-history-combobox-panel");
        const searchInput = combobox.querySelector("[data-qc-history-filter-search]");
        combobox.classList.add("is-open");
        if (trigger) {
            trigger.setAttribute("aria-expanded", "true");
        }
        if (panel) {
            panel.hidden = false;
        }
        if (searchInput) {
            searchInput.value = "";
            filterHistoryComboboxOptions(combobox, "");
            searchInput.focus({ preventScroll: true });
        }
    }

    function renderHistorySummaryCards(summary, currency) {
        return `
            <article class="summary-card"><div class="summary-card-title">Latest price</div><div class="summary-card-value compact">${summary.latestPrice == null ? "--" : escapeHtml(formatCurrency(summary.latestPrice, currency))}</div><div class="summary-card-insight">Most recent unit price in the selected range.</div></article>
            <article class="summary-card"><div class="summary-card-title">Oldest price</div><div class="summary-card-value compact">${summary.oldestPrice == null ? "--" : escapeHtml(formatCurrency(summary.oldestPrice, currency))}</div><div class="summary-card-insight">Starting unit price in the selected range.</div></article>
            <article class="summary-card"><div class="summary-card-title">Min / Max</div><div class="summary-card-value compact">${summary.minPrice == null ? "--" : `${escapeHtml(formatCurrency(summary.minPrice, currency))} / ${escapeHtml(formatCurrency(summary.maxPrice, currency))}`}</div><div class="summary-card-insight">Lowest and highest unit price in the visible history.</div></article>
            <article class="summary-card"><div class="summary-card-title">Total change</div><div class="summary-card-value compact">${summary.totalChange == null ? "--" : escapeHtml(formatCurrency(summary.totalChange, currency))}</div><div class="summary-card-insight">${summary.totalChangePercent == null ? "No change percentage available yet." : `${escapeHtml(formatPercent(summary.totalChangePercent))} vs oldest visible record.`}</div></article>
        `;
    }

    function refreshHistoryView(elements, state) {
        if (state.currentScreen !== "history") return;
        const historyScreen = elements.app?.querySelector(".qc2-screen-history");
        if (!historyScreen) {
            renderApp(elements, state, { preserveScroll: true });
            return;
        }

        const viewModel = getHistoryViewModel(state);
        closeHistoryComboboxes(elements);

        const controls = historyScreen.querySelector(".qc2-history-controls");
        if (controls) {
            controls.innerHTML = renderHistoryFilters(state, viewModel.productOptions, viewModel.supplierOptions);
        }

        const summaryGrid = historyScreen.querySelector(".qc2-history-summary-grid");
        if (summaryGrid) {
            summaryGrid.innerHTML = renderHistorySummaryCards(viewModel.summary, viewModel.currency);
        }

        const tableContent = historyScreen.querySelector("[data-qc-history-table-content]");
        if (tableContent) {
            tableContent.innerHTML = renderHistoryTable(state, viewModel.tableRows, { hasHistoryContext: viewModel.hasHistoryContext });
        }

        const trendContent = historyScreen.querySelector("[data-qc-history-trend-content]");
        if (trendContent) {
            trendContent.innerHTML = renderHistoryTrend(state, viewModel.selectedSeriesRows, { hasHistoryContext: viewModel.hasHistoryContext });
        }

        const detailModalSlot = historyScreen.querySelector("[data-qc-history-detail-modal]");
        if (detailModalSlot) {
            detailModalSlot.innerHTML = renderHistoryDetailModal(state);
        }

        scheduleHistoryDetailChartRender(elements, state);

        persistQuoteCompareSession(state, elements);
    }

    function renderHistoryTable(state, rows, { hasHistoryContext = false } = {}) {
        if (!rows.length) {
            if (hasHistoryContext) {
                return '<div class="decision-list-empty">No saved price records match the selected filters.</div>';
            }
            return '<div class="decision-list-empty">Save supplier price records to start building product history.</div>';
        }
        const visibleColumns = getVisibleHistoryColumns(state);
        return `
            <div class="qc2-history-table-shell">
                <div class="qc2-history-table-scroll" data-qc-history-table-scroll>
                    <table class="quote-compare-table qc2-history-table">
                    <thead>
                        <tr>
                            ${visibleColumns.map((column) => `
                                ${(() => {
                                    const sortDirection = getHistoryHeaderSortDirection(state, column.key);
                                    const sortHint = getHistoryHeaderSortHint(state, column.key);
                                    const sortIndicator = getHistoryHeaderSortIndicator(state, column.key);
                                    const ariaSort = getHistoryHeaderAriaSort(state, column.key);
                                    const headerClasses = [
                                        column.headerClassName || "",
                                        "qc2-history-sortable-header",
                                        sortDirection ? "is-sort-active" : "",
                                        sortDirection === "asc" ? "is-sort-asc" : "",
                                        sortDirection === "desc" ? "is-sort-desc" : ""
                                    ].filter(Boolean).join(" ");
                                    return `
                                <th
                                    class="${headerClasses}"
                                    data-qc-history-sort-key="${column.key}"
                                    data-qc-history-column-key="${column.key}"
                                    draggable="true"
                                    role="button"
                                    tabindex="0"
                                    aria-sort="${ariaSort}"
                                    title="${escapeHtml(sortHint)}"
                                    aria-label="${escapeHtml(`${column.label}. ${sortHint}`)}"
                                ><span class="qc2-history-sortable-head-copy"><span class="qc2-history-sortable-label">${escapeHtml(column.label)}</span><span class="qc2-history-sortable-indicator" aria-hidden="true">${escapeHtml(sortIndicator)}</span></span></th>`;
                                })()}
                            `).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((row) => `
                            <tr
                                class="${state.historySelectedRowId === row.historyId ? "is-history-row-selected" : ""}"
                                data-qc-history-row
                                data-qc-history-series-key="${escapeHtml(getHistorySeriesKey(row.productName, row.unit))}"
                                data-qc-history-row-id="${escapeHtml(row.historyId)}"
                                tabindex="0"
                                role="button"
                                aria-label="${escapeHtml(`${row.productName} ${row.unit || ""}. Click to inspect movement. Double click for details.`)}"
                            >
                                ${visibleColumns.map((column) => {
                                    const toneClassName = typeof column.toneClassName === "function" ? column.toneClassName(row) : "";
                                    const cellClassName = [column.cellClassName || "", toneClassName].filter(Boolean).join(" ");
                                    return `<td class="${cellClassName}">${column.render(row)}</td>`;
                                }).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderHistoryDetailModal(state) {
        if (!state.historyDetailModalOpen || !state.historyDetailModalSeries?.rows?.length) return "";
        const { productName, unit, rows, usesFullSeries } = state.historyDetailModalSeries;
        const summary = buildHistorySeriesSummary(rows);
        const insights = buildHistorySeriesInsights(rows);
        return `
            <div class="qc2-history-detail-backdrop" data-qc-history-detail-close></div>
            <aside class="qc2-history-detail-drawer" role="dialog" aria-modal="true" aria-label="${escapeHtml(`${productName} ${unit} detail view`)}">
                <div class="qc2-history-detail-head">
                    <div>
                        <div class="mapping-section-title">${escapeHtml(productName)}</div>
                    <div class="mapping-section-copy">Unit: ${escapeHtml(unit || "Unit missing")} • ${rows.length} movements</div>
                    </div>
                    <button type="button" class="secondary-btn" data-qc-history-detail-close="true" aria-label="Close history detail">Close</button>
                </div>
                <div class="qc2-history-detail-meta">
                    <span>${escapeHtml(summary.firstDate || "--")} → ${escapeHtml(summary.latestDate || "--")}</span>
                    ${usesFullSeries ? "<span>Full history</span>" : ""}
                </div>
                ${renderHistorySeriesChart(rows)}
                <div class="qc2-history-detail-kpis">
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Latest Unit Price</div><div class="summary-card-value compact">${summary.latestUnitPrice == null ? "--" : escapeHtml(formatCurrency(summary.latestUnitPrice, rows[rows.length - 1]?.currency || "USD"))}</div><div class="summary-card-insight">${escapeHtml(summary.latestUnitPriceSupplier || "Supplier missing")}${summary.latestUnitPriceDate ? ` | ${escapeHtml(summary.latestUnitPriceDate)}` : ""}</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Highest Unit Price</div><div class="summary-card-value compact">${summary.highestUnitPrice == null ? "--" : escapeHtml(formatCurrency(summary.highestUnitPrice, rows[0]?.currency || "USD"))}</div><div class="summary-card-insight">${escapeHtml(summary.highestUnitPriceSupplier || "Supplier missing")}${summary.highestUnitPriceDate ? ` | ${escapeHtml(summary.highestUnitPriceDate)}` : ""}</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Earliest Unit Price</div><div class="summary-card-value compact">${summary.earliestUnitPrice == null ? "--" : escapeHtml(formatCurrency(summary.earliestUnitPrice, rows[0]?.currency || "USD"))}</div><div class="summary-card-insight">${escapeHtml(summary.earliestUnitPriceSupplier || "Supplier missing")}${summary.earliestUnitPriceDate ? ` | ${escapeHtml(summary.earliestUnitPriceDate)}` : ""}</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Net Change</div><div class="summary-card-value compact">${summary.netChange == null ? "--" : escapeHtml(formatCurrency(summary.netChange, rows[rows.length - 1]?.currency || "USD"))}</div><div class="summary-card-insight">First -> Latest</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Net Change %</div><div class="summary-card-value compact">${summary.netChangePercent == null ? "--" : escapeHtml(formatPercent(summary.netChangePercent))}</div><div class="summary-card-insight">${escapeHtml(summary.firstDate || "--")} -> ${escapeHtml(summary.latestDate || "--")}</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Current vs Best</div><div class="summary-card-value compact">${summary.currentVsBestUnitPrice == null ? "--" : escapeHtml(formatCurrency(summary.currentVsBestUnitPrice, rows[rows.length - 1]?.currency || "USD"))}</div><div class="summary-card-insight">${escapeHtml(summary.currentVsBestLabel || "Best-price comparison unavailable")}</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Average Unit Price</div><div class="summary-card-value compact">${summary.averageUnitPrice == null ? "--" : escapeHtml(formatCurrency(summary.averageUnitPrice, rows[0]?.currency || "USD"))}</div><div class="summary-card-insight">Across ${escapeHtml(String(summary.movementCount || 0))} records</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Movement Count</div><div class="summary-card-value compact">${summary.movementCount}</div><div class="summary-card-insight">First -> Latest</div></article>
                    <article class="summary-card qc2-history-detail-kpi"><div class="summary-card-title">Supplier Count</div><div class="summary-card-value compact">${summary.supplierCount}</div><div class="summary-card-insight">${escapeHtml(summary.supplierNames.length ? summary.supplierNames.join(", ") : "Supplier names unavailable")}</div></article>
                </div>
                <div class="qc2-history-detail-insights">
                    ${insights.map((insight) => `<div class="qc2-history-detail-insight">${escapeHtml(insight)}</div>`).join("")}
                </div>
                <div class="qc2-history-detail-timeline">
                    ${rows.map((row) => `
                        <div class="qc2-history-detail-item">
                            <div class="qc2-history-detail-item-date">${escapeHtml(formatDate(row.quoteDate || row.createdAt))}</div>
                            <div class="qc2-history-detail-item-supplier">${escapeHtml(row.supplier || "Supplier missing")}</div>
                            <div class="qc2-history-detail-item-copy">Qty ${escapeHtml(String(row.quantity || 0))} • Unit ${escapeHtml(formatCurrency(row.unitPrice, row.currency))} • Total ${escapeHtml(formatCurrency(row.totalPrice, row.currency))}</div>
                        </div>
                    `).join("")}
                </div>
            </aside>
        `;
    }

    function renderQcHistory(state) {
        const viewModel = getHistoryViewModel(state);

        return `
            <section class="qc2-screen qc2-screen-history" data-qc-anchor="history-top">
                <div class="qc2-card qc2-history-card">
                    <div class="qc2-head qc2-head-compact">
                        <div class="qc2-head-shell">
                            <div class="qc2-head-copy">
                                <div class="upload-step">Step 4</div>
                                <h2 class="qc2-title">Product history</h2>
                                <p class="qc2-copy">Filter saved supplier price records by product, supplier, and date to review how visible prices changed over time.</p>
                            </div>
                        </div>
                    </div>
                    <div class="qc2-history-controls">
                        ${renderHistoryFilters(state, viewModel.productOptions, viewModel.supplierOptions)}
                    </div>
                    <div class="qc2-summary-grid qc2-history-summary-grid">
                        ${renderHistorySummaryCards(viewModel.summary, viewModel.currency)}
                    </div>
                    <section class="qc2-history-block qc2-history-table-block qc2-history-section">
                        <div class="mapping-section-head">
                            <div>
                                <div class="mapping-section-title">Price history table</div>
                                <div class="mapping-section-copy">Review each saved supplier price record, including change versus the previous visible record.</div>
                            </div>
                        </div>
                        <div data-qc-history-table-content>${renderHistoryTable(state, viewModel.tableRows, { hasHistoryContext: viewModel.hasHistoryContext })}</div>
                    </section>
                    <section class="qc2-history-block qc2-history-trend-block">
                        <div class="mapping-section-head"><div><div class="mapping-section-title">Simple trend</div><div class="mapping-section-copy">Unit price over time for the currently visible history rows.</div></div></div>
                        <div data-qc-history-trend-content>${renderHistoryTrend(state, viewModel.selectedSeriesRows, { hasHistoryContext: viewModel.hasHistoryContext })}</div>
                    </section>
                    <div data-qc-history-detail-modal>${renderHistoryDetailModal(state)}</div>
                    ${renderStatus(state)}
                    <div class="qc2-actions">
                        <button type="button" class="secondary-btn" data-qc-action="back-analyze">Back to Analyze</button>
                    </div>
                </div>
            </section>
        `;
    }

    function renderCurrentScreen(state) {
        switch (state.currentScreen) {
            case "upload":
                return renderQcUpload(state);
            case "manual":
                return renderQcManual(state);
            case "review":
                return renderQcReview(state);
            case "analyze":
                return renderQcAnalyze(state);
            case "history":
                return renderQcHistory(state);
            case "start":
            default:
                return renderQcStart(state);
        }
    }

    function renderApp(elements, state, options = {}) {
        const renderStartedAt = performance.now();
        const preserveScrollTop = options.preserveScroll ? readScrollPosition(elements) : null;
        const anchorSelector = options.anchorSelector || "";
        const anchorOffset = anchorSelector ? getAnchorOffset(elements, anchorSelector) : null;
        if (!elements.app) return;
        elements.app.innerHTML = renderCurrentScreen(state);
        if (state.currentScreen === "analyze") {
            applyAnalysisTableFilter(elements, state);
        }
        if (preserveScrollTop != null) {
            writeScrollPosition(elements, preserveScrollTop);
        }
        restoreAnchorOffset(elements, anchorSelector, anchorOffset);
        if (state.currentScreen === "history") {
            scheduleHistoryDetailChartRender(elements, state);
        }
        persistQuoteCompareSession(state, elements);
        console.info("[quote compare render timing]", {
            screen: state.currentScreen,
            durationMs: Number((performance.now() - renderStartedAt).toFixed(1))
        });
    }

    function scheduleAnalysisTableFilter(elements, state) {
        window.clearTimeout(state.analysisFilterTimer);
        state.analysisFilterTimer = window.setTimeout(() => {
            state.analysisFilterTimer = null;
            applyAnalysisTableFilter(elements, state);
            persistQuoteCompareSession(state, elements);
        }, 120);
    }

    function scheduleHistoryViewRefresh(elements, state) {
        if (state.historyRefreshFrame) {
            cancelAnimationFrame(state.historyRefreshFrame);
        }
        state.historyRefreshFrame = requestAnimationFrame(() => {
            state.historyRefreshFrame = 0;
            refreshHistoryView(elements, state);
        });
    }

    function applyAnalysisTableFilter(elements, state) {
        if (!elements.app) return;
        const activeFilter = normalizeAnalysisTableFilter(state.analysisTableFilter);
        const searchTerm = String(state.analysisTableSearch || "").trim().toLowerCase();
        const rows = Array.from(elements.app.querySelectorAll("[data-qc-analysis-row]"));
        const table = rows[0]?.parentElement || null;
        const emptyState = elements.app.querySelector("[data-qc-analysis-empty]");
        const rankedRows = rows
            .map((row, index) => {
                const rowIndex = Number(row.dataset.rowIndex);
                const productText = String(row.dataset.productSearchText || "");
                const supplierText = String(row.dataset.supplierSearchText || "");
                const productMatch = searchTerm && productText.includes(searchTerm);
                const supplierMatch = searchTerm && supplierText.includes(searchTerm);
                let searchRank = 2;
                if (!searchTerm) {
                    searchRank = 2;
                } else if (productMatch) {
                    searchRank = productText.startsWith(searchTerm) ? 0 : 1;
                }
                return {
                    row,
                    index: Number.isFinite(rowIndex) ? rowIndex : index,
                    searchRank,
                    matchesFilter: activeFilter === "all" || row.dataset.result === activeFilter,
                    matchesSearch: !searchTerm || productMatch || supplierMatch
                };
            })
            .sort((left, right) => {
                if (left.searchRank !== right.searchRank) return left.searchRank - right.searchRank;
                return left.index - right.index;
            });
        let visibleCount = 0;
        rankedRows.forEach(({ row, matchesFilter, matchesSearch }) => {
            const matches = matchesFilter && matchesSearch;
            row.classList.toggle("is-filter-hidden", !matches);
            if (table) {
                table.appendChild(row);
            }
            if (matches) visibleCount += 1;
        });
        if (table && emptyState) {
            table.appendChild(emptyState);
        }
        elements.app.querySelectorAll("[data-qc-action=\"set-analysis-filter\"]").forEach((button) => {
            const isActive = button.dataset.filterValue === activeFilter;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    }

    async function parseSelectedFile(state, file) {
        const parseSelectedStartedAt = performance.now();
        state.file = file || null;
        state.uploadReview = null;
        state.headers = [];
        state.rows = [];
        state.detectedMappings = {};
        state.selectedMappings = {};
        state.analysisResult = null;
        state.validation = { mappedCount: 0, missingFields: [...REQUIRED_FIELDS], duplicateColumns: [], ready: false };
        state.parseError = "";
        if (!file) {
            state.activeSessionId = "";
            sessionStorage.removeItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY);
            setStatus(state, "File removed. Choose another supplier file to continue.", "info");
            return;
        }
        await inspectUpload(state);
        console.info("[quote compare file selection timing]", {
            fileName: file.name,
            totalFileSelectionMs: Number((performance.now() - parseSelectedStartedAt).toFixed(1))
        });
    }

    async function startUploadAnalysis(state, elements) {
        if (!state.file && !state.activeSessionId) {
            setStatus(state, "Choose a supplier file before starting analysis.", "error");
            return false;
        }
        computeValidation(state);
        if (!state.validation.ready) {
            setStatus(state, "Complete the required unique mappings before starting analysis.", "error");
            return false;
        }
        if (!state.file && state.activeSessionId) {
            try {
                const activeSession = await fetchActiveQuoteCompareSession(state.activeSessionId);
                if (!activeSession || !isValidRestorableReviewSession(activeSession)) {
                    resetQuoteCompareUploadState(
                        state,
                        "Your upload session expired. Please upload the file again before starting analysis."
                    );
                    return false;
                }
                if (!isValidSelectedMappingSet(state.selectedMappings, activeSession.headers || [])) {
                    resetQuoteCompareUploadState(
                        state,
                        "Your restored mappings no longer match the uploaded file. Please upload the file again."
                    );
                    return false;
                }
                state.uploadReview = {
                    session_id: activeSession.session_id || "",
                    filename: activeSession.filename || "",
                    required_fields: activeSession.required_fields || REQUIRED_FIELDS,
                    optional_fields: activeSession.optional_fields || OPTIONAL_FIELDS,
                    message: activeSession.message || "",
                    review_message: activeSession.review_message || "",
                    mapping: activeSession.mapping || {},
                    field_reviews: activeSession.field_reviews || [],
                    matched_fields: activeSession.matched_fields || 0,
                    missing_fields: activeSession.missing_fields || [],
                    optional_columns: activeSession.optional_columns || [],
                    headers: activeSession.headers || []
                };
                state.headers = activeSession.headers || [];
                state.detectedMappings = { ...(activeSession.mapping || {}) };
            } catch (error) {
                resetQuoteCompareUploadState(
                    state,
                    "Your upload session could not be restored. Please upload the file again."
                );
                return false;
            }
        }
        state.isSubmitting = true;
        setStatus(state, "Building pricing analysis from the confirmed mappings.", "info");
        const formData = new FormData();
        if (state.file) {
            formData.append("file", state.file);
        }
        formData.append("mappings", JSON.stringify(state.selectedMappings));
        if (state.activeSessionId) {
            formData.append("session_id", state.activeSessionId);
        }
        try {
            const data = await fetchJson("/quote-compare/upload/confirm", {
                method: "POST",
                body: formData
            });
            state.activeSessionId = data.session_id || state.activeSessionId;
            if (state.activeSessionId) {
                sessionStorage.setItem(QUOTE_COMPARE_ACTIVE_SESSION_KEY, state.activeSessionId);
            }
            state.analyzeMode = "compare";
            state.analysisResult = {
                comparison: { ...data.comparison, source_type: "upload" },
                evaluation: data.evaluation,
                summary: buildAnalyzeSummary({ comparison: { ...data.comparison, source_type: "upload" } })
            };
            state.rows = data.comparison?.bids || [];
            state.activeAnalyzeTab = "savings";
            state.showOpportunitySection = true;
            state.showFullComparison = false;
            state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
            state.lastFlowScreen = "review";
            state.currentScreen = "analyze";
            state.isSubmitting = false;
            await activateCurrentUploadScope(elements, state);
            setStatus(state, data.message || "Pricing analysis is ready.", "success");
            return true;
        } catch (error) {
            state.isSubmitting = false;
            if (!state.file && /no longer available|upload it again|session/i.test(error.message || "")) {
                resetQuoteCompareUploadState(
                    state,
                    "Your upload session expired. Please upload the file again."
                );
                return false;
            }
            setStatus(state, error.message, "error");
            return false;
        }
    }

    async function startManualAnalysis(state, elements) {
        try {
            computeValidation(state);
            if (!state.validation.ready) {
                setStatus(state, "Complete the required unique mappings before starting analysis.", "error");
                state.isSubmitting = false;
                return false;
            }
            const mappedRows = normalizeMappedManualRows(applySelectedMappingsToRows(state.rows, state.selectedMappings));
            const importResult = buildQuoteBidImportResultFromRows(mappedRows);
            if (!importResult.valid_row_count) {
                throw new Error("Add at least one complete pricing row before starting analysis.");
            }
            const payload = {
                upload_id: state.manualUploadId,
                name: `Manual Pricing Analysis ${new Date().toLocaleDateString("en-US")}`,
                sourcing_need: "",
                source_type: "manual",
                mode: "compare",
                bids: importResult.bids,
                weighting: null
            };
            setStatus(state, "Calculating pricing analysis from the manual pricing rows.", "info");
            const data = await fetchJson("/quote-compare/evaluate", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            state.analyzeMode = "compare";
            state.analysisResult = {
                comparison: { ...data.comparison, source_type: "manual" },
                evaluation: data.evaluation,
                summary: buildAnalyzeSummary({ comparison: { ...data.comparison, source_type: "manual" } })
            };
            state.manualUploadId = data.comparison?.upload_id || state.manualUploadId;
            state.rows = importResult.bids;
            state.activeAnalyzeTab = "savings";
            state.showOpportunitySection = true;
            state.showFullComparison = false;
            state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
            state.lastFlowScreen = "review";
            state.currentScreen = "analyze";
            await activateCurrentUploadScope(elements, state);
            const skippedMessage = importResult.skipped_row_count
                ? ` ${importResult.skipped_row_count} incomplete rows were skipped.`
                : "";
            setStatus(state, `Manual pricing analysis is ready.${skippedMessage}`, "success");
            state.isSubmitting = false;
            return true;
        } catch (error) {
            setStatus(state, error.message, "error");
            state.isSubmitting = false;
            return false;
        }
    }

    function openUploadFlow(elements, state) {
        resetQuoteCompareUploadState(state);
        state.mode = "upload";
        state.currentScreen = "upload";
        state.lastFlowScreen = "review";
        setStatus(state, "", "");
        renderApp(elements, state);
        writeScrollPosition(elements, 0);
    }

    function bindEvents(elements, state) {
        if (!elements.app || elements.app.dataset.bound === "true") return;
        elements.app.dataset.bound = "true";
        const analysisTableDrag = {
            scroller: null,
            pointerId: null,
            startX: 0,
            startY: 0,
            startScrollLeft: 0,
            didDrag: false,
            isDragging: false,
            suppressClick: false
        };

        function resetAnalysisTableDrag() {
            if (analysisTableDrag.scroller) {
                analysisTableDrag.scroller.classList.remove("is-dragging");
            }
            analysisTableDrag.scroller = null;
            analysisTableDrag.pointerId = null;
            analysisTableDrag.startX = 0;
            analysisTableDrag.startY = 0;
            analysisTableDrag.startScrollLeft = 0;
            analysisTableDrag.didDrag = false;
            analysisTableDrag.isDragging = false;
        }

        function canStartAnalysisTableDrag(event) {
            if (event.button !== 0 || event.pointerType === "touch") return false;
            const tableScroller = event.target.closest(".qc2-analysis-table-scroll");
            if (!tableScroller) return false;
            if (event.target.closest("button, input, textarea, select, a, [contenteditable='true']")) return false;
            return tableScroller.scrollWidth > tableScroller.clientWidth + 2;
        }

        elements.app.addEventListener("click", (event) => {
            if (!analysisTableDrag.suppressClick || !event.target.closest(".qc2-analysis-table-scroll")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            analysisTableDrag.suppressClick = false;
        }, true);

        elements.app.addEventListener("pointerdown", (event) => {
            analysisTableDrag.suppressClick = false;
            if (!canStartAnalysisTableDrag(event)) return;
            const tableScroller = event.target.closest(".qc2-analysis-table-scroll");
            if (!tableScroller) return;
            analysisTableDrag.scroller = tableScroller;
            analysisTableDrag.pointerId = event.pointerId;
            analysisTableDrag.startX = event.clientX;
            analysisTableDrag.startY = event.clientY;
            analysisTableDrag.startScrollLeft = tableScroller.scrollLeft;
            analysisTableDrag.didDrag = false;
            analysisTableDrag.isDragging = false;
        });

        elements.app.addEventListener("pointermove", (event) => {
            if (!analysisTableDrag.scroller || analysisTableDrag.pointerId !== event.pointerId) return;
            const deltaX = event.clientX - analysisTableDrag.startX;
            const deltaY = event.clientY - analysisTableDrag.startY;
            if (!analysisTableDrag.isDragging) {
                if (Math.abs(deltaX) < 6 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
                analysisTableDrag.isDragging = true;
                analysisTableDrag.didDrag = true;
                analysisTableDrag.scroller.classList.add("is-dragging");
                if (!analysisTableDrag.scroller.hasPointerCapture(event.pointerId)) {
                    analysisTableDrag.scroller.setPointerCapture(event.pointerId);
                }
            }
            event.preventDefault();
            analysisTableDrag.scroller.scrollLeft = analysisTableDrag.startScrollLeft - deltaX;
        });

        elements.app.addEventListener("pointerup", (event) => {
            if (!analysisTableDrag.scroller || analysisTableDrag.pointerId !== event.pointerId) return;
            if (analysisTableDrag.scroller.hasPointerCapture(event.pointerId)) {
                analysisTableDrag.scroller.releasePointerCapture(event.pointerId);
            }
            analysisTableDrag.suppressClick = analysisTableDrag.didDrag;
            resetAnalysisTableDrag();
        });

        elements.app.addEventListener("pointercancel", (event) => {
            if (!analysisTableDrag.scroller || analysisTableDrag.pointerId !== event.pointerId) return;
            resetAnalysisTableDrag();
        });

        elements.app.addEventListener("click", async (event) => {
            const actionTarget = event.target.closest("[data-qc-action]");
            if (!actionTarget) return;
            const action = actionTarget.dataset.qcAction;

            if (action === "start-upload") {
                closeProductSummary(state);
                state.mode = "upload";
                state.currentScreen = "upload";
                setStatus(state, "", "");
                renderApp(elements, state);
                return;
            }
            if (action === "start-manual") {
                closeProductSummary(state);
                state.mode = "manual";
                state.currentScreen = "manual";
                setStatus(state, "", "");
                renderApp(elements, state);
                return;
            }
            if (action === "back-start") {
                closeProductSummary(state);
                state.currentScreen = "start";
                setStatus(state, "", "");
                renderApp(elements, state);
                return;
            }
            if (action === "pick-file" || action === "replace-file") {
                elements.app.querySelector("#qc2FileInput")?.click();
                return;
            }
            if (action === "remove-file") {
                await parseSelectedFile(state, null);
                renderApp(elements, state);
                return;
            }
            if (action === "go-review") {
                closeProductSummary(state);
                state.currentScreen = "review";
                renderApp(elements, state);
                return;
            }
            if (action === "back-upload") {
                closeProductSummary(state);
                state.currentScreen = "upload";
                renderApp(elements, state);
                return;
            }
            if (action === "clear-mappings") {
                clearMappings(state);
                setStatus(state, "All mapping selections were cleared.", "info");
                renderApp(elements, state, { preserveScroll: true });
                return;
            }
            if (action === "start-analysis") {
                if (state.isSubmitting) return;
                state.isSubmitting = true;
                setStatus(state, "Starting analysis...", "info");
                renderApp(elements, state, { preserveScroll: true });
                await waitForNextPaint();
                const started = state.mode === "manual"
                    ? await startManualAnalysis(state, elements)
                    : await startUploadAnalysis(state, elements);
                renderApp(elements, state);
                if (started) {
                    writeScrollPosition(elements, 0);
                }
                return;
            }
            if (action === "back-review") {
                closeProductSummary(state);
                if (state.currentScreen === "review" && state.mode === "manual") {
                    state.currentScreen = "manual";
                } else {
                    state.currentScreen = "review";
                }
                renderApp(elements, state);
                return;
            }
            if (action === "add-manual-row") {
                state.manualRows.push(createEmptyManualRow());
                renderApp(elements, state);
                return;
            }
            if (action === "remove-manual-row") {
                const manualEntryScrollLeft = getManualEntryScroller(elements)?.scrollLeft || 0;
                const index = Number(actionTarget.dataset.index || -1);
                if (index > 0) state.manualRows.splice(index, 1);
                renderApp(elements, state, { preserveScroll: true });
                restoreManualEntryScrollLeft(elements, manualEntryScrollLeft);
                return;
            }
            if (action === "go-manual-review") {
                try {
                    prepareManualDraftForReview(state);
                    state.lastFlowScreen = "manual";
                    state.currentScreen = "review";
                    setStatus(state, "Manual rows are ready for review.", "info");
                } catch (error) {
                    setStatus(state, error.message, "error");
                }
                renderApp(elements, state);
                return;
            }
            if (action === "open-product-summary") {
                const productName = actionTarget.dataset.productName || "";
                const productUnit = actionTarget.dataset.productUnit || "";
                if (openProductSummary(state, productName, productUnit)) {
                    renderApp(elements, state, { preserveScroll: true });
                }
                return;
            }
            if (action === "toggle-decision-card") {
                const cardKey = actionTarget.dataset.cardKey || "";
                if (cardKey) {
                    const cardScope = getDecisionCardScope(cardKey);
                    if (cardScope === "spotlight") {
                        toggleSpotlightCardInPlace(elements, state, cardKey);
                        return;
                    }
                    const shouldRestoreAnalysisPosition = cardScope === "analysis";
                    if (shouldRestoreAnalysisPosition) {
                        rememberFullComparisonTablePosition(elements, state);
                    }
                    state.collapsedDecisionCards = toggleDecisionCardState(state.collapsedDecisionCards, cardKey);
                    if (cardScope === "analysis") {
                        selectFullComparisonRow(elements, state, cardKey, { persist: false });
                    }
                    const anchorSelector = cardScope === "analysis"
                        ? `[data-qc-analysis-card-key="${cssEscape(cardKey)}"]`
                        : `[data-qc-card-key="${cssEscape(cardKey)}"], [data-card-key="${cssEscape(cardKey)}"]`;
                    renderApp(elements, state, { preserveScroll: true, anchorSelector });
                    if (shouldRestoreAnalysisPosition) {
                        requestAnimationFrame(() => {
                            restoreFullComparisonTablePosition(elements, state);
                        });
                    }
                }
                return;
            }
            if (action === "set-analyze-tab") {
                const nextTab = actionTarget.dataset.tab === "full-table" ? "full-table" : "savings";
                state.activeAnalyzeTab = nextTab;
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="opportunity-section"], [data-qc-anchor="full-comparison-section"]' });
                return;
            }
            if (action === "collapse-all-opportunity-tables") {
                state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="opportunity-section"]' });
                return;
            }
            if (action === "hide-opportunity-section") {
                state.showOpportunitySection = false;
                state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="opportunity-section"]' });
                return;
            }
            if (action === "toggle-opportunity-section") {
                state.showOpportunitySection = !state.showOpportunitySection;
                if (!state.showOpportunitySection) {
                    state.collapsedDecisionCards = clearDecisionCardsForScope(state.collapsedDecisionCards, "spotlight");
                }
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="opportunity-section"]' });
                return;
            }
            if (action === "hide-all-details") {
                state.collapsedDecisionCards = clearFullComparisonDetails(state.collapsedDecisionCards);
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="full-comparison-section"]' });
                return;
            }
            if (action === "toggle-full-comparison") {
                state.showFullComparison = !state.showFullComparison;
                state.activeAnalyzeTab = "full-table";
                renderApp(elements, state, { preserveScroll: true, anchorSelector: '[data-qc-anchor="full-comparison-section"]' });
                return;
            }
            if (action === "set-analysis-filter") {
                state.analysisTableFilter = actionTarget.dataset.filterValue || "all";
                applyAnalysisTableFilter(elements, state);
                persistQuoteCompareSession(state, elements);
                return;
            }
            if (action === "toggle-optimized-summary") {
                state.showOptimizedSummary = !state.showOptimizedSummary;
                renderApp(elements, state, { preserveScroll: true });
                return;
            }
            if (action === "go-history") {
                closeProductSummary(state);
                rememberFullComparisonTablePosition(elements, state);
                state.previousAnalyzeTab = state.activeAnalyzeTab || "savings";
                initializeHistoryFilters(state);
                setStatus(state, "Loading saved product history.", "info");
                await ensureHistoryComparisonsLoaded(state);
                state.currentScreen = "history";
                renderApp(elements, state);
                requestAnimationFrame(() => {
                    scrollHistorySectionIntoView(elements);
                });
                return;
            }
            if (action === "see-history-offers") {
                const productName = actionTarget.dataset.productName || "";
                const productUnit = actionTarget.dataset.productUnit || "";
                selectFullComparisonRow(
                    elements,
                    state,
                    actionTarget.closest("[data-qc-analysis-row]")?.dataset.qcAnalysisCardKey || state.selectedAnalysisRowKey
                );
                rememberFullComparisonTablePosition(elements, state);
                state.previousAnalyzeTab = state.activeAnalyzeTab || "full-table";
                initializeHistoryFilters(state);
                setStatus(state, `Opening price history for ${productName}.`, "info");
                await ensureHistoryComparisonsLoaded(state);
                focusHistoryOnProductSeries(state, productName, productUnit);
                state.currentScreen = "history";
                renderApp(elements, state);
                requestAnimationFrame(() => {
                    scrollHistorySectionIntoView(elements);
                });
                return;
            }
            if (action === "back-analyze") {
                state.currentScreen = "analyze";
                state.activeAnalyzeTab = state.previousAnalyzeTab || state.activeAnalyzeTab || "savings";
                const anchorSelector = state.activeAnalyzeTab === "full-table"
                    ? '[data-qc-anchor="full-comparison-section"]'
                    : '[data-qc-anchor="opportunity-section"]';
                renderApp(elements, state, { preserveScroll: true, anchorSelector });
                requestAnimationFrame(() => {
                    restoreFullComparisonTablePosition(elements, state);
                });
                return;
            }
        });

        elements.app.addEventListener("click", (event) => {
            setFullComparisonTableActiveState(elements, Boolean(event.target.closest(".qc2-analysis-table-frame")));
            const productSummaryClose = event.target.closest("[data-qc-product-summary-close]");
            if (productSummaryClose) {
                closeProductSummary(state);
                renderApp(elements, state, { preserveScroll: true });
                return;
            }
            const selectedAnalysisRow = event.target.closest("[data-qc-analysis-card-key]");
            if (selectedAnalysisRow) {
                selectFullComparisonRow(elements, state, selectedAnalysisRow.dataset.qcAnalysisCardKey || "");
            }

            const historyDateClear = event.target.closest("[data-qc-history-date-clear]");
            if (historyDateClear) {
                const key = historyDateClear.dataset.qcHistoryDateClear;
                if (key === "dateFrom" || key === "dateTo") {
                    state.historyFilters[key] = "";
                    syncHistoryFilterDefaults(state);
                    clearHistorySelectedSeries(state);
                    closeHistoryDetailModal(state);
                    scheduleHistoryViewRefresh(elements, state);
                }
                return;
            }

            const historyComboboxToggle = event.target.closest("[data-qc-history-combobox-toggle]");
            if (historyComboboxToggle) {
                const key = historyComboboxToggle.dataset.qcHistoryComboboxToggle;
                const combobox = historyComboboxToggle.closest("[data-qc-history-combobox]");
                const isOpen = combobox?.classList.contains("is-open");
                if (isOpen) {
                    closeHistoryComboboxes(elements);
                } else {
                    openHistoryCombobox(elements, key);
                }
                return;
            }

            const historyOption = event.target.closest("[data-qc-history-filter-option]");
            if (historyOption) {
                const key = historyOption.dataset.qcHistoryFilterOption;
                if (key === "product") {
                    state.historyFocusedSeriesKey = "";
                }
                applyHistoryFilterValue(state, key, historyOption.dataset.value || "");
                clearHistorySelectedSeries(state);
                closeHistoryDetailModal(state);
                scheduleHistoryViewRefresh(elements, state);
                return;
            }

            const historySortHeader = event.target.closest("[data-qc-history-sort-key]");
            if (historySortHeader) {
                if (state.historyDrag?.suppressClick) {
                    state.historyDrag.suppressClick = false;
                    return;
                }
                cycleHistorySort(state, historySortHeader.dataset.qcHistorySortKey || "");
                scheduleHistoryViewRefresh(elements, state);
                return;
            }

            const historyRow = event.target.closest("[data-qc-history-row]");
            if (historyRow) {
                const seriesKey = historyRow.dataset.qcHistorySeriesKey || "";
                const rowId = historyRow.dataset.qcHistoryRowId || "";
                if (state.historyRowClickTimer) {
                    clearTimeout(state.historyRowClickTimer);
                }
                state.historyRowClickTimer = setTimeout(() => {
                    const previousScrollTop = readScrollPosition(elements);
                    const previousTableScrollTop = getHistoryTableScroller(elements)?.scrollTop || 0;
                    const viewModel = getHistoryViewModel(state);
                    setHistorySelectedSeries(state, viewModel.filteredRows, seriesKey, rowId);
                    refreshHistoryView(elements, state);
                    requestAnimationFrame(() => {
                        writeScrollPosition(elements, previousScrollTop);
                        const nextTableScroller = getHistoryTableScroller(elements);
                        if (nextTableScroller) nextTableScroller.scrollTop = previousTableScrollTop;
                        if (shouldScrollToHistoryTrend(elements)) {
                            elements.app?.querySelector("[data-qc-history-trend-content]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        }
                    });
                    state.historyRowClickTimer = null;
                }, 180);
                return;
            }

            const dateShell = event.target.closest("[data-date-shell]");
            if (dateShell && elements.app.contains(dateShell)) {
                const input = dateShell.querySelector('.date-input[type="date"]');
                if (!input) return;

                if (event.target === input) {
                    input.focus({ preventScroll: true });
                    return;
                }

                if (event.target.closest(".qc2-history-date-trigger")) {
                    event.preventDefault();
                    event.stopPropagation();
                    openDateInputPicker(input);
                    return;
                }

                openDateInputPicker(input);
                return;
            }

            if (!event.target.closest("[data-qc-history-combobox]")) {
                closeHistoryComboboxes(elements);
            }

            if (event.target.closest("[data-qc-history-detail-close]")) {
                const previousScrollTop = readScrollPosition(elements);
                const previousTableScrollTop = getHistoryTableScroller(elements)?.scrollTop || 0;
                closeHistoryDetailModal(state);
                refreshHistoryView(elements, state);
                restoreHistoryTablePosition(elements, previousScrollTop, previousTableScrollTop);
            }
        });

        elements.app.addEventListener("change", async (event) => {
            const fileInput = event.target.closest("#qc2FileInput");
            if (fileInput) {
                const renderStartedAt = performance.now();
                const file = fileInput.files?.[0] || null;
                await parseSelectedFile(state, file);
                renderApp(elements, state);
                console.info("[quote compare upload render timing]", {
                    fileName: file?.name || "",
                    renderAfterInspectMs: Number((performance.now() - renderStartedAt).toFixed(1))
                });
                return;
            }

            const mappingSelect = event.target.closest("[data-qc-mapping-field]");
            if (mappingSelect) {
                state.selectedMappings[mappingSelect.dataset.qcMappingField] = mappingSelect.value || "";
                computeValidation(state);
                renderApp(elements, state, { preserveScroll: true });
                return;
            }

            const historyFilter = event.target.closest("[data-qc-history-filter]");
            if (historyFilter) {
                const key = historyFilter.dataset.qcHistoryFilter;
                state.historyFilters[key] = historyFilter.value || "";
                syncHistoryFilterDefaults(state);
                clearHistorySelectedSeries(state);
                closeHistoryDetailModal(state);
                scheduleHistoryViewRefresh(elements, state);
                return;
            }

            const historyColumnCheckbox = event.target.closest("[data-qc-history-column-toggle]");
            if (historyColumnCheckbox) {
                setHistoryColumnVisibility(
                    state,
                    historyColumnCheckbox.dataset.qcHistoryColumnToggle,
                    historyColumnCheckbox.checked
                );
                scheduleHistoryViewRefresh(elements, state);
                return;
            }

            const manualField = event.target.closest("[data-manual-field]");
            if (manualField) {
                const index = Number(manualField.dataset.index || -1);
                const field = manualField.dataset.manualField || "";
                if (index >= 0 && state.manualRows[index] && field) {
                    state.manualRows[index][field] = manualField.value;
                }
                persistQuoteCompareSession(state, elements);
                refreshManualDraftUi(elements, state, index);
            }
        });

        elements.app.addEventListener("input", (event) => {
            const historySearchInput = event.target.closest("[data-qc-history-filter-search]");
            if (historySearchInput) {
                const combobox = historySearchInput.closest("[data-qc-history-combobox]");
                filterHistoryComboboxOptions(combobox, historySearchInput.value || "");
                return;
            }

            const searchInput = event.target.closest("[data-qc-analysis-search]");
            if (searchInput) {
                state.analysisTableSearch = searchInput.value || "";
                scheduleAnalysisTableFilter(elements, state);
                return;
            }
            const manualField = event.target.closest("[data-manual-field]");
            if (!manualField) return;
            const index = Number(manualField.dataset.index || -1);
            const field = manualField.dataset.manualField || "";
            if (index >= 0 && state.manualRows[index] && field) {
                state.manualRows[index][field] = manualField.value;
            }
            persistQuoteCompareSession(state, elements);
            refreshManualDraftUi(elements, state, index);
        });

        elements.app.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && state.productSummaryModalOpen) {
                closeProductSummary(state);
                renderApp(elements, state, { preserveScroll: true });
                return;
            }
            if (event.key === "Escape" && state.historyDetailModalOpen) {
                const previousScrollTop = readScrollPosition(elements);
                const previousTableScrollTop = getHistoryTableScroller(elements)?.scrollTop || 0;
                closeHistoryDetailModal(state);
                refreshHistoryView(elements, state);
                restoreHistoryTablePosition(elements, previousScrollTop, previousTableScrollTop);
                return;
            }

            const historySortHeader = event.target.closest("[data-qc-history-sort-key]");
            if (historySortHeader && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                cycleHistorySort(state, historySortHeader.dataset.qcHistorySortKey || "");
                scheduleHistoryViewRefresh(elements, state);
                return;
            }

            const historyRow = event.target.closest("[data-qc-history-row]");
            if (historyRow && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                const seriesKey = historyRow.dataset.qcHistorySeriesKey || "";
                const rowId = historyRow.dataset.qcHistoryRowId || "";
                const previousScrollTop = readScrollPosition(elements);
                const previousTableScrollTop = getHistoryTableScroller(elements)?.scrollTop || 0;
                const viewModel = getHistoryViewModel(state);
                if (event.key === "Enter" && state.historySelectedSeriesKey === seriesKey) {
                    const fullSeriesRows = getHistoryFullSeriesRows(state, seriesKey);
                    openHistoryDetailModal(state, fullSeriesRows, true);
                } else {
                    setHistorySelectedSeries(state, viewModel.filteredRows, seriesKey, rowId);
                }
                refreshHistoryView(elements, state);
                restoreHistoryTablePosition(elements, previousScrollTop, previousTableScrollTop);
                return;
            }

            const historySearchInput = event.target.closest("[data-qc-history-filter-search]");
            if (!historySearchInput) return;
            const combobox = historySearchInput.closest("[data-qc-history-combobox]");
            if (!combobox) return;

            if (event.key === "Escape") {
                closeHistoryComboboxes(elements);
                combobox.querySelector("[data-qc-history-combobox-toggle]")?.focus({ preventScroll: true });
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                const firstVisibleOption = Array.from(combobox.querySelectorAll("[data-qc-history-filter-option]"))
                    .find((option) => !option.hidden);
                if (!firstVisibleOption) return;
                applyHistoryFilterValue(
                    state,
                    firstVisibleOption.dataset.qcHistoryFilterOption,
                    firstVisibleOption.dataset.value || ""
                );
                clearHistorySelectedSeries(state);
                closeHistoryDetailModal(state);
                scheduleHistoryViewRefresh(elements, state);
            }
        });

        elements.app.addEventListener("dragstart", (event) => {
            const historyHeader = event.target.closest("[data-qc-history-column-key]");
            if (!historyHeader) return;
            state.historyDrag = { key: historyHeader.dataset.qcHistoryColumnKey || "", suppressClick: false };
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", state.historyDrag.key);
            }
        });

        elements.app.addEventListener("dragover", (event) => {
            const historyHeader = event.target.closest("[data-qc-history-column-key]");
            if (!historyHeader) return;
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move";
            }
        });

        elements.app.addEventListener("drop", (event) => {
            const historyHeader = event.target.closest("[data-qc-history-column-key]");
            if (!historyHeader) return;
            event.preventDefault();
            const draggedKey = state.historyDrag?.key || event.dataTransfer?.getData("text/plain") || "";
            const targetKey = historyHeader.dataset.qcHistoryColumnKey || "";
            if (moveHistoryColumn(state, draggedKey, targetKey)) {
                state.historyDrag = { key: "", suppressClick: true };
                scheduleHistoryViewRefresh(elements, state);
                return;
            }
            state.historyDrag = { key: "", suppressClick: false };
        });

        elements.app.addEventListener("dragend", () => {
            if (!state.historyDrag) return;
            state.historyDrag.key = "";
        });

        elements.app.addEventListener("dblclick", (event) => {
            const historyRow = event.target.closest("[data-qc-history-row]");
            if (!historyRow) return;
            if (state.historyRowClickTimer) {
                clearTimeout(state.historyRowClickTimer);
                state.historyRowClickTimer = null;
            }
            const seriesKey = historyRow.dataset.qcHistorySeriesKey || "";
            const rowId = historyRow.dataset.qcHistoryRowId || "";
            const previousScrollTop = readScrollPosition(elements);
            const previousTableScrollTop = getHistoryTableScroller(elements)?.scrollTop || 0;
            const viewModel = getHistoryViewModel(state);
            setHistorySelectedSeries(state, viewModel.filteredRows, seriesKey, rowId);
            const fullSeriesRows = getHistoryFullSeriesRows(state, seriesKey);
            openHistoryDetailModal(state, fullSeriesRows, true);
            refreshHistoryView(elements, state);
            restoreHistoryTablePosition(elements, previousScrollTop, previousTableScrollTop);
        });
    }

    function exposeApi(elements, state) {
        window.resetQuoteCompareToStep1 = function resetQuoteCompareToStep1() {
            setQuoteCompareReady(elements, false);
            openUploadFlow(elements, state);
            setQuoteCompareReady(elements, true);
        };

        window.PriceAnalyzerQuoteCompare = {
            openStartAction(action) {
                state.currentScreen = action === "manual" ? "manual" : "upload";
                state.mode = action === "manual" ? "manual" : "upload";
                renderApp(elements, state);
            },
            openUploadFilePicker() {
                state.currentScreen = "upload";
                renderApp(elements, state);
                elements.app.querySelector("#qc2FileInput")?.click();
            },
            syncUploadFileName() {},
            continueUploadReview() {
                state.currentScreen = "review";
                renderApp(elements, state);
            },
            clearUploadFile() {
                parseSelectedFile(state, null).then(() => renderApp(elements, state));
            },
            addManualSupplier() {
                state.currentScreen = "manual";
                state.manualRows.push(createEmptyManualRow());
                renderApp(elements, state);
            },
            saveManualProduct() {},
            addAnotherManualProduct() {
                state.currentScreen = "manual";
                state.manualRows.push(createEmptyManualRow());
                renderApp(elements, state);
            },
            continueManualReview() {
                try {
                    prepareManualDraftForReview(state);
                    state.lastFlowScreen = "manual";
                    state.currentScreen = "review";
                    renderApp(elements, state);
                } catch (error) {
                    setStatus(state, error.message, "error");
                    renderApp(elements, state);
                }
            },
            goToStart() {
                state.currentScreen = "start";
                renderApp(elements, state);
            }
        };
    }

    async function initQuoteCompare() {
        const initStartedAt = performance.now();
        const elements = getElements();
        if (!elements.shell || !elements.app) return;
        console.info("[quote compare init start]");
        setQuoteCompareReady(elements, false);
        const state = createState();
        let hardResetRequested = false;
        let hasBackendAnalysis = false;
        try {
            try {
                const scopePayload = await fetchJson("/analysis/scope-bootstrap?scope=current_upload");
                hasBackendAnalysis = Boolean(scopePayload?.has_analysis);
            } catch (error) {
                hasBackendAnalysis = false;
            }
            hardResetRequested = Boolean(window.PriceAnalyzerBootGuard?.didHardReset?.());
            if (hardResetRequested) {
                resetQuoteCompareUploadState(state);
            } else if (!hasBackendAnalysis) {
                clearPersistedQuoteCompareState();
                resetQuoteCompareUploadState(state);
            } else {
                restoreQuoteCompareSession(state);
                restoreHistoryUiPreferences(state);
            }
            bindEvents(elements, state);
            await refreshSharedScopeSummary(elements, state);
            exposeApi(elements, state);
            await loadSavedComparisons(state, { includeComparisons: false });
            if (state.currentScreen === "history") {
                await ensureHistoryComparisonsLoaded(state);
            }
            const renderStartedAt = performance.now();
            renderApp(elements, state);
            console.info("[quote compare initial render timing]", {
                currentScreen: state.currentScreen,
                durationMs: Number((performance.now() - renderStartedAt).toFixed(1))
            });
            if (hardResetRequested) {
                writeScrollPosition(elements, 0);
            } else {
                restoreQuoteCompareScroll(elements);
            }
        } catch (error) {
            console.error("[quote compare init failed]", error);
            state.currentScreen = "start";
            state.lastFlowScreen = "review";
            state.status = {
                message: "Quote Compare could not restore the previous session. Starting a fresh workflow.",
                tone: "info"
            };
            renderApp(elements, state);
        } finally {
            setQuoteCompareReady(elements, true);
            console.info("[quote compare init end]", {
                currentScreen: state.currentScreen,
                totalInitMs: Number((performance.now() - initStartedAt).toFixed(1))
            });
        }

        const scrollContext = getScrollContext(elements);
        const scrollTarget = scrollContext.type === "element" ? scrollContext.target : window;
        scrollTarget.addEventListener("scroll", () => {
            scheduleQuoteCompareSessionPersist(state, elements);
        }, { passive: true });
        window.addEventListener("beforeunload", () => {
            window.clearTimeout(state.persistSessionTimer);
            persistQuoteCompareSession(state, elements);
        });

        elements.app.addEventListener("focusin", (event) => {
            setFullComparisonTableActiveState(elements, Boolean(event.target.closest(".qc2-analysis-table-frame")));
        });

        elements.app.addEventListener("focusout", (event) => {
            if (!event.relatedTarget || !event.relatedTarget.closest?.(".qc2-analysis-table-frame")) {
                setFullComparisonTableActiveState(elements, false);
            }
        });

        document.addEventListener("mousedown", (event) => {
            if (!event.target.closest(".qc2-analysis-table-frame")) {
                setFullComparisonTableActiveState(elements, false);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            initQuoteCompare();
        });
    } else {
        initQuoteCompare();
    }
})();

