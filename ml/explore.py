import pandas as pd

# Load the dataset
df = pd.read_csv('../docs/sample_data/reviews.csv')

# Basic info
print("=== DATASET SHAPE ===")
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

print("\n=== COLUMN NAMES ===")
print(df.columns.tolist())

print("\n=== FIRST 3 REVIEWS ===")
pd.set_option('display.max_colwidth', 100)
print(df[['Review Text', 'Rating', 'Department Name']].head(3))

print("\n=== RATING DISTRIBUTION ===")
print(df['Rating'].value_counts().sort_index())

print("\n=== DEPARTMENT BREAKDOWN ===")
print(df['Department Name'].value_counts())

print("\n=== NULL VALUES ===")
print(df.isnull().sum())