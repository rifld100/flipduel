# Flipduel Anchor Escrow

Program ID (local/devnet placeholder): `FLiPduEL1111111111111111111111111111111111`

## Instructions

- `create_room` — init room + vault PDA metadata
- `register_player2` — set opponent pubkey
- `mark_active` — both deposits received (vault balance check)
- `cancel_search` — refund creator stake
- `settle_win` — pay winner full vault
- `settle_tie` — refund both stakes

## Build (requires Anchor 0.30 + Rust)

```bash
cd programs/flipduel-escrow
anchor build
anchor deploy --provider.cluster devnet
```

## v1 API note

The running API uses per-room vault keypairs for deposits and manual settlement until the program is deployed and wired into the API client.
