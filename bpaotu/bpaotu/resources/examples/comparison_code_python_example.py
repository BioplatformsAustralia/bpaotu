#!/usr/bin/env python
# coding: utf-8



import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# === CONFIG ===
ordination_file = "ordination.csv"
contextual_file = "contextual.csv"
definitions_file = "definitions.csv"
definitions_values_file = "definitions_values.csv"

# === LOAD DATA ===
ordination = pd.read_csv(ordination_file)
ordination["sample_id"] = ordination["sample_id"].astype(str)
ordination = ordination.rename(columns={
    "braycurtis_x": "UMAP1",
    "braycurtis_y": "UMAP2"
})

contextual = pd.read_csv(contextual_file)
contextual["sample_id"] = contextual["sample_id"].astype(str)

definitions = pd.read_csv(definitions_file)
definitions_values = pd.read_csv(definitions_values_file)

# === MERGE ORDINATION AND CONTEXTUAL DATA ===
merged = pd.merge(ordination, contextual, on="sample_id", how="left")




# === PARAMETERS ===
dissimilarity_method = "braycurtis" # Only "braycurtis" supported at the moment
contextual_variable = "vegetation_type_id"




# === CHECK ===
if contextual_variable not in merged.columns:
    raise ValueError(f"Variable '{contextual_variable}' not found in contextual data.")

if contextual_variable not in definitions["name"].values:
    raise ValueError(f"Variable '{contextual_variable}' not found in definitions data.")




# === DETERMINE VARIABLE TYPE & MAP IF ONTOLOGY ===

definition = definitions.loc[definitions["name"] == contextual_variable].iloc[0]

if definition["type"] == "ontology":
    # Get the values for this contextual_variable
    subset = definitions_values[definitions_values["name"] == contextual_variable]

    # Build mapping dict: {value_id -> value_label}
    # (replacing empty or NaN labels with "N/A")
    value_map = {
        int(row["value_id"]): (
            row["value_label"] if pd.notna(row["value_label"]) and row["value_label"] != "" else "N/A"
        )
        for _, row in subset.iterrows()
    }

    # Apply mapping to label column
    label_col = contextual_variable.replace("_id", "_label")
    merged[label_col] = merged[contextual_variable].map(value_map)

    # Build category order sorted by value_id and store in label column
    categories = [value_map[k] for k in sorted(value_map.keys())]
    merged[label_col] = pd.Categorical(
        merged[label_col],
        categories=categories,
        ordered=True
    )

    colour_label = label_col
    is_continuous = False

elif definition["type"] == "float":
    colour_label = contextual_variable
    is_continuous = True

elif definition["type"] == "string":
    colour_label = contextual_variable
    is_continuous = False

elif definition["type"] == "date":
    colour_label = contextual_variable
    is_continuous = False

else:
    print("Unknown type")




# === PLOT ===
plt.figure(figsize=(8, 6))
ax = plt.gca()

if is_continuous:
    # Separate valid and NaN points
    valid_mask = merged[colour_label].notna()
    nan_mask = merged[colour_label].isna()

    # Plot valid points on colour scale
    sc = plt.scatter(
        merged.loc[valid_mask, "UMAP1"],
        merged.loc[valid_mask, "UMAP2"],
        c=merged.loc[valid_mask, colour_label],
        cmap="viridis",
        s=50,
        edgecolor="none",
        alpha=0.9
    )
    plt.colorbar(sc, label=definition["display_name"])

    # Plot NaN points as tiny black dots
    plt.scatter(
        merged.loc[nan_mask, "UMAP1"],
        merged.loc[nan_mask, "UMAP2"],
        color='black',
        s=1,
        alpha=0.8,
        label='Missing'
    )

    # Optionally, include in legend
    if nan_mask.any():
        plt.legend(loc='upper left')
else:
    palette = sns.color_palette("tab10", len(merged[colour_label].cat.categories))
    colour_map = dict(zip(merged[colour_label].cat.categories, palette))
    colours = np.array([colour_map[val] for val in merged[colour_label]])
    plt.scatter(
        merged["UMAP1"], merged["UMAP2"],
        c=colours, s=50, edgecolor="none", alpha=0.9
    )
    plt.legend(
        handles=[
            plt.Line2D([0], [0], marker='o', color='w', label=str(cat),
                       markerfacecolor=colour_map[cat], markersize=8)
            for cat in categories if pd.notna(cat)
        ],
        title=definition["display_name"],
        bbox_to_anchor=(1.05, 1), loc='upper left'
    )
    
# Since this is an ordination the axes and ticks are arbitrary (so we remove them all)
ax.set_xticks([])
ax.set_yticks([])
ax.set_xlabel("")
ax.set_ylabel("")

title = f"Ordination Coloured by {definition['display_name']}"
plt.title(title)
plt.tight_layout()
plt.show()

