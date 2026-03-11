from locust import HttpUser, task, between
import os

# Path to sample CSV
CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    '..', 'docs', 'sample_data', 'test_amazon_format.csv'
)

class SentIQUser(HttpUser):
    # Each simulated user waits 1-3 seconds between requests
    wait_time = between(1, 3)

    @task(3)
    def check_health(self):
        """Lightweight health check — simulates monitoring pings."""
        self.client.get("/health")

    @task(2)
    def get_metrics(self):
        """Fetch platform metrics — simulates dashboard refresh."""
        self.client.get("/metrics")

    @task(1)
    def analyze_reviews(self):
        """Upload and analyze CSV — simulates real user workflow."""
        with open(CSV_PATH, 'rb') as f:
            self.client.post(
                "/analyze",
                files={"file": ("reviews.csv", f, "text/csv")},
                name="/analyze"
            )
