# install.packages(c('dplyr', 'readr', 'forcats', 'ggplot2'))

library(readr)
library(dplyr)
library(ggplot2)
library(forcats)

# === CONFIG ===
ordination_file <- "ordination.csv"
contextual_file <- "contextual.csv"
definitions_file <- "definitions.csv"
definitions_values_file <- "definitions_values.csv"

# === LOAD DATA ===
ordination <- read_csv(ordination_file, col_types = cols())
ordination <- ordination %>%
  mutate(sample_id = as.character(sample_id)) %>%
  rename(
    UMAP1 = braycurtis_x,
    UMAP2 = braycurtis_y
  )

contextual <- read_csv(contextual_file, col_types = cols()) %>%
  mutate(sample_id = as.character(sample_id))

definitions <- read_csv(definitions_file, col_types = cols())
definitions_values <- read_csv(definitions_values_file, col_types = cols())

# === MERGE ORDINATION AND CONTEXTUAL DATA ===
merged <- ordination %>% left_join(contextual, by = "sample_id")

# === PARAMETERS ===
dissimilarity_method <- "braycurtis" # Only braycurtis supported
contextual_variable <- "ph"

# === CHECK ===
if (!(contextual_variable %in% names(merged))) {
  stop(paste("Variable", contextual_variable, "not found in contextual data."))
}
if (!(contextual_variable %in% definitions$name)) {
  stop(paste("Variable", contextual_variable, "not found in definitions data."))
}

# === DETERMINE VARIABLE TYPE & MAP IF ONTOLOGY ===
definition <- definitions %>% filter(name == contextual_variable) %>% slice(1)

if (definition$type == "ontology") {
  
  # Subset values for this variable
  subset_values <- definitions_values %>% filter(name == contextual_variable)
  
  # Build mapping, replacing empty or NA with "N/A"
  value_map <- setNames(
    ifelse(is.na(subset_values$value_label) | subset_values$value_label == "", 
           "N/A", 
           subset_values$value_label),
    subset_values$value_id
  )
  
  # Label column name
  label_col <- gsub("_id$", "_label", contextual_variable)
  
  # Apply mapping and set as ordered factor
  merged[[label_col]] <- factor(
    value_map[as.character(merged[[contextual_variable]])],
    levels = value_map[order(as.numeric(names(value_map)))],
    ordered = TRUE
  )
  
  colour_label <- label_col
  is_continuous <- FALSE
  
} else if (definition$type == "float") {
  colour_label <- contextual_variable
  is_continuous <- TRUE
  
} else if (definition$type == "string") {
  colour_label <- contextual_variable
  is_continuous <- FALSE
    
} else if (definition$type == "date") {
  colour_label <- contextual_variable
  is_continuous <- FALSE

} else {
  stop("Unknown variable type")
}

# === PLOT ===
p <- ggplot(merged, aes(x = UMAP1, y = UMAP2))

if (is_continuous) {
  # Separate NA points
  p <- p +
    geom_point(
      data = merged %>% filter(!is.na(.data[[colour_label]])),
      aes(color = .data[[colour_label]]),
      size = 2
    ) +
    geom_point(
      data = merged %>% filter(is.na(.data[[colour_label]])),
      color = "black",
      size = 0.1
    ) +
    scale_color_viridis_c(option = "viridis") +
    labs(color = definition$display_name)
  
} else {
  # Categorical
  p <- p +
    geom_point(aes(color = .data[[colour_label]]), size = 2) +
    scale_color_manual(
      values = scales::hue_pal()(length(levels(merged[[colour_label]]))),
      na.value = "black"
    ) +
    labs(color = definition$display_name)
}

p <- p +
  theme_void() +
  theme(
    legend.position = "right",
    plot.title = element_text(hjust = 0.5)
  ) +
  ggtitle(paste("Ordination Coloured by", definition$display_name))

# Optionally set axis limits to include all points even if some are NA
p <- p +
  xlim(min(merged$UMAP1, na.rm = TRUE), max(merged$UMAP1, na.rm = TRUE)) +
  ylim(min(merged$UMAP2, na.rm = TRUE), max(merged$UMAP2, na.rm = TRUE))

print(p)

