# multiaxis

First we will create a three dimensional graph drawing space.

Next, we will include lines drawn at each of the three axes with zero points at the center.

The axes will be defined with a label, as well as a `min`, `max`, and `step` value to draw guiding ticks.

The plotted data will consist of an array of data `points`, which in turn will consist of three coordinate values, a color, a magnitude ("POP POP!"), and another array consisting of arbitrarily typed values for later exploration.

```json
{
    "axes":
        [
            {"label": "x", "description": "The x-axis", "min": 0, "max": 10, "step": 1},
            {"label": "y", "min": 0, "max": 10, "step": 1},
            {"label": "z", "min": 0, "max": 10, "step": 1}
        ],
    "points":
        [
            [1, 2, 3, "red", 0.5, ["metadata-attr-1", "metadata-attr-2"]],
            [2, 3, 4, "blue", 23, ["metadata-attr-1", "metadata-attr-2"]],
            [3, 4, 5, "green", 42, ["metadata-attr-1", "metadata-attr-2"]],
            [4, 5, 6, "yellow", 69, ["metadata-attr-1", "metadata-attr-2"]]
        ]
}
```
