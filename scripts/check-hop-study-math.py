"""Independent numerical audit (NumPy SVD + PRESS), offline and without AI.

The source's observational data and the team's exploratory ranges are distinct.
These are empirical bounds, not a prediction interval with guaranteed coverage.
"""
import json
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parents[1]
study = json.loads((root / "src/data/hopStudies/lafontaine2018.cascade2015.json").read_text(encoding="utf-8"))
pack = json.loads((root / "src/data/hopStudyBootstrap.json").read_text(encoding="utf-8"))
rows = np.array([[r[1], r[2]] for r in study["rows"]], dtype=float)
x = np.column_stack([np.ones(len(rows)), rows[:, 0]])
y = rows[:, 1]
beta = np.linalg.lstsq(x, y, rcond=None)[0]
residual = y - x @ beta
hat = np.sum(x * np.linalg.pinv(x).T, axis=1)
press = residual / (1 - hat)
loo = np.array([np.linalg.lstsq(np.delete(x, i, axis=0), np.delete(y, i), rcond=None)[0] for i in range(len(rows))])
np.testing.assert_allclose(press, y - np.sum(x * loo, axis=1), atol=1e-12)

model = next(k for k in pack["hopKnowledge"] if k["kind"] == "model")
c = model["outputs"][0]["calibration"]
bounds = lambda values: [float(np.min(values)), float(np.max(values))]
saved = lambda param: [param["range"]["min"], param["range"]["max"]]
all_fits = np.vstack([beta, loo])
np.testing.assert_allclose(saved(c["intercept"]), bounds(all_fits[:, 0]), atol=1e-12)
np.testing.assert_allclose(saved(c["terms"][0]["coefficient"]), bounds(all_fits[:, 1]), atol=1e-12)
np.testing.assert_allclose(saved(c["residual"]), bounds(press), atol=1e-12)
r_squared = 1 - float(residual @ residual) / float((y - y.mean()) @ (y - y.mean()))
assert round(r_squared, 2) == 0.50
print(json.dumps({"numpy": np.__version__, "observations": len(rows), "intercept": float(beta[0]), "slope": float(beta[1]), "rSquared": r_squared, "leaveOneOutResidual": bounds(press), "verified": "SVD, PRESS and packaged parameter bounds agree; no external validation claimed"}, ensure_ascii=False, indent=2))
