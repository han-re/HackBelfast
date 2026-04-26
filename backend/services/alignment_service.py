import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"

_questions: list[dict] | None = None
_party_positions: dict | None = None


def _get_questions() -> list[dict]:
    global _questions
    if _questions is None:
        with open(_DATA_DIR / "quiz_questions.json") as f:
            _questions = json.load(f)
    return _questions


def _get_party_positions() -> dict:
    global _party_positions
    if _party_positions is None:
        with open(_DATA_DIR / "party_positions.json") as f:
            data = json.load(f)
        _party_positions = {k: v for k, v in data.items() if not k.startswith("_")}
    return _party_positions


def _alignment_pct(total_distance: int, axes_scored: int) -> int:
    if axes_scored == 0:
        return 0
    return round(100 - (total_distance / (axes_scored * 4) * 100))


def score_parties(answers: dict[str, int]) -> list[dict]:
    """
    answers: {"q1": 2, "q2": -1, ...} keyed by question id
    Returns list sorted descending by alignment_pct.
    """
    questions = _get_questions()
    positions = _get_party_positions()

    axis_answers: dict[str, int] = {}
    for q in questions:
        if q["id"] in answers:
            axis_answers[q["axis"]] = answers[q["id"]]

    results = []
    for party_id, party_pos in positions.items():
        total_distance = 0
        axes_scored = 0
        for axis, user_val in axis_answers.items():
            party_val = party_pos.get(axis, 0)
            total_distance += abs(user_val - party_val)
            axes_scored += 1
        results.append({
            "party_id": party_id,
            "alignment_pct": _alignment_pct(total_distance, axes_scored),
        })

    return sorted(results, key=lambda x: x["alignment_pct"], reverse=True)


def score_mla(mla: dict, answers: dict[str, int]) -> int:
    """
    Score a single MLA against user answers.
    Falls back to party position for any axis without a vote record.
    """
    questions = _get_questions()
    positions = _get_party_positions()
    party_pos = positions.get(mla.get("party_id", ""), {})

    mla_stances: dict[str, int] = {}
    for vote in mla.get("votes", []):
        axis = vote.get("policy_axis")
        stance = vote.get("stance_value")
        if axis is not None and stance is not None:
            mla_stances[axis] = stance

    total_distance = 0
    axes_scored = 0
    for q in questions:
        qid = q["id"]
        axis = q["axis"]
        if qid not in answers:
            continue
        user_val = answers[qid]
        mla_val = mla_stances.get(axis, party_pos.get(axis, 0))
        total_distance += abs(user_val - mla_val)
        axes_scored += 1

    return _alignment_pct(total_distance, axes_scored)
