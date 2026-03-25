from munin_sdk.capabilities import supports_action


def test_supports_action() -> None:
    caps = {
        "actions": {
            "core": ["store", "retrieve"],
            "optional": ["search"],
        }
    }
    assert supports_action(caps, "store")
    assert supports_action(caps, "search")
    assert not supports_action(caps, "rollback")
