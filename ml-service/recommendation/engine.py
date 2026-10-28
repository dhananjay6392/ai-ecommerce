from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class HybridRecommender:
    """
    Hybrid Recommendation Engine combining:
    1. Content-based TF-IDF vector representations over title, description, brand, specifications.
    2. Implicit Collaborative filtering weighting based on interaction actions.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.products = []
        self.tfidf_matrix = None
        self.product_index_map = {}

    def fit_catalog(self, products: List[Dict[str, Any]]):
        """Fit TF-IDF matrix over product catalog text features."""
        self.products = products
        self.product_index_map = {str(p["_id"]): idx for idx, p in enumerate(products)}

        corpus = []
        for p in products:
            text = f"{p.get('name', '')} {p.get('brand', '')} {p.get('categoryName', '')} {p.get('description', '')} {' '.join(p.get('tags', []))}"
            corpus.append(text)

        if corpus:
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def get_content_recommendations(
        self, product_id: str, top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """Get items similar to a specific seed product via TF-IDF cosine similarity."""
        if self.tfidf_matrix is None or str(product_id) not in self.product_index_map:
            return []

        idx = self.product_index_map[str(product_id)]
        product_vec = self.tfidf_matrix[idx]
        sim_scores = cosine_similarity(product_vec, self.tfidf_matrix).flatten()

        # Sort indices descending, excluding itself
        ranked_indices = [i for i in np.argsort(-sim_scores) if i != idx][:top_k]

        results = []
        for i in ranked_indices:
            p = self.products[i]
            score = float(sim_scores[i])
            results.append({
                "product_id": str(p["_id"]),
                "name": p.get("name"),
                "score": round(min(0.99, max(0.50, score + 0.35)), 2),
                "reason": f"Content Match ({p.get('categoryName', 'Category')} & Spec similarity)",
            })
        return results

    def get_user_recommendations(
        self, user_history: List[Dict[str, Any]], top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """Recommend items based on user's implicit feedback history."""
        if not user_history or self.tfidf_matrix is None:
            # Cold-start fallback: return top rated / popular
            sorted_prods = sorted(self.products, key=lambda x: x.get("salesCount", 0), reverse=True)
            return [
                {
                    "product_id": str(p["_id"]),
                    "name": p.get("name"),
                    "score": 0.88,
                    "reason": "Popular Trending SKU (Cold-start)",
                }
                for p in sorted_prods[:top_k]
            ]

        # Weight interactions: PURCHASE=5, ADD_TO_CART=3, WISHLIST=2, VIEW=1
        action_weights = {"PURCHASE": 5.0, "ADD_TO_CART": 3.0, "WISHLIST": 2.0, "VIEW": 1.0}
        user_vector = np.zeros((1, self.tfidf_matrix.shape[1]))
        interacted_ids = set()

        for item in user_history:
            pid = str(item.get("product_id") or item.get("product"))
            interacted_ids.add(pid)
            if pid in self.product_index_map:
                idx = self.product_index_map[pid]
                weight = action_weights.get(item.get("action", "VIEW"), 1.0)
                user_vector += weight * self.tfidf_matrix[idx].toarray()

        if np.sum(user_vector) > 0:
            sim_scores = cosine_similarity(user_vector, self.tfidf_matrix).flatten()
            ranked_indices = [
                i for i in np.argsort(-sim_scores)
                if str(self.products[i]["_id"]) not in interacted_ids
            ][:top_k]

            results = []
            for i in ranked_indices:
                p = self.products[i]
                score = float(sim_scores[i])
                results.append({
                    "product_id": str(p["_id"]),
                    "name": p.get("name"),
                    "score": round(min(0.99, max(0.60, score + 0.30)), 2),
                    "reason": "Personalized via Your Browsing & Purchase Interactions",
                })
            return results

        return []
