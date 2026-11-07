import random

from helpers.recommender import recommend, taste_vector


def test_cold_start_returns_an_unseen_product_with_an_embedding(catalogue_items):
    pick = recommend(catalogue_items, [], rng=random.Random(0))
    assert pick.mode == "start"
    assert pick.product["embedding"] is not None


def test_cold_start_spreads_across_categories(catalogue_items):
    # Passed on a shirt and nothing kept yet: the next start pick avoids shirts.
    pick = recommend(catalogue_items, [(1, False)], rng=random.Random(0))
    assert pick.mode == "start"
    assert pick.product["category"] != "mens-shirts"


def test_keeping_a_shirt_recommends_the_closest_shirt(catalogue_items):
    pick = recommend(catalogue_items, [(1, True)], explore_rate=0.0)
    assert pick.mode == "match"
    assert pick.product["id"] == 2
    assert pick.because["id"] == 1
    assert pick.score > 0.9


def test_passing_moves_taste_away(catalogue_items):
    # Kept a dress, then passed on the other dress: shirts and dresses are now both
    # worse than before, and the result is never a swiped product.
    swipes = [(3, True), (4, False)]
    pick = recommend(catalogue_items, swipes, explore_rate=0.0)
    assert pick.product["id"] not in {3, 4}


def test_never_repeats_and_ends_when_everything_is_seen(catalogue_items):
    swipes = [(pid, True) for pid in (1, 2, 3, 4, 5)]
    assert recommend(catalogue_items, swipes) is None


def test_explore_pick_is_flagged(catalogue_items):
    pick = recommend(catalogue_items, [(1, True)], rng=random.Random(0), explore_rate=1.0)
    assert pick.mode == "explore"
    assert pick.product["id"] != 1


def test_taste_vector_weights_recent_swipes(catalogue_items):
    vectors = {p["id"]: p["embedding"] for p in catalogue_items if p["embedding"] is not None}
    taste = taste_vector([(1, True), (3, True)], vectors)
    assert taste[1] > 0 and taste[0] > 0  # both kept pieces contribute
    assert taste_vector([(99, True)], vectors) is None  # unknown ids are ignored
