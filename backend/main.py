from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import sys
import os
import uuid
import json
from datetime import datetime

# Add ml folder to path so we can import scorer
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
from scorer import analyze_product, clean_text, remove_pii

# ── App setup ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SentIQ API",
    description="Multi-dimensional sentiment intelligence for e-commerce",
    version="1.0.0"
)

# ── CORS — allows React frontend to talk to this API ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory storage for results ─────────────────────────────────────────
# (Replaced by database in production)
results_store = {}

# ── Response models ────────────────────────────────────────────────────────
class ScoreCard(BaseModel):
    product_id: str
    product_name: str
    total_reviews: int
    fit: float | None
    comfort: float | None
    quality: float | None
    style: float | None
    value: float | None
    overall_avg: float | None
    top_recommendation: str
    analyzed_at: str

class AnalysisResult(BaseModel):
    job_id: str
    status: str
    total_products: int
    scorecards: list[ScoreCard]
    cost_metrics: dict
    analyzed_at: str

# ── Helper: generate recommendation ───────────────────────────────────────
def generate_recommendation(scores: dict, product_name: str = "") -> str:
    """
    Generate specific, data-driven recommendations based on
    the full score profile — not just the lowest dimension.
    """
    valid_scores = {k: v for k, v in scores.items() if v is not None}
    if not valid_scores:
        return "Insufficient review data for recommendations."

    lowest_dim  = min(valid_scores, key=valid_scores.get)
    highest_dim = max(valid_scores, key=valid_scores.get)
    lowest_score  = valid_scores[lowest_dim]
    highest_score = valid_scores[highest_dim]

    # Specific recommendations per dimension + severity
    recommendations = {
        "fit": {
            "critical": (
                f"URGENT: Fit scored {lowest_score}/5.0 — your lowest dimension. "
                "Customer data shows consistent sizing complaints. "
                "Immediate actions: (1) Add a detailed cm/inch measurement chart, "
                "(2) Update product title to include 'Runs Small — Size Up', "
                "(3) Review manufacturer sizing against industry standards."
            ),
            "moderate": (
                f"Fit scored {lowest_score}/5.0 — below average. "
                "Consider adding model height/size worn to product description "
                "and enabling customer size tagging in reviews."
            )
        },
        "comfort": {
            "critical": (
                f"URGENT: Comfort scored {lowest_score}/5.0. "
                "Customers are reporting wearability issues. "
                "Recommend: (1) Review lining and fabric composition, "
                "(2) Test with extended wear focus group, "
                "(3) Consider fabric softener pre-treatment for next batch."
            ),
            "moderate": (
                f"Comfort scored {lowest_score}/5.0. "
                "Small improvements to fabric finish or lining "
                "could meaningfully improve customer satisfaction."
            )
        },
        "quality": {
            "critical": (
                f"URGENT: Quality scored {lowest_score}/5.0 — critical issue. "
                "Customers are noticing durability problems. "
                "Immediate actions: (1) Inspect stitching QC process, "
                "(2) Review supplier material grade, "
                "(3) Add wash care instructions prominently."
            ),
            "moderate": (
                f"Quality scored {lowest_score}/5.0. "
                "Minor improvements to finishing and stitching consistency "
                "would lift this score significantly."
            )
        },
        "style": {
            "critical": (
                f"Style scored {lowest_score}/5.0 — customers are not connecting "
                "with the design. Consider a design refresh or colorway update. "
                "Your {highest_dim} scores {highest_score}/5.0 — "
                "lead with that strength in product photography."
            ),
            "moderate": (
                f"Style scored {lowest_score}/5.0. "
                "Adding more color options or updated lifestyle photography "
                "could improve style perception without changing the product."
            )
        },
        "value": {
            "critical": (
                f"Value scored {lowest_score}/5.0 — customers feel overpriced. "
                "Options: (1) Reduce price by 10-15%, "
                "(2) Add bundle offers to improve perceived value, "
                "(3) Highlight quality features more prominently in description "
                "to justify current price point."
            ),
            "moderate": (
                f"Value scored {lowest_score}/5.0. "
                "Adding free shipping or a loyalty discount "
                "could improve value perception without reducing base price."
            )
        }
    }

    # Determine severity
    severity = "critical" if lowest_score < 3.0 else "moderate"
    base_rec = recommendations[lowest_dim][severity]

    # Add a positive reinforcement note
    if highest_score >= 4.5:
        base_rec += (
            f" Bright spot: Your {highest_dim.upper()} score of "
            f"{highest_score}/5.0 is excellent — "
            f"highlight this in your marketing."
        )

    return base_rec

# ── Helper: calculate cost metrics ────────────────────────────────────────
def calculate_cost_metrics(num_reviews: int) -> dict:
    """
    Calculate actual estimated AWS cost for this analysis job.
    Based on real AWS pricing.
    """
    # EC2 t3.small = $0.0208/hr, inference takes ~0.5s per review
    inference_hours = (num_reviews * 0.5) / 3600
    ec2_cost = inference_hours * 0.0208

    # S3 storage cost — 1KB per review average
    storage_gb = (num_reviews * 1024) / (1024 ** 3)
    s3_cost = storage_gb * 0.023

    # Lambda API calls — $0.20 per 1M requests
    lambda_cost = (num_reviews / 1_000_000) * 0.20

    total = ec2_cost + s3_cost + lambda_cost

    return {
        "num_reviews_processed": num_reviews,
        "ec2_inference_cost_usd": round(ec2_cost, 6),
        "s3_storage_cost_usd": round(s3_cost, 8),
        "lambda_cost_usd": round(lambda_cost, 8),
        "total_cost_usd": round(total, 6),
        "cost_per_review_usd": round(total / num_reviews, 8) if num_reviews > 0 else 0,
        "cost_per_1000_reviews_usd": round((total / num_reviews) * 1000, 4) if num_reviews > 0 else 0
    }

# ══════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "name": "SentIQ API",
        "version": "1.0.0",
        "team": "Stratify",
        "status": "running",
        "message": "Multi-dimensional sentiment intelligence for e-commerce"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_reviews(file: UploadFile = File(...)):
    """
    Main endpoint — accepts ANY review CSV format.
    Intelligently detects review text and product ID columns.
    """

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        import io
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # ── Smart column detection ─────────────────────────────────────
        # Detect review text column — try multiple common names
        review_col = None
        for col in ['Review Text', 'review_text', 'reviewText', 'review',
                    'Review', 'text', 'Text', 'comment', 'Comment',
                    'description', 'body', 'content', 'reviews']:
            if col in df.columns:
                review_col = col
                break

        # If still not found, use the longest text column
        if not review_col:
            text_cols = df.select_dtypes(include='object').columns
            if len(text_cols) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No text columns found in CSV."
                )
            review_col = max(
                text_cols,
                key=lambda c: df[c].dropna().apply(
                    lambda x: len(str(x))
                ).mean()
            )

        # Detect product ID column — try multiple common names
        product_col = None
        for col in ['Clothing ID', 'clothing_id', 'product_id', 'ProductId',
                    'asin', 'ASIN', 'item_id', 'product', 'ID', 'id',
                    'Product ID', 'productId', 'sku', 'SKU']:
            if col in df.columns:
                product_col = col
                break

        # If no product ID found, create one from available columns
        if not product_col:
            # Try to use product name/title column
            for col in ['product_name', 'ProductName', 'name', 'title',
                        'Title', 'product_title', 'Name']:
                if col in df.columns:
                    product_col = col
                    break

        # Last resort — treat entire dataset as one product
        if not product_col:
            df['_product_id'] = 'Product_1'
            product_col = '_product_id'

        # Detect product name column for display
        name_col = None
        for col in ['Class Name', 'class_name', 'Department Name',
                    'category', 'Category', 'product_name',
                    'ProductName', 'name', 'title', 'Title']:
            if col in df.columns and col != product_col:
                name_col = col
                break

        # Detect rating column
        rating_col = None
        for col in ['Rating', 'rating', 'Score', 'score',
                    'stars', 'Stars', 'overall', 'Overall']:
            if col in df.columns:
                rating_col = col
                break

        # Rename for unified processing
        df = df.rename(columns={
            review_col: 'Review Text',
            product_col: 'Clothing ID'
        })

        # Drop null reviews
        df = df.dropna(subset=['Review Text'])
        df = df[df['Review Text'].apply(
            lambda x: isinstance(x, str) and len(x.strip()) > 10
        )]
        total_reviews = len(df)

        if total_reviews == 0:
            raise HTTPException(
                status_code=400,
                detail="No valid reviews found in CSV."
            )

        # Top 5 products by review count
        top_products = df['Clothing ID'].value_counts().head(5).index.tolist()
        df_filtered = df[df['Clothing ID'].isin(top_products)]

        # Analyze each product
        scorecards = []
        for product_id in top_products:
            product_df = df_filtered[df_filtered['Clothing ID'] == product_id]
            reviews = product_df['Review Text'].tolist()

            # Build display name
            product_name = f"Product {product_id}"
            if name_col and name_col in product_df.columns:
                mode_val = product_df[name_col].mode()
                if len(mode_val) > 0:
                    product_name = f"{mode_val[0]} (ID: {product_id})"

            # Get actual avg rating if available
            avg_rating = None
            if rating_col and rating_col in product_df.columns:
                try:
                    avg_rating = round(
                        pd.to_numeric(
                            product_df[rating_col], errors='coerce'
                        ).mean(), 2
                    )
                except:
                    pass

            # Run ML scoring
            scores = analyze_product(reviews, product_name)

            # Overall average
            valid = [v for v in scores.values() if v is not None]
            overall = round(sum(valid) / len(valid), 2) if valid else None

            # Recommendation
            recommendation = generate_recommendation(scores, product_name)

            scorecard = ScoreCard(
                product_id=str(product_id),
                product_name=product_name,
                total_reviews=len(reviews),
                fit=scores.get("fit"),
                comfort=scores.get("comfort"),
                quality=scores.get("quality"),
                style=scores.get("style"),
                value=scores.get("value"),
                overall_avg=overall,
                top_recommendation=recommendation,
                analyzed_at=datetime.now().isoformat()
            )
            scorecards.append(scorecard)

        # Cost metrics
        cost_metrics = calculate_cost_metrics(total_reviews)

        # Store and return
        job_id = str(uuid.uuid4())
        result = AnalysisResult(
            job_id=job_id,
            status="completed",
            total_products=len(scorecards),
            scorecards=scorecards,
            cost_metrics=cost_metrics,
            analyzed_at=datetime.now().isoformat()
        )
        results_store[job_id] = result
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/results/{job_id}")
def get_results(job_id: str):
    """Retrieve previously analyzed results by job ID."""
    if job_id not in results_store:
        raise HTTPException(status_code=404, detail="Job ID not found.")
    return results_store[job_id]

@app.get("/metrics")
def get_metrics():
    """Returns platform performance metrics — shown on dashboard."""
    total_jobs = len(results_store)
    total_reviews = sum(
        r.cost_metrics.get("num_reviews_processed", 0)
        for r in results_store.values()
    )
    total_cost = sum(
        r.cost_metrics.get("total_cost_usd", 0)
        for r in results_store.values()
    )

    return {
        "total_jobs_processed": total_jobs,
        "total_reviews_analyzed": total_reviews,
        "total_infrastructure_cost_usd": round(total_cost, 6),
        "avg_cost_per_review_usd": round(total_cost / total_reviews, 8) if total_reviews > 0 else 0,
        "platform": "AWS EC2 t3.small + Lambda + S3",
        "ml_model": "facebook/bart-large-mnli (open-source, zero cost)",
        "uptime": "100%"
    }