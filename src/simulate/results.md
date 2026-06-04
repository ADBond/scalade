# Simulation results

Approximate:

```json
{
  arundel: { played: 135, leaguePoints: 140, totalScore: 53061 },
  bodiam: { played: 135, leaguePoints: -270, totalScore: 44814 },
  camber: { played: 135, leaguePoints: 160, totalScore: 53060 }
}
```

```json
{
  camber: { played: 12, leaguePoints: -10, totalScore: 4074 },
  ismcts1000: { played: 12, leaguePoints: 10, totalScore: 4235 }
}
```

with zero sum correction (but still without proper rollout, so zero-scored hands):
```json
{
  random: { played: 225, leaguePoints: -290, totalScore: 17503 },
  arundel: { played: 225, leaguePoints: 120, totalScore: 20692 },
  bodiam: { played: 225, leaguePoints: -50, totalScore: 20147 },
  camber: { played: 225, leaguePoints: 210, totalScore: 20020 },
  ismcts1000: { played: 225, leaguePoints: -30, totalScore: 18639 }
}
```

and full rollouts & c=10
```json
{
  random: { played: 225, leaguePoints: -540, totalScore: 14851 },
  arundel: { played: 225, leaguePoints: -310, totalScore: 16542 },
  bodiam: { played: 225, leaguePoints: -300, totalScore: 16467 },
  camber: { played: 225, leaguePoints: -60, totalScore: 17508 },
  ismcts1000: { played: 225, leaguePoints: 1230, totalScore: 31122 }
}
```

