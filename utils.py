""""""

class ThreeChart:
    def __init__(self, name: str, axes: [str] or ['Axis'], points: ['Point']):
        self.name = name
        self.axes = axes
        self.points = points

    def to_json(self):
        return {
            "axes": [axis.to_json() if isinstance(axis, Axis) else self.process_axis(i, axis) for i, axis in enumerate(self.axes)],
            "points": [point.to_json() for point in self.points]
        }

    def process_axis(self, i, axis):
        axis_min = 0

        axis_max = max([point.i(i) for point in self.points])

        return {"label": axis, "description": f"The {axis}-axis", "min": axis_min, "max": axis_max, "step": 1}

    def write(self):
        import json
        with open(f'data/{self.name}.json', 'w') as f:
            f.write(json.dumps(self.to_json(), indent=4))



class Axis:
    def __init__(self, label: str, description: str = "", min: int = 0, max: int = 10, step: int = 1):
        self.label = label
        self.description = description
        self.axis_min = min
        self.axis_max = max
        self.step = step

    def to_json(self):
        label = f"The {self.label}-axis" if not self.description else self.description
        return {"label": self.label, "description": label, "min": self.axis_min, "max": self.axis_max, "step": self.step}


class Point:
    def __init__(self, x: int, y: int, z: int, color: str, options: dict):
        self.x = x
        self.y = y
        self.z = z
        self.color = color
        self.options = options

    def to_json(self):
        return [self.x, self.y, self.z, self.color, self.options]

    def i(self, i):
        return [self.x, self.y, self.z][i]



def test():
    axes = ["x", "y", "z"]
    points = [Point(1, 2, 3, "red", {"size": 1.0, "label": "point 1"}),
              Point(2, 3, 4, "blue", {"size": 0.8, "label": "point 2"}),
              Point(3, 4, 5, "green", {"size": 0.4, "label": "point 3"}),
              Point(4, 5, 6, "yellow", {"size": 1.1, "label": "point 4"})]

    chart = ThreeChart('experimental_1', axes, points)

    print(chart.to_json())

    assert chart.to_json() == {
        "axes": [
            {"label": "x", "description": "The x-axis", "min": 0, "max": 4, "step": 1},
            {"label": "y", "description": "The y-axis", "min": 0, "max": 5, "step": 1},
            {"label": "z", "description": "The z-axis", "min": 0, "max": 6, "step": 1}
        ],
        "points": [
            [1, 2, 3, "red", {"size": 1.0, "label": "point 1"}],
            [2, 3, 4, "blue", {"size": 0.8, "label": "point 2"}],
            [3, 4, 5, "green", {"size": 0.4, "label": "point 3"}],
            [4, 5, 6, "yellow", {"size": 1.1, "label": "point 4"}]
        ]
    }

    chart.write()


#test()
