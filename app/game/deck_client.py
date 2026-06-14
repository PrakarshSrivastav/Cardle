import httpx

BASE_URL = "https://deckofcardsapi.com/api/deck"


class DeckApiError(Exception):
    pass


def _check(response: httpx.Response) -> dict:
    response.raise_for_status()
    data = response.json()
    if not data.get("success"):
        raise DeckApiError(f"Deck API returned success=false: {data}")
    return data


def shuffle_new_deck() -> str:
    with httpx.Client(timeout=10) as client:
        data = _check(client.get(f"{BASE_URL}/new/shuffle/", params={"deck_count": 1}))
    return data["deck_id"]


def draw_cards(deck_id: str, count: int) -> list[dict]:
    with httpx.Client(timeout=10) as client:
        data = _check(client.get(f"{BASE_URL}/{deck_id}/draw/", params={"count": count}))
    return data["cards"]


def make_draw_fn(deck_id: str):
    def draw(n: int) -> list[dict]:
        return draw_cards(deck_id, n)
    return draw
