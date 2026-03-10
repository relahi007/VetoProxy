import hashlib
import json
import time


# ─────────────────────────────────────────
# VETOCHAIN — Custom SHA-256 Audit Ledger
# Built for VetoProxy @ BME HackNight 2026
#
# Every voting decision gets written here as
# a permanent, tamper-evident linked block.
# Alter any block → entire chain breaks.
# ─────────────────────────────────────────


class Block:
    def __init__(self, index, data, previous_hash):
        self.index = index
        self.timestamp = time.time()
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """
        SHA-256 hash of this block's contents.
        If anything changes, hash changes → chain breaks.
        """
        content = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }

    def __repr__(self):
        return (
            f"\n--- Block #{self.index} ---\n"
            f"Timestamp  : {self.timestamp}\n"
            f"Data       : {json.dumps(self.data, indent=2)}\n"
            f"Prev Hash  : {self.previous_hash[:20]}...\n"
            f"Hash       : {self.hash[:20]}...\n"
        )


class VetoChain:
    def __init__(self):
        self.chain = [self._create_genesis_block()]
        print("VetoChain initialized ✓")

    def _create_genesis_block(self):
        """
        Block #0 — the anchor of the entire chain.
        Previous hash is '0' by convention.
        """
        return Block(
            index=0,
            data={
                "type": "genesis",
                "message": "VetoProxy Audit Chain Initialized"
            },
            previous_hash="0"
        )

    def get_last_block(self):
        return self.chain[-1]

    def add_vote(self, voting_record):
        """
        Add a new voting decision as a block.

        voting_record should contain:
        - company     : company name
        - proposal    : proposal title
        - vote        : YES / NO / REVIEW
        - rule_triggered : which rule caused this vote
        - confidence  : HIGH / MEDIUM / REQUIRES_HUMAN_REVIEW
        """
        new_block = Block(
            index=len(self.chain),
            data=voting_record,
            previous_hash=self.get_last_block().hash
        )
        self.chain.append(new_block)
        return new_block

    def is_valid(self):
        """
        Validates the entire chain.
        Checks:
        1. Each block's hash matches its own contents
        2. Each block's previous_hash matches the actual previous block's hash
        If either fails → tampered.
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            if current.hash != current.calculate_hash():
                print(f"❌ Block #{i} hash mismatch — tampered!")
                return False

            if current.previous_hash != previous.hash:
                print(f"❌ Block #{i} broken link — chain corrupted!")
                return False

        return True

    def print_chain(self):
        for block in self.chain:
            print(block)
        print(f"\nChain valid : {self.is_valid()}")
        print(f"Total blocks: {len(self.chain)}")

    def to_dict(self):
        return [block.to_dict() for block in self.chain]

    def get_stats(self):
        votes = [b.data for b in self.chain[1:]]  # Skip genesis
        yes    = sum(1 for v in votes if v.get("vote") == "YES")
        no     = sum(1 for v in votes if v.get("vote") == "NO")
        review = sum(1 for v in votes if v.get("vote") == "REVIEW")
        return {
            "total_votes"     : len(votes),
            "yes"             : yes,
            "no"              : no,
            "requires_review" : review,
            "chain_valid"     : self.is_valid()
        }


# ─────────────────────────────────────────
# TEST — run with: python vetochain.py
# ─────────────────────────────────────────

if __name__ == "__main__":
    print("=== VetoChain Test ===\n")

    chain = VetoChain()

    chain.add_vote({
        "company"       : "Apple Inc.",
        "proposal"      : "CEO Pay Raise 15%",
        "vote"          : "NO",
        "rule_triggered": "Vote NO on pay raises above 10%",
        "confidence"    : "HIGH"
    })

    chain.add_vote({
        "company"       : "Apple Inc.",
        "proposal"      : "Elect Jane Smith (Independent Director)",
        "vote"          : "YES",
        "rule_triggered": "Always support independent board members",
        "confidence"    : "HIGH"
    })

    chain.add_vote({
        "company"       : "Apple Inc.",
        "proposal"      : "Climate Disclosure Report",
        "vote"          : "YES",
        "rule_triggered": "Always vote yes on climate disclosure",
        "confidence"    : "HIGH"
    })

    chain.print_chain()

    print("\n=== Stats ===")
    print(json.dumps(chain.get_stats(), indent=2))

    print("\n=== Tamper Test ===")
    print("Flipping Block #1 vote from NO → YES...")
    chain.chain[1].data["vote"] = "YES"
    print(f"Chain valid? {chain.is_valid()}")
    print("(Should be False — tamper detected ✓)")