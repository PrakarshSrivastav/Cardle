FACE_VALUES = {"JACK": 10, "QUEEN": 10, "KING": 10, "ACE": 11}


def card_value(card: dict) -> int:
    v = card["value"].upper()
    if v in FACE_VALUES:
        return FACE_VALUES[v]
    return int(v)


def score_hand(cards: list[dict]) -> int:
    total = 0
    aces = 0

    for card in cards:
        val = card_value(card)
        if card["value"].upper() == "ACE":
            aces += 1
        total += val

    while total > 21 and aces:
        total -= 10
        aces -= 1

    return total


def dealer_draw(initial_cards: list[dict], deck_draw_fn) -> tuple[list[dict], int]:
    hand = list(initial_cards)
    score = score_hand(hand)

    while score < 17:
        new_cards = deck_draw_fn(1)
        hand.extend(new_cards)
        score = score_hand(hand)

    return hand, score


def determine_answer(player_score: int, dealer_score: int) -> str:
    if dealer_score > 21:
        return "NO"
    if dealer_score > player_score:
        return "YES"
    return "NO"
