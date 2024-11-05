# multiaxis

First we will create a three dimensional graph drawing space.

Next, we will include lines drawn at each of the three axes with zero points at the center.

The axes will be defined with a label, as well as a `min`, `max`, and `step` value to draw guiding ticks.

The plotted data will consist of an array of data `points`, which in turn will consist of three coordinate values, a color, a magnitude (["pop pop!"](https://www.youtube.com/watch?v=G_P5pC0RgSY)), and another array consisting of arbitrarily typed values for later exploration.

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
            [1, 2, 3, "red", {"size": 1.0, "label":  "point 1"}],
            [2, 3, 4, "blue", {"size": 0.8, "label":  "point 2"}],
            [3, 4, 5, "green", {"size": 0.4, "label":  "point 3"}],
            [4, 5, 6, "yellow", {"size": 1.1, "label":  "point 4"}]
        ]
}
```

# Using Custom Data

If you'd like to load your own custom data, simply place the `JSON` file into `data/`, and then modify the `datasrc` meta tag's content attribute to include the file name (without extension).

```html
<meta name="datasrc" content="data" />
```
