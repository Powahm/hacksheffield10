def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}


def test_products_never_expose_embeddings(client):
    products = client.get("/api/products").get_json()
    assert products and all("embedding" not in p for p in products)


def test_feed_next_returns_a_pick_and_counts(client):
    body = client.post("/api/feed/next", json={"swipes": [{"id": 1, "kept": True}]}).get_json()
    assert body["product"]["id"] != 1
    assert "embedding" not in body["product"]
    assert body["total"] == 5 and body["remaining"] == 4


def test_feed_next_rejects_bad_swipes(client):
    assert client.post("/api/feed/next", json={"swipes": [{"id": "x"}]}).status_code == 400
    assert client.post("/api/feed/next", json={"swipes": "nope"}).status_code == 400


def test_feed_ends_cleanly(client):
    swipes = [{"id": i, "kept": False} for i in range(1, 6)]
    body = client.post("/api/feed/next", json={"swipes": swipes}).get_json()
    assert body["product"] is None and body["remaining"] == 0


def test_studio_writes_need_the_token(client):
    payload = {"name": "Coat", "price": 40}
    assert client.post("/api/dashboard/products", json=payload).status_code == 401
    wrong = {"X-Admin-Token": "nope"}
    assert client.delete("/api/dashboard/products/1", headers=wrong).status_code == 401


def test_studio_validates_before_embedding(client):
    headers = {"X-Admin-Token": "test-token"}
    resp = client.post("/api/dashboard/products", json={"name": "Coat", "price": "cheap"}, headers=headers)
    assert resp.status_code == 400


def test_chat_validates_and_rate_limits(client, monkeypatch):
    import app.routes.chat as chat_module

    monkeypatch.setattr(chat_module, "chat_with_gemini", lambda m, h, c="": "Try white trainers.")
    assert client.post("/api/chat", json={"message": ""}).status_code == 400
    assert client.post("/api/chat", json={"message": "x" * 501}).status_code == 400
    ok = client.post("/api/chat", json={"message": "What goes with this?", "product_id": 1})
    assert ok.get_json() == {"reply": "Try white trainers."}
    # TestConfig allows 3 per minute and the two 400s above count, so the fourth is refused.
    assert client.post("/api/chat", json={"message": "again"}).status_code == 429


def test_unknown_route_is_json(client):
    resp = client.get("/api/nope")
    assert resp.status_code == 404 and "error" in resp.get_json()
