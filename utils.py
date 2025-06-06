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


""" SVG CONVERSION """

from bs4 import BeautifulSoup

'''
<g
   text-rendering="geometricPrecision"
   stroke-miterlimit="1.45"
   shape-rendering="geometricPrecision"
   transform="matrix(1,0,0,1,-616,-200)"
   stroke-linecap="butt"
   id="g41">
  <path
     id="rect35"
     clip-path="url(#clipPath2)"
     style="fill:none"
     d="m 631.75,244 h 86.5 v 44 h -86.5 z" />
  <g
     aria-label="Project"
     id="text37"
     clip-path="url(#clipPath2)"
     style="font-family:sans-serif;stroke:none">
    <path
       d="m 659.75817,254.79531 q 1.68,0 2.448,0.66 0.768,0.66 0.768,1.86 0,0.708 -0.324,1.332 -0.312,0.612 -1.068,0.996 -0.744,0.384 -2.028,0.384 h -0.984 v 3.336 h -1.08 v -8.568 z m -0.096,0.924 h -1.092 v 3.384 h 0.864 q 1.224,0 1.824,-0.396 0.6,-0.396 0.6,-1.344 0,-0.828 -0.54,-1.236 -0.528,-0.408 -1.656,-0.408 z"
       id="path181" />
    <path
       d="m 667.60617,256.81131 q 0.18,0 0.384,0.024 0.204,0.012 0.372,0.048 l -0.132,0.972 q -0.156,-0.036 -0.348,-0.06 -0.192,-0.024 -0.348,-0.024 -0.492,0 -0.924,0.276 -0.432,0.264 -0.696,0.756 -0.252,0.48 -0.252,1.128 v 3.432 h -1.056 v -6.432 h 0.864 l 0.12,1.176 h 0.048 q 0.3,-0.528 0.792,-0.912 0.504,-0.384 1.176,-0.384 z"
       id="path183" />
    <path
       d="m 674.91416,260.13531 q 0,1.596 -0.816,2.472 -0.804,0.876 -2.184,0.876 -0.852,0 -1.524,-0.384 -0.66,-0.396 -1.044,-1.14 -0.384,-0.756 -0.384,-1.824 0,-1.596 0.792,-2.46 0.804,-0.864 2.196,-0.864 0.864,0 1.536,0.396 0.672,0.384 1.044,1.128 0.384,0.732 0.384,1.8 z m -4.86,0 q 0,1.14 0.444,1.812 0.456,0.66 1.44,0.66 0.972,0 1.428,-0.66 0.456,-0.672 0.456,-1.812 0,-1.14 -0.456,-1.788 -0.456,-0.648 -1.44,-0.648 -0.984,0 -1.428,0.648 -0.444,0.648 -0.444,1.788 z"
       id="path185" />
    <path
       d="m 676.49816,255.19131 q 0,-0.348 0.18,-0.504 0.18,-0.168 0.444,-0.168 0.24,0 0.42,0.168 0.192,0.156 0.192,0.504 0,0.348 -0.192,0.516 -0.18,0.156 -0.42,0.156 -0.264,0 -0.444,-0.156 -0.18,-0.168 -0.18,-0.516 z m -0.672,11.052 q -0.312,0 -0.54,-0.048 -0.228,-0.036 -0.384,-0.096 v -0.852 q 0.18,0.06 0.372,0.084 0.192,0.036 0.42,0.036 0.384,0 0.636,-0.216 0.252,-0.204 0.252,-0.792 v -7.428 h 1.056 v 7.392 q 0,0.9 -0.432,1.404 -0.432,0.516 -1.38,0.516 z"
       id="path187" />
    <path
       d="m 682.16215,256.81131 q 0.816,0 1.416,0.36 0.6,0.36 0.912,1.02 0.324,0.648 0.324,1.524 v 0.636 h -4.404 q 0.024,1.092 0.552,1.668 0.54,0.564 1.5,0.564 0.612,0 1.08,-0.108 0.48,-0.12 0.984,-0.336 v 0.924 q -0.492,0.216 -0.972,0.312 -0.48,0.108 -1.14,0.108 -0.924,0 -1.62,-0.372 -0.696,-0.372 -1.092,-1.104 -0.384,-0.732 -0.384,-1.812 0,-1.056 0.348,-1.812 0.36,-0.756 0.996,-1.164 0.648,-0.408 1.5,-0.408 z m -0.012,0.864 q -0.756,0 -1.2,0.492 -0.432,0.48 -0.516,1.344 h 3.276 q -0.012,-0.816 -0.384,-1.32 -0.372,-0.516 -1.176,-0.516 z"
       id="path189" />
    <path
       d="m 689.02614,263.48331 q -0.864,0 -1.524,-0.348 -0.66,-0.348 -1.044,-1.08 -0.372,-0.732 -0.372,-1.872 0,-1.188 0.384,-1.932 0.396,-0.744 1.08,-1.092 0.684,-0.348 1.548,-0.348 0.48,0 0.936,0.108 0.468,0.096 0.756,0.24 l -0.324,0.876 q -0.288,-0.108 -0.672,-0.204 -0.384,-0.096 -0.72,-0.096 -1.896,0 -1.896,2.436 0,1.164 0.456,1.788 0.468,0.612 1.38,0.612 0.516,0 0.924,-0.108 0.408,-0.108 0.744,-0.264 v 0.936 q -0.324,0.168 -0.72,0.252 -0.384,0.096 -0.936,0.096 z"
       id="path191" />
    <path
       d="m 694.35413,262.61931 q 0.24,0 0.492,-0.036 0.252,-0.036 0.408,-0.096 v 0.804 q -0.168,0.084 -0.48,0.132 -0.312,0.06 -0.6,0.06 -0.504,0 -0.936,-0.168 -0.42,-0.18 -0.684,-0.612 -0.264,-0.432 -0.264,-1.212 v -3.744 h -0.912 v -0.504 l 0.924,-0.42 0.42,-1.368 h 0.624 v 1.476 h 1.86 v 0.816 h -1.86 v 3.72 q 0,0.588 0.276,0.876 0.288,0.276 0.732,0.276 z"
       id="path193" />
  </g>
  <g
     aria-label="Schema"
     id="text39"
     clip-path="url(#clipPath2)"
     style="font-family:sans-serif;stroke:none">
    <path
       d="m 659.01332,275.77251 q 0,1.14 -0.828,1.776 -0.828,0.636 -2.232,0.636 -0.72,0 -1.332,-0.108 -0.612,-0.108 -1.02,-0.3 v -1.032 q 0.432,0.192 1.068,0.348 0.648,0.156 1.332,0.156 0.948,0 1.44,-0.372 0.492,-0.372 0.492,-1.008 0,-0.42 -0.18,-0.708 -0.18,-0.288 -0.624,-0.528 -0.444,-0.24 -1.212,-0.528 -1.104,-0.396 -1.656,-0.972 -0.552,-0.576 -0.552,-1.572 0,-0.672 0.348,-1.164 0.348,-0.492 0.96,-0.756 0.612,-0.264 1.428,-0.264 0.696,0 1.284,0.132 0.588,0.132 1.08,0.348 l -0.336,0.924 q -0.444,-0.192 -0.972,-0.324 -0.528,-0.132 -1.08,-0.132 -0.804,0 -1.212,0.348 -0.408,0.336 -0.408,0.9 0,0.432 0.18,0.72 0.18,0.288 0.588,0.528 0.408,0.228 1.104,0.48 0.756,0.276 1.272,0.6 0.528,0.312 0.792,0.756 0.276,0.444 0.276,1.116 z"
       id="path196" />
    <path
       d="m 663.17732,278.18451 q -0.864,0 -1.524,-0.348 -0.66,-0.348 -1.044,-1.08 -0.372,-0.732 -0.372,-1.872 0,-1.188 0.384,-1.932 0.396,-0.744 1.08,-1.092 0.684,-0.348 1.548,-0.348 0.48,0 0.936,0.108 0.468,0.096 0.756,0.24 l -0.324,0.876 q -0.288,-0.108 -0.672,-0.204 -0.384,-0.096 -0.72,-0.096 -1.896,0 -1.896,2.436 0,1.164 0.456,1.788 0.468,0.612 1.38,0.612 0.516,0 0.924,-0.108 0.408,-0.108 0.744,-0.264 v 0.936 q -0.324,0.168 -0.72,0.252 -0.384,0.096 -0.936,0.096 z"
       id="path198" />
    <path
       d="m 667.41331,268.94451 v 2.676 q 0,0.48 -0.06,0.9 h 0.072 q 0.312,-0.492 0.84,-0.744 0.54,-0.252 1.164,-0.252 1.164,0 1.752,0.564 0.6,0.552 0.6,1.788 v 4.188 h -1.044 v -4.116 q 0,-1.548 -1.44,-1.548 -1.08,0 -1.488,0.612 -0.396,0.6 -0.396,1.728 v 3.324 h -1.056 v -9.12 z"
       id="path200" />
    <path
       d="m 676.25731,271.51251 q 0.816,0 1.416,0.36 0.6,0.36 0.912,1.02 0.324,0.648 0.324,1.524 v 0.636 h -4.404 q 0.024,1.092 0.552,1.668 0.54,0.564 1.5,0.564 0.612,0 1.08,-0.108 0.48,-0.12 0.984,-0.336 v 0.924 q -0.492,0.216 -0.972,0.312 -0.48,0.108 -1.14,0.108 -0.924,0 -1.62,-0.372 -0.696,-0.372 -1.092,-1.104 -0.384,-0.732 -0.384,-1.812 0,-1.056 0.348,-1.812 0.36,-0.756 0.996,-1.164 0.648,-0.408 1.5,-0.408 z m -0.012,0.864 q -0.756,0 -1.2,0.492 -0.432,0.48 -0.516,1.344 h 3.276 q -0.012,-0.816 -0.384,-1.32 -0.372,-0.516 -1.176,-0.516 z"
       id="path202" />
    <path
       d="m 687.5973,271.51251 q 1.092,0 1.632,0.564 0.54,0.564 0.54,1.8 v 4.188 h -1.044 v -4.14 q 0,-1.524 -1.308,-1.524 -0.936,0 -1.344,0.54 -0.396,0.54 -0.396,1.572 v 3.552 h -1.044 v -4.14 q 0,-1.524 -1.32,-1.524 -0.972,0 -1.344,0.6 -0.372,0.6 -0.372,1.728 v 3.336 h -1.056 v -6.432 h 0.852 l 0.156,0.876 h 0.06 q 0.3,-0.504 0.804,-0.744 0.516,-0.252 1.092,-0.252 1.512,0 1.968,1.08 h 0.06 q 0.324,-0.552 0.876,-0.816 0.552,-0.264 1.188,-0.264 z"
       id="path204" />
    <path
       d="m 694.19729,271.52451 q 1.176,0 1.74,0.516 0.564,0.516 0.564,1.644 v 4.38 h -0.768 l -0.204,-0.912 h -0.048 q -0.42,0.528 -0.888,0.78 -0.468,0.252 -1.272,0.252 -0.876,0 -1.452,-0.456 -0.576,-0.468 -0.576,-1.452 0,-0.96 0.756,-1.476 0.756,-0.528 2.328,-0.576 l 1.092,-0.036 v -0.384 q 0,-0.804 -0.348,-1.116 -0.348,-0.312 -0.984,-0.312 -0.504,0 -0.96,0.156 -0.456,0.144 -0.852,0.336 l -0.324,-0.792 q 0.42,-0.228 0.996,-0.384 0.576,-0.168 1.2,-0.168 z m 1.26,3.396 -0.948,0.036 q -1.2,0.048 -1.668,0.384 -0.456,0.336 -0.456,0.948 0,0.54 0.324,0.792 0.336,0.252 0.852,0.252 0.804,0 1.344,-0.444 0.552,-0.456 0.552,-1.392 z"
       id="path206" />
  </g>
</g>
<g
   fill="rgb(255,204,0)"
   text-rendering="geometricPrecision"
   shape-rendering="geometricPrecision"
   transform="matrix(1,0,0,1,-616,-200)"
   stroke="rgb(255,204,0)"
   id="g45">
  <path
     id="rect43"
     clip-path="url(#clipPath2)"
     style="stroke:none"
     d="m 774,344 h 66 v 44 h -66 z" />
</g>
'''

def strip_namespace(tag):
    """Convert svg:xxx to xxx by removing namespace prefixes."""
    if getattr(tag, 'name', None) and ':' in tag.name:
        tag.name = tag.name.split(':', 1)[1]
    for child in getattr(tag, 'contents', []):
        if hasattr(child, 'name'):
            strip_namespace(child)


def find_matching_d(soup, d, path_id, circle=False):
    for possible_match in soup.find_all("path"):
        if circle:
            if possible_match.get("id", "").startswith("circle") and possible_match.get("d", "") == d and possible_match.get('id') != path_id:
                return possible_match
        else:
            if possible_match.get("d", "") == d and possible_match.get('id') != path_id:
                return possible_match

def annotate_svg_paths(svg_str):
    soup = BeautifulSoup(svg_str, "lxml")

    # Remove all namespaces
    strip_namespace(soup)

    for g in soup.find_all("g"):
        group_id = g.get("id")

        # You can also grab group-level fill/stroke
        fill_color = g.get("fill", "")
        stroke_color = g.get("stroke", "")

        # Loop over all paths in this group
        paths = g.find_all("path")
        for path in paths:
            path_id = path.get("id", "") or ""
            d_attr = path.get("d", "")

            # If group has fill, store it on each path
            if fill_color and not path.get("data-orig-fill"):
                path["data-orig-fill"] = fill_color

            # Classify shape by ID or heuristic:
            if path_id.startswith("rect") or group_id.startswith("rect"):
                path["data-orig-type"] = "rect"
            elif path_id.startswith("text") or group_id.startswith("text"):
                path["data-orig-type"] = "text"
            elif path_id.startswith("circle") or group_id.startswith("circle"):
                path["data-orig-type"] = "circle"
                d = path.get("d", "")

                # relative circle with matching `d` value...
                path_id = path.get("id", "")
                possible_circle = find_matching_d(soup, d, path_id, circle=True)
                if not possible_circle.get("data-orig-fill"):
                    possible_circle["data-orig-fill"] = fill_color
                    print('possible_circle["data-orig-fill"]:', fill_color, possible_circle["data-orig-fill"])
                possible_circle["data-orig-type"] = "circle"
                path["data-orig-type"] = "circle"
                if fill_color:
                    path["data-orig-fill"] = fill_color
            else:
                # Example: If it starts with "path" or group is "path"
                # then check for M... L... for your "badge" shape
                if d_attr.startswith("M") and d_attr.count("L") == 5:
                    d = path.get("d", "")
                    path["data-orig-type"] = "badge"

                    # look up matching `d` path...
                    path_id = path.get("id", "")
                    possible_match = find_matching_d(soup, d, path_id)
                    print("SETTING FILL COLOR (badge):", fill_color, stroke_color, path, possible_match)
                    if possible_match:
                        # set the fill color
                        #fill_color = path.get("data-orig-fill", "")
                        if not possible_match.get("data-orig-fill"):
                            print("---- SETTING FILL COLOR:", stroke_color)
                            possible_match["data-orig-fill"] = stroke_color
                        possible_match["data-orig-type"] = "badge"
                else:
                    print('==> UNKNOWN TYPE:', path_id)

    return str(soup)



if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        name = sys.argv[1]

        try:
            result = annotate_svg_paths(open(f"src/imagery/{name}_out.svg").read())
        except FileNotFoundError:
            print(f"File src/imagery/{name}_out.svg not found.")
            sys.exit(1)

        try:
            with open(f"src/imagery/{name}_out_annotated.svg", "w") as f:
                f.write(result)
        except Exception as e:
            print(f"Error writing to file: {e}")
            sys.exit(1)



