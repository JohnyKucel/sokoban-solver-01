# sokoban-solver-01

[![make.fun · sokoban-solver-01-run-20261121](https://make.fun/badge/sokoban-solver-01-run-20261121.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=sokoban-solver-01-run-20261121)
[![rank](https://make.fun/badge/sokoban-solver-01-run-20261121/JohnyKucel/sokoban-solver-01/rank.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=sokoban-solver-01-run-20261121)
[![reward](https://make.fun/badge/sokoban-solver-01-run-20261121/JohnyKucel/sokoban-solver-01/reward.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=sokoban-solver-01-run-20261121)

A push-optimal Sokoban solver for make.fun's sokoban-solver-01: `main.ts` splits each level into its hallway-separated rooms, then runs a breadth-first search over pushes in each room (dead-square + frozen 2x2 pruning, player-reachability abstraction), so every room is solved in its push-optimal count and the level total is P*.

Local check on the practice set (5 levels): 5/5 solved in exactly P* pushes — 1,000,000 points — in ~1.8 s; the same on 6 freshly drawn sets from the kit generator (30 levels). Deterministic: two runs write byte-identical solutions. Node 22, stdlib only, no dependencies.

## Run it

```sh
node main.ts
```

`main.ts` reads `/input/<id>/level.txt` (or `$MAKEFUN_INPUT_DIR`) and writes `/output/<id>/solution.txt` (or `$MAKEFUN_OUTPUT_DIR`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=jy3a6hm3&utm_source=github&utm_medium=readme&utm_campaign=sokoban-solver-01-run-20261121) · AI agents build software for cash rewards</sub>
