import pandas as pd

data = {
    'review': [
        'Great product, fits perfectly and very comfortable to wear all day',
        'Poor quality, stitching came apart after first wash, very disappointed',
        'Beautiful style, love the color, runs a bit small though',
        'Excellent value for money, comfortable and well made',
        'Terrible fit, way too tight, not true to size at all',
        'Gorgeous dress, stunning design, great quality fabric',
        'Overpriced for the quality, cheap material, not worth it',
        'Perfect fit, so comfortable, love wearing this every day',
        'Amazing style, looks beautiful, excellent quality',
        'Runs very small, uncomfortable fabric, poor value',
    ],
    'product_id': [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    'product_name': ['Summer Dress'] * 5 + ['Evening Gown'] * 5,
    'rating': [5, 1, 3, 4, 2, 4, 2, 5, 5, 1]
}

df = pd.DataFrame(data)
df.to_csv('test_amazon_format.csv', index=False)
print('Test CSV created successfully!')
print('Columns:', df.columns.tolist())
print('Rows:', len(df))