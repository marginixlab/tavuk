import pandas as pd


def build_curated_demo_dataframe() -> pd.DataFrame:
    return pd.DataFrame({
        "Product Name": [
            "Eggs",
            "Eggs",
            "Eggs",
            "Eggs",
            "Olive Oil",
            "Olive Oil",
            "Rice",
            "Rice",
            "Coffee Beans",
            "Coffee Beans",
            "Bread",
            "Bread",
            "Sugar",
            "Sugar",
            "Olive Oil",
            "Rice"
        ],
        "Supplier": [
            "Sysco",
            "US Foods",
            "Metro",
            "Metro",
            "Sysco",
            "US Foods",
            "Metro",
            "Sysco",
            "US Foods",
            "Sysco",
            "US Foods",
            "Metro",
            "Sysco",
            "Metro"
        ],
        "Unit": [
            "piece",
            "piece",
            "carton",
            "carton",
            "liter",
            "liter",
            "kg",
            "kg",
            "kg",
            "kg",
            "loaf",
            "loaf",
            "kg",
            "kg",
            "liter",
            "kg"
        ],
        "Quantity": [
            24,
            12,
            3,
            2,
            8,
            5,
            50,
            30,
            12,
            8,
            20,
            14,
            18,
            10,
            6,
            40
        ],
        "Unit Price": [
            0.42,
            0.39,
            4.80,
            5.20,
            12.60,
            13.10,
            2.10,
            2.35,
            17.40,
            18.10,
            3.25,
            3.55,
            1.28,
            1.42,
            14.00,
            2.18
        ],
        "Date": [
            "2026-03-01",
            "2026-03-02",
            "2026-03-03",
            "2026-03-04",
            "2026-03-05",
            "2026-03-06",
            "2026-03-07",
            "2026-03-08",
            "2026-03-09",
            "2026-03-10",
            "2026-03-11",
            "2026-03-12",
            "2026-03-13",
            "2026-03-14",
            "2026-03-15",
            "2026-03-16"
        ]
    })


if __name__ == "__main__":
    dataframe = build_curated_demo_dataframe()
    dataframe.to_csv("sample_500.csv", index=False)
    print("Wrote curated 15-row demo dataset to sample_500.csv")
